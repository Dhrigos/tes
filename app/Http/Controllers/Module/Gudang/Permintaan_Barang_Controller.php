<?php

namespace App\Http\Controllers\Module\Gudang;

use App\Http\Controllers\Controller;
use App\Models\Settings\External_Database;
use App\Models\Settings\Web_Setting;
use App\Models\Module\Master\Data\Gudang\Daftar_Obat;
use App\Models\Module\Gudang\Permintaan_Barang;
use App\Models\Module\Gudang\Permintaan_Barang_Detail;
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
        $dabar = Daftar_Obat::all();
        
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
                
                // Query data dari database eksternal
                $request = $connection->table('permintaan_barangs')
                    ->where('kode_klinik', $kodeKlinik)
                    ->get();
                
                $data_kirim = $connection->table('pengiriman_barangs')
                    ->select('kode_request', 'tanggal_input', 'nama_klinik')
                    ->where('nama_klinik', $namaKlinik)
                    ->groupBy('kode_request', 'tanggal_input', 'nama_klinik')
                    ->get();
                
            } else {
                $request = collect(); // kosong jika tidak ada koneksi eksternal
                $data_kirim = collect(); // kosong jika tidak ada koneksi eksternal
            }
            
        } elseif ($webSetting && $webSetting->is_gudangutama_active == 1) {
            // Mengambil data permintaan barang lokal
            $request = Permintaan_Barang::where('kode_klinik', $kodeKlinik)->get();
            
            // Mengambil data pengiriman barang lokal
            $data_kirim = DB::table('permintaan_barangs')
                ->select('kode_request', 'tanggal_input', 'nama_klinik')
                ->where('nama_klinik', $namaKlinik)
                ->groupBy('kode_request', 'tanggal_input', 'nama_klinik')
                ->get();
        } else {
            $request = collect();
            $data_kirim = collect();
        }
        
        // Mengambil data permintaan barang lokal untuk ditampilkan
        $permintaan_barang = Permintaan_Barang::all();
        
        return Inertia::render("module/gudang/permintaan-barang/index", [
            "permintaan_barang" => $permintaan_barang,
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
                'items' => 'required|array|min:1',
                'items.*.kode_barang' => 'required',
                'items.*.nama_barang' => 'required',
                'items.*.jumlah' => 'required|integer|min:1',
            ]);

            // Get the currently authenticated user's ID and name
            $userId = Auth::id();
            $userName = Auth::user()->name;

            // Create the permintaan barang record
            $permintaanBarang = Permintaan_Barang::create([
                'kode_request' => $validatedData['kode_request'],
                'kode_klinik' => $validatedData['kode_klinik'],
                'nama_klinik' => $validatedData['nama_klinik'],
                'status' => 'pending',
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
            
            if ($webSetting->is_gudangutama_active == 0) {
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
                    
                    // Query detail request based on kode_request
                    $details = $connection->table('gudang_klinik_request_details')
                        ->where('kode_request', $kode_request)
                        ->select('kode_obat_alkes as kode_barang', 'nama_obat_alkes as nama_barang', 'qty as jumlah', 'satuan')
                        ->get();
                } else {
                    $details = collect(); // empty if no external connection
                }
            } elseif ($webSetting->is_gudangutama_active == 1) {
                // Local database
                $details = Permintaan_Barang_Detail::where('kode_request', $kode_request)
                            ->select(
                                'kode_obat_alkes as kode_barang',
                                'nama_obat_alkes as nama_barang',
                                'qty as jumlah'
                            )
                            ->get();
            }
            
            return response()->json([
                'success' => true,
                'kode_request' => $kode_request,
                'details' => $details
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat mengambil detail permintaan barang!'
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
}
