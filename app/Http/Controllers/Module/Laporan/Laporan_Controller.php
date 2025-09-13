<?php

namespace App\Http\Controllers\Module\Laporan;

use App\Http\Controllers\Controller;
use App\Models\Module\Gudang\Stok_Penyesuaian;
use App\Models\Module\Pemdaftaran\Antrian_Pasien;
use App\Models\Module\Pemdaftaran\Pendaftaran;
use App\Models\Settings\Web_Setting;
use App\Models\Module\Kasir\Kasir;
use App\Models\Module\Kasir\Kasir_Detail;
use App\Models\Module\Pembelian\Pembelian;
use App\Models\Module\Pelayanan\Pelayanan_Soap_Dokter_Icd;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\StokPenyesuaianExport;
use App\Exports\GenericArrayExport;

class Laporan_Controller extends Controller
{
    public function pendataan_antrian()
    {
        $title = "Data Antrian";

        $data = Antrian_Pasien::with('pasien')->get();

        return Inertia::render('module/laporan/antrian/index', [
            'title' => $title,
            'data' => $data,
        ]);
    }

    // removed print_antrian

    public function export_antrian(Request $request)
    {
        $data = json_decode($request->input('data'), true) ?: [];
        $tanggal_awal = $request->input('tanggal_awal');
        $tanggal_akhir = $request->input('tanggal_akhir');

        $headers = ['No RM', 'NIK', 'Nama', 'Jenis Kelamin', 'Nomor Antrian', 'Tanggal'];
        $rows = array_map(function ($it) {
            $pasien = $it['pasien'] ?? [];
            $noRm = $pasien['no_rm'] ?? '-';
            $nik = $pasien['nik'] ?? '-';
            $nama = $pasien['nama'] ?? '-';
            $seks = $pasien['seks'] ?? '-';
            $nomor = $it['nomor_antrian'] ?? ($it['nomor'] ?? '-');
            $tanggal = $it['tanggal'] ?? substr((string)($it['created_at'] ?? ''), 0, 10);
            return [$noRm, $nik, $nama, $seks, $nomor, $tanggal];
        }, $data);

        $filename = 'laporan_antrian_' . ($tanggal_awal ?: now()->format('Y-m-d')) . '_' . ($tanggal_akhir ?: now()->format('Y-m-d')) . '.xlsx';
        return Excel::download(new GenericArrayExport($headers, $rows), $filename);
    }

    public function pendataan_pendaftaran()
    {
        $title = "Data Pendaftaran";

        $data = Pendaftaran::with(
            'poli',
            'dokter.namauser',
            'pasien',
            'penjamin',
            'so_perawat',
            'soap_dokter',
            'pelayanan_statuses',
            'apoteks'
        )->get();

        return Inertia::render('module/laporan/pendaftaran/index', [
            'title' => $title,
            'data' => $data,
        ]);
    }

    public function pendataan_trend_pendaftaran()
    {
        $title = "Trend Pendaftaran";

        $data = Pendaftaran::with(
            'poli',
            'dokter.namauser',
            'pasien',
            'penjamin',
            'so_perawat',
            'soap_dokter',
            'pelayanan_statuses',
            'apoteks'
        )->get();

        return Inertia::render('module/laporan/trend-pendaftaran/index', [
            'title' => $title,
            'data' => $data,
        ]);
    }

    // removed print_pendaftaran

    public function export_pendaftaran(Request $request)
    {
        $data = json_decode($request->input('data'), true) ?: [];
        $tanggal_awal = $request->input('tanggal_awal');
        $tanggal_akhir = $request->input('tanggal_akhir');
        $headers = ['No RM', 'Nama', 'No Rawat', 'JK', 'Tanggal', 'Jam', 'Poli', 'Dokter', 'Penjamin', 'Antrian', 'Perawat Tgl', 'Perawat Jam', 'Panggil Dokter Tgl', 'Panggil Dokter Jam', 'Dokter Tgl', 'Dokter Jam', 'Apotek Tgl', 'Apotek Jam'];
        $rows = array_map(function ($it) {
            $pasien = $it['pasien'] ?? [];
            $noRm = $pasien['nomor_rm'] ?? ($pasien['no_rm'] ?? '-');
            $nama = $pasien['nama'] ?? '-';
            $noRawat = $it['nomor_register'] ?? '-';
            $jk = $pasien['seks'] ?? '-';
            $src = $it['tanggal_kujungan'] ?? ($it['created_at'] ?? '');
            $s = (string) $src;
            $tanggal = '';
            $jam = '';
            if ($s) {
                if (strpos($s, 'T') !== false) {
                    [$d, $t] = explode('T', $s, 2);
                    $tanggal = substr($d, 0, 10);
                    $jam = substr((string) $t, 0, 5);
                } elseif (strpos($s, ' ') !== false) {
                    [$d, $t] = explode(' ', $s, 2);
                    $tanggal = substr($d, 0, 10);
                    $jam = substr((string) $t, 0, 5);
                } else {
                    $tanggal = substr($s, 0, 10);
                }
            }
            $poli = data_get($it, 'poli.nama', '-');
            $dokter = data_get($it, 'dokter.namauser.name', data_get($it, 'dokter.nama', data_get($it, 'dokter.name', data_get($it, 'dokter_nama', '-'))));
            $penjamin = data_get($it, 'penjamin.nama', '-');
            $antrian = $it['antrian'] ?? '-';
            $toParts = function ($val) {
                $s = (string) ($val ?? '');
                if ($s === '') return ['', ''];
                if (strpos($s, 'T') !== false) {
                    [$d, $t] = explode('T', $s, 2);
                    return [substr($d, 0, 10), substr((string) $t, 0, 5)];
                }
                if (strpos($s, ' ') !== false) {
                    [$d, $t] = explode(' ', $s, 2);
                    return [substr($d, 0, 10), substr((string) $t, 0, 5)];
                }
                return [substr($s, 0, 10), ''];
            };
            [$perawatTgl, $perawatJam] = $toParts(data_get($it, 'so_perawat.created_at') ?? data_get($it, 'perawat_created_at'));
            [$panggilTgl, $panggilJam] = $toParts(data_get($it, 'pelayanan_statuses.waktu_panggil_dokter') ?? data_get($it, 'waktu_panggil_dokter'));
            [$dokterTgl, $dokterJam] = $toParts(data_get($it, 'soap_dokter.created_at') ?? data_get($it, 'dokter_created_at'));
            [$apotekTgl, $apotekJam] = $toParts(data_get($it, 'apoteks.0.created_at') ?? data_get($it, 'apotek_created_at'));
            return [$noRm, $nama, $noRawat, $jk, $tanggal, $jam, $poli, $dokter, $penjamin, $antrian, $perawatTgl, $perawatJam, $panggilTgl, $panggilJam, $dokterTgl, $dokterJam, $apotekTgl, $apotekJam];
        }, $data);
        $filename = 'laporan_pendaftaran_' . ($tanggal_awal ?: now()->format('Y-m-d')) . '_' . ($tanggal_akhir ?: now()->format('Y-m-d')) . '.xlsx';
        return Excel::download(new GenericArrayExport($headers, $rows), $filename);
    }

    public function pendataan_dokter()
    {
        $title = "Data Pemeriksaan Dokter";

        $data = Pendaftaran::with('poli', 'dokter.namauser', 'pasien', 'penjamin', 'soap_dokter')
            ->whereHas('soap_dokter')
            ->get();

        return Inertia::render('module/laporan/dokter/index', [
            'title' => $title,
            'data' => $data,
        ]);
    }



    public function export_dokter(Request $request)
    {
        $data = json_decode($request->input('data'), true) ?: [];
        $tanggal_awal = $request->input('tanggal_awal');
        $tanggal_akhir = $request->input('tanggal_akhir');
        $headers = ['No RM', 'Nama', 'No Rawat', 'JK', 'Tanggal', 'Jam', 'Poli', 'Dokter', 'Penjamin', 'Tensi', 'Sistol', 'Distol', 'Suhu', 'Nadi', 'RR', 'SpO2', 'Tinggi', 'Berat', 'Lingkar Perut', 'BMI', 'Status BMI', 'Kesadaran', 'GCS Eye', 'GCS Verbal', 'GCS Motorik', 'HTT', 'Assessment', 'Plan', 'Expertise', 'Evaluasi'];
        $rows = array_map(function ($it) {
            $noRm = $it['nomor_rm'] ?? data_get($it, 'pasien.no_rm', '-');
            $nama = data_get($it, 'pasien.nama', '-');
            $noRawat = $it['nomor_register'] ?? '-';
            $jk = data_get($it, 'pasien.seks', '-');
            $src = $it['tanggal_kujungan'] ?? ($it['created_at'] ?? '');
            $s = (string) $src;
            $tanggal = '';
            $jam = '';
            if ($s) {
                if (strpos($s, 'T') !== false) {
                    [$d, $t] = explode('T', $s, 2);
                    $tanggal = substr($d, 0, 10);
                    $jam = substr((string) $t, 0, 5);
                } elseif (strpos($s, ' ') !== false) {
                    [$d, $t] = explode(' ', $s, 2);
                    $tanggal = substr($d, 0, 10);
                    $jam = substr((string) $t, 0, 5);
                } else {
                    $tanggal = substr($s, 0, 10);
                }
            }
            $poli = data_get($it, 'poli.nama', '-');
            $dokter = data_get($it, 'dokter.namauser.name', data_get($it, 'dokter.nama', data_get($it, 'dokter.name', data_get($it, 'dokter_nama', '-'))));
            $penjamin = data_get($it, 'penjamin.nama', '-');
            $soap = $it['soap_dokter'] ?? [];
            return [
                $noRm,
                $nama,
                $noRawat,
                $jk,
                $tanggal,
                $jam,
                $poli,
                $dokter,
                $penjamin,
                data_get($soap, 'tensi'),
                data_get($soap, 'sistol'),
                data_get($soap, 'distol'),
                data_get($soap, 'suhu'),
                data_get($soap, 'nadi'),
                data_get($soap, 'rr'),
                data_get($soap, 'spo2'),
                data_get($soap, 'tinggi'),
                data_get($soap, 'berat'),
                data_get($soap, 'lingkar_perut'),
                data_get($soap, 'nilai_bmi'),
                data_get($soap, 'status_bmi'),
                data_get($soap, 'kesadaran'),
                data_get($soap, 'eye'),
                data_get($soap, 'verbal'),
                data_get($soap, 'motorik'),
                data_get($soap, 'htt'),
                data_get($soap, 'assesmen'),
                data_get($soap, 'plan'),
                data_get($soap, 'expertise'),
                data_get($soap, 'evaluasi'),
            ];
        }, $data);
        $filename = 'laporan_pelayanan_dokter_' . ($tanggal_awal ?: now()->format('Y-m-d')) . '_' . ($tanggal_akhir ?: now()->format('Y-m-d')) . '.xlsx';
        return Excel::download(new GenericArrayExport($headers, $rows), $filename);
    }



    public function pendataan_perawat()
    {
        $title = "Data Pemeriksaan Perawat";

        $data = Pendaftaran::with('poli', 'dokter.namauser', 'pasien', 'penjamin', 'so_perawat')
            ->whereHas('so_perawat')
            ->get();

        return Inertia::render('module/laporan/perawat/index', [
            'title' => $title,
            'data' => $data,
        ]);
    }



    public function export_perawat(Request $request)
    {
        $data = json_decode($request->input('data'), true) ?: [];
        $tanggal_awal = $request->input('tanggal_awal');
        $tanggal_akhir = $request->input('tanggal_akhir');
        $headers = ['No RM', 'Nama', 'No Rawat', 'JK', 'Tanggal', 'Jam', 'Poli', 'Perawat', 'Penjamin', 'Tensi', 'Sistol', 'Distol', 'Suhu', 'Nadi', 'RR', 'SpO2', 'Tinggi', 'Berat', 'Jenis Alergi', 'Alergi', 'Kesadaran', 'GCS Eye', 'GCS Verbal', 'GCS Motorik', 'HTT / Tindakan', 'Catatan'];
        $rows = array_map(function ($it) {
            $noRm = $it['nomor_rm'] ?? data_get($it, 'pasien.no_rm', '-');
            $nama = data_get($it, 'pasien.nama', '-');
            $noRawat = $it['nomor_register'] ?? '-';
            $jk = data_get($it, 'pasien.seks', '-');
            $src = $it['tanggal_kujungan'] ?? ($it['created_at'] ?? '');
            $s = (string) $src;
            $tanggal = '';
            $jam = '';
            if ($s) {
                if (strpos($s, 'T') !== false) {
                    [$d, $t] = explode('T', $s, 2);
                    $tanggal = substr($d, 0, 10);
                    $jam = substr((string) $t, 0, 5);
                } elseif (strpos($s, ' ') !== false) {
                    [$d, $t] = explode(' ', $s, 2);
                    $tanggal = substr($d, 0, 10);
                    $jam = substr((string) $t, 0, 5);
                } else {
                    $tanggal = substr($s, 0, 10);
                }
            }
            $poli = data_get($it, 'poli.nama', '-');
            $perawat = data_get($it, 'so_perawat.user_input_name', data_get($it, 'soap_perawat.user_input_name', data_get($it, 'perawat_nama', '-')));
            $penjamin = data_get($it, 'penjamin.nama', '-');
            $so = $it['so_perawat'] ?? ($it['soap_perawat'] ?? []);
            return [
                $noRm,
                $nama,
                $noRawat,
                $jk,
                $tanggal,
                $jam,
                $poli,
                $perawat,
                $penjamin,
                data_get($so, 'tensi'),
                data_get($so, 'sistol'),
                data_get($so, 'distol'),
                data_get($so, 'suhu'),
                data_get($so, 'nadi'),
                data_get($so, 'rr'),
                data_get($so, 'spo2'),
                data_get($so, 'tinggi'),
                data_get($so, 'berat'),
                data_get($so, 'jenis_alergi'),
                data_get($so, 'alergi'),
                data_get($so, 'kesadaran'),
                data_get($so, 'eye'),
                data_get($so, 'verbal'),
                data_get($so, 'motorik'),
                data_get($so, 'htt'),
                data_get($so, 'catatan'),
            ];
        }, $data);
        $filename = 'laporan_pelayanan_perawat_' . ($tanggal_awal ?: now()->format('Y-m-d')) . '_' . ($tanggal_akhir ?: now()->format('Y-m-d')) . '.xlsx';
        return Excel::download(new GenericArrayExport($headers, $rows), $filename);
    }



    public function laporan_stok_penyesuaian()
    {
        $title = "Laporan Selisih Mutasi & Penyesuaian";
        $data = Stok_Penyesuaian::all();
        return Inertia::render('module/laporan/stok_penyesuaian/index', [
            'title' => $title,
            'data' => $data,
        ]);
    }



    public function export_stok_penyesuaian(Request $request)
    {
        $data = json_decode($request->input('data'), true);
        $tanggal_awal = $request->input('tanggal_awal');
        $tanggal_akhir = $request->input('tanggal_akhir');
        $obat = $request->input('obat');
        $jenis = $request->input('jenis');
        $tipe = $request->input('tipe');

        if (!is_array($data)) {
            $query = Stok_Penyesuaian::query();
            if ($tanggal_awal) {
                $query->whereDate('created_at', '>=', $tanggal_awal);
            }
            if ($tanggal_akhir) {
                $query->whereDate('created_at', '<=', $tanggal_akhir);
            }
            if ($obat) {
                $query->where('nama_obat', $obat);
            }
            if ($jenis) {
                $query->where('jenis_penyesuaian', $jenis);
            }
            if ($tipe) {
                $query->where(function ($q) use ($tipe) {
                    $q->where('jenis_gudang', $tipe);
                });
            }
            $data = $query->get()->toArray();
        }

        $payload = array_map(function ($item) {
            $source = $item['tanggal'] ?? ($item['created_at'] ?? '');
            $s = (string) $source;
            $tanggal = '';
            $jam = '';
            if ($s !== '') {
                if (strpos($s, 'T') !== false) {
                    [$d, $t] = explode('T', $s, 2);
                    $tanggal = substr($d, 0, 10);
                    $jam = substr((string) $t, 0, 5);
                } elseif (strpos($s, ' ') !== false) {
                    [$d, $t] = explode(' ', $s, 2);
                    $tanggal = substr($d, 0, 10);
                    $jam = substr((string) $t, 0, 5);
                } else {
                    $tanggal = substr($s, 0, 10);
                }
            }
            $item['tanggal'] = $tanggal;
            $item['jam'] = isset($item['jam']) ? substr((string) $item['jam'], 0, 5) : $jam;
            return $item;
        }, $data);

        $filename = 'laporan_selisih_mutasi_penyesuaian_' . ($tanggal_awal ?: now()->format('Y-m-d')) . '_' . ($tanggal_akhir ?: now()->format('Y-m-d')) . '.xlsx';

        return Excel::download(new StokPenyesuaianExport($payload), $filename);
    }

    public function stok_opname()
    {
        $title = "Laporan Stok Opname";
        $data = collect();
        return Inertia::render('module/laporan/stok_opname/index', [
            'title' => $title,
            'data' => $data,
        ]);
    }



    public function apotek()
    {
        $title = "Data Lunas Apotek";

        $header = Kasir::has('apotek_lunas')->with('apotek_lunas')->get();

        $obatList = collect($header)->flatMap(function ($item) {
            return collect($item['apotek_lunas'])->pluck('nama_obat_tindakan');
        })->unique()->sort()->values();

        return Inertia::render('module/laporan/apotek/index', [
            'title' => $title,
            'header' => $header,
            'obatList' => $obatList,
        ]);
    }



    public function export_apotek(Request $request)
    {
        $data = json_decode($request->input('data'), true) ?: [];
        $tanggal_awal = $request->input('tanggal_awal');
        $tanggal_akhir = $request->input('tanggal_akhir');
        $headers = ['No', 'Kode Faktur', 'No RM', 'No Rawat', 'Nama', 'Nama Obat/Alkes', 'Harga', 'Qty', 'Total', 'Poli', 'Dokter', 'Penjamin', 'Tanggal', 'Petugas'];
        $rows = array_map(function ($row) {
            return [
                $row['no'] ?? '',
                $row['kode_faktur'] ?? '-',
                $row['no_rm'] ?? '-',
                $row['no_rawat'] ?? '-',
                $row['nama'] ?? '-',
                $row['nama_obat_tindakan'] ?? '-',
                $row['harga_obat_tindakan'] ?? '-',
                $row['qty'] ?? '-',
                $row['total_sementara'] ?? '-',
                $row['poli'] ?? '-',
                $row['dokter'] ?? '-',
                $row['penjamin'] ?? '-',
                $row['tanggal'] ?? '-',
                $row['user_input_name'] ?? '-',
            ];
        }, $request->input('flat_rows') ? json_decode($request->input('flat_rows'), true) : $data);
        $filename = 'kasir_apotek_lunas_' . now()->format('Ymd_His') . '.xlsx';
        return Excel::download(new GenericArrayExport($headers, $rows), $filename);
    }

    // Data Lunas Kasir
    public function kasir()
    {
        $title = "Kasir Lunas";

        $header = Kasir::all();

        return Inertia::render('module/laporan/kasir/index', [
            'title' => $title,
            'header' => $header,
        ]);
    }



    public function export_kasir(Request $request)
    {
        $data = json_decode($request->input('data'), true) ?: [];
        $headers = [
            'No',
            'Invoice',
            'No RM',
            'No Rawat',
            'Nama',
            'Poli',
            'Dokter',
            'Penjamin',
            'Sub Total',
            'Diskon',
            'Administrasi',
            'Materai',
            'Total',
            'Pembayaran 1',
            'Nominal 1',
            'Pembayaran 2',
            'Nominal 2',
            'Pembayaran 3',
            'Nominal 3',
            'Tanggal',
            // kolom detail mengikuti tampilan detail
            'Tindakan/Obat',
            'Harga',
            'Qty/Pelaksana',
            'Subtotal',
            'Total'
        ];
        $rows = [];
        foreach ($data as $index => $it) {
            $rows[] = [
                $it['no'] ?? ($index + 1),
                $it['kode_faktur'] ?? '-',
                $it['no_rm'] ?? '-',
                $it['no_rawat'] ?? '-',
                $it['nama'] ?? '-',
                $it['poli'] ?? '-',
                $it['dokter'] ?? '-',
                $it['penjamin'] ?? '-',
                $it['sub_total'] ?? '-',
                $it['potongan_harga'] ?? '-',
                $it['administrasi'] ?? '-',
                $it['materai'] ?? '-',
                $it['total'] ?? '-',
                $it['payment_method_1'] ?? '-',
                $it['payment_nominal_1'] ?? '-',
                $it['payment_method_2'] ?? '-',
                $it['payment_nominal_2'] ?? '-',
                $it['payment_method_3'] ?? '-',
                $it['payment_nominal_3'] ?? '-',
                substr((string) ($it['tanggal'] ?? ''), 0, 10),
                '',
                '',
                '',
                '',
                '',
            ];
            $kode = $it['kode_faktur'] ?? null;
            if ($kode) {
                $details = Kasir_Detail::with('kasir')
                    ->whereHas('kasir', function ($q) use ($kode) {
                        $q->where('kode_faktur', $kode);
                    })
                    ->get();
                foreach ($details as $d) {
                    $rows[] = [
                        '',
                        $kode,
                        $d->no_rm ?? data_get($d, 'kasir.no_rm', ''),
                        $d->no_rawat ?? data_get($d, 'kasir.no_rawat', ''),
                        data_get($d, 'kasir.nama', ''),
                        data_get($d, 'kasir.poli', ''),
                        data_get($d, 'kasir.dokter', ''),
                        data_get($d, 'kasir.penjamin', ''),
                        '',
                        '',
                        '',
                        '',
                        '',
                        '',
                        '',
                        '',
                        '',
                        '',
                        '',
                        substr((string) (data_get($d, 'kasir.tanggal', '') ?: ''), 0, 10),
                        $d->nama_obat_tindakan ?? '-',
                        $d->harga_obat_tindakan ?? '-',
                        ($d->pelaksana ?? $d->qty ?? '-'),
                        $d->subtotal ?? '-',
                        $d->total ?? '-',
                    ];
                }
            }
        }
        $filename = 'kasir_lunas_' . now()->format('Ymd_His') . '.xlsx';
        return Excel::download(new GenericArrayExport($headers, $rows), $filename);
    }

    // Data Lunas Detail
    public function kasir_detail_data(Request $request)
    {
        $kodeFaktur = $request->input('kode_faktur');

        if (!$kodeFaktur) {
            return response()->json(['data' => []]);
        }

        $details = Kasir_Detail::with('kasir')
            ->whereHas('kasir', function ($q) use ($kodeFaktur) {
                $q->where('kode_faktur', $kodeFaktur);
            })
            ->get();

        return response()->json(['data' => $details]);
    }



    public function top_icd10()
    {
        $title = "Top ICD-10";
        // Ambil data dari pendaftarans yang memiliki ICD, gunakan tanggal dari pendaftarans
        $data = Pelayanan_Soap_Dokter_Icd::join('pendaftarans', 'pendaftarans.nomor_register', '=', 'pelayanan_soap_dokter_icds.no_rawat')
            ->whereNotNull('pelayanan_soap_dokter_icds.kode_icd10')
            ->select([
                'pelayanan_soap_dokter_icds.kode_icd10',
                'pelayanan_soap_dokter_icds.nama_icd10',
                'pendaftarans.nomor_rm',
                DB::raw('pendaftarans.tanggal_kujungan as created_at'),
            ])
            ->get();

        return Inertia::render('module/laporan/top-icd10/index', [
            'title' => $title,
            'data' => $data,
        ]);
    }


    private function formatRupiah($amount)
    {
        return 'Rp ' . number_format($amount, 0, ',', '.');
    }

    // Laporan Pembelian (header only)
    public function pembelian()
    {
        $title = "Laporan Pembelian";
        $header = Pembelian::orderByDesc('created_at')->get();

        return Inertia::render('module/laporan/pembelian/index', [
            'title' => $title,
            'header' => $header,
        ]);
    }



    public function export_pembelian(Request $request)
    {
        $data = json_decode($request->input('data'), true) ?: [];
        $tanggal_awal = $request->input('tanggal_awal');
        $tanggal_akhir = $request->input('tanggal_akhir');
        $headers = ['No', 'Faktur', 'Jenis', 'Supplier', 'Sub Total', 'Diskon', 'PPN', 'Materai', 'Total', 'Tanggal'];
        $rows = array_map(function ($it) {
            return [
                $it['no'] ?? '',
                $it['nomor_faktur'] ?? '-',
                $it['jenis_pembelian'] ?? '-',
                $it['supplier'] ?? '-',
                $it['sub_total'] ?? '-',
                $it['total_diskon'] ?? '-',
                $it['ppn_total'] ?? '-',
                $it['materai'] ?? '-',
                $it['total'] ?? '-',
                substr((string) ($it['tgl_pembelian'] ?? $it['created_at'] ?? ''), 0, 10),
            ];
        }, $data);
        $filename = 'laporan_pembelian_' . ($tanggal_awal ?: now()->format('Y-m-d')) . '_' . ($tanggal_akhir ?: now()->format('Y-m-d')) . '.xlsx';
        return Excel::download(new GenericArrayExport($headers, $rows), $filename);
    }

    public function export_trend_pendaftaran(Request $request)
    {
        // Expect aggregated daily rows from frontend
        $rows = json_decode($request->input('data'), true) ?: [];
        $headers = ['Tanggal', 'BPJS', 'Umum', 'Asuransi Lain', 'Total Kunjungan', 'Jumlah Pasien', 'Pasien >1 kali'];
        $mapped = array_map(function ($r) {
            return [
                $r['tanggal'] ?? '-',
                $r['bpjs'] ?? 0,
                $r['umum'] ?? 0,
                $r['asuransiLain'] ?? 0,
                $r['totalKunjungan'] ?? 0,
                $r['jumlahPasien'] ?? 0,
                $r['pasienSatuKali'] ?? 0,
            ];
        }, $rows);
        $filename = 'trend_pendaftaran_' . now()->format('Ymd_His') . '.xlsx';
        return Excel::download(new GenericArrayExport($headers, $mapped), $filename);
    }

    public function export_top_icd10(Request $request)
    {
        // Expect aggregated rows from frontend: { kode, nama, visits, patients }
        $rows = json_decode($request->input('data'), true) ?: [];
        $headers = ['Kode ICD', 'Nama ICD', 'Jumlah Kunjungan', 'Jumlah Pasien'];
        $mapped = array_map(function ($r) {
            return [
                $r['kode'] ?? '-',
                $r['nama'] ?? '-',
                (int) ($r['visits'] ?? 0),
                (int) ($r['patients'] ?? 0),
            ];
        }, $rows);
        $filename = 'top_icd10_' . now()->format('Ymd_His') . '.xlsx';
        return Excel::download(new GenericArrayExport($headers, $mapped), $filename);
    }
}
