<?php

namespace App\Http\Controllers\Module\Pendaftaran;

use App\Http\Controllers\Controller;
use App\Models\Module\Pasien\Pasien;
use App\Models\Module\Master\Data\Medis\Poli;
use App\Models\Module\Pemdaftaran\Pendaftaran;
use App\Models\Module\Pemdaftaran\Pendaftaran_status;
use App\Models\Module\Master\Data\Umum\Penjamin;
use App\Models\Module\Master\Data\Umum\Loket;
use App\Models\Module\SDM\Dokter;
use Illuminate\Support\Facades\Log;
use App\Models\Module\Pelayanan;
use App\Models\Module\Pelayanan\Pelayanan_So_Perawat;
use App\Models\Module\Pelayanan\Pelayanan_status;
use App\Models\Module\SDM\DokterJadwal;

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
        $poli = Poli::all();

        $today = Carbon::today(); // atau now()->startOfDay()

        $pendaftaran = Pendaftaran::with('status', 'poli', 'dokter.nama', 'pasien', 'penjamin')
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
            ->whereDate('tanggal_kujungan', $today) // filter kujungan hari ini
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
                    return $item->status && in_array($item->status->status_panggil, [0, 1]) && $item->status->status_pendaftaran == 2;
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
                        return $item->status && in_array($item->status->status_panggil, [0, 1]) && $item->status->status_pendaftaran == 2;
                    })) {
                        $statusPeriksa = 1; //menungu
                    } elseif ($group->contains(function ($item) {
                        return $item->status && $item->status->status_panggil == 2;
                    })) {
                        $statusPeriksa = 2; //periksa
                    } else {
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

        return view('module.pendaftaran.daftar', compact('title', 'rekapPerDokter', 'jumlahDokter', 'totalPasien', 'rekapPerPoliDokter', 'pendaftaran', 'pasiens', 'penjamin', 'poli', 'pasienallnewnow', 'pasienallold'));
    }


    // 🔹 Ambil semua pasien
    public function getPasienList()
    {
        $pasien = Pasien::select('id', 'nama', 'no_rm')->get();

        return response()->json([
            'success' => true,
            'data' => $pasien
        ]);
    }

    // 🔹 Ambil semua poli yang sudah dikonfigurasi di loket
    public function getPoliList()
    {
        $poli = Poli::with('loket')
            ->whereHas('loket')
            ->get()
            ->map(function ($poli) {
                return [
                    'id' => $poli->id,
                    'nama' => $poli->nama,
                    'kode' => $poli->kode,
                    'kode_loket' => $poli->loket->nama ?? null
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $poli
        ]);
    }

    // 🔹 Ambil semua penjamin
    public function getPenjaminList()
    {
        $penjamin = Penjamin::select('id', 'nama')->get();

        return response()->json([
            'success' => true,
            'data' => $penjamin
        ]);
    }

    public function getDokterByPoli(Request $request)
    {
        $request->validate([
            'poli_id' => 'required|integer',
            'hari' => 'required|string',
            'jam' => 'required'
        ]);

        $dokter = DokterJadwal::with(['dokter.namapoli'])
            ->whereHas('dokter', function ($q) use ($request) {
                $q->where('poli', $request->poli_id); // karena kolom di tabel 'dokters' adalah 'poli'
            })
            ->where('hari', $request->hari)
            ->where('jam_mulai', '<=', $request->jam)
            ->where('jam_selesai', '>=', $request->jam)
            ->where('aktif', 1)
            ->get()
            ->map(function ($jadwal) {
                return [
                    'id' => $jadwal->dokter->id,
                    'nama' => $jadwal->dokter->nama,
                    'poli' => $jadwal->dokter->namapoli->nama ?? null,
                    'hari' => $jadwal->hari,
                    'jam_mulai' => $jadwal->jam_mulai,
                    'jam_selesai' => $jadwal->jam_selesai,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $dokter
        ]);
    }

    public function getHariList()
    {
        $hari = DokterJadwal::select('hari')
            ->distinct()
            ->orderBy('hari')
            ->pluck('hari');

        return response()->json([
            'success' => true,
            'data' => $hari
        ]);
    }

    public function getMasterData()
    {
        try {
            $pasien = Pasien::select('id', 'nama', 'no_rm', 'nik', 'no_bpjs')
                ->orderBy('nama', 'asc')
                ->limit(100) // Batasi untuk performa
                ->get();

            // Hanya ambil poli yang sudah dikonfigurasi di loket menggunakan relasi
            $poli = Poli::with('loket')
                ->whereHas('loket')
                ->get()
                ->map(function ($poli) {
                    return [
                        'id' => $poli->id,
                        'nama' => $poli->nama,
                        'kode' => $poli->kode,
                        'kode_loket' => $poli->loket->nama ?? null
                    ];
                });

            $penjamin = Penjamin::select('id', 'nama')->orderBy('nama', 'asc')->get();
            $dokter = Dokter::with('namauser:id,name')->get();

            return response()->json([
                'success' => true,
                'pasien' => $pasien,
                'poli' => $poli,
                'penjamin' => $penjamin,
                'dokter' => $dokter,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memuat data master: ' . $e->getMessage()
            ], 500);
        }
    }

    public function searchPasien(Request $request)
    {
        try {
            $search = $request->input('search', '');
            $limit = $request->input('limit', 20);

            $query = Pasien::select('id', 'nama', 'no_rm', 'nik', 'no_bpjs')
                ->orderBy('nama', 'asc');

            if (!empty($search)) {
                $query->where(function ($q) use ($search) {
                    $q->where('nama', 'like', '%' . $search . '%')
                        ->orWhere('no_rm', 'like', '%' . $search . '%')
                        ->orWhere('nik', 'like', '%' . $search . '%')
                        ->orWhere('no_bpjs', 'like', '%' . $search . '%');
                });
            }

            $pasien = $query->limit($limit)->get();

            return response()->json([
                'success' => true,
                'data' => $pasien
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mencari pasien: ' . $e->getMessage()
            ], 500);
        }
    }


    public function getByPoli($id, Request $request)
    {
        $datetime = $request->input('datetime'); // ex: 2025-04-16 00:30:00

        $dokter = dokter::where('poli', $id)
            ->whereHas('jadwal', function ($query) use ($datetime) {
                $query->where('start', '<=', $datetime)
                    ->where('end', '>=', $datetime);
            })
            ->with('namauser', 'namapoli', 'namastatuspegawai')
            ->get();

        return response()->json($dokter);
    }



    public function pendaftaranbatal(Request $request)
    {
        try {

            $pendaftaran = Pendaftaran::find($request->batalid_delete);

            // Pastikan data ditemukan
            if (!$pendaftaran) {
                return redirect()->back()->with('error', 'Pendaftaran tidak ditemukan.');
            }


            $datapendaftaran = $pendaftaran;

            $penjamin = Penjamin::find($datapendaftaran->Penjamin);
            // if ($penjamin->nama == 'BPJS') {

            //     $poli = poli::find($datapendaftaran->poli_id)->first();

            //     $databpjs = [
            //         "tanggalperiksa" => Carbon::parse($pendaftaran->tanggal_kujungan)->format('Y-m-d'),
            //         "kodepoli" => $poli->kode,
            //         "nomorkartu" => $datapendaftaran->pasien->no_bpjs,
            //         "alasan" => $request->alasanpembatalan,
            //     ];

            // $this->PcareController->delete_ws_antria_bpjs($databpjs);
            // }


            // Hapus pendaftaran langsung
            $datapendaftaran?->delete();

            // Hapus data pelayanan_statuses dan pelayanans yang terkait nomor_register ini
            if ($pendaftaran->nomor_register) {
                Pelayanan_status::where('nomor_register', $pendaftaran->nomor_register)->delete();
                Pelayanan::where('nomor_register', $pendaftaran->nomor_register)->delete();
            }

            return response()->json([
                'success' => true,
                'message' => 'Data pasien berhasil disimpan.'
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'errors' => $e->errors()
            ], 422);
        }
    }

    public function store(Request $request)
    {
        try {
            $request->validate([
                'pasien_id' => 'required|integer|exists:pasiens,id',
                'poli_id' => 'required|integer|exists:polis,id',
                'dokter_id' => 'required|integer|exists:dokters,id',
                'penjamin_id' => 'required|integer|exists:penjamins,id',
                'tanggal' => 'required|date',
                'jam' => 'required|string',
                'pasien_info' => 'required|array',
                'pasien_info.nama' => 'required|string',
                'pasien_info.no_rm' => 'required|string',
                'pasien_info.nik' => 'required|string',
            ]);

            // Ambil data pasien
            $pasien = Pasien::findOrFail($request->pasien_id);
            $poli = Poli::findOrFail($request->poli_id);
            $dokter = Dokter::findOrFail($request->dokter_id);
            $penjamin = Penjamin::findOrFail($request->penjamin_id);

            // Generate nomor register: RRR-KK-JJMM-DDMMYY
            $nomorRegister = $this->generateNomorRegister($request->tanggal, $request->jam, $pasien);

            // Generate nomor antrian
            $antrian = $this->generateAntrian($request->tanggal, $poli->id, $dokter->id);

            // Simpan data pendaftaran
            $pendaftaran = Pendaftaran::create([
                'nomor_register' => $nomorRegister,
                'tanggal_kujungan' => $request->tanggal . ' ' . $request->jam . ':00',
                'nomor_rm' => $pasien->no_rm,
                'antrian' => $antrian,
                'pasien_id' => $request->pasien_id,
                'poli_id' => $request->poli_id,
                'dokter_id' => $request->dokter_id,
                'Penjamin' => $request->penjamin_id,
            ]);

            // Simpan status kehadiran di pelayanan_statuses (0: belum hadir, 1: terdaftar, 2: hadir)
            Pelayanan_status::updateOrCreate(
                ['nomor_register' => $nomorRegister],
                [
                    'nomor_register' => $nomorRegister,
                    'pasien_id' => $request->pasien_id,
                    'tanggal_kujungan' => $request->tanggal . ' ' . $request->jam . ':00',
                    'status_daftar' => 1,
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Pendaftaran berhasil disimpan',
                'data' => [
                    'nomor_register' => $nomorRegister,
                    'antrian' => $antrian,
                ]
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error storing pendaftaran: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat menyimpan pendaftaran: ' . $e->getMessage()
            ], 500);
        }
    }

    private function generateNomorRegister($tanggal, $jam, $pasien)
    {
        $tanggalObj = Carbon::parse($tanggal);
        // Format menjadi 02092025 (ddmmyyyy)
        $tanggalStr = $tanggalObj->format('dmY');

        // Angka acak 3 digit (mulai 100)
        $angkaAcak = str_pad((string) random_int(100, 999), 3, '0', STR_PAD_LEFT);

        // Jam hadir HH (2 digit)
        $jamDigits = preg_replace('/[^0-9]/', '', (string) $jam);
        $jamhadir = str_pad(substr($jamDigits, 0, 2), 2, '0', STR_PAD_LEFT);

        // Kode kelamin: 01 laki, 02 perempuan (fallback 00 jika tidak diketahui)
        $kodeKelamin = '00';
        $seks = (string) ($pasien->seks ?? '');
        if ($seks === '1' || $seks === 'L' || strtolower($seks) === 'laki-laki') {
            $kodeKelamin = '01';
        } elseif ($seks === '2' || $seks === 'P' || strtolower($seks) === 'perempuan') {
            $kodeKelamin = '02';
        }

        return $angkaAcak . '-' . $kodeKelamin . $jamhadir . '-' . $tanggalStr;
    }

    private function generateAntrian($tanggal, $poliId, $dokterId)
    {
        // Ambil data loket berdasarkan poli_id
        $antrian = Loket::where('poli_id', $poliId)->first();
        if (!$antrian) {
            // Fallback jika tidak ada loket, gunakan format sederhana
            $today = Carbon::parse($tanggal);
            $last = Pendaftaran::where('poli_id', $poliId)
                ->where('dokter_id', $dokterId)
                ->whereDate('created_at', $today)
                ->orderBy('created_at', 'desc')
                ->first();
            $nextNumber = $last ? ((int) $last->antrian) + 1 : 1;
            return (string) $nextNumber;
        }

        $today = Carbon::parse($tanggal);
        $last = Pendaftaran::where('antrian', 'like', $antrian->nama . '-%')
            ->whereDate('created_at', $today)
            ->orderBy('created_at', 'desc')
            ->first();
        $nextNumber = $last ? ((int) str_replace($antrian->nama . '-', '', $last->antrian)) + 1 : 1;
        $antrianBaru = $antrian->nama . '-' . $nextNumber;
        
        return $antrianBaru;
    }

    public function getData()
    {
        try {
            $today = Carbon::today();

            // Ambil data pendaftaran hari ini (tanpa bergantung pada pendaftaran_statuses)
            $pendaftaran = Pendaftaran::with(['poli', 'dokter', 'pasien', 'penjamin'])
                ->whereDate('tanggal_kujungan', '=', $today)
                ->orderBy('created_at', 'desc')
                ->get();

            // Ambil status dari pelayanan_statuses dan map by nomor_register
            $registers = $pendaftaran->pluck('nomor_register')->filter()->values();
            $statusMap = \App\Models\Module\Pelayanan\Pelayanan_status::whereIn('nomor_register', $registers)
                ->get()->keyBy('nomor_register');

            // Bentuk array dengan field 'status' kompatibel untuk frontend (bukan relation Eloquent)
            $pendaftaran = $pendaftaran->map(function ($p) use ($statusMap) {
                $ps = $statusMap->get($p->nomor_register);
                // Pastikan default 1 diterapkan sebelum casting agar tidak menjadi 0 saat null
                $statusDaftar = (int) ((optional($ps)->status_daftar) ?? 1); // 1: terdaftar, 2: hadir
                $statusPerawat = (int)optional($ps)->status_perawat ?? 0; // 0/1/2 stage perawat

                // Mapping ke field lama:
                // - status_pendaftaran: gunakan status_daftar (1/2)
                // - status_panggil: 0=menunggu, 1=menunggu, 2=periksa, 3=selesai
                $statusPanggil = 0;
                if ($statusPerawat === 0) {
                    $statusPanggil = 0;
                } elseif ($statusPerawat === 1) {
                    $statusPanggil = 2;
                } elseif ($statusPerawat >= 2) {
                    $statusPanggil = 3;
                }

                $asArray = $p->toArray();
                $asArray['status'] = [
                    'id' => $p->id,
                    'status_pendaftaran' => $statusDaftar,
                    'status_panggil' => $statusPanggil,
                    'Status_aplikasi' => 1,
                ];
                return $asArray;
            });

            // Rekap dokter (kompatibel dengan item array hasil map di atas)
            $rekapDokter = $pendaftaran
                ->groupBy('dokter_id')
                ->map(function ($group) use ($statusMap) {
                    // Hitung dengan status_dokter: 0=menunggu, 3/4=dilayani (selesai)
                    $jumlahMenunggu = $group->filter(function ($item) use ($statusMap) {
                        $nr = $item['nomor_register'] ?? null;
                        $ps = $nr ? optional($statusMap->get($nr)) : null;
                        $sd = (int)optional($ps)->status_dokter ?? 0;
                        $status = $item['status'] ?? null; // berisi status_pendaftaran (1/2)
                        return $status && (int)($status['status_pendaftaran'] ?? 0) === 2 && $sd === 0;
                    })->count();

                    $jumlahDilayani = $group->filter(function ($item) use ($statusMap) {
                        $nr = $item['nomor_register'] ?? null;
                        $ps = $nr ? optional($statusMap->get($nr)) : null;
                        $sd = (int)optional($ps)->status_dokter ?? 0;
                        return in_array($sd, [3, 4], true);
                    })->count();

                    // Pasien aktif berdasarkan logika antrian lama (status_panggil == 2)
                    $pasienAktifQueue = $group->filter(function ($item) {
                        $status = $item['status'] ?? null;
                        return $status && (int)($status['status_panggil'] ?? 0) === 2;
                    })->sortBy('antrian')->first();

                    // Fallback: jika tidak terdeteksi dari antrian lama, gunakan status_dokter 1/2
                    $pasienAktifDokter = null;
                    if (!$pasienAktifQueue) {
                        $pasienAktifDokter = $group->filter(function ($item) use ($statusMap) {
                            $nr = $item['nomor_register'] ?? null;
                            $ps = $nr ? optional($statusMap->get($nr)) : null;
                            $sd = (int)optional($ps)->status_dokter ?? 0;
                            return in_array($sd, [1, 2], true);
                        })->sortBy('antrian')->first();
                    }

                    $aktif = $pasienAktifQueue ?: $pasienAktifDokter;
                    $noAntrian = $aktif ? ($aktif['antrian'] ?? '-') : '-';
                    $latest = $group->first();

                    $statusPeriksa = '-';
                    if ($latest && isset($latest['status'])) {
                        // Deteksi berdasarkan status lama (antrian)
                        $hasMenungguQueue = $group->contains(function ($item) {
                            $status = $item['status'] ?? null;
                            return $status && in_array((int)($status['status_panggil'] ?? 0), [0, 1]) && (int)($status['status_pendaftaran'] ?? 0) === 2;
                        });

                        // Sinkronkan dengan pelayanan_statuses.status_dokter
                        $hasDokterMelayani = $group->contains(function ($item) use ($statusMap) {
                            $nr = $item['nomor_register'] ?? null;
                            $ps = $nr ? optional($statusMap->get($nr)) : null;
                            $sd = (int)optional($ps)->status_dokter ?? 0;
                            return in_array($sd, [1, 2], true); // 1/2 = sedang melayani
                        });
                        $hasDokterMenunggu = !$hasDokterMelayani && $group->contains(function ($item) use ($statusMap) {
                            $nr = $item['nomor_register'] ?? null;
                            $ps = $nr ? optional($statusMap->get($nr)) : null;
                            $sd = (int)optional($ps)->status_dokter ?? 0;
                            return $sd === 0; // 0 = menunggu
                        });

                        // Prioritas penentuan:
                        // 1) Jika ada status_dokter 1/2 -> periksa (2)
                        // 2) Else jika ada yang menunggu (dari status_dokter=0 ATAU dari antrian lama) -> menunggu (1)
                        // 3) Else -> kosong (3) [status_dokter 3/4]
                        if ($hasDokterMelayani) {
                            $statusPeriksa = 2;
                        } elseif ($hasDokterMenunggu || $hasMenungguQueue) {
                            $statusPeriksa = 1;
                        } else {
                            $statusPeriksa = 3;
                        }
                    }

                    return (object) [
                        'dokter' => $latest['dokter'] ?? null,
                        'poli' => $latest['poli'] ?? null,
                        'menunggu' => $jumlahMenunggu,
                        'dilayani' => $jumlahDilayani,
                        'no_antrian' => $noAntrian,
                        'status_periksa' => $statusPeriksa
                    ];
                });

            // Statistics
            $totalTerdaftar = $pendaftaran->count();

            $jumlahDokter = $rekapDokter->count();
            $totalPasien = $rekapDokter->sum('menunggu') + $rekapDokter->sum('dilayani');
            $pasienSelesai = $rekapDokter->sum('dilayani');

            return response()->json([
                'success' => true,
                'data' => [
                    'pendaftaran' => $pendaftaran,
                    'rekap_dokter' => $rekapDokter->values(),
                    'statistics' => [
                        'total_terdaftar' => $totalTerdaftar,
                        'jumlah_dokter' => $jumlahDokter,
                        'total_pasien' => $totalPasien,
                        'pasien_selesai' => $pasienSelesai,
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error getting pendaftaran data: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal memuat data pendaftaran: ' . $e->getMessage()
            ], 500);
        }
    }

    public function updateDokter(Request $request)
    {
        try {
            $request->validate([
                'rubahdokter_id' => 'required|integer|exists:pendaftarans,id',
                'dokter_id_update' => 'required|integer|exists:dokters,id',
            ]);

            $pendaftaran = Pendaftaran::findOrFail($request->rubahdokter_id);
            $dokterBaru = Dokter::findOrFail($request->dokter_id_update);

            // Update dokter di pendaftaran
            $pendaftaran->update([
                'dokter_id' => $request->dokter_id_update
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Dokter berhasil diupdate'
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error updating dokter: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat mengupdate dokter: ' . $e->getMessage()
            ], 500);
        }
    }

    public function pendaftaranhadir(Request $request)
    {
        try {
            $pendaftaran = Pendaftaran::find($request->hadirid_delete);

            // Pastikan data ditemukan
            if (!$pendaftaran) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pendaftaran tidak ditemukan.'
                ], 404);
            }

            $datapendaftaran = $pendaftaran;

            if (!$datapendaftaran) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data pendaftaran tidak ditemukan.'
                ], 404);
            }

            // Buat atau update data pelayanan
            \App\Models\Module\Pelayanan::updateOrCreate([
                'nomor_rm' => $datapendaftaran->nomor_rm,
                'pasien_id' => $datapendaftaran->pasien_id,
                'nomor_register' => $datapendaftaran->nomor_register,
                'tanggal_kujungan' => $datapendaftaran->tanggal_kujungan,
                'poli_id' => $datapendaftaran->poli_id,
                'dokter_id' => $datapendaftaran->dokter_id,
            ]);

            // Ambil data penjamin
            $penjamin = Penjamin::find($datapendaftaran->Penjamin);
            
            // Ambil data pasien untuk so_perawat
            $pasien = \App\Models\Module\Pasien\Pasien::find($datapendaftaran->pasien_id);
            
            // Hitung umur dalam format "X Tahun Y Bulan Z Hari"
            $tanggalLahir = \Carbon\Carbon::parse($pasien->tanggal_lahir);
            $sekarang = \Carbon\Carbon::now();
            $umur = $tanggalLahir->diff($sekarang);
            $umurString = $umur->y . ' Tahun ' . $umur->m . ' Bulan ' . $umur->d . ' Hari';

            // Buat data so_perawat
            Pelayanan_So_Perawat::updateOrCreate([
                'no_rawat' => $datapendaftaran->nomor_register,
            ], [
                'nomor_rm' => $datapendaftaran->nomor_rm,
                'nama' => $pasien->nama,
                'no_rawat' => $datapendaftaran->nomor_register,
                'seks' => $pasien->seks,
                'penjamin' => $penjamin ? $penjamin->nama : 'Umum',
                'tanggal_lahir' => $pasien->tanggal_lahir,
                'umur' => $umurString,
                'user_input_id' => 1,
                'user_input_name' => 'System',
            ]);

            if ($penjamin && $penjamin->nama == 'BPJS') {
                // Logic untuk BPJS (dikomentari untuk sementara)
                $poli = Poli::where('id', $datapendaftaran->poli_id)->first();

                date_default_timezone_set('UTC');
                $Timestamp = strval(time() - strtotime('1970-01-01 00:00:00'));
                $newTimestamp = $Timestamp * 1000;

                $databpjs = [
                    "tanggalperiksa" => Carbon::parse($pendaftaran->tanggal_kujungan, 'Asia/Jakarta')->format('Y-m-d'),
                    "kodepoli" => $poli->kode,
                    "nomorkartu" => $datapendaftaran->pasien->no_bpjs,
                    "status" => 1,
                    "waktu" => $newTimestamp,
                ];

                // BPJS logic dikomentari untuk sementara
                // if((int)$pendaftaran->Status_aplikasi === 2){
                //     $this->PcareController->update_ws_antria_bpjs($databpjs);
                // }

                $pendaftaranpcare = [
                    "kdProviderPeserta" => $datapendaftaran->pasien->kodeprovide,
                    "tglDaftar" => Carbon::parse($pendaftaran->tanggal_kujungan, 'Asia/Jakarta')->format('d-m-Y'),
                    "noKartu" => $datapendaftaran->pasien->no_bpjs,
                    "kdPoli" => $poli->kode,
                    "keluhan" => null,
                    "kunjSakit" => true,
                    "sistole" => 0,
                    "diastole" => 0,
                    "beratBadan" => 0,
                    "tinggiBadan" => 0,
                    "respRate" => 0,
                    "lingkarPerut" => 0,
                    "heartRate" => 0,
                    "rujukBalik" => 0,
                    "kdTkp" => "10",
                ];

                // BPJS API calls dikomentari untuk sementara
                // try {
                //     $response = $this->PcareController->post_pendaftaran_bpjs($pendaftaranpcare);
                //     // ... rest of BPJS logic
                // } catch (\Exception $e) {
                //     Log::error('Gagal post_pendaftaran_bpjs: ' . $e->getMessage());
                // }
            }

            // Update status daftar di pelayanan_statuses: 2 (hadir)
            Pelayanan_status::updateOrCreate(
                ['nomor_register' => $datapendaftaran->nomor_register],
                [
                    'pasien_id' => $datapendaftaran->pasien_id,
                    'tanggal_kujungan' => $datapendaftaran->tanggal_kujungan,
                    'status_daftar' => 2,
                ]
            );

            return response()->json([
                'success' => true,
                'message' => 'Status kehadiran berhasil diupdate.'
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage()
            ], 500);
        }
    }
}
