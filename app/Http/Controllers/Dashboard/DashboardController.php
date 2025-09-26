<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Module\SDM\Dokter;
use Carbon\Carbon;
use App\Models\Module\Kasir\Kasir;
use App\Models\Module\Kasir\Kasir_Detail;
use App\Models\Module\Pemdaftaran\Pendaftaran;
use App\Models\Module\Pasien\Pasien;
use Illuminate\Support\Facades\DB;
use App\Models\Module\Pelayanan\Pelayanan_So_Perawat;
use App\Models\Module\Pelayanan\Pelayanan_Soap_Dokter;
use App\Models\Module\Pelayanan\Pelayanan_status;


class DashboardController extends Controller
{
    public function index()
    {
        $dayMap = [
            1 => 'Senin',
            2 => 'Selasa',
            3 => 'Rabu',
            4 => 'Kamis',
            5 => 'Jumat',
            6 => 'Sabtu',
            7 => 'Minggu',
        ];
        $todayName = $dayMap[Carbon::now()->dayOfWeekIso] ?? '';

        $dokterAktifQuery = Dokter::whereHas('jadwals', function ($q) use ($todayName) {
            $q->where('aktif', 1)
              ->where('hari', $todayName);
        })->with(['jadwals' => function ($q) use ($todayName) {
            $q->where('aktif', 1)
              ->where('hari', $todayName)
              ->select(['id', 'dokter_id', 'hari', 'jam_mulai', 'jam_selesai', 'kuota']);
        }])->select(['id', 'nama']);

        $dokterAktif = (clone $dokterAktifQuery)->count();

        // Aggregate kuota per dokter (jadwal aktif pada hari ini)
        $kuotaPerDokter = DB::table('dokter_jadwals')
            ->where('aktif', 1)
            ->where('hari', $todayName)
            ->select('dokter_id', DB::raw('SUM(kuota) as total_kuota'))
            ->groupBy('dokter_id')
            ->pluck('total_kuota', 'dokter_id');

        // Hitung jumlah diperiksa per dokter (pendaftaran hari ini yang sudah ada SOAP dokter)
        $today = Carbon::today();
        $diperiksaPerDokter = DB::table('pendaftarans as p')
            ->leftJoin('pelayanan_soap_dokters as sd', 'sd.no_rawat', '=', 'p.nomor_register')
            ->whereDate('p.created_at', $today)
            ->select(DB::raw('p.dokter_id as dokter_id'), DB::raw('COUNT(sd.no_rawat) as total_diperiksa'))
            ->groupBy('dokter_id')
            ->pluck('total_diperiksa', 'dokter_id');

        $dokterAktifList = (clone $dokterAktifQuery)->get()->map(function ($dokter) use ($kuotaPerDokter, $diperiksaPerDokter) {
            return [
                'nama' => $dokter->nama,
                'kuota' => (int) ($kuotaPerDokter[$dokter->id] ?? 0),
                'diperiksa' => (int) ($diperiksaPerDokter[$dokter->id] ?? 0),
                'jadwal' => $dokter->jadwals->map(function ($j) {
                    return [
                        'hari' => $j->hari,
                        'jam_mulai' => $j->jam_mulai,
                        'jam_selesai' => $j->jam_selesai,
                        'kuota' => $j->kuota,
                    ];
                })->values(),
            ];
        })->values();

        // Pendapatan: sum of payments (1..3) minus change (kembalian)
        $today = Carbon::today();
        $monthStart = Carbon::now()->startOfMonth();

        $sumPayments = function ($query) {
            return $query->get()->reduce(function ($carry, $row) {
                $p1 = (float)($row->payment_nominal_1 ?? 0);
                $p2 = (float)($row->payment_nominal_2 ?? 0);
                $p3 = (float)($row->payment_nominal_3 ?? 0);
                $kembalian = (float)($row->kembalian ?? 0);
                return $carry + max(0, ($p1 + $p2 + $p3) - $kembalian);
            }, 0.0);
        };

        $todayRevenue = $sumPayments(
            Kasir::query()->whereDate('created_at', $today)
                ->select(['payment_nominal_1','payment_nominal_2','payment_nominal_3','kembalian'])
        );
        $monthRevenue = $sumPayments(
            Kasir::query()->whereBetween('created_at', [$monthStart, Carbon::now()])
                ->select(['payment_nominal_1','payment_nominal_2','payment_nominal_3','kembalian'])
        );

        // Breakdown pendapatan hari ini: tindakan vs obat from kasir_details
        $detailsToday = Kasir_Detail::query()
            ->whereDate('created_at', $today)
            ->select(['nama_obat_tindakan','pelaksana','total'])
            ->get();
        $pendapatanObatToday = (float)$detailsToday->filter(function ($row) {
            return is_null($row->pelaksana) || $row->pelaksana === '';
        })->sum(function ($row) { return (float)($row->total ?? 0); });
        $pendapatanTindakanToday = (float)$detailsToday->filter(function ($row) {
            return !is_null($row->pelaksana) && $row->pelaksana !== '';
        })->sum(function ($row) { return (float)($row->total ?? 0); });

        $kunjunganHariIni = Pendaftaran::whereDate('created_at', Carbon::today())->count();

        $stats = [
            [
                'value' => $dokterAktif,
                'label' => 'Dokter Aktif',
                'color' => 'bg-green-500',
                'footer' => ['href' => '/dokter', 'text' => 'Lihat Dokter'],
            ],
            [
                'value' => Pasien::count(),
                'label' => 'Jumlah Pasien Terdaftar',
                'color' => 'bg-cyan-500',
                'footer' => ['href' => '/pasien', 'text' => 'Lihat Pasien'],
            ],
            [
                'value' => $kunjunganHariIni,
                'label' => 'Kunjungan Hari Ini',
                'color' => 'bg-yellow-500',
                'footer' => ['href' => '/pendaftaran', 'text' => 'Lihat Kunjungan'],
            ],
            [
                'value' => 'Rp' . number_format($todayRevenue, 0, ',', '.'),
                'label' => 'Pendapatan Hari Ini',
                'color' => 'bg-red-500',
                'footer' => ['href' => '/pendapatan', 'text' => 'Rincian'],
                'meta' => [
                    'today' => $todayRevenue,
                    'month' => $monthRevenue,
                    'today_obat' => $pendapatanObatToday,
                    'today_tindakan' => $pendapatanTindakanToday,
                ],
            ],
        ];

        // Monthly aggregates (last 12 months)
        $months = collect(range(0, 11))->map(function ($i) {
            return Carbon::now()->startOfMonth()->subMonths($i);
        })->reverse()->values();

        $revenueMonthly = $months->map(function (Carbon $m) use ($sumPayments) {
            $sum = $sumPayments(
                Kasir::query()
                    ->whereBetween('created_at', [$m->copy()->startOfMonth(), $m->copy()->endOfMonth()])
                    ->select(['payment_nominal_1','payment_nominal_2','payment_nominal_3','kembalian'])
            );
            return [
                'label' => $m->isoFormat('MMM YY'),
                'value' => (float)$sum,
            ];
        });

        $kunjunganMonthly = $months->map(function (Carbon $m) {
            $count = Pendaftaran::whereBetween('created_at', [$m->copy()->startOfMonth(), $m->copy()->endOfMonth()])->count();
            return [
                'label' => $m->isoFormat('MMM YY'),
                'value' => (int)$count,
            ];
        });

        // Frekuensi pendaftaran per poli (semua waktu; sesuaikan jika perlu per bulan)
        $poliFrequency = Pendaftaran::with('poli')
            ->select('poli_id', DB::raw('count(*) as total'))
            ->groupBy('poli_id')
            ->orderByDesc('total')
            ->get()
            ->map(function ($row) {
                $label = $row->poli->nama ?? (string)$row->poli_id;
                return [
                    'label' => $label,
                    'value' => (int) $row->total,
                ];
            })
            ->values();

        // Bridging status placeholder (adjust to real source if available)
        $statusBridging = [
            'bpjs' => true,
            'satusehat' => true,
            'last_sync' => Carbon::now()->subMinutes(5)->toDateTimeString(),
        ];

        // Average times (today)
        $todayStart = Carbon::today();
        $now = Carbon::now();

        // Rata-rata waktu tunggu perawat: dari pendaftarans.created_at ke pelayanan_so_perawats.created_at
        $avgWaitPerawat = (float) (DB::table('pendaftarans as p')
            ->join('pelayanan_so_perawats as sp', 'sp.no_rawat', '=', 'p.nomor_register')
            ->whereBetween('p.created_at', [$todayStart, $now])
            ->avg(DB::raw('TIMESTAMPDIFF(MINUTE, p.created_at, sp.created_at)')) ?? 0);

        // Rata-rata waktu tunggu dokter: prioritas pakai pelayanan_statuses.waktu_panggil_dokter, fallback ke pelayanan_soap_dokters.created_at
        $avgWaitDokterViaStatus = (float) (DB::table('pendaftarans as p')
            ->join('pelayanan_statuses as ps', 'ps.nomor_register', '=', 'p.nomor_register')
            ->whereNotNull('ps.waktu_panggil_dokter')
            ->whereBetween('p.created_at', [$todayStart, $now])
            ->avg(DB::raw('TIMESTAMPDIFF(MINUTE, p.created_at, ps.waktu_panggil_dokter)')) ?? 0);

        $avgWaitDokterViaSoap = (float) (DB::table('pendaftarans as p')
            ->join('pelayanan_soap_dokters as sd', 'sd.no_rawat', '=', 'p.nomor_register')
            ->whereBetween('p.created_at', [$todayStart, $now])
            ->avg(DB::raw('TIMESTAMPDIFF(MINUTE, p.created_at, sd.created_at)')) ?? 0);

        $avgWaitDokter = $avgWaitDokterViaStatus > 0 ? $avgWaitDokterViaStatus : $avgWaitDokterViaSoap;

        // Rata-rata waktu pemeriksaan perawat: durasi sp.updated_at - sp.created_at
        $avgExamPerawat = (float) (DB::table('pelayanan_so_perawats as sp')
            ->whereBetween('sp.created_at', [$todayStart, $now])
            ->avg(DB::raw('TIMESTAMPDIFF(MINUTE, sp.created_at, sp.updated_at)')) ?? 0);

        // Rata-rata waktu pemeriksaan dokter: durasi sd.updated_at - sd.created_at
        $avgExamDokter = (float) (DB::table('pelayanan_soap_dokters as sd')
            ->whereBetween('sd.created_at', [$todayStart, $now])
            ->avg(DB::raw('TIMESTAMPDIFF(MINUTE, sd.created_at, sd.updated_at)')) ?? 0);

        return Inertia::render('dashboard', [
            'stats' => $stats,
            'dokterAktifList' => $dokterAktifList,
            'pendapatanBulanIni' => $monthRevenue,
            'revenueMonthly' => $revenueMonthly,
            'kunjunganMonthly' => $kunjunganMonthly,
            'statusBridging' => $statusBridging,
            'poliFrequency' => $poliFrequency,
            'avgTimes' => [
                'wait_perawat' => round($avgWaitPerawat, 1),
                'wait_dokter' => round($avgWaitDokter, 1),
                'exam_perawat' => round($avgExamPerawat, 1),
                'exam_dokter' => round($avgExamDokter, 1),
            ],
        ]);
    }

}
