<?php

namespace App\Http\Controllers\Module\Gudang;

use App\Http\Controllers\Controller;
use App\Models\Settings\Web_Setting;
use App\Models\Module\Gudang\Permintaan_Barang;
use App\Models\Module\Gudang\Permintaan_Barang_Detail;
use App\Models\Module\Gudang\Permintaan_Barang_Konfirmasi;
use App\Models\Module\Gudang\Data_Barang_Keluar;
use App\Models\Module\Master\Data\Gudang\Daftar_Barang;
use App\Models\Module\Master\Data\Gudang\Daftar_Harga_Jual;
use App\Models\Module\Gudang\Stok_Barang;
use App\Models\Module\Gudang\Stok_Inventaris;
use App\Services\PermintaanBarangWebSocketService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Illuminate\Support\Carbon;
use App\Models\Module\Master\Data\Gudang\Setting_Harga_Jual_Utama;

class Daftar_Permintaan_Barang_Controller extends Controller
{
    protected $webSocketService;

    public function __construct(PermintaanBarangWebSocketService $webSocketService)
    {
        $this->webSocketService = $webSocketService;
    }

    /**
     * KONSEP BARU: Hanya Master yang dapat mengakses daftar permintaan
     */
    public function index(Request $request)
    {
        // Cek apakah user adalah Master
        $webSetting = Web_Setting::first();
        if (!$webSetting || $webSetting->is_gudangutama_active != 1) {
            return Inertia::render('errors/unauthorized', [
                'title' => 'Akses Ditolak',
                'message' => 'Hanya Master Gudang yang dapat mengakses halaman ini!'
            ]);
        }

        $title = "Master Gudang - Daftar Permintaan Barang";

        // Master dapat melihat semua permintaan dari semua client
        $permintaan = Permintaan_Barang::select('kode_request', 'tanggal_input', 'nama_klinik', 'kode_klinik', 'status')
            ->orderBy('tanggal_input', 'desc')
            ->get();

        $dabar = Daftar_Barang::all();

        // Ambil data pengiriman barang (tanpa kode_klinik karena tidak ada di tabel)
        $data_kirim = Permintaan_Barang_Konfirmasi::select('kode_request', 'tanggal_request', 'nama_klinik')
            ->orderBy('tanggal_request', 'desc')
            ->get();

        return Inertia::render('module/gudang/daftar-permintaan-barang/index', [
            'title' => $title,
            'permintaan' => $permintaan,
            'dabar' => $dabar,
            'isMaster' => true,
            'webSetting' => $webSetting
        ]);
    }

    /**
     * KONSEP BARU: Hanya Master yang dapat mengkonfirmasi permintaan
     */
    public function konfirmasi(Request $request)
    {
        // Cek apakah user adalah Master
        $webSetting = Web_Setting::first();
        if (!$webSetting || $webSetting->is_gudangutama_active != 1) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya Master Gudang yang dapat mengkonfirmasi permintaan!'
            ], 403);
        }

        $request->validate([
            'detail_kode_request' => 'required|string',
            'detail_tanggal' => 'required|string',
        ]);

        try {
            $found = Permintaan_Barang::where('kode_request', $request->input('detail_kode_request'))
                ->where('tanggal_input', $request->input('detail_tanggal'))
                ->first();

            if (!$found) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data tidak valid atau tidak ditemukan!',
                ], 404);
            }

            // Update status menjadi dikonfirmasi
            $found->update([
                'status' => 1,
            ]);

            // Broadcast WebSocket event untuk memberitahu client
            $this->webSocketService->broadcastKonfirmasi([
                'kode_request' => $found->kode_request,
                'kode_klinik' => $found->kode_klinik,
                'nama_klinik' => $found->nama_klinik,
                'status' => 1,
                'tanggal_input' => $found->tanggal_input,
                'source' => 'master_confirmation'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Permintaan berhasil dikonfirmasi dan client telah diberitahu',
                'data' => $found,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat konfirmasi data!',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get harga dasar obat dari daftar_harga_juals
     */
    public function getHargaDasar($kode_obat)
    {
        try {
            $tanggalHariIni = Carbon::today();
            // Ambil setting waktu dari Gudang Utama; fallback 3 bulan jika tidak tersedia
            $settingUtama = Setting_Harga_Jual_Utama::first();
            $jumlahWaktu = (int)($settingUtama->setting_waktu ?? 0);
            $satuanWaktu = strtolower(trim((string)($settingUtama->satuan_waktu ?? '')));

            $tanggalMulai = null;
            if ($jumlahWaktu > 0) {
                if ($satuanWaktu === 'minggu') {
                    $tanggalMulai = $tanggalHariIni->copy()->subWeeks($jumlahWaktu);
                } elseif ($satuanWaktu === 'bulan') {
                    $tanggalMulai = $tanggalHariIni->copy()->subMonths($jumlahWaktu);
                } elseif ($satuanWaktu === 'tahun') {
                    $tanggalMulai = $tanggalHariIni->copy()->subYears($jumlahWaktu);
                }
            }

            if ($tanggalMulai === null) {
                $tanggalMulai = $tanggalHariIni->copy()->subMonths(3);
            }

            $harga = Daftar_Harga_Jual::where('kode_obat_alkes', $kode_obat)
                ->where('jenis', 'utama')
                ->whereBetween('tanggal_obat_masuk', [$tanggalMulai, $tanggalHariIni])
                ->max('harga_dasar');

            return response()->json([
                'success' => true,
                'harga_dasar' => $harga
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * KONSEP BARU: Hanya Master yang dapat melihat detail permintaan
     */
    public function getDetail($kode_request)
    {
        try {
            // Cek apakah user adalah Master
            $webSetting = Web_Setting::first();
            if (!$webSetting || $webSetting->is_gudangutama_active != 1) {
                return response()->json([
                    'success' => false,
                    'message' => 'Hanya Master Gudang yang dapat melihat detail permintaan!'
                ], 403);
            }

            Log::info('Master fetching details for kode_request: ' . $kode_request);
            $details = collect();

            if (!empty($kode_request)) {
                $details = Permintaan_Barang_Detail::where('kode_request', $kode_request)
                    ->select('kode_obat_alkes', 'nama_obat_alkes', 'qty', 'jenis_barang')
                    ->get();
                
                // Add stock information to each detail
                $details = $details->map(function ($item) {
                    // Get stok_minimal from daftar_barang
                    $barang = Daftar_Barang::where('kode', $item->kode_obat_alkes)->first();
                    $stokMinimal = $barang ? (int)($barang->stok_minimal ?? 0) : 0;
                    
                    // Determine stock table based on jenis_barang
                    if ($item->jenis_barang === 'inventaris') {
                        // For inventaris, check Stok_Inventaris
                        $totalStock = Stok_Inventaris::where('kode_barang', $item->kode_obat_alkes)
                            ->where('qty_barang', '>', 0)
                            ->sum('qty_barang');
                    } else {
                        // For obat/alkes, check Stok_Barang
                        $totalStock = Stok_Barang::where('kode_obat_alkes', $item->kode_obat_alkes)
                            ->where('qty', '>', 0)
                            ->sum('qty');
                    }
                    
                    // Ensure all values are properly cast to integers
                    $totalStock = (int)$totalStock;
                    $stokMinimal = (int)$stokMinimal;
                    
                    // Calculate available stock (total stock - minimum stock)
                    $availableStock = max(0, $totalStock - $stokMinimal);
                    
                    // Create a new array with all the required data
                    return [
                        'kode_barang' => $item->kode_obat_alkes,
                        'nama_barang' => $item->nama_obat_alkes,
                        'jumlah' => (int)$item->qty,
                        'jenis_barang' => $item->jenis_barang,
                        'stock_tersedia' => $totalStock,
                        'stok_minimal' => $stokMinimal,
                        'stok_tersedia_dikurangi_minimal' => $availableStock,
                        'cukup_stok' => $availableStock >= (int)$item->qty
                    ];
                });
            }

            return response()->json([
                'success' => true,
                'details' => $details,
                'isMaster' => true
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching details for kode_request: ' . $kode_request . ' - ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat mengambil detail data!',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * KONSEP BARU: Hanya Master yang dapat memproses permintaan dan mengurangi stok
     */
    public function prosesPermintaan(Request $request)
    {
        // Cek apakah user adalah Master
        $webSetting = Web_Setting::first();
        if (!$webSetting || $webSetting->is_gudangutama_active != 1) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya Master Gudang yang dapat memproses permintaan!'
            ], 403);
        }

        try {
            $items = $request->input('items');
            $kodeRequest = $request->input('kode_request');
            $tanggalRequest = $request->input('tanggal_request');
            $namaKlinik = $request->input('nama_klinik');

            if (empty($items) || !is_array($items)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data item tidak valid atau kosong!',
                ], 400);
            }

            $found = Permintaan_Barang::where('kode_request', $kodeRequest)
                ->where('tanggal_input', $tanggalRequest)
                ->first();

            if (!$found) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data tidak valid atau tidak ditemukan!',
                ], 404);
            }

            // Use database transaction to ensure data consistency
            return DB::transaction(function () use ($items, $kodeRequest, $tanggalRequest, $namaKlinik, $found) {
                // First, validate all items have sufficient stock before making any changes
                foreach ($items as $item) {
                    $kodeObat = $item['kode_obat'];
                    $jumlahDibutuhkan = intval($item['jumlah']);
                    $jenisBarang = $item['jenis_barang'] ?? 'obat';

                    if ($jumlahDibutuhkan <= 0) {
                        continue;
                    }

                    // Get stok_minimal from daftar_barang
                    $barang = Daftar_Barang::where('kode', $kodeObat)->first();
                    $stokMinimal = $barang ? (int)($barang->stok_minimal ?? 0) : 0;

                    // Use appropriate table based on jenis_barang
                    if ($jenisBarang === 'inventaris') {
                        $query = Stok_Inventaris::where('kode_barang', $kodeObat)
                            ->where('qty_barang', '>', 0);
                        $stokList = $query->get();
                        $totalTersedia = $stokList->sum('qty_barang');
                    } else {
                        $query = Stok_Barang::where('kode_obat_alkes', $kodeObat)
                            ->where('qty', '>', 0)
                            ->orderBy('tanggal_terima_obat', 'asc');
                        $stokList = $query->get();
                        $totalTersedia = $stokList->sum('qty');
                    }

                    // Calculate available stock (total stock - minimum stock)
                    $availableStock = max(0, $totalTersedia - $stokMinimal);

                    if ($availableStock < $jumlahDibutuhkan) {
                        $jenisBarangLabel = $jenisBarang === 'inventaris' ? 'inventaris' : 'obat/alkes';
                        return response()->json([
                            'success' => false,
                            'message' => "Stok tidak cukup untuk {$jenisBarangLabel} dengan kode {$kodeObat}. Dibutuhkan: {$jumlahDibutuhkan}, tersedia (dikurangi stok minimal): {$availableStock}",
                        ], 422);
                    }
                }

                // Update status menjadi sedang diproses
                $found->update([
                    'status' => 2,
                ]);

                // Broadcast WebSocket event untuk memberitahu client bahwa permintaan sedang diproses
                $this->webSocketService->broadcastKonfirmasi([
                    'kode_request' => $kodeRequest,
                    'kode_klinik' => $found->kode_klinik,
                    'nama_klinik' => $namaKlinik,
                    'status' => 2,
                    'tanggal_request' => $tanggalRequest,
                    'source' => 'master_processing'
                ]);

                // Process all items since we know they all have sufficient stock
                foreach ($items as $item) {
                    $kodeObat = $item['kode_obat'];
                    $jumlahDibutuhkan = intval($item['jumlah']);
                    $jenisBarang = $item['jenis_barang'] ?? 'obat';

                    $hargaDasarRaw = $item['harga_dasar'];
                    $hargaDasar = intval(str_replace(['Rp', '.', ' '], '', $hargaDasarRaw));

                    if ($jumlahDibutuhkan <= 0) {
                        continue;
                    }

                    // Use appropriate table based on jenis_barang
                    if ($jenisBarang === 'inventaris') {
                        $query = Stok_Inventaris::where('kode_barang', $kodeObat)
                            ->where('qty_barang', '>', 0);
                        $stokList = $query->get();

                        foreach ($stokList as $stok) {
                            if ($jumlahDibutuhkan <= 0) break;

                            $ambil = min($stok->qty_barang, $jumlahDibutuhkan);

                            $stok->qty_barang -= $ambil;
                            $stok->save();

                            $jumlahDibutuhkan -= $ambil;

                            Data_Barang_Keluar::create([
                                'kode_request' => $kodeRequest,
                                'nama_klinik' => $namaKlinik,
                                'tanggal_request' => $tanggalRequest,
                                'kode_obat_alkes' => $kodeObat,
                                'nama_obat_alkes' => $stok->nama_barang,
                                'harga_dasar' => $hargaDasar,
                                'qty' => $ambil,
                                'tanggal_terima_obat' => $stok->tanggal_pembelian,
                                'expired' => null,
                            ]);

                            Permintaan_Barang_Konfirmasi::create([
                                'kode_request' => $kodeRequest,
                                'nama_klinik' => $namaKlinik,
                                'tanggal_request' => $tanggalRequest,
                                'kode_obat_alkes' => $kodeObat,
                                'nama_obat_alkes' => $stok->nama_barang,
                                'harga_dasar' => $hargaDasar,
                                'qty' => $ambil,
                                'jenis_barang' => $jenisBarang,
                                'tanggal_terima_obat' => $stok->tanggal_pembelian,
                                'expired' => null,
                            ]);
                        }
                    } else {
                        $query = Stok_Barang::where('kode_obat_alkes', $kodeObat)
                            ->where('qty', '>', 0)
                            ->orderBy('tanggal_terima_obat', 'asc');
                        $stokList = $query->get();

                        foreach ($stokList as $stok) {
                            if ($jumlahDibutuhkan <= 0) break;

                            $ambil = min($stok->qty, $jumlahDibutuhkan);

                            $stok->qty -= $ambil;
                            $stok->save();

                            $jumlahDibutuhkan -= $ambil;

                            Data_Barang_Keluar::create([
                                'kode_request' => $kodeRequest,
                                'nama_klinik' => $namaKlinik,
                                'tanggal_request' => $tanggalRequest,
                                'kode_obat_alkes' => $kodeObat,
                                'nama_obat_alkes' => $stok->nama_obat_alkes,
                                'harga_dasar' => $hargaDasar,
                                'qty' => $ambil,
                                'tanggal_terima_obat' => $stok->tanggal_terima_obat,
                                'expired' => $stok->expired,
                            ]);

                            Permintaan_Barang_Konfirmasi::create([
                                'kode_request' => $kodeRequest,
                                'nama_klinik' => $namaKlinik,
                                'tanggal_request' => $tanggalRequest,
                                'kode_obat_alkes' => $kodeObat,
                                'nama_obat_alkes' => $stok->nama_obat_alkes,
                                'harga_dasar' => $hargaDasar,
                                'qty' => $ambil,
                                'jenis_barang' => $jenisBarang,
                                'tanggal_terima_obat' => $stok->tanggal_terima_obat,
                                'expired' => $stok->expired,
                            ]);
                        }
                    }
                }

                // Broadcast WebSocket event untuk memberitahu client bahwa barang sudah diproses
                $this->webSocketService->broadcastPengiriman([
                    'kode_request' => $kodeRequest,
                    'kode_klinik' => $found->kode_klinik,
                    'nama_klinik' => $namaKlinik,
                    'status' => 2,
                    'tanggal_request' => $tanggalRequest,
                    'items' => $items,
                    'source' => 'master_processed'
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Permintaan berhasil diproses dan client telah diberitahu!',
                    'data' => $kodeRequest,
                ], 201);
            });
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat memproses permintaan!',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
