<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;


class DashboardController extends Controller
{
    public function index()
    {
        $stats = [
            [
                'value' => 0,
                'label' => 'Dokter Aktif',
                'color' => 'bg-green-500',
                'footer' => ['href' => '/dokter', 'text' => 'Lihat Dokter'],
            ],
            [
                'value' => 5,
                'label' => 'Jumlah Pasien Terdaftar',
                'color' => 'bg-cyan-500',
            ],
            [
                'value' => 4,
                'label' => 'Kunjungan Hari Ini',
                'color' => 'bg-yellow-500',
            ],
            [
                'value' => 'Rp0',
                'label' => 'Pendapatan Hari Ini',
                'color' => 'bg-red-500',
                'footer' => ['href' => '/pendapatan', 'text' => 'Rincian'],
            ],
        ];

        return Inertia::render('dashboard', [
            'stats' => $stats,
        ]);
    }

}
