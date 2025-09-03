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
use App\Models\Module\Gudang\Harga_Barang;
use App\Models\Module\Master\Data\Gudang\Setting_Harga_Jual;
use App\Models\Module\Master\Data\Gudang\Daftar_Harga_Jual;
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
            
            // Ambil data pengiriman barang
            $data_kirim = Permintaan_Barang_Konfirmasi::select('kode_request', 'tanggal_request', 'nama_klinik', 'kode_klinik')
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
            
            // Ambil data pengiriman barang untuk client ini
            $data_kirim = Permintaan_Barang_Konfirmasi::select('kode_request', 'tanggal_request', 'nama_klinik', 'kode_klinik')
                ->where('kode_klinik', $kodeKlinik)
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
        $webSetting = Web_Setting::first();
        
        if ($webSetting && $webSetting->is_gudangutama_active == 1) {
            // MASTER MODE: Dapat melihat semua konfirmasi
            $details = Permintaan_Barang_Konfirmasi::where('kode_request', $kodeRequest)
                        ->get();
        } elseif ($webSetting && $webSetting->is_gudangutama_active == 0) {
            // CLIENT MODE: Hanya dapat melihat konfirmasi sendiri
            $details = Permintaan_Barang_Konfirmasi::where('kode_request', $kodeRequest)
                        ->where('kode_klinik', $webSetting->kode_klinik)
                        ->get();
        } else {
            $details = collect();
        }

        return response()->json([
            'details' => $details,
            'isMaster' => $webSetting && $webSetting->is_gudangutama_active == 1
        ]);
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
            
            // KONSEP BARU: Hanya Master yang dapat menerima data
            $webSetting = Web_Setting::first();
            if (!$webSetting || $webSetting->is_gudangutama_active != 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Hanya Master Gudang yang dapat menerima data!'
                ], 403);
            }
            
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
                
                // Process each item based on jenis_barang
                foreach ($items as $item) {
                    $jenisBarang = $item['jenis_barang'] ?? 'obat';
                    $kodeObatAlkes = $item['kode_obat_alkes'];
                    $namaObatAlkes = $item['nama_obat_alkes'];
                    $qty = $item['qty'] ?? 0;
                    $expired = $item['expired'] ?? null;
                    
                    if ($qty <= 0) {
                        continue;
                    }
                    
                    // Save to appropriate table based on jenis_barang
                    if ($jenisBarang === 'inventaris') {
                        // Save to stok_inventaris_klinik table
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
                        // Save to stok_obat_klinik table (for obat/alkes)
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

                // KONSEP BARU: Broadcast WebSocket event untuk memberitahu client
                $this->webSocketService->broadcastPenerimaan([
                    'kode_request' => $kodeRequest,
                    'kode_klinik' => $permintaan->kode_klinik,
                    'nama_klinik' => $permintaan->nama_klinik,
                    'status' => 3,
                    'items' => $items,
                    'tanggal_terima' => now(),
                    'source' => 'master_confirmation' // Menandakan ini konfirmasi dari master
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
                    
                    // Create or update harga jual record
                    Daftar_Harga_Jual::updateOrCreate(
                        [
                            'kode_obat_alkes' => $item['kode_obat_alkes'],
                            'jenis' => 'klinik'
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
                            'updated_at' => now(),
                        ]
                    );
                }
                
                // Delete the data from permintaan_barang_konfirmasi table
                Permintaan_Barang_Konfirmasi::where('kode_request', $kodeRequest)->delete();
                
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
