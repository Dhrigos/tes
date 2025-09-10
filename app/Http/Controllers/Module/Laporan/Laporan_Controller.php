<?php

namespace App\Http\Controllers\Module\Laporan;

use App\Http\Controllers\Controller;
use App\Models\Module\Pemdaftaran\Antrian_Pasien;
use App\Models\Module\Pemdaftaran\Pendaftaran;
use App\Models\Settings\Web_Setting;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
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

        $data = Pendaftaran::with('poli', 'dokter.namauser', 'pasien', 'penjamin')->get();

        return Inertia::render('module/laporan/pendaftaran/index', [
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

        $pdf = Pdf::loadView('pdf.data_pendaftaran', compact('data', 'tanggal_awal', 'tanggal_akhir', 'poli', 'dokter', 'total_invoice', 'namaKlinik', 'alamatKlinik'))
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
        $data = collect();
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

        $total_invoice = count($data);

        $namaKlinik = Web_Setting::value('nama');
        $alamatKlinik = Web_Setting::value('alamat');

        $pdf = Pdf::loadView('pdf.data_mutasi_penyesuaian', compact('data', 'tanggal_awal', 'tanggal_akhir', 'obat', 'jenis', 'total_invoice', 'namaKlinik', 'alamatKlinik'))
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
}
