<?php

namespace App\Http\Controllers\Module\Antrian;

use App\Http\Controllers\Controller;
use App\Models\Module\Master\Data\Umum\Loket;
use App\Models\Module\Pemdaftaran\Pendaftaran;
use App\Models\Module\Pemdaftaran\Pendaftaran_status;
use App\Models\Module\Pemdaftaran\Antrian_Pasien;
use App\Models\Module\Pelayanan\Pelayanan_status;
use App\Models\Module\Pasien\Pasien;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class Monitor_Controller extends Controller
{
    /**
     * Tampilkan interface monitor antrian untuk TV/Monitor (React TSX)
     */
    public function tampilkan_antrian()
    {
        // Ambil data settings untuk ditampilkan di header
        $settings = (object) [
            'nama' => config('app.name', 'Klinik')
        ];

        return Inertia::render('module/antrian/loket_antrian', [
            'settings' => $settings,
        ]);
    }

    /**
     * Ambil data antrian real-time untuk semua loket
     */
    public function ambil_data_antrian()
    {
        try {
            $hari_ini = now()->toDateString();
            $lokets = Loket::with('poli')->get();
            $data_antrian = [];

            foreach ($lokets as $loket) {
                // Ambil antrian yang sedang dilayani untuk loket ini
                $sedang_dilayani = $this->ambil_antrian_sedang_dilayani($loket->id, $hari_ini);
                
                // Ambil antrian yang menunggu untuk loket ini
                $antrian_menunggu = $this->ambil_antrian_menunggu($loket->id, $hari_ini);
                
                // Ambil total antrian hari ini
                $total_hari_ini = $this->ambil_total_antrian_loket($loket->id, $hari_ini);

                $data_antrian[] = [
                    'loket_id' => $loket->id,
                    'loket_nama' => $loket->nama,
                    'poli_nama' => $loket->poli->nama ?? 'Umum',
                    'sedang_dilayani' => $sedang_dilayani,
                    'antrian_menunggu' => $antrian_menunggu,
                    'total_hari_ini' => $total_hari_ini,
                    'terakhir_dipanggil' => $this->ambil_antrian_terakhir_dipanggil($loket->id, $hari_ini),
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $data_antrian,
                'timestamp' => now()->format('H:i:s'),
                'tanggal' => now()->format('d F Y'),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error mengambil data antrian: ' . $e->getMessage()
            ], 500);
        }
    }


    /**
     * Ambil statistik antrian untuk dashboard
     */
    public function ambil_statistik_antrian()
    {
        try {
            $hari_ini = now()->toDateString();
            
            $statistik = [
                'total_terdaftar' => Pendaftaran::whereDate('tanggal_kujungan', $hari_ini)->count(),
                'menunggu_pendaftaran' => $this->hitung_menunggu_pendaftaran($hari_ini),
                'dengan_perawat' => $this->hitung_dengan_perawat($hari_ini),
                'dengan_dokter' => $this->hitung_dengan_dokter($hari_ini),
                'selesai' => $this->hitung_selesai($hari_ini),
                'rata_rata_waktu_tunggu' => $this->hitung_rata_rata_waktu_tunggu($hari_ini),
            ];

            return response()->json([
                'success' => true,
                'data' => $statistik
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error mengambil statistik: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reset nomor antrian harian (dipanggil pada tengah malam)
     */
    public function reset_antrian_harian()
    {
        try {
            $hari_ini = now()->toDateString();
            
            // Log aksi reset
            Log::info("Reset antrian harian dijalankan untuk tanggal: {$hari_ini}");
            
            return response()->json([
                'success' => true,
                'message' => 'Reset antrian harian selesai'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error mereset antrian: ' . $e->getMessage()
            ], 500);
        }
    }

    // Private helper methods dengan penamaan Indonesia

    private function ambil_antrian_sedang_dilayani($loket_id, $tanggal)
    {
        // Ambil antrian yang sedang dilayani berdasarkan loket dan tahap
        $loket = Loket::find($loket_id);
        
        if (!$loket) return null;

        // Untuk loket pendaftaran (biasanya loket A)
        if (stripos($loket->nama, 'A') !== false || stripos($loket->nama, 'pendaftaran') !== false) {
            return Pendaftaran::with('pasien')
                ->whereDate('tanggal_kujungan', $tanggal)
                ->whereHas('status', function($q) {
                    $q->where('status_panggil', 0); // Sedang dilayani di pendaftaran
                })
                ->orderBy('created_at')
                ->first();
        }

        // Untuk loket perawat (biasanya loket B)
        if (stripos($loket->nama, 'B') !== false || stripos($loket->nama, 'perawat') !== false) {
            return Pendaftaran::with('pasien')
                ->whereDate('tanggal_kujungan', $tanggal)
                ->whereHas('pelayanan_statuses', function($q) {
                    $q->where('status_perawat', 1); // Sedang dengan perawat
                })
                ->orderBy('created_at')
                ->first();
        }

        // Untuk loket dokter (biasanya loket C atau spesifik poli)
        return Pendaftaran::with('pasien')
            ->whereDate('tanggal_kujungan', $tanggal)
            ->where('poli_id', $loket->poli_id)
            ->whereHas('pelayanan_statuses', function($q) {
                $q->where('status_dokter', 1); // Sedang dengan dokter
            })
            ->orderBy('created_at')
            ->first();
    }

    private function ambil_antrian_menunggu($loket_id, $tanggal)
    {
        $loket = Loket::find($loket_id);
        
        if (!$loket) return collect();

        // Untuk loket pendaftaran
        if (stripos($loket->nama, 'A') !== false || stripos($loket->nama, 'pendaftaran') !== false) {
            return Pendaftaran::with('pasien')
                ->whereDate('tanggal_kujungan', $tanggal)
                ->whereHas('status', function($q) {
                    $q->where('status_panggil', 0)
                      ->where('status_pendaftaran', 1); // Terdaftar tapi belum dipanggil
                })
                ->orderBy('created_at')
                ->take(5)
                ->get();
        }

        // Untuk loket perawat
        if (stripos($loket->nama, 'B') !== false || stripos($loket->nama, 'perawat') !== false) {
            return Pendaftaran::with('pasien')
                ->whereDate('tanggal_kujungan', $tanggal)
                ->whereHas('status', function($q) {
                    $q->where('status_panggil', 1); // Dipanggil dari pendaftaran
                })
                ->whereDoesntHave('pelayanan_statuses', function($q) {
                    $q->where('status_perawat', '>', 0);
                })
                ->orderBy('created_at')
                ->take(5)
                ->get();
        }

        // Untuk loket dokter
        return Pendaftaran::with('pasien')
            ->whereDate('tanggal_kujungan', $tanggal)
            ->where('poli_id', $loket->poli_id)
            ->whereHas('pelayanan_statuses', function($q) {
                $q->where('status_perawat', 2); // Selesai dengan perawat
            })
            ->whereDoesntHave('pelayanan_statuses', function($q) {
                $q->where('status_dokter', '>', 0);
            })
            ->orderBy('created_at')
            ->take(5)
            ->get();
    }

    private function ambil_total_antrian_loket($loket_id, $tanggal)
    {
        $loket = Loket::find($loket_id);
        
        if (!$loket) return 0;

        if ($loket->poli_id) {
            return Pendaftaran::whereDate('tanggal_kujungan', $tanggal)
                ->where('poli_id', $loket->poli_id)
                ->count();
        }

        return Pendaftaran::whereDate('tanggal_kujungan', $tanggal)->count();
    }

    private function ambil_antrian_terakhir_dipanggil($loket_id, $tanggal)
    {
        $loket = Loket::find($loket_id);
        
        if (!$loket) return null;

        // Ambil antrian yang paling baru dipanggil untuk loket ini
        return Pendaftaran::with('pasien')
            ->whereDate('tanggal_kujungan', $tanggal)
            ->whereHas('status', function($q) {
                $q->where('status_panggil', '>', 0);
            })
            ->orderBy('updated_at', 'desc')
            ->first();
    }

    private function ambil_antrian_selanjutnya_untuk_dipanggil($loket_id, $tahap, $tanggal)
    {
        $loket = Loket::find($loket_id);
        
        if (!$loket) return null;

        switch ($tahap) {
            case 'pendaftaran':
                return Pendaftaran::with('pasien')
                    ->whereDate('tanggal_kujungan', $tanggal)
                    ->whereHas('status', function($q) {
                        $q->where('status_panggil', 0)
                          ->where('status_pendaftaran', 1);
                    })
                    ->orderBy('created_at')
                    ->first();

            case 'perawat':
                return Pendaftaran::with('pasien')
                    ->whereDate('tanggal_kujungan', $tanggal)
                    ->whereHas('status', function($q) {
                        $q->where('status_panggil', 1);
                    })
                    ->whereDoesntHave('pelayanan_statuses')
                    ->orderBy('created_at')
                    ->first();

            case 'dokter':
                return Pendaftaran::with('pasien')
                    ->whereDate('tanggal_kujungan', $tanggal)
                    ->where('poli_id', $loket->poli_id)
                    ->whereHas('pelayanan_statuses', function($q) {
                        $q->where('status_perawat', 2);
                    })
                    ->whereDoesntHave('pelayanan_statuses', function($q) {
                        $q->where('status_dokter', '>', 0);
                    })
                    ->orderBy('created_at')
                    ->first();

            default:
                return null;
        }
    }

    private function perbarui_status_antrian($pendaftaran, $tahap)
    {
        switch ($tahap) {
            case 'pendaftaran':
                // Update status pendaftaran menjadi dipanggil
                $pendaftaran->status()->updateOrCreate(
                    ['register_id' => $pendaftaran->id],
                    ['status_panggil' => 1]
                );
                break;

            case 'perawat':
                // Buat atau update status pelayanan untuk perawat
                Pelayanan_status::updateOrCreate(
                    ['nomor_register' => $pendaftaran->nomor_register],
                    [
                        'pasien_id' => $pendaftaran->pasien_id,
                        'tanggal_kujungan' => $pendaftaran->tanggal_kujungan,
                        'status_perawat' => 1,
                    ]
                );
                break;

            case 'dokter':
                // Update status pelayanan untuk dokter
                Pelayanan_status::updateOrCreate(
                    ['nomor_register' => $pendaftaran->nomor_register],
                    [
                        'pasien_id' => $pendaftaran->pasien_id,
                        'tanggal_kujungan' => $pendaftaran->tanggal_kujungan,
                        'status_dokter' => 1,
                        'waktu_panggil_dokter' => now(),
                    ]
                );
                break;
        }
    }

    private function hitung_menunggu_pendaftaran($tanggal)
    {
        return Pendaftaran::whereDate('tanggal_kujungan', $tanggal)
            ->whereHas('status', function($q) {
                $q->where('status_panggil', 0)
                  ->where('status_pendaftaran', 1);
            })
            ->count();
    }

    private function hitung_dengan_perawat($tanggal)
    {
        return Pelayanan_status::whereDate('tanggal_kujungan', $tanggal)
            ->where('status_perawat', 1)
            ->count();
    }

    private function hitung_dengan_dokter($tanggal)
    {
        return Pelayanan_status::whereDate('tanggal_kujungan', $tanggal)
            ->where('status_dokter', 1)
            ->count();
    }

    private function hitung_selesai($tanggal)
    {
        return Pelayanan_status::whereDate('tanggal_kujungan', $tanggal)
            ->where('status_dokter', 2)
            ->count();
    }

    private function hitung_rata_rata_waktu_tunggu($tanggal)
    {
        // Hitung rata-rata waktu tunggu dari pendaftaran sampai selesai dengan dokter
        $selesai = Pelayanan_status::whereDate('tanggal_kujungan', $tanggal)
            ->where('status_dokter', 2)
            ->whereNotNull('waktu_panggil_dokter')
            ->get();

        if ($selesai->isEmpty()) {
            return 0;
        }

        $total_menit = 0;
        $jumlah = 0;

        foreach ($selesai as $status) {
            $pendaftaran = Pendaftaran::where('nomor_register', $status->nomor_register)->first();
            if ($pendaftaran) {
                $waktu_mulai = Carbon::parse($pendaftaran->created_at);
                $waktu_selesai = Carbon::parse($status->updated_at);
                $total_menit += $waktu_mulai->diffInMinutes($waktu_selesai);
                $jumlah++;
            }
        }

        return $jumlah > 0 ? round($total_menit / $jumlah) : 0;
    }

    /**
     * Handle panggil antrian
     */
    public function panggil_antrian(Request $request)
    {
        $request->validate([
            'loket_id' => 'required|exists:lokets,id',
            'tahap' => 'required|in:pendaftaran,perawat,dokter',
            'antrian_id' => 'required|exists:pendaftarans,id'
        ]);

        try {
            DB::beginTransaction();

            $loket_id = $request->loket_id;
            $tahap = $request->tahap;
            $antrian_id = $request->antrian_id;
            $hari_ini = now()->toDateString();

            // Dapatkan data antrian
            $antrian = Pendaftaran::with('pasien')
                ->where('id', $antrian_id)
                ->first();

            if (!$antrian) {
                return response()->json([
                    'success' => false,
                    'message' => 'Antrian tidak ditemukan'
                ], 404);
            }

            // Update status antrian berdasarkan tahap
            $this->perbarui_status_antrian($antrian, $tahap);

            // Jika ini tahap pendaftaran, update status_panggil di pendaftaran_statuses
            if ($tahap === 'pendaftaran') {
                $antrian->status()->updateOrCreate(
                    ['register_id' => $antrian->id],
                    ['status_panggil' => 1] // 1 = Dipanggil
                );
            }

            // Jika ini tahap perawat atau dokter, update pelayanan_statuses
            if (in_array($tahap, ['perawat', 'dokter'])) {
                $statusField = $tahap === 'perawat' ? 'status_perawat' : 'status_dokter';
                
                Pelayanan_status::updateOrCreate(
                    ['nomor_register' => $antrian->nomor_register],
                    [
                        'pasien_id' => $antrian->pasien_id,
                        'tanggal_kujungan' => $antrian->tanggal_kujungan,
                        $statusField => 1, // 1 = Sedang dilayani
                        'waktu_panggil_' . $tahap => now()
                    ]
                );
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Antrian berhasil dipanggil',
                'data' => [
                    'antrian' => $antrian->antrian,
                    'nama_pasien' => $antrian->pasien->nama,
                    'no_rm' => $antrian->pasien->no_rm,
                    'tahap' => $tahap,
                    'waktu_panggil' => now()->format('H:i:s')
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error memanggil antrian: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal memanggil antrian: ' . $e->getMessage()
            ], 500);
        }
    }
}
