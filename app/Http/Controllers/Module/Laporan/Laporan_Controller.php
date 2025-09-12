<?php

namespace App\Http\Controllers\Module\Laporan;

use App\Http\Controllers\Controller;
use App\Models\Module\Gudang\Stok_Penyesuaian;
use App\Models\Module\Pemdaftaran\Antrian_Pasien;
use App\Models\Module\Pemdaftaran\Pendaftaran;
use App\Models\Settings\Web_Setting;
use App\Models\Module\Kasir\Kasir;
use App\Models\Module\Pelayanan\Pelayanan_Soap_Dokter_Icd;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

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

    public function print_antrian(Request $request)
    {
        $data = json_decode($request->input('data'), true);
        $tanggal_awal = $request->input('tanggal_awal');
        $tanggal_akhir = $request->input('tanggal_akhir');

        $total_invoice = count($data);

        $namaKlinik = Web_Setting::value('nama');
        $alamatKlinik = Web_Setting::value('alamat');

        $pdf = Pdf::loadView('pdf/antrian', compact('data', 'tanggal_awal', 'tanggal_akhir', 'total_invoice', 'namaKlinik', 'alamatKlinik'))
            ->setPaper('a4', 'landscape');

        $filename = 'laporan_antrian_' . $tanggal_awal . '_' . $tanggal_akhir . '.pdf';

        return $pdf->stream($filename);
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

    public function print_pendaftaran(Request $request)
    {
        $data = json_decode($request->input('data'), true);
        $tanggal_awal = $request->input('tanggal_awal');
        $tanggal_akhir = $request->input('tanggal_akhir');
        $poli = $request->input('poli');
        $dokter = $request->input('dokter');

        $total_invoice = count($data);

        $namaKlinik = Web_Setting::value('nama');
        $alamatKlinik = Web_Setting::value('alamat');

        $pdf = Pdf::loadView('pdf/pendaftaran', compact('data', 'tanggal_awal', 'tanggal_akhir', 'poli', 'dokter', 'total_invoice', 'namaKlinik', 'alamatKlinik'))
            ->setPaper('a4', 'landscape');

        $filename = 'laporan_pendaftaran_' . $tanggal_awal . '_' . $tanggal_akhir . '.pdf';

        return $pdf->stream($filename);
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

    public function print_dokter(Request $request)
    {
        $data = json_decode($request->input('data'), true);
        $tanggal_awal = $request->input('tanggal_awal');
        $tanggal_akhir = $request->input('tanggal_akhir');
        $poli = $request->input('poli');
        $dokter = $request->input('dokter');

        $total_invoice = count($data);

        $namaKlinik = Web_Setting::value('nama');
        $alamatKlinik = Web_Setting::value('alamat');

        $pdf = Pdf::loadView('pdf/dokter', compact('data', 'tanggal_awal', 'tanggal_akhir', 'poli', 'dokter', 'total_invoice', 'namaKlinik', 'alamatKlinik'))
            ->setPaper('a4', 'landscape');

        $filename = 'laporan_pelayanan_dokter_' . $tanggal_awal . '_' . $tanggal_akhir . '.pdf';

        return $pdf->stream($filename);
    }

    public function print_dokter_detail(Request $request)
    {
        $item = json_decode($request->input('item'), true);

        $namaKlinik = Web_Setting::value('nama');
        $alamatKlinik = Web_Setting::value('alamat');

        $pdf = Pdf::loadView('pdf/dokter_detail', compact('item', 'namaKlinik', 'alamatKlinik'))
            ->setPaper('a4', 'portrait');

        $noRawat = data_get($item, 'nomor_register', 'detail_dokter');
        $filename = 'detail_dokter_' . $noRawat . '.pdf';

        return $pdf->stream($filename);
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

    public function print_perawat(Request $request)
    {
        $data = json_decode($request->input('data'), true);
        $tanggal_awal = $request->input('tanggal_awal');
        $tanggal_akhir = $request->input('tanggal_akhir');
        $poli = $request->input('poli');
        $dokter = $request->input('dokter');

        $total_invoice = count($data);

        $namaKlinik = Web_Setting::value('nama');
        $alamatKlinik = Web_Setting::value('alamat');

        $pdf = Pdf::loadView('pdf/perawat', compact('data', 'tanggal_awal', 'tanggal_akhir', 'poli', 'dokter', 'total_invoice', 'namaKlinik', 'alamatKlinik'))
            ->setPaper('a4', 'landscape');

        $filename = 'laporan_pelayanan_perawat_' . $tanggal_awal . '_' . $tanggal_akhir . '.pdf';

        return $pdf->stream($filename);
    }

    public function print_perawat_detail(Request $request)
    {
        $item = json_decode($request->input('item'), true);

        $namaKlinik = Web_Setting::value('nama');
        $alamatKlinik = Web_Setting::value('alamat');

        $pdf = Pdf::loadView('pdf/perawat_detail', compact('item', 'namaKlinik', 'alamatKlinik'))
            ->setPaper('a4', 'portrait');

        $noRawat = data_get($item, 'nomor_register', 'detail_perawat');
        $filename = 'detail_perawat_' . $noRawat . '.pdf';

        return $pdf->stream($filename);
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

    public function print_stok_penyesuaian(Request $request)
    {
        $data = json_decode($request->input('data'), true);
        $tanggal_awal = $request->input('tanggal_awal');
        $tanggal_akhir = $request->input('tanggal_akhir');
        $obat = $request->input('obat');
        $jenis = $request->input('jenis');
        $tipe = $request->input('tipe');

        $total_invoice = count($data);

        $namaKlinik = Web_Setting::value('nama');
        $alamatKlinik = Web_Setting::value('alamat');

        $pdf = Pdf::loadView('pdf/stok_penyesuaian', compact('data', 'tanggal_awal', 'tanggal_akhir', 'obat', 'jenis', 'tipe', 'total_invoice', 'namaKlinik', 'alamatKlinik'))
            ->setPaper('a4', 'landscape');

        $filename = 'laporan_selisih_mutasi_penyesuaian_' . $tanggal_awal . '_' . $tanggal_akhir . '.pdf';

        return $pdf->stream($filename);
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

    public function print_stok_opname(Request $request)
    {
        $data = json_decode($request->input('data'), true);
        $tanggal_awal = $request->input('tanggal_awal');
        $tanggal_akhir = $request->input('tanggal_akhir');
        $obat = $request->input('obat');

        $total_invoice = count($data);

        $namaKlinik = Web_Setting::value('nama');
        $alamatKlinik = Web_Setting::value('alamat');

        $pdf = Pdf::loadView('pdf.data_stok_opname', compact('data', 'tanggal_awal', 'tanggal_akhir', 'obat', 'total_invoice', 'namaKlinik', 'alamatKlinik'))
            ->setPaper('a4', 'landscape');

        $filename = 'laporan_stok_opname_' . $tanggal_awal . '_' . $tanggal_akhir . '.pdf';

        return $pdf->stream($filename);
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

    public function print_apotek(Request $request)
    {
        $data = json_decode($request->input('data'), true); // penting! decode data JSON
        $tanggal_awal = $request->input('tanggal_awal');
        $tanggal_akhir = $request->input('tanggal_akhir');
        $poli = $request->input('poli');

        $total_invoice = 0;

        foreach ($data as $item) {
            if (isset($item['is_detail']) && $item['is_detail'] == false) {
                $total_invoice++;
            }
        }

        $pendapatan = 0;

        foreach ($data as $item) {
            $pendapatan += $item['total_sementara'];
        }

        $pendapatanFormatted = $this->formatRupiah($pendapatan);

        $obatQtySummary = []; // array penampung

        foreach ($data as $item) {
            $nama_obat = $item['nama_obat_tindakan'] ?? '-';
            $qty = (int) $item['qty'] ?? 0;

            if (!isset($obatQtySummary[$nama_obat])) {
                $obatQtySummary[$nama_obat] = 0;
            }

            $obatQtySummary[$nama_obat] += $qty;
        }

        $namaKlinik = Web_Setting::value('nama');
        $alamatKlinik = Web_Setting::value('alamat');

        $pdf = Pdf::loadView('pdf.data_lunas_kasir_apotek', compact('data', 'tanggal_awal', 'tanggal_akhir', 'poli', 'total_invoice', 'pendapatanFormatted', 'obatQtySummary', 'namaKlinik', 'alamatKlinik'))
            ->setPaper('a4', 'landscape');

        $filename = 'kasir_apotek_lunas_' . now()->format('Ymd_His') . '.pdf';

        return $pdf->stream($filename); // tampilkan langsung di tab baru
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

    public function print_kasir(Request $request)
    {
        $data = json_decode($request->input('data'), true);
        $tanggal_awal = $request->input('tanggal_awal');
        $tanggal_akhir = $request->input('tanggal_akhir');
        $poli = $request->input('poli');

        $total_invoice = count($data);

        $namaKlinik = Web_Setting::value('nama');
        $alamatKlinik = Web_Setting::value('alamat');

        $pdf = Pdf::loadView('pdf.kasir_lunas', compact('data', 'tanggal_awal', 'tanggal_akhir', 'poli', 'total_invoice', 'namaKlinik', 'alamatKlinik'))
            ->setPaper('a4', 'landscape');

        $filename = 'kasir_lunas_' . now()->format('Ymd_His') . '.pdf';

        return $pdf->stream($filename);
    }

    // Data Lunas Detail
    public function kasir_detail()
    {
        $title = "Kasir Detail";

        $header = \App\Models\Module\Kasir\Kasir_Detail::with('kasir')->get();

        return Inertia::render('module/laporan/kasir-detail/index', [
            'title' => $title,
            'header' => $header,
        ]);
    }

    public function kasir_detail_print(Request $request)
    {
        $data = json_decode($request->input('data'), true); // penting! decode data JSON
        $tanggal_awal = $request->input('tanggal_awal');
        $tanggal_akhir = $request->input('tanggal_akhir');
        $poli = $request->input('poli');

        $total_invoice = 0;

        foreach ($data as $item) {
            if (isset($item['is_detail']) && $item['is_detail'] == false) {
                $total_invoice++;
            }
        }

        $cash = 0;
        $debit = 0;
        $credit = 0;
        $transfer = 0;

        foreach ($data as $item) {
            for ($i = 1; $i <= 3; $i++) {
                $methodKey = "payment_method_$i";
                $nominalKey = "payment_nominal_$i";

                if (!empty($item[$methodKey]) && !empty($item[$nominalKey])) {
                    $method = strtolower($item[$methodKey]);
                    // Hilangkan 'Rp ', titik dan spasi dari nominal sebelum konversi
                    $nominalStr = str_replace(['Rp', '.', ' '], '', $item[$nominalKey]);

                    // Cek apakah setelah dibersihkan adalah angka
                    if ($nominalStr) {
                        $nominal = $nominalStr;

                        switch ($method) {
                            case 'cash':
                                $cash += $nominal;
                                break;
                            case 'debit':
                                $debit += $nominal;
                                break;
                            case 'credit':
                                $credit += $nominal;
                                break;
                            case 'transfer':
                                $transfer += $nominal;
                                break;
                        }
                    }
                }
            }
        }

        // Contoh penggunaan:
        $cashFormatted = $this->formatRupiah($cash);
        $debitFormatted = $this->formatRupiah($debit);
        $creditFormatted = $this->formatRupiah($credit);
        $transferFormatted = $this->formatRupiah($transfer);

        $pendapatan = $cash + $debit + $credit + $transfer;
        $pendapatanFormatted = $this->formatRupiah($pendapatan);

        $namaKlinik = Web_Setting::value('nama');
        $alamatKlinik = Web_Setting::value('alamat');

        $pdf = Pdf::loadView('pdf.data_lunas_kasir_detail', compact('data', 'tanggal_awal', 'tanggal_akhir', 'poli', 'total_invoice', 'cashFormatted', 'debitFormatted', 'creditFormatted', 'transferFormatted', 'pendapatanFormatted', 'namaKlinik', 'alamatKlinik'))
            ->setPaper('a4', 'landscape');

        $filename = 'kasir_detail_lunas_' . now()->format('Ymd_His') . '.pdf';

        return $pdf->stream($filename); // tampilkan langsung di tab baru
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
}
