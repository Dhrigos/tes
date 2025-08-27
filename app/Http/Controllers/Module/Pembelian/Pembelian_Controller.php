<?php

namespace App\Http\Controllers\Module\Pembelian;

use App\Http\Controllers\Controller;
use App\Models\Module\Pembelian\Pembelian;
use App\Models\Module\Pembelian\PembelianDetail;
use App\Models\Module\Pembelian\PembelianObatDetail;
use App\Models\Module\Pembelian\PembelianInventarisDetail;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class Pembelian_Controller extends Controller
{
    public function index()
    {
        $title = "Pembelian";
        // $supplier = gudang_supplier_industri::all();
        // $gudang = WebSetting::first()->is_gudangutama_active;
        // if ($gudang == 1) {
        //     $dabar = gudang_barang_utama::all();
        // } else {
        //     $dabar = gudang_barang::all();
        // }
        // $user = User::all();
        // if ($gudang == 1) {
        //     $settingHarga = gudang_setting_harga_utama::first();
        // } else {
        //     $settingHarga = gudang_setting_harga::first();
        // }

        return Inertia::render('module/pembelian/index', compact(
            'title'
        ));
    }

    public function store(Request $request)
    {
        try {
            // Validasi data
            $request->validate([
                'jenis_pembelian' => 'required|in:obat,inventaris',
                'nomor_faktur' => 'required|string',
                'supplier' => 'nullable|string',
                'no_po_sp' => 'nullable|string',
                'no_faktur_supplier' => 'nullable|string',
                'tanggal_terima_barang' => 'nullable|string',
                'tanggal_faktur' => 'nullable|string',
                'tanggal_jatuh_tempo' => 'nullable|string',
                'pajak_ppn' => 'nullable|string',
                'metode_hna' => 'nullable|string',
                'sub_total' => 'nullable|string',
                'total_diskon' => 'nullable|string',
                'ppn_total' => 'nullable|string',
                'total' => 'required|string',
                'materai' => 'nullable|string',
                'koreksi' => 'nullable|string',
                'penerima_barang' => 'required|string',
                'tgl_pembelian' => 'nullable|string',
                'details' => 'required|array',
                'details.*.nama_obat_alkes' => 'required|string',
                'details.*.kode_obat_alkes' => 'required|string',
                'details.*.qty' => 'required|string',
                'details.*.harga_satuan' => 'required|string',
                'details.*.diskon' => 'nullable|string',
                'details.*.exp' => 'nullable|string',
                'details.*.batch' => 'nullable|string',
                'details.*.sub_total' => 'required|string',
            ], [
                'jenis_pembelian.required' => 'Jenis pembelian wajib dipilih',
                'nomor_faktur.required' => 'Nomor faktur wajib diisi',
                'total.required' => 'Total pembelian wajib diisi',
                'penerima_barang.required' => 'Penerima barang wajib diisi',
                'details.required' => 'Detail pembelian wajib diisi',
                'details.*.nama_obat_alkes.required' => 'Nama item wajib diisi',
                'details.*.kode_obat_alkes.required' => 'Kode item wajib diisi',
                'details.*.qty.required' => 'Quantity wajib diisi',
                'details.*.harga_satuan.required' => 'Harga satuan wajib diisi',
                'details.*.sub_total.required' => 'Sub total wajib diisi',
            ]);

            // Cek apakah nomor faktur sudah ada
            $existingPembelian = Pembelian::where('nomor_faktur', $request->nomor_faktur)->first();
            if ($existingPembelian) {
                return response()->json([
                    'success' => false,
                    'message' => 'Nomor faktur sudah digunakan!'
                ], 422);
            }

            // Simpan data secara atomik agar master dan detail konsisten
            $pembelian = DB::transaction(function () use ($request) {
                $header = Pembelian::create([
                    'jenis_pembelian' => $request->jenis_pembelian,
                    'nomor_faktur' => $request->nomor_faktur,
                    'supplier' => $request->supplier,
                    'no_po_sp' => $request->no_po_sp,
                    'no_faktur_supplier' => $request->no_faktur_supplier,
                    'tanggal_terima_barang' => $request->tanggal_terima_barang,
                    'tanggal_faktur' => $request->tanggal_faktur,
                    'tanggal_jatuh_tempo' => $request->tanggal_jatuh_tempo,
                    'pajak_ppn' => $request->pajak_ppn ?: '0',
                    'metode_hna' => $request->metode_hna,
                    'sub_total' => $request->sub_total ?: '0',
                    'total_diskon' => $request->total_diskon ?: '0',
                    'ppn_total' => $request->ppn_total ?: '0',
                    'total' => $request->total,
                    'materai' => $request->materai ?: '0',
                    'koreksi' => $request->koreksi ?: '0',
                    'penerima_barang' => $request->penerima_barang,
                    'tgl_pembelian' => $request->tgl_pembelian ?: now()->format('Y-m-d'),
                ]);

                $details = $request->input('details', []);
                foreach ($details as $detail) {
                    // Lewati entri kosong jika ada
                    if (!(isset($detail['nama_obat_alkes'], $detail['kode_obat_alkes'], $detail['qty'], $detail['harga_satuan'], $detail['sub_total']))) {
                        continue;
                    }

                    if ($request->jenis_pembelian === 'inventaris') {
                        PembelianInventarisDetail::create([
                            'kode' => $request->nomor_faktur,
                            'kode_barang' => $detail['kode_obat_alkes'],
                            'nama_barang' => $detail['nama_obat_alkes'],
                            'kategori_barang' => 'Inventaris',
                            'jenis_barang' => 'Medical Equipment',
                            'qty_barang' => $detail['qty'],
                            'harga_barang' => $detail['harga_satuan'],
                            'lokasi' => $detail['lokasi'] ?? 'Gudang',
                            'kondisi' => $detail['kondisi'] ?? 'Baik',
                            'masa_akhir_penggunaan' => $detail['exp'] ?? null,
                            'tanggal_pembelian' => $detail['tanggal_pembelian'] ?? ($request->tgl_pembelian),
                            'detail_barang' => $detail['deskripsi_barang'] ?? ('Batch: ' . ($detail['batch'] ?? '-')),
                        ]);
                    } else {
                        PembelianObatDetail::create([
                            'nomor_faktur' => $request->nomor_faktur,
                            'nama_obat_alkes' => $detail['nama_obat_alkes'],
                            'kode_obat_alkes' => $detail['kode_obat_alkes'],
                            'qty' => $detail['qty'],
                            'harga_satuan' => $detail['harga_satuan'],
                            'diskon' => $detail['diskon'] ?? '0',
                            'exp' => $detail['exp'] ?? null,
                            'batch' => $detail['batch'] ?? null,
                            'sub_total' => $detail['sub_total'],
                        ]);
                    }
                }

                return $header;
            });

            return response()->json([
                'success' => true,
                'message' => 'Data pembelian berhasil disimpan!',
                'data' => $pembelian
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal!',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat menyimpan data pembelian!',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    //GENERATE NO FAKTUR
    public function generateFakturPembelian(Request $request)
    {
        try {
            $jenisPembelian = $request->input('jenis_pembelian');
            $today = date('Ymd'); // Format menjadi YYYYMMDD

            // Tentukan prefix berdasarkan jenis pembelian
            if ($jenisPembelian === 'inventaris') {
                $prefix = 'FIP-' . $today . '-'; // Faktur Inventaris Pembelian
            } else {
                $prefix = 'INV-' . $today . '-'; // Invoice untuk obat
            }

            // Cari nomor faktur terakhir untuk tanggal yang sama dengan jenis pembelian yang sama
            $lastPembelian = Pembelian::where('nomor_faktur', 'LIKE', $prefix . '%')
                ->whereDate('created_at', '=', date('Y-m-d'))
                ->where('jenis_pembelian', $jenisPembelian)
                ->latest('nomor_faktur')
                ->first();

            // Jika ada nomor faktur terakhir dengan kode yang sama, ambil angka di akhir dan tambahkan 1
            if ($lastPembelian) {
                if ($jenisPembelian === 'inventaris') {
                    preg_match('/FIP-\d{8}-(\d{5})$/', $lastPembelian->nomor_faktur, $matches);
                } else {
                    preg_match('/INV-\d{8}-(\d{5})$/', $lastPembelian->nomor_faktur, $matches);
                }
                $nextNumber = isset($matches[1]) ? (int) $matches[1] + 1 : 1;
            } else {
                // Jika tidak ada nomor faktur sebelumnya untuk jenis ini hari ini, mulai dari 1
                $nextNumber = 1;
            }

            // Format nomor faktur dengan padding 5 digit
            $nextNomorFaktur = $prefix . str_pad($nextNumber, 5, '0', STR_PAD_LEFT);

            return response()->json([
                'success' => true,
                'nomor_faktur' => $nextNomorFaktur,
                'jenis_pembelian' => $jenisPembelian
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat menghasilkan nomor faktur.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    //GENERATE NO INVENTARIS
    public function generatePembelianInventaris()
    {
        try {
            $today = date('Ymd'); // Tanggal hari ini dalam format YYYYMMDD
            $prefix = 'FIP-' . $today . '-';

            // Cari nomor inventaris terakhir untuk tanggal yang sama dengan prefix yang sama
            // Menggunakan model pembelian untuk inventaris (sesuaikan dengan model yang tersedia)
            $lastInventaris = Pembelian::where('nomor_faktur', 'LIKE', $prefix . '%')
                ->whereDate('created_at', '=', date('Y-m-d'))
                ->where('jenis_pembelian', 'inventaris') // Filter berdasarkan jenis pembelian
                ->latest('nomor_faktur')
                ->first();

            // Jika ada nomor inventaris sebelumnya dengan kode yang sama
            if ($lastInventaris) {
                // Ambil nomor urut terakhir dari kode nomor faktur
                preg_match('/FIP-\d{8}-(\d{5})$/', $lastInventaris->nomor_faktur, $matches);
                $nextNumber = isset($matches[1]) ? ((int)$matches[1] + 1) : 1;
            } else {
                // Jika tidak ada nomor inventaris sebelumnya untuk hari ini, mulai dari 1
                $nextNumber = 1;
            }

            // Generate kode inventaris baru
            $kodeInventaris = $prefix . str_pad($nextNumber, 5, '0', STR_PAD_LEFT);

            return response()->json([
                'success' => true,
                'nomor_faktur' => $kodeInventaris,
                'message' => 'Nomor inventaris berhasil di-generate'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat menghasilkan nomor inventaris.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
