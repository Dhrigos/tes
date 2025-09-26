<?php

namespace App\Http\Controllers\Module\Gudang;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Module\Master\Data\Gudang\Supplier;
use App\Models\Module\Master\Data\Gudang\Daftar_Barang;
use App\Models\Module\Gudang\PengeluaranBarang;
use App\Models\Module\Gudang\PengeluaranBarangItem;
use App\Models\Module\Pembelian\Pembelian;
use App\Models\Module\Pembelian\PembelianObatDetail;
use App\Models\Module\Pembelian\PembelianInventarisDetail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use App\Models\Module\Master\Data\Gudang\Satuan_Barang;
use App\Models\pembelian_obat_detail;

class Pengeluaran_Barang_Controller extends Controller
{
    public function index()
    {
        $title = 'Pengeluaran Barang';
        $suppliers = Supplier::orderBy('nama')->get(['id', 'kode', 'nama', 'nama_pic', 'telepon_pic']);
        $barangs = Daftar_Barang::all();
        $satuan = Satuan_Barang::all();
        
        // Get batch data from both tables
        $batchObat = PembelianObatDetail::all();
        $batchInventaris = PembelianInventarisDetail::all();
        $batch = $batchObat->concat($batchInventaris);
        
        return Inertia::render('module/gudang/pengeluaran-barang/index', compact('title', 'suppliers', 'barangs', 'satuan', 'batch'));
    }

    public function store(Request $request)
    {
        try {
            $data = $request->validate([
                'jenis_pengeluaran' => 'required|in:return,tidak_terduga,return_utama,tidak_terduga_utama',
                'supplier_id' => 'nullable|string',
                'keterangan' => 'nullable|string',
                'tanggal_return' => 'required|date',
                'kode_barang_keluar' => 'required|string',
                'nama_pemeriksa' => 'required|string',
                'nama_approver' => 'required|string',
                'pembelian_id' => 'nullable|string',
                'retur_items' => 'nullable|array',
                'retur_items.*.kode' => 'required_with:retur_items|string',
                'retur_items.*.nama' => 'required_with:retur_items|string',
                'retur_items.*.batch' => 'nullable|string',
                'retur_items.*.qty' => 'required_with:retur_items|numeric|min:1',
                'barang_items' => 'nullable|array',
                'barang_items.*.barang_id' => 'required_with:barang_items|string',
                'barang_items.*.qty' => 'required_with:barang_items|numeric|min:1',
            ], [
                'jenis_pengeluaran.required' => 'Pilih jenis pengeluaran',
                'tanggal_return.required' => 'Tanggal return wajib diisi',
                'kode_barang_keluar.required' => 'Kode barang keluar wajib diisi',
                'nama_pemeriksa.required' => 'Nama yang memeriksa wajib diisi',
                'nama_approver.required' => 'Nama yang approve wajib diisi',
            ]);

            // Supplier diperlukan hanya untuk jenis return
            if (($data['jenis_pengeluaran'] === 'return' || $data['jenis_pengeluaran'] === 'return_utama') && empty($data['supplier_id'])) {
                throw ValidationException::withMessages([
                    'supplier_id' => ['Pilih supplier untuk retur'],
                ]);
            }

            $record = DB::transaction(function () use ($data) {
                $pengeluaran = PengeluaranBarang::create([
                    'jenis_pengeluaran' => $data['jenis_pengeluaran'],
                    'supplier_id' => $data['supplier_id'] ?? null,
                    'keterangan' => $data['keterangan'] ?? null,
                    'tanggal_return' => $data['tanggal_return'],
                    'kode_barang_keluar' => $data['kode_barang_keluar'],
                    'nama_pemeriksa' => $data['nama_pemeriksa'],
                    'nama_approver' => $data['nama_approver'],
                    'pembelian_id' => $data['pembelian_id'] ?? null,
                ]);

                // Handle items based on jenis_pengeluaran
                if (($data['jenis_pengeluaran'] === 'return' || $data['jenis_pengeluaran'] === 'return_utama') && !empty($data['retur_items'])) {
                    // Save return items to database
                    foreach ($data['retur_items'] as $item) {
                        if (isset($item['qty']) && $item['qty'] > 0) {
                            PengeluaranBarangItem::create([
                                'pengeluaran_id' => $pengeluaran->id,
                                'kode_obat_alkes' => $item['kode'] ?? '',
                                'nama_obat_alkes' => $item['nama'] ?? '',
                                'batch' => $item['batch'] ?? null,
                                'qty' => $item['qty']
                            ]);
                            
                            // Kurangi stok berdasarkan jenis pengeluaran
                            // Untuk return, kurangi berdasarkan kode_obat_alkes/nomor_seri atau kode_barang/no_seri
                            if ($data['jenis_pengeluaran'] === 'return_utama') {
                                // Untuk gudang utama, kurangi stok_barang (obat) atau stok_inventaris (inventaris)
                                if (strpos($item['kode'], 'FIP') === 0) {
                                    // Inventaris - cari berdasarkan kode_barang dan no_seri
                                    $stokInventaris = \App\Models\Module\Gudang\Stok_Inventaris::where('kode_barang', $item['kode'])
                                        ->where('no_seri', $item['batch'])
                                        ->first();
                                    if ($stokInventaris) {
                                        // Pastikan qty tidak menjadi negatif
                                        $newQty = max(0, $stokInventaris->qty_barang - $item['qty']);
                                        $stokInventaris->update(['qty_barang' => $newQty]);
                                        \Illuminate\Support\Facades\Log::info('Stok inventaris dikurangi', [
                                            'kode_barang' => $item['kode'],
                                            'no_seri' => $item['batch'],
                                            'qty_dikurangi' => $item['qty'],
                                            'qty_awal' => $stokInventaris->qty_barang,
                                            'qty_akhir' => $newQty
                                        ]);
                                    } else {
                                        \Illuminate\Support\Facades\Log::warning('Stok inventaris tidak ditemukan', [
                                            'kode_barang' => $item['kode'],
                                            'no_seri' => $item['batch']
                                        ]);
                                    }
                                } else {
                                    // Obat - cari berdasarkan kode_obat_alkes dan nomor_seri
                                    $stokBarang = \App\Models\Module\Gudang\Stok_Barang::where('kode_obat_alkes', $item['kode'])
                                        ->where('nomor_seri', $item['batch'])
                                        ->first();
                                    if ($stokBarang) {
                                        // Pastikan qty tidak menjadi negatif
                                        $newQty = max(0, $stokBarang->qty - $item['qty']);
                                        $stokBarang->update(['qty' => $newQty]);
                                        \Illuminate\Support\Facades\Log::info('Stok barang dikurangi', [
                                            'kode_obat_alkes' => $item['kode'],
                                            'nomor_seri' => $item['batch'],
                                            'qty_dikurangi' => $item['qty'],
                                            'qty_awal' => $stokBarang->qty,
                                            'qty_akhir' => $newQty
                                        ]);
                                    } else {
                                        \Illuminate\Support\Facades\Log::warning('Stok barang tidak ditemukan', [
                                            'kode_obat_alkes' => $item['kode'],
                                            'nomor_seri' => $item['batch']
                                        ]);
                                    }
                                }
                            } else {
                                // Untuk klinik, kurangi stok_obat_klinik (obat) atau stok_inventaris_klinik (inventaris)
                                if (strpos($item['kode'], 'FIP') === 0) {
                                    // Inventaris - cari berdasarkan kode_barang dan no_seri
                                    $stokInventarisKlinik = \App\Models\Module\Gudang\Stok_Inventaris_Klinik::where('kode_barang', $item['kode'])
                                        ->where('no_seri', $item['batch'])
                                        ->first();
                                    if ($stokInventarisKlinik) {
                                        // Pastikan qty tidak menjadi negatif
                                        $newQty = max(0, $stokInventarisKlinik->qty_barang - $item['qty']);
                                        $stokInventarisKlinik->update(['qty_barang' => $newQty]);
                                        \Illuminate\Support\Facades\Log::info('Stok inventaris klinik dikurangi', [
                                            'kode_barang' => $item['kode'],
                                            'no_seri' => $item['batch'],
                                            'qty_dikurangi' => $item['qty'],
                                            'qty_awal' => $stokInventarisKlinik->qty_barang,
                                            'qty_akhir' => $newQty
                                        ]);
                                    } else {
                                        \Illuminate\Support\Facades\Log::warning('Stok inventaris klinik tidak ditemukan', [
                                            'kode_barang' => $item['kode'],
                                            'no_seri' => $item['batch']
                                        ]);
                                    }
                                } else {
                                    // Obat - cari berdasarkan kode_obat_alkes
                                    $stokObatKlinik = \App\Models\Module\Gudang\Stok_Obat_Klinik::where('kode_obat_alkes', $item['kode'])
                                        ->first();
                                    if ($stokObatKlinik) {
                                        // Pastikan qty tidak menjadi negatif
                                        $newQty = max(0, $stokObatKlinik->qty - $item['qty']);
                                        $stokObatKlinik->update(['qty' => $newQty]);
                                        \Illuminate\Support\Facades\Log::info('Stok obat klinik dikurangi', [
                                            'kode_obat_alkes' => $item['kode'],
                                            'qty_dikurangi' => $item['qty'],
                                            'qty_awal' => $stokObatKlinik->qty,
                                            'qty_akhir' => $newQty
                                        ]);
                                    } else {
                                        \Illuminate\Support\Facades\Log::warning('Stok obat klinik tidak ditemukan', [
                                            'kode_obat_alkes' => $item['kode']
                                        ]);
                                    }
                                }
                            }
                        }
                    }
                } elseif (($data['jenis_pengeluaran'] === 'tidak_terduga' || $data['jenis_pengeluaran'] === 'tidak_terduga_utama') && !empty($data['barang_items'])) {
                    // Save tidak_terduga items to database
                    foreach ($data['barang_items'] as $item) {
                        if (isset($item['qty']) && $item['qty'] > 0) {
                            // Get item details from barang_id
                            // First try to find from PembelianObatDetail
                            $obatDetail = PembelianObatDetail::find($item['barang_id']);
                            if ($obatDetail) {
                                PengeluaranBarangItem::create([
                                    'pengeluaran_id' => $pengeluaran->id,
                                    'kode_obat_alkes' => $obatDetail->kode_obat_alkes ?? '',
                                    'nama_obat_alkes' => $obatDetail->nama_obat_alkes ?? '',
                                    'batch' => $obatDetail->batch ?? null,
                                    'qty' => $item['qty']
                                ]);
                                
                                // Kurangi stok berdasarkan jenis pengeluaran
                                // Untuk tidak terduga, kurangi berdasarkan no_seri (nomor batch)
                                if ($data['jenis_pengeluaran'] === 'tidak_terduga_utama') {
                                    // Untuk gudang utama, kurangi stok_barang berdasarkan nomor_seri
                                    $stokBarang = \App\Models\Module\Gudang\Stok_Barang::where('kode_obat_alkes', $obatDetail->kode_obat_alkes)
                                        ->where('nomor_seri', $obatDetail->batch)
                                        ->first();
                                    if ($stokBarang) {
                                        // Pastikan qty tidak menjadi negatif
                                        $newQty = max(0, $stokBarang->qty - $item['qty']);
                                        $stokBarang->update(['qty' => $newQty]);
                                        \Illuminate\Support\Facades\Log::info('Stok barang dikurangi (tidak terduga)', [
                                            'kode_obat_alkes' => $obatDetail->kode_obat_alkes,
                                            'nomor_seri' => $obatDetail->batch,
                                            'qty_dikurangi' => $item['qty'],
                                            'qty_awal' => $stokBarang->qty,
                                            'qty_akhir' => $newQty
                                        ]);
                                    } else {
                                        \Illuminate\Support\Facades\Log::warning('Stok barang tidak ditemukan (tidak terduga)', [
                                            'kode_obat_alkes' => $obatDetail->kode_obat_alkes,
                                            'nomor_seri' => $obatDetail->batch
                                        ]);
                                    }
                                } else {
                                    // Untuk klinik, kurangi stok_obat_klinik
                                    $stokObatKlinik = \App\Models\Module\Gudang\Stok_Obat_Klinik::where('kode_obat_alkes', $obatDetail->kode_obat_alkes)
                                        ->first();
                                    if ($stokObatKlinik) {
                                        // Pastikan qty tidak menjadi negatif
                                        $newQty = max(0, $stokObatKlinik->qty - $item['qty']);
                                        $stokObatKlinik->update(['qty' => $newQty]);
                                        \Illuminate\Support\Facades\Log::info('Stok obat klinik dikurangi (tidak terduga)', [
                                            'kode_obat_alkes' => $obatDetail->kode_obat_alkes,
                                            'qty_dikurangi' => $item['qty'],
                                            'qty_awal' => $stokObatKlinik->qty,
                                            'qty_akhir' => $newQty
                                        ]);
                                    } else {
                                        \Illuminate\Support\Facades\Log::warning('Stok obat klinik tidak ditemukan (tidak terduga)', [
                                            'kode_obat_alkes' => $obatDetail->kode_obat_alkes
                                        ]);
                                    }
                                }
                            } else {
                                // Try to find from PembelianInventarisDetail
                                $inventarisDetail = PembelianInventarisDetail::find($item['barang_id']);
                                if ($inventarisDetail) {
                                    PengeluaranBarangItem::create([
                                        'pengeluaran_id' => $pengeluaran->id,
                                        'kode_obat_alkes' => $inventarisDetail->kode_barang ?? $inventarisDetail->kode ?? '',
                                        'nama_obat_alkes' => $inventarisDetail->nama_barang ?? '',
                                        'batch' => $inventarisDetail->batch ?? null,
                                        'qty' => $item['qty']
                                    ]);
                                    
                                    // Kurangi stok berdasarkan jenis pengeluaran
                                    // Untuk tidak terduga, kurangi berdasarkan no_seri (nomor batch)
                                    if ($data['jenis_pengeluaran'] === 'tidak_terduga_utama') {
                                        // Untuk gudang utama, kurangi stok_inventaris berdasarkan no_seri
                                        $stokInventaris = \App\Models\Module\Gudang\Stok_Inventaris::where('kode_barang', $inventarisDetail->kode_barang)
                                            ->where('no_seri', $inventarisDetail->batch)
                                            ->first();
                                        if ($stokInventaris) {
                                            // Pastikan qty tidak menjadi negatif
                                            $newQty = max(0, $stokInventaris->qty_barang - $item['qty']);
                                            $stokInventaris->update(['qty_barang' => $newQty]);
                                            \Illuminate\Support\Facades\Log::info('Stok inventaris dikurangi (tidak terduga)', [
                                                'kode_barang' => $inventarisDetail->kode_barang,
                                                'no_seri' => $inventarisDetail->batch,
                                                'qty_dikurangi' => $item['qty'],
                                                'qty_awal' => $stokInventaris->qty_barang,
                                                'qty_akhir' => $newQty
                                            ]);
                                        } else {
                                            \Illuminate\Support\Facades\Log::warning('Stok inventaris tidak ditemukan (tidak terduga)', [
                                                'kode_barang' => $inventarisDetail->kode_barang,
                                                'no_seri' => $inventarisDetail->batch
                                            ]);
                                        }
                                    } else {
                                        // Untuk klinik, kurangi stok_inventaris_klinik berdasarkan no_seri
                                        $stokInventarisKlinik = \App\Models\Module\Gudang\Stok_Inventaris_Klinik::where('kode_barang', $inventarisDetail->kode_barang)
                                            ->where('no_seri', $inventarisDetail->batch)
                                            ->first();
                                        if ($stokInventarisKlinik) {
                                            // Pastikan qty tidak menjadi negatif
                                            $newQty = max(0, $stokInventarisKlinik->qty_barang - $item['qty']);
                                            $stokInventarisKlinik->update(['qty_barang' => $newQty]);
                                            \Illuminate\Support\Facades\Log::info('Stok inventaris klinik dikurangi (tidak terduga)', [
                                                'kode_barang' => $inventarisDetail->kode_barang,
                                                'no_seri' => $inventarisDetail->batch,
                                                'qty_dikurangi' => $item['qty'],
                                                'qty_awal' => $stokInventarisKlinik->qty_barang,
                                                'qty_akhir' => $newQty
                                            ]);
                                        } else {
                                            \Illuminate\Support\Facades\Log::warning('Stok inventaris klinik tidak ditemukan (tidak terduga)', [
                                                'kode_barang' => $inventarisDetail->kode_barang,
                                                'no_seri' => $inventarisDetail->batch
                                            ]);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                return $pengeluaran;
            });

            return redirect()
                ->back()
                ->with('success', 'Pengeluaran barang berhasil disimpan');
        } catch (ValidationException $e) {
            return redirect()->back()->withErrors($e->errors())->with('error', 'Validasi gagal');
        } catch (\Throwable $e) {
            Log::error($e);
            return redirect()->back()->with('error', 'Terjadi kesalahan saat menyimpan');
        }
    }

    // GENERATE KODE PENGELUARAN BARANG
    public function generateKode(Request $request)
    {
        try {
            $jenis = (string) $request->input('jenis_pengeluaran');
            $today = date('Ymd');

            // Menentukan prefix berdasarkan jenis pengeluaran
            if ($jenis === 'return' || $jenis === 'return_utama') {
                $prefix = 'RTR-' . $today . '-';
                // Untuk return dan return_utama, gunakan urutan yang sama
                $jenis_filter = ['return', 'return_utama'];
            } else { // tidak_terduga or tidak_terduga_utama
                $prefix = 'BKTD-' . $today . '-';
                // Untuk tidak_terduga dan tidak_terduga_utama, gunakan urutan yang sama
                $jenis_filter = ['tidak_terduga', 'tidak_terduga_utama'];
            }

            // Mencari record terakhir berdasarkan jenis pengeluaran yang sesuai
            $last = PengeluaranBarang::where('kode_barang_keluar', 'LIKE', $prefix . '%')
                ->whereDate('created_at', '=', date('Y-m-d'))
                ->whereIn('jenis_pengeluaran', $jenis_filter)
                ->latest('kode_barang_keluar')
                ->first();

            if ($last) {
                if ($jenis === 'return' || $jenis === 'return_utama') {
                    preg_match('/RTR-\d{8}-(\d{5})$/', $last->kode_barang_keluar, $matches);
                } else {
                    preg_match('/BKTD-\d{8}-(\d{5})$/', $last->kode_barang_keluar, $matches);
                }
                $nextNumber = isset($matches[1]) ? (int) $matches[1] + 1 : 1;
            } else {
                $nextNumber = 1;
            }

            $nextKode = $prefix . str_pad($nextNumber, 5, '0', STR_PAD_LEFT);

            return response()->json([
                'success' => true,
                'kode' => $nextKode,
                'jenis_pengeluaran' => $jenis,
            ], 200);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat menghasilkan kode pengeluaran.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function getPembelians(Request $request) {
        try {
            $pembelians = Pembelian::orderByDesc('tanggal_faktur')
                ->get(['id', 'nomor_faktur', 'supplier', 'tanggal_faktur']);
            
            return response()->json([
                'success' => true,
                'data' => $pembelians,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching pembelians: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function getPembelianDetails(Request $request) {
        try {
            // Get data from PembelianObatDetail
            $obat_details = PembelianObatDetail::orderBy('nomor_faktur')
                ->get(['nomor_faktur', 'kode_obat_alkes', 'nama_obat_alkes', 'qty', 'exp', 'batch']);
            
            // Get data from PembelianInventarisDetail
            $inventaris_details = PembelianInventarisDetail::orderBy('kode')
                ->get(['kode as nomor_faktur', 'kode_barang as kode_obat_alkes', 'nama_barang as nama_obat_alkes', 'qty_barang as qty', 'masa_akhir_penggunaan as exp', 'batch']);
            
            // Merge both collections
            $pembelian_details = $obat_details->concat($inventaris_details);
            
            return response()->json([
                'success' => true,
                'data' => $pembelian_details,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching pembelian details: ' . $e->getMessage(),
            ], 500);
        }
    }
}
