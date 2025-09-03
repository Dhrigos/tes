<?php

namespace App\Http\Controllers\Module\Pembelian;

use App\Http\Controllers\Controller;
use App\Models\Module\Pembelian\Pembelian;
use App\Models\Module\Pembelian\PembelianObatDetail;
use App\Models\Module\Pembelian\PembelianInventarisDetail;
use App\Models\Module\Gudang\Stok_Inventaris;
use App\Models\Module\Gudang\Stok_Barang;
use App\Models\Module\Gudang\Stok_Obat_Klinik;
use App\Models\Module\Gudang\Stok_Inventaris_Klinik;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use App\Models\Module\Master\Data\Gudang\Daftar_Harga_Jual;
use App\Models\Module\Master\Data\Gudang\Daftar_Harga_Jual_Klinik;
use App\Models\Module\Master\Data\Gudang\Setting_Harga_Jual as SettingHargaJual;
use App\Models\Module\Master\Data\Gudang\Setting_Harga_Jual_Utama as SettingHargaJualUtama;
use App\Models\Settings\Web_Setting;

class Pembelian_Controller extends Controller
{
    public function index()
    {
        $title = "Pembelian";
        return Inertia::render('module/pembelian/index', compact(
            'title'
        ));
    }

    public function store(Request $request)
    {
        try {
            try {
                // Validasi data
                $request->validate([
                    'jenis_pembelian' => 'required|in:obat,inventaris,obat_klinik,inventaris_klinik',
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

                $existingPembelian = Pembelian::where('nomor_faktur', $request->nomor_faktur)->first();
                if ($existingPembelian) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Nomor faktur sudah digunakan!'
                    ], 422);
                }

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

                    $klinikSetting = SettingHargaJual::first();
                    $utamaSetting = SettingHargaJualUtama::first();

                    $uPercent1 = (float) (($utamaSetting?->harga_jual_1 ?? $klinikSetting?->harga_jual_1 ?? '0'));
                    $uPercent2 = (float) (($utamaSetting?->harga_jual_2 ?? $klinikSetting?->harga_jual_2 ?? '0'));
                    $uPercent3 = (float) (($utamaSetting?->harga_jual_3 ?? $klinikSetting?->harga_jual_3 ?? '0'));
                    $uEmbalase = (float) ($klinikSetting?->embalase_poin ?? '0');

                    $kPercent1 = (float) (($klinikSetting?->harga_jual_1 ?? $utamaSetting?->harga_jual_1 ?? '0'));
                    $kPercent2 = (float) (($klinikSetting?->harga_jual_2 ?? $utamaSetting?->harga_jual_2 ?? '0'));
                    $kPercent3 = (float) (($klinikSetting?->harga_jual_3 ?? $utamaSetting?->harga_jual_3 ?? '0'));
                    $kEmbalase = (float) ($klinikSetting?->embalase_poin ?? '0');

                    $ppnPercent = (float) ($request->pajak_ppn ?: '0');
                    $metodeHna = (string) ($request->metode_hna ?: '1');
                    foreach ($details as $detail) {
                        if (!(isset($detail['nama_obat_alkes'], $detail['kode_obat_alkes'], $detail['qty'], $detail['harga_satuan'], $detail['sub_total']))) {
                            continue;
                        }

                        if (in_array($request->jenis_pembelian, ['inventaris', 'inventaris_klinik'])) {
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
                            if ($request->jenis_pembelian === 'inventaris') {
                                Stok_Inventaris::create([
                                    'kode_pembelian' => $request->nomor_faktur,
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
                                    'penanggung_jawab' => $detail['penanggung_jawab'] ?? '-',
                                    'no_seri' => $detail['no_seri'] ?? null,
                                ]);
                            } else { // inventaris_klinik
                                Stok_Inventaris_Klinik::create([
                                    'kode_pembelian' => $request->nomor_faktur,
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
                                    'penanggung_jawab' => $detail['penanggung_jawab'] ?? '-',
                                    'no_seri' => $detail['no_seri'] ?? null,
                                ]);
                            }
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
                            if ($request->jenis_pembelian === 'obat') {
                                Stok_Barang::create([
                                    'kode_obat_alkes' => $detail['kode_obat_alkes'],
                                    'nama_obat_alkes' => $detail['nama_obat_alkes'],
                                    'qty' => $detail['qty'],
                                    'tanggal_terima_obat' => $request->tanggal_terima_barang ?? now()->format('Y-m-d'),
                                    'expired' => $detail['exp'] ?? null,
                                ]);
                            } else { // obat_klinik
                                Stok_Obat_Klinik::create([
                                    'kode_obat_alkes' => $detail['kode_obat_alkes'],
                                    'nama_obat_alkes' => $detail['nama_obat_alkes'],
                                    'qty' => $detail['qty'],
                                    'tanggal_terima_obat' => $request->tanggal_terima_barang ?? now()->format('Y-m-d'),
                                    'expired' => $detail['exp'] ?? null,
                                ]);
                            }

                            $qty = (float) ($detail['qty'] ?? '0');
                            if ($qty <= 0) { $qty = 1; }
                            $hargaSatuan = (float) ($detail['harga_satuan'] ?? '0');
                            $diskonRaw = (float) ($detail['diskon'] ?? '0');
                            $diskonPersen = false;
                            if (array_key_exists('diskon_persen', $detail)) {
                                $dp = $detail['diskon_persen'];
                                if (is_bool($dp)) {
                                    $diskonPersen = $dp;
                                } else {
                                    $dpStr = strtolower((string) $dp);
                                    $diskonPersen = in_array($dpStr, ['1', 'true', 'yes', 'ya'], true);
                                }
                            }

                            $unitDiscount = $diskonPersen ? ($hargaSatuan * ($diskonRaw / 100.0)) : ($qty > 0 ? ($diskonRaw / $qty) : 0.0);
                            $unitNet = max(0.0, $hargaSatuan - $unitDiscount);

                            switch ($metodeHna) {
                                case '2':
                                    $hargaDasar = $hargaSatuan * (1 + $ppnPercent / 100.0);
                                    break;
                                case '3':
                                    $hargaDasar = $unitNet;
                                    break;
                                case '4':
                                    $hargaDasar = $unitNet * (1 + $ppnPercent / 100.0);
                                    break;
                                case '1':
                                    $hargaDasar = $hargaSatuan;
                                    break;
                                default:
                                    $hargaDasar = $hargaSatuan;
                                    break;
                            }

                            $uJual1 = $hargaDasar * (1 + $uPercent1 / 100.0) + $uEmbalase;
                            $uJual2 = $hargaDasar * (1 + $uPercent2 / 100.0) + $uEmbalase;
                            $uJual3 = $hargaDasar * (1 + $uPercent3 / 100.0) + $uEmbalase;

                            $kJual1 = $hargaDasar * (1 + $kPercent1 / 100.0) + $kEmbalase;
                            $kJual2 = $hargaDasar * (1 + $kPercent2 / 100.0) + $kEmbalase;
                            $kJual3 = $hargaDasar * (1 + $kPercent3 / 100.0) + $kEmbalase;

                            $tglMasuk = $request->tanggal_terima_barang ?: now()->format('Y-m-d');
                            $targetJenis = ($request->jenis_pembelian === 'obat_klinik') ? 'klinik' : 'utama';

                            if ($targetJenis === 'utama') {
                                $jual1 = $uJual1;
                                $jual2 = $uJual2;
                                $jual3 = $uJual3;
                            } else {
                                $jual1 = $kJual1;
                                $jual2 = $kJual2;
                                $jual3 = $kJual3;
                            }

                            if ($targetJenis === 'klinik') {
                                Daftar_Harga_Jual_Klinik::updateOrCreate(
                                    [
                                        'kode_obat_alkes' => $detail['kode_obat_alkes'],
                                    ],
                                    [
                                        'nama_obat_alkes' => $detail['nama_obat_alkes'],
                                        'harga_dasar' => (string) $hargaDasar,
                                        'harga_jual_1' => (string) $jual1,
                                        'harga_jual_2' => (string) $jual2,
                                        'harga_jual_3' => (string) $jual3,
                                        'diskon' => (string) $diskonRaw,
                                        'ppn' => (string) $ppnPercent,
                                        'tanggal_obat_masuk' => $tglMasuk,
                                        'jenis' => $targetJenis,
                                    ]
                                );
                            } else {
                                Daftar_Harga_Jual::updateOrCreate(
                                    [
                                        'kode_obat_alkes' => $detail['kode_obat_alkes'],
                                        'jenis' => $targetJenis,
                                    ],
                                    [
                                        'nama_obat_alkes' => $detail['nama_obat_alkes'],
                                        'harga_dasar' => (string) $hargaDasar,
                                        'harga_jual_1' => (string) $jual1,
                                        'harga_jual_2' => (string) $jual2,
                                        'harga_jual_3' => (string) $jual3,
                                        'diskon' => (string) $diskonRaw,
                                        'ppn' => (string) $ppnPercent,
                                        'tanggal_obat_masuk' => $tglMasuk,
                                        'user_input_id' => (string) (Auth::id() ?? '0'),
                                        'user_input_name' => (string) (Auth::user()->name ?? 'System'),
                                        'jenis' => $targetJenis,
                                    ]
                                );
                            }
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
            }
        } catch (\Exception $e) {
            Log::error($e);
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    //GENERATE NO FAKTUR
    public function generateFakturPembelian(Request $request)
    {
        try {
            $jenisPembelian = $request->input('jenis_pembelian');
            $today = date('Ymd'); // Format menjadi YYYYMMDD

            if ($jenisPembelian === 'inventaris') {
                $prefix = 'FIP-' . $today . '-'; // Faktur Inventaris Pembelian
            } elseif ($jenisPembelian === 'inventaris_klinik') {
                $prefix = 'FIPK-' . $today . '-'; // Faktur Inventaris Klinik Pembelian
            } elseif ($jenisPembelian === 'obat_klinik') {
                $prefix = 'INK-' . $today . '-'; // Invoice Obat Klinik
            } else {
                $prefix = 'INV-' . $today . '-'; // Invoice untuk obat
            }

            $lastPembelian = Pembelian::where('nomor_faktur', 'LIKE', $prefix . '%')
                ->whereDate('created_at', '=', date('Y-m-d'))
                ->where('jenis_pembelian', $jenisPembelian)
                ->latest('nomor_faktur')
                ->first();

            if ($lastPembelian) {
                if ($jenisPembelian === 'inventaris') {
                    preg_match('/FIP-\d{8}-(\d{5})$/', $lastPembelian->nomor_faktur, $matches);
                } elseif ($jenisPembelian === 'inventaris_klinik') {
                    preg_match('/FIPK-\d{8}-(\d{5})$/', $lastPembelian->nomor_faktur, $matches);
                } elseif ($jenisPembelian === 'obat_klinik') {
                    preg_match('/INK-\d{8}-(\d{5})$/', $lastPembelian->nomor_faktur, $matches);
                } else {
                    preg_match('/INV-\d{8}-(\d{5})$/', $lastPembelian->nomor_faktur, $matches);
                }
                $nextNumber = isset($matches[1]) ? (int) $matches[1] + 1 : 1;
            } else {
                $nextNumber = 1;
            }

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

            $lastInventaris = Pembelian::where('nomor_faktur', 'LIKE', $prefix . '%')
                ->whereDate('created_at', '=', date('Y-m-d'))
                ->where('jenis_pembelian', 'inventaris')
                ->latest('nomor_faktur')
                ->first();

            if ($lastInventaris) {
                preg_match('/FIP-\d{8}-(\d{5})$/', $lastInventaris->nomor_faktur, $matches);
                $nextNumber = isset($matches[1]) ? ((int)$matches[1] + 1) : 1;
            } else {
                $nextNumber = 1;
            }

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
