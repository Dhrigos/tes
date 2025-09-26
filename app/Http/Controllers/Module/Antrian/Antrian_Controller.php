<?php

namespace App\Http\Controllers\Module\Antrian;

use App\Http\Controllers\Controller;
use App\Models\Module\Pemdaftaran\Pendaftaran;
use Illuminate\Http\Request;
use Inertia\Inertia;

class Antrian_Controller extends Controller
{
    public function index()
    {
        $data = [
            'general_poly' => 10,
            'dental_poly' => 5,
            'kia_poly' => 8,
        ];

        return Inertia::render('module/monitor/index', $data);
    }
    
    /**
     * Menampilkan halaman monitor antrian loket
     */
    public function loket_antrian()
    {
        // Ambil data antrian loket
        $loket_data = [];
        
        // Loket 1 - Pendaftaran
        $pendaftaran = Pendaftaran::where('tanggal_kujungan', date('Y-m-d'))
            ->where('status', 'menunggu')
            ->orderBy('antrian', 'asc')
            ->first();
            
        if ($pendaftaran) {
            $loket_data['1'] = [
                'nomor' => $pendaftaran->antrian,
                'nama' => $pendaftaran->pasien->nama ?? 'Pasien'
            ];
        } else {
            $loket_data['1'] = [
                'nomor' => '-',
                'nama' => 'Belum ada antrian'
            ];
        }
        
        // Loket 2 - Farmasi
        $farmasi = Pendaftaran::whereHas('apoteks', function($query) {
                $query->where('status', 'menunggu');
            })
            ->where('tanggal_kujungan', date('Y-m-d'))
            ->orderBy('antrian', 'asc')
            ->first();
            
        if ($farmasi) {
            $loket_data['2'] = [
                'nomor' => $farmasi->antrian,
                'nama' => $farmasi->pasien->nama ?? 'Pasien'
            ];
        } else {
            $loket_data['2'] = [
                'nomor' => '-',
                'nama' => 'Belum ada antrian'
            ];
        }
        
        // Loket 3 - Kasir
        $kasir = Pendaftaran::whereHas('pelayanan_statuses', function($query) {
                $query->where('status', 'kasir');
            })
            ->where('tanggal_kujungan', date('Y-m-d'))
            ->orderBy('antrian', 'asc')
            ->first();
            
        if ($kasir) {
            $loket_data['3'] = [
                'nomor' => $kasir->antrian,
                'nama' => $kasir->pasien->nama ?? 'Pasien'
            ];
        } else {
            $loket_data['3'] = [
                'nomor' => '-',
                'nama' => 'Belum ada antrian'
            ];
        }

        return Inertia::render('module/monitor/loket_antrian', [
            'loket_data' => $loket_data
        ]);
    }
}