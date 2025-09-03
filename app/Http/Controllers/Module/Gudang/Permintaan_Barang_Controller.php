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
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Database\Connectors\ConnectionFactory;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;

class Permintaan_Barang_Controller extends Controller
{
    public function index()
    {
        $title = "Request Stok Obat Alkes";
        
        // Mengambil data master obat
        $dabar = Daftar_Barang::all();
        
        // Mengambil pengaturan web
        $webSetting = Web_Setting::first();
        $kodeKlinik = $webSetting->kode_klinik ?? '';
        $namaKlinik = $webSetting->nama ?? '';
        
        if ($webSetting && $webSetting->is_gudangutama_active == 0) {
            $connExternal = External_Database::where('active', 1)->first();
            
            if ($connExternal) {
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
                
                // Query data dari database eksternal - ambil dari permintaan_barang_konfirmasi
                $request = $connection->table('permintaan_barangs')
                    ->select('kode_request', 'tanggal_input', 'nama_klinik', 'status')
                    ->where('nama_klinik', $namaKlinik)
                    ->groupBy('kode_request', 'tanggal_input', 'nama_klinik', 'status')
                    ->get();
                
                $data_kirim = $connection->table('permintaan_barang_konfirmasi')
                    ->select('kode_request', 'tanggal_input', 'nama_klinik')
                    ->where('nama_klinik', $namaKlinik)
                    ->groupBy('kode_request', 'tanggal_input', 'nama_klinik')
                    ->get();
                
            } else {
                $request = collect(); // kosong jika tidak ada koneksi eksternal
                $data_kirim = collect(); // kosong jika tidak ada koneksi eksternal
            }
            
        } elseif ($webSetting && $webSetting->is_gudangutama_active == 1) {
            // Mengambil data permintaan barang lokal dari permintaan_barang_konfirmasi
            $request = Permintaan_Barang::select('kode_request', 'tanggal_input', 'nama_klinik', 'status')
                ->where('nama_klinik', $namaKlinik)
                ->groupBy('kode_request', 'tanggal_input', 'nama_klinik', 'status')
                ->get();
            
            // Mengambil data pengiriman barang lokal
            $data_kirim = Permintaan_Barang_Konfirmasi::select('kode_request', 'tanggal_request', 'nama_klinik')
                ->where('nama_klinik', $namaKlinik)
                ->groupBy('kode_request', 'tanggal_request', 'nama_klinik')
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
            "webSetting" => $webSetting
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

            // Get the currently authenticated user's ID and name
            $userId = Auth::id();
            $userName = Auth::user()->name;

            // Create the permintaan barang record
            $permintaanBarang = Permintaan_Barang::create([
                'kode_request' => $validatedData['kode_request'],
                'kode_klinik' => $validatedData['kode_klinik'],
                'nama_klinik' => $validatedData['nama_klinik'],
                'status' => $validatedData['status'],
                'tanggal_input' => now(),
            ]);

            // Simpan detail permintaan barang
            \Log::info('Jumlah item yang akan disimpan: ' . count($validatedData['items']));
            foreach ($validatedData['items'] as $index => $item) {
                \Log::info('Menyimpan item ke-' . ($index + 1) . ': ', $item);
                try {
                    Permintaan_Barang_Detail::create([
                        'kode_request' => $validatedData['kode_request'],
                        'kode_obat_alkes' => $item['kode_barang'],
                        'nama_obat_alkes' => $item['nama_barang'],
                        'qty' => $item['jumlah'],
                        'jenis_barang' => $item['jenis_barang'],
                    ]);
                    \Log::info('Item ke-' . ($index + 1) . ' berhasil disimpan');
                } catch (\Exception $e) {
                    \Log::error('Gagal menyimpan item ke-' . ($index + 1) . ': ' . $e->getMessage());
                }
            }

            // Return Inertia response with success message
            return redirect()->back()->with([
                'success' => 'Permintaan barang berhasil dibuat!'
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
            
            if ($webSetting && $webSetting->is_gudangutama_active == 0) {
                // External database connection
                $connExternal = External_Database::where('active', 1)->first();
                
                if ($connExternal) {
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
                    
                    // Get details from permintaan_barang_details table
                    $details = $connection->table('permintaan_barang_details')
                        ->where('kode_request', $kode_request)
                        ->select('kode_obat_alkes as kode_barang', 'nama_obat_alkes as nama_barang', 'qty as jumlah', 'jenis_barang')
                        ->get();
                    
                    return response()->json([
                        'success' => true,
                        'kode_request' => $kode_request,
                        'details' => $details,
                    ]);
                } else {
                    return response()->json([
                        'success' => false,
                        'message' => 'Koneksi database eksternal tidak ditemukan!'
                    ], 404);
                }
            } elseif ($webSetting && $webSetting->is_gudangutama_active == 1) {
                // Local database
                // Get details from permintaan_barang_details table
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

        $last = null;

        if ($webSetting->is_gudangutama_active == 0) {
            $connExternal = External_Database::where('active', 1)->first();

            if ($connExternal) {
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

                try {
                    $factory = app(ConnectionFactory::class);
                    $connection = $factory->make($config, $connExternal->name);

                    $last = $connection->table('permintaan_barangs')
                        ->where('kode_klinik', $kodeKlinik)
                        ->where('kode_request', 'like', "{$kodeKlinik}-%-%")
                        ->orderByDesc('kode_request')
                        ->first();
                } catch (\Exception $e) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Gagal terhubung ke database gudang utama: ' . $e->getMessage()
                    ], 500);
                }
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Database gudang utama belum diatur atau tidak aktif.'
                ], 400);
            }
        } elseif ($webSetting->is_gudangutama_active == 1) {
            $last = Permintaan_Barang::where('kode_klinik', $kodeKlinik)
                ->where('kode_request', 'like', "{$kodeKlinik}-%-%")
                ->orderByDesc('kode_request')
                ->first();
        }

        // Buat kode baru jika $last ditemukan
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
        
        if ($webSetting && $webSetting->is_gudangutama_active == 0) {
            $connExternal = External_Database::where('active', 1)->first();
            
            if ($connExternal) {
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
                
                // Query detail konfirmasi berdasarkan kode_request
                $details = $connection->table('permintaan_barang_konfirmasi_details')
                    ->where('kode_request', $kodeRequest)
                    ->get();
                
            } else {
                $details = collect(); // kosong jika tidak ada koneksi eksternal
            }
        } elseif ($webSetting && $webSetting->is_gudangutama_active == 1) {
            $details = Permintaan_Barang_Konfirmasi::where('kode_request', $kodeRequest)
                        ->get();
        } else {
            $details = collect(); // kosong jika pengaturan tidak valid
        }

        return response()->json([
            'details' => $details
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
                            'kode_pembelian' => $kodeRequest, // Using kode_request as kode_pembelian
                            'kode_barang' => $kodeObatAlkes,
                            'nama_barang' => $namaObatAlkes,
                            'kategori_barang' => 'inventaris',
                            'jenis_barang' => 'inventaris',
                            'qty_barang' => (string)$qty, // Converting to string as per migration
                            'harga_barang' => '0', // Default value
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
}
