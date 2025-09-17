<?php

namespace App\Http\Controllers\Module\Gudang;

use App\Http\Controllers\Controller;
use App\Models\Settings\External_Database;
use App\Models\Settings\Web_Setting;
use App\Models\Module\Master\Data\Gudang\Daftar_Barang;
use App\Models\Module\Gudang\Permintaan_Barang;
use App\Models\Module\Gudang\Permintaan_Barang_Detail;
use App\Models\Module\Gudang\Permintaan_Barang_Konfirmasi;
use App\Models\Module\Gudang\Stok_Inventaris_Klinik;
use App\Models\Module\Gudang\Stok_Obat_Klinik;
use App\Models\Module\Gudang\Stok_Barang;
use App\Models\Module\Gudang\Stok_Inventaris;
use App\Models\Module\Gudang\Harga_Barang;
use App\Models\Module\Master\Data\Gudang\Setting_Harga_Jual;
use App\Models\Module\Master\Data\Gudang\Daftar_Harga_Jual;
use App\Models\Module\Master\Data\Gudang\Daftar_Harga_Jual_Klinik;
use App\Services\PermintaanBarangWebSocketService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Database\Connectors\ConnectionFactory;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;

class Permintaan_Barang_Controller extends Controller
{
    protected $webSocketService;

    public function __construct(PermintaanBarangWebSocketService $webSocketService)
    {
        $this->webSocketService = $webSocketService;
    }

    public function index()
    {
        $title = "Request Stok Obat Alkes";

        // Mengambil data master obat
        $dabar = Daftar_Barang::all();

        // Mengambil pengaturan web
        $webSetting = Web_Setting::first();
        $kodeKlinik = $webSetting->kode_klinik ?? '';
        $namaKlinik = $webSetting->nama ?? '';

        // KONSEP BARU: Master-Client Architecture
        if ($webSetting && $webSetting->is_gudangutama_active == 1) {
            // MASTER MODE: Dapat menerima permintaan dari semua client
            $title = "Master Gudang - Request Stok Obat Alkes";

            // Ambil semua permintaan dari semua client
            $request = Permintaan_Barang::select('kode_request', 'tanggal_input', 'nama_klinik', 'kode_klinik', 'status')
                ->orderBy('tanggal_input', 'desc')
                ->get();

            // Ambil data pengiriman barang (tanpa kode_klinik karena tidak ada di tabel)
            $data_kirim = Permintaan_Barang_Konfirmasi::select('kode_request', 'tanggal_request', 'nama_klinik')
                ->orderBy('tanggal_request', 'desc')
                ->get();
        } elseif ($webSetting && $webSetting->is_gudangutama_active == 0) {
            // CLIENT MODE: Hanya dapat melihat permintaan sendiri
            $title = "Client - Request Stok Obat Alkes";

            // Ambil permintaan dari client ini saja
            $request = Permintaan_Barang::select('kode_request', 'tanggal_input', 'nama_klinik', 'kode_klinik', 'status')
                ->where('kode_klinik', $kodeKlinik)
                ->orderBy('tanggal_input', 'desc')
                ->get();

            // Ambil data pengiriman barang untuk client ini (filter berdasarkan nama_klinik)
            $data_kirim = Permintaan_Barang_Konfirmasi::select('kode_request', 'tanggal_request', 'nama_klinik')
                ->where('nama_klinik', $namaKlinik)
                ->orderBy('tanggal_request', 'desc')
                ->get();
        } else {
            $request = collect();
            $data_kirim = collect();
        }

        return Inertia::render("module/gudang/permintaan-barang/index", [
            "title" => $title,
            "dabar" => $dabar,
            "request" => $request,
            "data_kirim" => $data_kirim,
            "webSetting" => $webSetting,
            "isMaster" => $webSetting && $webSetting->is_gudangutama_active == 1
        ]);
    }

    public function store(Request $request)
    {
        try {
            // Validasi input
            $validatedData = $request->validate([
                'kode_request' => 'required|unique:permintaan_barangs,kode_request',
                'kode_klinik' => 'required',
                'nama_klinik' => 'required',
                'status' => 'required|integer|between:0,2',
                'items' => 'required|array|min:1',
                'items.*.kode_barang' => 'required',
                'items.*.nama_barang' => 'required',
                'items.*.jumlah' => 'required|integer|min:1',
                'items.*.jenis_barang' => 'required|in:obat,alkes,inventaris',
            ]);

            // Create the permintaan barang record
            $permintaanBarang = Permintaan_Barang::create([
                'kode_request' => $validatedData['kode_request'],
                'kode_klinik' => $validatedData['kode_klinik'],
                'nama_klinik' => $validatedData['nama_klinik'],
                'status' => $validatedData['status'],
                'tanggal_input' => now(),
            ]);

            // Simpan detail permintaan barang
            foreach ($validatedData['items'] as $index => $item) {
                try {
                    Permintaan_Barang_Detail::create([
                        'kode_request' => $validatedData['kode_request'],
                        'kode_obat_alkes' => $item['kode_barang'],
                        'nama_obat_alkes' => $item['nama_barang'],
                        'qty' => $item['jumlah'],
                        'jenis_barang' => $item['jenis_barang'],
                    ]);
                } catch (\Exception $e) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Gagal menyimpan item ke-' . ($index + 1) . ': ' . $e->getMessage()
                    ], 500);
                }
            }

            // KONSEP BARU: Broadcast WebSocket event untuk real-time communication
            // Master akan menerima notifikasi permintaan baru dari client
            $this->webSocketService->broadcastPermintaanBaru([
                'kode_request' => $validatedData['kode_request'],
                'kode_klinik' => $validatedData['kode_klinik'],
                'nama_klinik' => $validatedData['nama_klinik'],
                'status' => $validatedData['status'],
                'tanggal_input' => now(),
                'items' => $validatedData['items'],
                'source' => 'client_request' // Menandakan ini request dari client
            ]);

            // Return Inertia response with success message
            return redirect()->back()->with([
                'success' => 'Permintaan barang berhasil dibuat dan dikirim ke Master Gudang!'
            ]);
        } catch (ValidationException $e) {
            return redirect()->back()->withErrors($e->errors())->with([
                'error' => 'Permintaan barang gagal dibuat!'
            ]);
        } catch (\Exception $e) {
            return redirect()->back()->with([
                'error' => 'Terjadi kesalahan saat menyimpan permintaan barang!'
            ]);
        }
    }

    /**
     * Get detail of a specific permintaan barang.
     *
     * @param  string  $kode_request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getDetail($kode_request)
    {
        try {
            // Get web setting
            $webSetting = Web_Setting::first();

            if ($webSetting && $webSetting->is_gudangutama_active == 1) {
                // MASTER MODE: Dapat melihat detail semua permintaan
                $details = Permintaan_Barang_Detail::where('kode_request', $kode_request)
                    ->select(
                        'kode_obat_alkes as kode_barang',
                        'nama_obat_alkes as nama_barang',
                        'qty as jumlah',
                        'jenis_barang'
                    )
                    ->get();

                return response()->json([
                    'success' => true,
                    'kode_request' => $kode_request,
                    'details' => $details,
                    'isMaster' => true
                ]);
            } elseif ($webSetting && $webSetting->is_gudangutama_active == 0) {
                // CLIENT MODE: Hanya dapat melihat detail permintaan sendiri
                $permintaan = Permintaan_Barang::where('kode_request', $kode_request)
                    ->where('kode_klinik', $webSetting->kode_klinik)
                    ->first();

                if (!$permintaan) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Anda hanya dapat melihat detail permintaan Anda sendiri!'
                    ], 403);
                }

                $details = Permintaan_Barang_Detail::where('kode_request', $kode_request)
                    ->select(
                        'kode_obat_alkes as kode_barang',
                        'nama_obat_alkes as nama_barang',
                        'qty as jumlah',
                        'jenis_barang'
                    )
                    ->get();

                return response()->json([
                    'success' => true,
                    'kode_request' => $kode_request,
                    'details' => $details,
                    'isMaster' => false
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Pengaturan sistem tidak valid!'
                ], 404);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat mengambil detail permintaan barang! ' . $e->getMessage()
            ], 500);
        }
    }

    // API Get Last Kode Request
    public function getLastKode()
    {
        $webSetting = Web_Setting::first();

        // Validasi kode klinik
        if (!$webSetting || empty($webSetting->kode_klinik)) {
            return response()->json([
                'success' => false,
                'message' => 'Kode klinik belum diatur. Silakan atur kode klinik terlebih dahulu di pengaturan web.'
            ], 400);
        }

        $kodeKlinik = $webSetting->kode_klinik;
        $tanggal = now()->format('Ymd'); // Format YYYYMMDD

        // KONSEP BARU: Semua kode request dibuat di database lokal
        $last = Permintaan_Barang::where('kode_klinik', $kodeKlinik)
            ->where('kode_request', 'like', "{$kodeKlinik}-%-%")
            ->orderByDesc('kode_request')
            ->first();

        // Buat kode baru
        $lastNumber = $last ? (int) substr($last->kode_request, -5) : 0;
        $nextNumber = $lastNumber + 1;
        $kodeBaru = $kodeKlinik . '-' . $tanggal . '-' . str_pad($nextNumber, 5, '0', STR_PAD_LEFT);

        return response()->json([
            'success' => true,
            'kode_request' => $kodeBaru
        ]);
    }

    /**
     * Get detail of a specific permintaan barang konfirmasi.
     *
     * @param  string  $kodeRequest
     * @return \Illuminate\Http\JsonResponse
     */
    public function getDetailKonfirmasi($kodeRequest)
    {
        try {
            $webSetting = Web_Setting::first();

            if ($webSetting && $webSetting->is_gudangutama_active == 1) {
                // MASTER MODE: Dapat melihat semua konfirmasi
                $details = Permintaan_Barang_Konfirmasi::where('kode_request', $kodeRequest)
                    ->get();
            } elseif ($webSetting && $webSetting->is_gudangutama_active == 0) {
                // CLIENT MODE: Hanya dapat melihat konfirmasi sendiri (filter berdasarkan nama_klinik)
                $details = Permintaan_Barang_Konfirmasi::where('kode_request', $kodeRequest)
                    ->where('nama_klinik', $webSetting->nama)
                    ->get();
            } else {
                $details = collect();
            }

            return response()->json([
                'success' => true,
                'details' => $details,
                'isMaster' => $webSetting && $webSetting->is_gudangutama_active == 1
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat mengambil detail konfirmasi: ' . $e->getMessage(),
                'details' => []
            ], 500);
        }
    }

    public function terimaData(Request $request)
    {
        try {
            $kodeRequest = $request->input('kode_request');
            $items = $request->input('items');

            if (empty($kodeRequest) || empty($items) || !is_array($items)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data tidak valid!'
                ], 400);
            }

            $webSetting = Web_Setting::first();

            // Use database transaction to ensure data consistency
            return DB::transaction(function () use ($kodeRequest, $items) {
                // Get the permintaan barang data
                $permintaan = Permintaan_Barang::where('kode_request', $kodeRequest)->first();

                if (!$permintaan) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Data permintaan tidak ditemukan!'
                    ], 404);
                }

                // Determine if items have IDs (selected subset) or represent full-batch
                $itemIds = collect($items)
                    ->map(function ($i) {
                        return is_array($i) ? ($i['id'] ?? null) : null;
                    })
                    ->filter()
                    ->values();

                // Fetch only selected confirmations when IDs are provided; otherwise process all by kode_request
                $konfirmasiQuery = Permintaan_Barang_Konfirmasi::where('kode_request', $kodeRequest);
                $konfirmasiToProcess = $itemIds->isNotEmpty()
                    ? $konfirmasiQuery->whereIn('id', $itemIds)->get()
                    : $konfirmasiQuery->get();

                foreach ($konfirmasiToProcess as $konfirmasi) {
                    $jenisBarang = $konfirmasi->jenis_barang ?? 'obat';
                    $kodeObatAlkes = $konfirmasi->kode_obat_alkes;
                    $namaObatAlkes = $konfirmasi->nama_obat_alkes;
                    $qty = $konfirmasi->qty ?? 0;
                    $expired = $konfirmasi->expired ?? null;

                    if ($qty <= 0) {
                        continue;
                    }

                    if ($jenisBarang === 'inventaris') {
                        Stok_Inventaris_Klinik::create([
                            'kode_pembelian' => $kodeRequest,
                            'kode_barang' => $kodeObatAlkes,
                            'nama_barang' => $namaObatAlkes,
                            'kategori_barang' => 'inventaris',
                            'jenis_barang' => 'inventaris',
                            'qty_barang' => $qty,
                            'harga_barang' => '0',
                            'tanggal_pembelian' => now()->toDateString(),
                            'detail_barang' => 'Pembelian inventaris',
                        ]);
                    } else {
                        Stok_Obat_Klinik::create([
                            'kode_klinik' => $permintaan->kode_klinik,
                            'nama_klinik' => $permintaan->nama_klinik,
                            'kode_obat_alkes' => $kodeObatAlkes,
                            'nama_obat_alkes' => $namaObatAlkes,
                            'qty' => $qty,
                            'tanggal_terima_obat' => now(),
                            'expired' => $expired,
                            'kode_request' => $kodeRequest,
                        ]);
                    }
                }

                // Update status of permintaan to 'selesai' (status 3)
                $permintaan->update([
                    'status' => 3
                ]);

                // KONSEP BARU: Broadcast WebSocket event untuk memberitahu master & anggota grup
                $this->webSocketService->broadcastPenerimaan([
                    'kode_request' => $kodeRequest,
                    'kode_klinik' => $permintaan->kode_klinik,
                    'nama_klinik' => $permintaan->nama_klinik,
                    'status' => 3,
                    'items' => $items,
                    'tanggal_terima' => now(),
                    'source' => 'client_receipt' // Menandakan barang telah diterima oleh client
                ]);

                // Process pricing for each item (only for non-inventaris items)
                $setting = Setting_Harga_Jual::first();

                foreach ($items as $item) {
                    // Only process pricing for non-inventaris items
                    if (($item['jenis_barang'] ?? 'obat') === 'inventaris') {
                        continue;
                    }

                    // Get harga dasar from item or default to 0
                    $harga_dasar = $item['harga_dasar'] ?? 0;

                    // Calculate selling prices
                    $harga_jual_1 = $harga_dasar + ($harga_dasar * ($setting->harga_jual_1 / 100));
                    $harga_jual_2 = $harga_dasar + ($harga_dasar * ($setting->harga_jual_2 / 100));
                    $harga_jual_3 = $harga_dasar + ($harga_dasar * ($setting->harga_jual_3 / 100));

                    // Create or update harga jual record in klinik-specific table
                    Daftar_Harga_Jual_Klinik::updateOrCreate(
                        [
                            'kode_obat_alkes' => $item['kode_obat_alkes'],
                        ],
                        [
                            'nama_obat_alkes' => $item['nama_obat_alkes'],
                            'harga_dasar' => $harga_dasar,
                            'harga_jual_1' => $harga_jual_1,
                            'harga_jual_2' => $harga_jual_2,
                            'harga_jual_3' => $harga_jual_3,
                            'diskon' => 0,
                            'ppn' => 0,
                            'tanggal_obat_masuk' => Carbon::now()->toDateString(),
                        ]
                    );
                }

                // Delete only processed confirmations (by IDs if provided, otherwise all under kode_request)
                if ($itemIds->isNotEmpty()) {
                    Permintaan_Barang_Konfirmasi::where('kode_request', $kodeRequest)
                        ->whereIn('id', $itemIds)
                        ->delete();
                } else {
                    Permintaan_Barang_Konfirmasi::where('kode_request', $kodeRequest)->delete();
                }

                // If no confirmations remain for this request, mark as selesai (status 3)
                $remaining = Permintaan_Barang_Konfirmasi::where('kode_request', $kodeRequest)->count();
                if ($remaining === 0) {
                    $permintaan->update(['status' => 3]);
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Data berhasil diterima dan disimpan!'
                ], 200);
            });
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat menyimpan data!',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function tolakData(Request $request, $id = null)
    {
        try {
            // Check if we're rejecting by ID (individual) or by kode_request (bulk)
            if ($id) {
                // Individual rejection by ID
                if (Web_Setting::first()->is_gudangutama_active == 0) {
                    $connExternal = External_Database::where('active', 1)->first();

                    $config = [
                        'driver'    => 'mysql',
                        'host'      => $connExternal->host,
                        'database'  => $connExternal->database,
                        'username'  => $connExternal->username,
                        'password'  => $connExternal->password,
                        'port'      => $connExternal->port ?? 3306,
                        'charset'   => 'utf8mb4',
                        'collation' => 'utf8mb4_unicode_ci',
                    ];

                    $factory = app(ConnectionFactory::class);
                    $connection = $factory->make($config, $connExternal->name);

                    $data = $connection->table('permintaan_barang_konfirmasi')->where('id', $id)->first();

                    if (!$data) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Data tidak ditemukan.'
                        ], 404);
                    }

                    // Tambahkan kembali qty ke gudang_barang atau stok_inventaris berdasarkan jenis_barang
                    if (isset($data->jenis_barang) && $data->jenis_barang === 'inventaris') {
                        // Untuk inventaris, tambahkan ke stok_inventaris
                        $connection->table('stok_inventaris')->insert([
                            'kode_pembelian' => $data->kode_request ?? 'REJECT-' . now()->format('YmdHis'),
                            'kode_barang' => $data->kode_obat_alkes,
                            'nama_barang' => $data->nama_obat_alkes,
                            'kategori_barang' => $data->kategori_barang ?? 'inventaris',
                            'jenis_barang' => $data->jenis_barang ?? 'inventaris',
                            'qty_barang' => $data->qty,
                            'harga_barang' => $data->harga_dasar ?? '0',
                            'masa_akhir_penggunaan' => $data->expired ?? now()->addYear()->format('Y-m-d'),
                            'tanggal_pembelian' => now()->format('Y-m-d'),
                            'detail_barang' => 'Barang ditolak dari permintaan ' . ($data->kode_request ?? ''),
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    } else {
                        // Untuk obat/alkes, tambahkan ke stok_barangs
                        $connection->table('stok_barangs')->insert([
                            'kode_obat_alkes' => $data->kode_obat_alkes,
                            'nama_obat_alkes' => $data->nama_obat_alkes,
                            'qty' => $data->qty,
                            'tanggal_terima_obat' => $data->tanggal_terima_obat,
                            'expired' => $data->expired,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }

                    $connection->table('gudang_penyesuaian_masuk_utamas')->insert([
                        'kode_obat' => $data->kode_obat_alkes,
                        'nama_obat' => $data->nama_obat_alkes,
                        'qty_sebelum' => '0',
                        'qty_mutasi' => $data->qty,
                        'qty_sesudah' => '0',
                        'jenis_penyesuaian' => 'BARANG DITOLAK',
                        'alasan' => "Kesalahan Pengiriman Barang Pada {$data->nama_klinik}",
                        'tanggal' => now()->toDateString(),
                        'jam' => now()->toTimeString(),
                        'harga' => $data->harga_dasar,
                        'expired' => $data->expired,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    // Hapus data dari keluar
                    $connection->table('gudang_utama_keluars')->where('id', $id)->delete();

                    // Update status permintaan menjadi 4 (ditolak oleh klinik)
                    $connection->table('permintaan_barangs')
                        ->where('kode_request', $data->kode_request)
                        ->update(['status' => 4]);
                } elseif (Web_Setting::first()->is_gudangutama_active == 1) {
                    // Assuming these models exist based on the pattern in terimaData
                    // You may need to adjust these model names based on your actual models
                    $data = Permintaan_Barang_Konfirmasi::where('id', $id)->first();

                    if (!$data) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Data tidak ditemukan.'
                        ], 404);
                    }

                    // Tambahkan kembali qty ke gudang_barang atau stok_inventaris berdasarkan jenis_barang
                    if (isset($data->jenis_barang) && $data->jenis_barang === 'inventaris') {
                        // Untuk inventaris, tambahkan ke stok_inventaris
                        Stok_Inventaris::insert([
                            'kode_pembelian' => $data->kode_request ?? 'REJECT-' . now()->format('YmdHis'),
                            'kode_barang' => $data->kode_obat_alkes,
                            'nama_barang' => $data->nama_obat_alkes,
                            'kategori_barang' => $data->kategori_barang ?? 'inventaris',
                            'jenis_barang' => $data->jenis_barang ?? 'inventaris',
                            'qty_barang' => $data->qty,
                            'harga_barang' => $data->harga_dasar ?? '0',
                            'masa_akhir_penggunaan' => $data->expired ?? now()->addYear()->format('Y-m-d'),
                            'tanggal_pembelian' => now()->format('Y-m-d'),
                            'detail_barang' => 'Barang ditolak dari permintaan ' . ($data->kode_request ?? ''),
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    } else {
                        // Untuk obat/alkes, tambahkan ke stok_barangs
                        Stok_Barang::insert([
                            'kode_obat_alkes' => $data->kode_obat_alkes,
                            'nama_obat_alkes' => $data->nama_obat_alkes,
                            'qty' => $data->qty,
                            'tanggal_terima_obat' => $data->tanggal_terima_obat,
                            'expired' => $data->expired,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }

                    // Gudang_Penyesuaian_Masuk_Utama::insert([
                    //     'kode_obat' => $data->kode_obat_alkes,
                    //     'nama_obat' => $data->nama_obat_alkes,
                    //     'qty_sebelum' => '0',
                    //     'qty_mutasi' => $data->qty,
                    //     'qty_sesudah' => '0',
                    //     'jenis_penyesuaian' => 'BARANG DITOLAK',
                    //     'alasan' => "Kesalahan Pengiriman Barang Pada {$data->nama_klinik}",
                    //     'tanggal' => now()->toDateString(),
                    //     'jam' => now()->toTimeString(),
                    //     'harga' => $data->harga_dasar,
                    //     'expired' => $data->expired,
                    //     'created_at' => now(),
                    //     'updated_at' => now(),
                    // ]);

                    // Hapus data dari keluar
                    Permintaan_Barang_Konfirmasi::where('id', $id)->delete();

                    // Update status permintaan menjadi 4 (ditolak oleh klinik)
                    Permintaan_Barang::where('kode_request', $data->kode_request)
                        ->update(['status' => 4]);
                }
            } else {
                // Bulk rejection by kode_request (all) or selected items by IDs if provided
                $kode_request = $request->input('kode_request');
                $items = $request->input('items', []);

                if (!$kode_request) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Kode request tidak ditemukan.'
                    ], 400);
                }

                // Collect IDs if provided
                $itemIds = collect($items)
                    ->map(function ($i) {
                        return is_array($i) ? ($i['id'] ?? null) : null;
                    })
                    ->filter()
                    ->values();

                if (Web_Setting::first()->is_gudangutama_active == 0) {
                    $connExternal = External_Database::where('active', 1)->first();

                    $config = [
                        'driver'    => 'mysql',
                        'host'      => $connExternal->host,
                        'database'  => $connExternal->database,
                        'username'  => $connExternal->username,
                        'password'  => $connExternal->password,
                        'port'      => $connExternal->port ?? 3306,
                        'charset'   => 'utf8mb4',
                        'collation' => 'utf8mb4_unicode_ci',
                    ];

                    $factory = app(ConnectionFactory::class);
                    $connection = $factory->make($config, $connExternal->name);

                    $query = $connection->table('permintaan_barang_konfirmasi')->where('kode_request', $kode_request);
                    if ($itemIds->isNotEmpty()) {
                        $query->whereIn('id', $itemIds->all());
                    }
                    $datas = $query->get();

                    if ($datas->isEmpty()) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Data tidak ditemukan.'
                        ], 404);
                    }

                    foreach ($datas as $data) {
                        // Tambahkan kembali qty ke gudang_barang atau stok_inventaris berdasarkan jenis_barang
                        if (isset($data->jenis_barang) && $data->jenis_barang === 'inventaris') {
                            // Untuk inventaris, tambahkan ke stok_inventaris
                            $connection->table('stok_inventaris')->insert([
                                'kode_barang' => $data->kode_obat_alkes,
                                'nama_barang' => $data->nama_obat_alkes,
                                'qty_barang' => $data->qty,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                        } else {
                            // Untuk obat/alkes, tambahkan ke stok_barangs
                            $connection->table('stok_barangs')->insert([
                                'kode_obat_alkes' => $data->kode_obat_alkes,
                                'nama_obat_alkes' => $data->nama_obat_alkes,
                                'qty' => $data->qty,
                                'tanggal_terima_obat' => $data->tanggal_terima_obat,
                                'expired' => $data->expired,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                        }

                        $connection->table('gudang_penyesuaian_masuk_utamas')->insert([
                            'kode_obat' => $data->kode_obat_alkes,
                            'nama_obat' => $data->nama_obat_alkes,
                            'qty_sebelum' => '0',
                            'qty_mutasi' => $data->qty,
                            'qty_sesudah' => '0',
                            'jenis_penyesuaian' => 'BARANG DITOLAK',
                            'alasan' => "Kesalahan Pengiriman Barang Pada {$data->nama_klinik}",
                            'tanggal' => now()->toDateString(),
                            'jam' => now()->toTimeString(),
                            'harga' => $data->harga_dasar,
                            'expired' => $data->expired,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }

                    // Hapus data dari keluar dan konfirmasi hanya untuk yang diproses
                    if ($itemIds->isNotEmpty()) {
                        $connection->table('gudang_utama_keluars')->whereIn('id', $itemIds->all())->delete();
                        $connection->table('permintaan_barang_konfirmasi')->whereIn('id', $itemIds->all())->delete();
                    } else {
                        $connection->table('gudang_utama_keluars')->where('kode_request', $kode_request)->delete();
                        $connection->table('permintaan_barang_konfirmasi')->where('kode_request', $kode_request)->delete();
                    }

                    // Update status permintaan menjadi 4 (ditolak oleh klinik)
                    $connection->table('permintaan_barangs')
                        ->where('kode_request', $kode_request)
                        ->update(['status' => 4]);
                } elseif (Web_Setting::first()->is_gudangutama_active == 1) {
                    $datasQuery = Permintaan_Barang_Konfirmasi::where('kode_request', $kode_request);
                    if ($itemIds->isNotEmpty()) {
                        $datasQuery->whereIn('id', $itemIds->all());
                    }
                    $datas = $datasQuery->get();

                    if ($datas->isEmpty()) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Data tidak ditemukan.'
                        ], 404);
                    }

                    foreach ($datas as $data) {
                        // Tambahkan kembali qty ke gudang_barang atau stok_inventaris berdasarkan jenis_barang
                        if (isset($data->jenis_barang) && $data->jenis_barang === 'inventaris') {
                            // Untuk inventaris, tambahkan ke stok_inventaris
                            Stok_Inventaris::insert([
                                'kode_barang' => $data->kode_obat_alkes,
                                'nama_barang' => $data->nama_obat_alkes,
                                'qty_barang' => $data->qty,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                        } else {
                            // Untuk obat/alkes, tambahkan ke stok_barangs
                            Stok_Barang::insert([
                                'kode_obat_alkes' => $data->kode_obat_alkes,
                                'nama_obat_alkes' => $data->nama_obat_alkes,
                                'qty' => $data->qty,
                                'tanggal_terima_obat' => $data->tanggal_terima_obat,
                                'expired' => $data->expired,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                        }

                        // Gudang_Penyesuaian_Masuk_Utama::insert([
                        //     'kode_obat' => $data->kode_obat_alkes,
                        //     'nama_obat' => $data->nama_obat_alkes,
                        //     'qty_sebelum' => '0',
                        //     'qty_mutasi' => $data->qty,
                        //     'qty_sesudah' => '0',
                        //     'jenis_penyesuaian' => 'BARANG DITOLAK',
                        //     'alasan' => "Kesalahan Pengiriman Barang Pada {$data->nama_klinik}",
                        //     'tanggal' => now()->toDateString(),
                        //     'jam' => now()->toTimeString(),
                        //     'harga' => $data->harga_dasar,
                        //     'expired' => $data->expired,
                        //     'created_at' => now(),
                        //     'updated_at' => now(),
                        // ]);
                    }

                    // Hapus hanya konfirmasi yang diproses
                    if ($itemIds->isNotEmpty()) {
                        Permintaan_Barang_Konfirmasi::where('kode_request', $kode_request)
                            ->whereIn('id', $itemIds->all())
                            ->delete();
                    } else {
                        Permintaan_Barang_Konfirmasi::where('kode_request', $kode_request)->delete();
                    }

                    // Update status permintaan menjadi 4 (ditolak oleh klinik)
                    Permintaan_Barang::where('kode_request', $kode_request)
                        ->update(['status' => 4]);
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Stok berhasil dikembalikan ke gudang.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Terima satu item konfirmasi (per item)
     */
    public function terimaItem(Request $request)
    {
        try {
            $kodeRequest = $request->input('kode_request');
            $item = $request->input('item');

            if (empty($kodeRequest) || empty($item) || !is_array($item)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data tidak valid!'
                ], 400);
            }

            return DB::transaction(function () use ($kodeRequest, $item) {
                $permintaan = Permintaan_Barang::where('kode_request', $kodeRequest)->first();
                if (!$permintaan) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Data permintaan tidak ditemukan!'
                    ], 404);
                }

                // Ambil konfirmasi by id jika ada, fallback ke data dari item
                $konfirmasi = null;
                if (isset($item['id'])) {
                    $konfirmasi = Permintaan_Barang_Konfirmasi::where('id', $item['id'])
                        ->where('kode_request', $kodeRequest)
                        ->first();
                }

                $jenisBarang = $konfirmasi->jenis_barang ?? ($item['jenis_barang'] ?? 'obat');
                $kodeObatAlkes = $konfirmasi->kode_obat_alkes ?? ($item['kode_obat_alkes'] ?? null);
                $namaObatAlkes = $konfirmasi->nama_obat_alkes ?? ($item['nama_obat_alkes'] ?? null);
                $qty = $konfirmasi->qty ?? ($item['qty'] ?? 0);
                $expired = $konfirmasi->expired ?? ($item['expired'] ?? null);

                if ($qty <= 0 || !$kodeObatAlkes || !$namaObatAlkes) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Data item tidak valid'
                    ], 400);
                }

                if ($jenisBarang === 'inventaris') {
                    Stok_Inventaris_Klinik::create([
                        'kode_pembelian' => $kodeRequest,
                        'kode_barang' => $kodeObatAlkes,
                        'nama_barang' => $namaObatAlkes,
                        'kategori_barang' => 'inventaris',
                        'jenis_barang' => 'inventaris',
                        'qty_barang' => $qty,
                        'harga_barang' => '0',
                        'tanggal_pembelian' => now()->toDateString(),
                        'detail_barang' => 'Pembelian inventaris',
                    ]);
                } else {
                    Stok_Obat_Klinik::create([
                        'kode_klinik' => $permintaan->kode_klinik,
                        'nama_klinik' => $permintaan->nama_klinik,
                        'kode_obat_alkes' => $kodeObatAlkes,
                        'nama_obat_alkes' => $namaObatAlkes,
                        'qty' => $qty,
                        'tanggal_terima_obat' => now(),
                        'expired' => $expired,
                        'kode_request' => $kodeRequest,
                    ]);

                    // Simpan/Update harga ke tabel klinik
                    $setting = Setting_Harga_Jual::first();
                    $harga_dasar = $item['harga_dasar'] ?? 0;
                    $harga_jual_1 = $harga_dasar + ($harga_dasar * (($setting->harga_jual_1 ?? 0) / 100));
                    $harga_jual_2 = $harga_dasar + ($harga_dasar * (($setting->harga_jual_2 ?? 0) / 100));
                    $harga_jual_3 = $harga_dasar + ($harga_dasar * (($setting->harga_jual_3 ?? 0) / 100));

                    Daftar_Harga_Jual_Klinik::updateOrCreate(
                        [
                            'kode_obat_alkes' => $kodeObatAlkes,
                        ],
                        [
                            'nama_obat_alkes' => $namaObatAlkes,
                            'harga_dasar' => $harga_dasar,
                            'harga_jual_1' => $harga_jual_1,
                            'harga_jual_2' => $harga_jual_2,
                            'harga_jual_3' => $harga_jual_3,
                            'diskon' => 0,
                            'ppn' => 0,
                            'tanggal_obat_masuk' => Carbon::now()->toDateString(),
                        ]
                    );
                }

                // Hapus konfirmasi untuk item ini bila ada id
                if ($konfirmasi) {
                    $konfirmasi->delete();
                }

                // Update status ke selesai jika tidak ada sisa konfirmasi
                $remaining = Permintaan_Barang_Konfirmasi::where('kode_request', $kodeRequest)->count();
                if ($remaining === 0) {
                    $permintaan->update(['status' => 3]);
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Item berhasil diterima'
                ]);
            });
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat menerima item',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Tolak satu item konfirmasi (per item)
     */
    public function tolakItem(Request $request)
    {
        try {
            $item = $request->input('item');
            $id = is_array($item) ? ($item['id'] ?? null) : null;
            if (!$id) {
                return response()->json([
                    'success' => false,
                    'message' => 'ID item tidak ditemukan.'
                ], 400);
            }
            // Reuse existing logic for individual rejection
            return $this->tolakData($request, $id);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat menolak item',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * KONSEP BARU: Master dapat mengirim konfirmasi ke client
     */
    public function kirimKonfirmasi(Request $request)
    {
        try {
            // Hanya Master yang dapat mengirim konfirmasi
            $webSetting = Web_Setting::first();
            if (!$webSetting || $webSetting->is_gudangutama_active != 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Hanya Master Gudang yang dapat mengirim konfirmasi!'
                ], 403);
            }

            $kodeRequest = $request->input('kode_request');
            $items = $request->input('items');
            $status = $request->input('status', 1); // 1: dikonfirmasi, 2: ditolak

            if (empty($kodeRequest) || empty($items) || !is_array($items)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data tidak valid!'
                ], 400);
            }

            // Get the permintaan barang data
            $permintaan = Permintaan_Barang::where('kode_request', $kodeRequest)->first();

            if (!$permintaan) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data permintaan tidak ditemukan!'
                ], 404);
            }

            // Update status permintaan
            $permintaan->update(['status' => $status]);

            // Simpan ke tabel konfirmasi
            foreach ($items as $item) {
                Permintaan_Barang_Konfirmasi::create([
                    'kode_request' => $kodeRequest,
                    'kode_klinik' => $permintaan->kode_klinik,
                    'nama_klinik' => $permintaan->nama_klinik,
                    'tanggal_request' => now(),
                    'kode_obat_alkes' => $item['kode_obat_alkes'],
                    'nama_obat_alkes' => $item['nama_obat_alkes'],
                    'qty' => $item['qty'],
                    'jenis_barang' => $item['jenis_barang'],
                    'status_konfirmasi' => $status
                ]);
            }

            // Broadcast WebSocket event untuk memberitahu client
            $this->webSocketService->broadcastKonfirmasi([
                'kode_request' => $kodeRequest,
                'kode_klinik' => $permintaan->kode_klinik,
                'nama_klinik' => $permintaan->nama_klinik,
                'status' => $status,
                'items' => $items,
                'tanggal_konfirmasi' => now(),
                'source' => 'master_confirmation'
            ]);

            return response()->json([
                'success' => true,
                'message' => $status == 1 ? 'Konfirmasi berhasil dikirim ke client!' : 'Penolakan berhasil dikirim ke client!'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat mengirim konfirmasi!',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
