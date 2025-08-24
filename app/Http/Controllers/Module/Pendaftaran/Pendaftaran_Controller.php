<?php

namespace App\Http\Controllers\Module\Pendaftaran;

use App\Http\Controllers\Controller;
use App\Models\Module\Pasien\Pasien;
use App\Models\Module\Master\Data\Medis\Poli;
use App\Models\Module\Pemdaftaran\Pendaftaran;
use App\Models\Module\Master\Data\Umum\Penjamin;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class Pendaftaran_Controller extends Controller
{
    public function index()
    {
        return Inertia::render('module/pendaftaran/index');
    }

    public function pendaftaran()
    {
        $title = "Pasien";
        $pasiens = Pasien::all();
        $poli = poli::all();

        $today = Carbon::today(); // atau now()->startOfDay()

        $pendaftaran = Pendaftaran::with('status', 'poli', 'dokter.namauser', 'pasien', 'penjamin')
            ->whereHas('status', function ($query) {
                $query->whereIn('status_pendaftaran', ['1', '2']);
            })
            ->whereDate('tanggal_kujungan', '=', $today)
            ->whereDoesntHave('apotek') // Filter: yang belum ada di tabel apotek
            ->get();


        $pasienallold = Pendaftaran::whereDate('tanggal_kujungan', '=', $today)
            ->whereHas('status', function ($query) {
                    $query->where('status_pendaftaran', '!=', 0);
                })
            ->count();
        $pasienallnewnow = Pendaftaran::with('status')
            ->whereHas('status', function ($query) {
                $query->whereIn('status_pendaftaran', ['3']);
            })
            ->count();

        $penjamin = penjamin::all();

        $rekapPerPoliDokter = Pendaftaran::whereDate('tanggal_kujungan', $today)
            ->whereHas('dokter.jadwal', function ($query) use ($today) {
                $query->whereDate('start', '=', $today);
            })
            ->whereHas('status', function ($query) {
                $query->where('status_pendaftaran', '!=', 0);
            })
            ->select('poli_id', 'dokter_id', DB::raw('count(*) as jumlah'))
            ->groupBy('poli_id', 'dokter_id')
            ->with(['poli', 'dokter'])
            ->get();

        $jumlahDokter = $rekapPerPoliDokter->count(); // Banyaknya dokter unik
        $totalPasien = $rekapPerPoliDokter->sum('jumlah'); // Total pasien dari semua dokter

        $rekapPerDokter = Pendaftaran::with(['dokter.namauser', 'poli', 'status'])
        ->whereDate('tanggal_kujungan', $today) // filter kunjungan hari ini
        ->whereHas('dokter.jadwal', function ($query) use ($today) {
            $query->whereDate('start', '=', $today);
        })
        ->whereHas('status', function ($query) {
            $query->whereIn('status_panggil', [0, 1, 2, 3]);
        })

        ->orderBy('created_at', 'desc')
        ->get()
        ->groupBy('dokter_id')
        ->map(function ($group) {
            $jumlahMenunggu = $group->filter(function ($item) {
                return $item->status && in_array($item->status->status_panggil, [0,1]) && $item->status->status_pendaftaran == 2;
            })->count();

            $jumlahDilayani = $group->filter(function ($item) {
                return $item->status && $item->status->status_panggil == 3;
            })->count();

            // Cari nomor antrian untuk status 2 atau 3
            $pasienAktif = $group->filter(function ($item) {
                return $item->status && in_array($item->status->status_panggil, [2]);
            })->sortBy('antrian')->first();

            $noAntrian = $pasienAktif ? $pasienAktif->antrian : '-';

            $latest = $group->first();

            // Tentukan status_periksa
            $statusPeriksa = '-';
            if ($latest && $latest->status) {
                if ($group->contains(function ($item) {
                    return $item->status && in_array($item->status->status_panggil, [0,1]) && $item->status->status_pendaftaran == 2;
                })) {
                    $statusPeriksa = 1; //menungu
                } elseif ($group->contains(function ($item) {
                    return $item->status && $item->status->status_panggil == 2;
                })) {
                    $statusPeriksa = 2; //periksa
                }
                else {
                    $statusPeriksa = 3; //kosong
                }
            }

            return (object) [
                'dokter'         => $latest->dokter,
                'poli'           => $latest->poli,
                'menunggu'       => $jumlahMenunggu,
                'dilayani'       => $jumlahDilayani,
                'no_antrian'     => $noAntrian,
                'status_periksa' => $statusPeriksa
            ];
        });

        return view('module.pendaftaran.daftar', compact('title','rekapPerDokter' ,'jumlahDokter', 'totalPasien', 'rekapPerPoliDokter', 'pendaftaran', 'pasiens', 'penjamin', 'poli', 'pasienallnewnow', 'pasienallold'));
    }
}
