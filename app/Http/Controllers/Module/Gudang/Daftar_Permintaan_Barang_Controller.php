<?php

namespace App\Http\Controllers\Module\Gudang;

use App\Http\Controllers\Controller;
use App\Models\Module\Gudang\Permintaan_Barang;
use App\Models\Module\Gudang\Permintaan_Barang_Detail;
use App\Models\Module\Gudang\Permintaan_Barang_Konfirmasi;
use App\Models\Module\Gudang\Data_Barang_Keluar;
use App\Models\Module\Master\Data\Gudang\Daftar_Barang;
use App\Models\Module\Gudang\Stok_Barang;
use App\Models\Module\Gudang\Stok_Inventaris;
use Illuminate\Http\Request;
use Inertia\Inertia;

class Daftar_Permintaan_Barang_Controller extends Controller
{
    public function index(Request $request) {
        $title = "Daftar Permintaan Barang";
        $permintaan = Permintaan_Barang::all();
        $dabar = Daftar_Barang::all();
        return Inertia::render('module/gudang/daftar-permintaan-barang/index', [
            'title' => $title,
            'permintaan' => $permintaan,
            'dabar' => $dabar,
        ]);
    }

    public function konfirmasi(Request $request)
    {
        $request->validate([
            'detail_kode_request' => 'required|string',
            'detail_tanggal' => 'required|string',
        ]);

        try {
            $found = Permintaan_Barang::where('kode_request', $request->input('detail_kode_request'))
                ->where('tanggal_input', $request->input('detail_tanggal'))
                ->first();

            if (!$found) {
                // Data tidak ditemukan, return error
                return response()->json([
                    'success' => false,
                    'message' => 'Data tidak valid atau tidak ditemukan!',
                ], 404);
            }

            // Update status
            $found->update([
                'status' => 1,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Data berhasil dikonfirmasi',
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

    public function getDetail($kode_request)
    {
        try {
            \Log::info('Fetching details for kode_request: ' . $kode_request);
            $details = collect(); // Default: koleksi kosong

            if (!empty($kode_request)) {
                $details = Permintaan_Barang_Detail::where('kode_request', $kode_request)
                    ->select('kode_obat_alkes', 'nama_obat_alkes', 'qty', 'jenis_barang')
                    ->get();
                \Log::info('Found ' . $details->count() . ' details for kode_request: ' . $kode_request);
            }

            return response()->json([
                'success' => true,
                'details' => $details
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching details for kode_request: ' . $kode_request . ' - ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat mengambil detail data!',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function prosesPermintaan(Request $request) //update status request dan kurangi stok
    {
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
                // Data tidak ditemukan, return error
                return response()->json([
                    'success' => false,
                    'message' => 'Data tidak valid atau tidak ditemukan!',
                ], 404);
            }

            // Use database transaction to ensure data consistency
            return \DB::transaction(function () use ($items, $kodeRequest, $tanggalRequest, $namaKlinik, $found) {
                // First, validate all items have sufficient stock before making any changes
                foreach ($items as $item) {
                    $kodeObat = $item['kode_obat'];
                    $jumlahDibutuhkan = intval($item['jumlah']);
                    $jenisBarang = $item['jenis_barang'] ?? 'obat'; // Default to 'obat' if not provided

                    // Skip jika jumlah kosong/tidak valid
                    if ($jumlahDibutuhkan <= 0) {
                        continue;
                    }

                    // Use appropriate table based on jenis_barang
                    if ($jenisBarang === 'inventaris') {
                        // For inventaris, check stok_inventaris table
                        $query = Stok_Inventaris::where('kode_barang', $kodeObat)
                                    ->where('qty_barang', '>', 0);
                        $stokList = $query->get();
                        $totalTersedia = $stokList->sum('qty_barang');
                    } else {
                        // For obat/alkes, check stok_barang table
                        $query = Stok_Barang::where('kode_obat_alkes', $kodeObat)
                                    ->where('qty', '>', 0)
                                    ->orderBy('tanggal_terima_obat', 'asc');
                        $stokList = $query->get();
                        $totalTersedia = $stokList->sum('qty');
                    }

                    if ($totalTersedia < $jumlahDibutuhkan) {
                        // Validasi gagal jika stok tidak mencukupi
                        $jenisBarangLabel = $jenisBarang === 'inventaris' ? 'inventaris' : 'obat/alkes';
                        return response()->json([
                            'success' => false,
                            'message' => "Stok tidak cukup untuk {$jenisBarangLabel} dengan kode {$kodeObat}. Dibutuhkan: {$jumlahDibutuhkan}, tersedia: {$totalTersedia}",
                        ], 422);
                    }
                }

                // Update status only after all validations pass
                $found->update([
                    'status' => 2,
                ]);

                // Process all items since we know they all have sufficient stock
                foreach ($items as $item) {
                    $kodeObat = $item['kode_obat'];
                    $jumlahDibutuhkan = intval($item['jumlah']);
                    $jenisBarang = $item['jenis_barang'] ?? 'obat'; // Default to 'obat' if not provided

                    $hargaDasarRaw = $item['harga_dasar'];
                    $hargaDasar = intval(str_replace(['Rp', '.', ' '], '', $hargaDasarRaw));

                    // Skip jika jumlah kosong/tidak valid
                    if ($jumlahDibutuhkan <= 0) {
                        continue;
                    }

                    // Use appropriate table based on jenis_barang
                    if ($jenisBarang === 'inventaris') {
                        // For inventaris, use stok_inventaris table
                        $query = Stok_Inventaris::where('kode_barang', $kodeObat)
                                    ->where('qty_barang', '>', 0);
                        $stokList = $query->get();

                        foreach ($stokList as $stok) {
                            if ($jumlahDibutuhkan <= 0) break;

                            $ambil = min($stok->qty_barang, $jumlahDibutuhkan);

                            $stok->qty_barang -= $ambil;
                            $stok->save();

                            $jumlahDibutuhkan -= $ambil;

                            // For inventaris, we need to adapt the data structure
                            Data_Barang_Keluar::create([
                                'kode_request' => $kodeRequest,
                                'nama_klinik' => $namaKlinik,
                                'tanggal_request' => $tanggalRequest,
                                'kode_obat_alkes' => $kodeObat,
                                'nama_obat_alkes' => $stok->nama_barang,
                                'harga_dasar' => $hargaDasar,
                                'qty' => $ambil,
                                'tanggal_terima_obat' => $stok->tanggal_pembelian,
                                'expired' => null, // Inventaris may not have expiration date
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
                                'expired' => null, // Inventaris may not have expiration date
                            ]);
                        }
                    } else {
                        // For obat/alkes, use stok_barang table
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

                // Return jika berhasil
                return response()->json([
                    'success' => true,
                    'message' => 'Permintaan berhasil diproses!',
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
