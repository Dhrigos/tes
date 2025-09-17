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
use App\Models\Module\Master\Data\Gudang\Supplier;

class Pembelian_Controller extends Controller
{
    public function index()
    {
        $title = "Pembelian";
        $suppliers = Supplier::orderBy('nama')->get(['id', 'kode', 'nama', 'nama_pic', 'telepon_pic']);
        return Inertia::render('module/pembelian/index', compact(
            'title',
            'suppliers'
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

                    // Persentase akan dipilih per-item berdasarkan jenis pembelian (utama vs klinik)
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

                        // Pembulatan harga satuan sebelum disimpan/diolah
                        $hargaSatuanRoundedStr = (string) round((float) ($detail['harga_satuan'] ?? '0'));
                        $hargaSatuanRounded = (float) $hargaSatuanRoundedStr;

                        if (in_array($request->jenis_pembelian, ['inventaris', 'inventaris_klinik'])) {
                            PembelianInventarisDetail::create([
                                'kode' => $request->nomor_faktur,
                                'kode_barang' => $detail['kode_obat_alkes'],
                                'nama_barang' => $detail['nama_obat_alkes'],
                                'kategori_barang' => 'Inventaris',
                                'jenis_barang' => 'Medical Equipment',
                                'qty_barang' => $detail['qty'],
                                'harga_barang' => $hargaSatuanRoundedStr,
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
                                    'harga_barang' => $hargaSatuanRoundedStr,
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
                                    'harga_barang' => $hargaSatuanRoundedStr,
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
                                'harga_satuan' => $hargaSatuanRoundedStr,
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

                            // Perhitungan disamakan dengan contoh: basis subtotal = harga_satuan,
                            // diskon persen atau rupiah tanpa normalisasi per-qty, PPN sesuai metode.
                            $hargaSatuan = $hargaSatuanRounded;
                            $subTotal = $hargaSatuan;

                            $diskonInput = (string) ($detail['diskon'] ?? '0');
                            $isDiskonPersen = false;
                            if (strpos($diskonInput, '%') !== false) {
                                $isDiskonPersen = true;
                            } elseif (array_key_exists('diskon_persen', $detail)) {
                                $dp = $detail['diskon_persen'];
                                if (is_bool($dp)) {
                                    $isDiskonPersen = $dp;
                                } else {
                                    $dpStr = strtolower((string) $dp);
                                    $isDiskonPersen = in_array($dpStr, ['1', 'true', 'yes', 'ya'], true);
                                }
                            }

                            $diskonPersenVal = 0.0;
                            $diskonRupiahVal = 0.0;
                            if ($isDiskonPersen) {
                                $diskonPersenVal = (float) str_replace('%', '', $diskonInput);
                            } else {
                                $diskonRupiahVal = (float) $diskonInput;
                            }

                            $PPNbarang = 0.0;
                            $Diskonbarang = 0.0;
                            $hargaDasar = $subTotal;

                            switch ($metodeHna) {
                                case '2':
                                    $PPNbarang = $subTotal * ($ppnPercent / 100.0);
                                    $hargaDasar = $subTotal + $PPNbarang;
                                    break;
                                case '3':
                                    if ($isDiskonPersen) {
                                        $Diskonbarang = $subTotal * ($diskonPersenVal / 100.0);
                                    } else {
                                        $Diskonbarang = $diskonRupiahVal;
                                    }
                                    $hargaDasar = max(0.0, $subTotal - $Diskonbarang);
                                    break;
                                case '4':
                                    if ($isDiskonPersen) {
                                        $Diskonbarang = $subTotal * ($diskonPersenVal / 100.0);
                                    } else {
                                        $Diskonbarang = $diskonRupiahVal;
                                    }
                                    $hargaSetelahDiskon = max(0.0, $subTotal - $Diskonbarang);
                                    $PPNbarang = $hargaSetelahDiskon * ($ppnPercent / 100.0);
                                    $hargaDasar = $hargaSetelahDiskon + $PPNbarang;
                                    break;
                                case '1':
                                default:
                                    $hargaDasar = $subTotal;
                                    break;
                            }
                            // Bulatkan ke atas harga dasar
                            $hargaDasar = (float) ceil($hargaDasar);

                            // Tentukan sumber setting sesuai target jenis
                            $targetJenis = ($request->jenis_pembelian === 'obat_klinik') ? 'klinik' : 'utama';
                            if ($targetJenis === 'utama') {
                                $p1 = (float) ($utamaSetting?->harga_jual_1 ?? 0);
                                $p2 = (float) ($utamaSetting?->harga_jual_2 ?? 0);
                                $p3 = (float) ($utamaSetting?->harga_jual_3 ?? 0);
                            } else {
                                $p1 = (float) ($klinikSetting?->harga_jual_1 ?? 0);
                                $p2 = (float) ($klinikSetting?->harga_jual_2 ?? 0);
                                $p3 = (float) ($klinikSetting?->harga_jual_3 ?? 0);
                            }

                            // Hitung harga jual lalu bulatkan ke atas
                            $uJual1 = (float) ceil($hargaDasar * (1 + $p1 / 100.0));
                            $uJual2 = (float) ceil($hargaDasar * (1 + $p2 / 100.0));
                            $uJual3 = (float) ceil($hargaDasar * (1 + $p3 / 100.0));

                            $tglMasuk = $request->tanggal_terima_barang ?: now()->format('Y-m-d');

                            // Gunakan uJual sebagai hasil final (sudah berdasarkan jenis di atas)
                            $jual1 = $uJual1;
                            $jual2 = $uJual2;
                            $jual3 = $uJual3;

                            // Simpan harga jual berdasarkan target lokasi
                            if ($targetJenis === 'utama') {
                                Daftar_Harga_Jual::create([
                                    'kode_obat_alkes' => $detail['kode_obat_alkes'],
                                    'jenis' => 'utama',
                                    'nama_obat_alkes' => $detail['nama_obat_alkes'],
                                    'harga_dasar' => (string) ceil($hargaDasar),
                                    'harga_jual_1' => (string) ceil($jual1),
                                    'harga_jual_2' => (string) ceil($jual2),
                                    'harga_jual_3' => (string) ceil($jual3),
                                    'diskon' => (string) $Diskonbarang,
                                    'ppn' => (string) $PPNbarang,
                                    'tanggal_obat_masuk' => $tglMasuk,
                                ]);
                            } else { // klinik
                                Daftar_Harga_Jual_Klinik::create([
                                    'kode_obat_alkes' => $detail['kode_obat_alkes'],
                                    'nama_obat_alkes' => $detail['nama_obat_alkes'],
                                    'harga_dasar' => (string) ceil($hargaDasar),
                                    'harga_jual_1' => (string) ceil($jual1),
                                    'harga_jual_2' => (string) ceil($jual2),
                                    'harga_jual_3' => (string) ceil($jual3),
                                    'diskon' => (string) $Diskonbarang,
                                    'ppn' => (string) $PPNbarang,
                                    'tanggal_obat_masuk' => $tglMasuk,
                                ]);
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
