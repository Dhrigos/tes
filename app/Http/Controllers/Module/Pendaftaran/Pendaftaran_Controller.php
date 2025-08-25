<?php

namespace App\Http\Controllers\Module\Pendaftaran;

use App\Http\Controllers\Controller;
use App\Models\Module\Pasien\Pasien;
use App\Models\Module\Master\Data\Medis\Poli;
use App\Models\Module\Pemdaftaran\Pendaftaran;
use App\Models\Module\Pemdaftaran\Pendaftaran_status;
use App\Models\Module\Master\Data\Umum\Penjamin;
use App\Models\Module\SDM\Dokter;
use App\Models\Module\Master\Data\Umum\Loket;

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

    public function pendaftaranadd(Request $request)
    {
        try {
            $data = $request->validate([
                'pasien' => 'required',
                'poli_id' => 'required',
                'tanggal_kunjungan' => 'required',
                'dokter_id' => 'required',
                'penjamin_id' => 'required',
            ]);

            $pasien = Pasien::find($request->pasien);
            if (!$pasien) {
                return response()->json(['error' => 'Pasien tidak ditemukan'], 404);
            }

            $tanggal = Carbon::parse($request->tanggal_kunjungan);
            $tanggalKode = $tanggal->format('y') . str_pad($tanggal->dayOfYear, 3, '0', STR_PAD_LEFT);
            $angkaAcak = mt_rand(1000, 9999);
            $no_registrasi = $angkaAcak . '-' . $tanggalKode;

            $antrian = Loket::where('poli_id', $request->poli_id)->first();
            if (!$antrian) {
                return response()->json(['error' => 'Loket tidak ditemukan untuk poli ini'], 404);
            }

            $today = Carbon::today();
            $last = Pendaftaran::where('antrian', 'like', $antrian->nama . '-%')
                ->whereDate('created_at', $today)
                ->orderBy('created_at', 'desc')
                ->first();
            $nextNumber = $last ? ((int) str_replace($antrian->nama . '-', '', $last->antrian)) + 1 : 1;
            $antrianBaru = $antrian->nama . '-' . $nextNumber;

            // Simpan ke database
            $pendaftaran = Pendaftaran::create([
                'nomor_rm' => $pasien->no_rm,
                'pasien_id' => $request->pasien,
                'poli_id' => $request->poli_id,
                'tanggal_kujungan' => $request->tanggal_kunjungan,
                'dokter_id' => $request->dokter_id,
                'Penjamin' => $request->penjamin_id,
                'nomor_register' => $no_registrasi,
                'antrian' => $antrianBaru,
            ]);

            Pendaftaran_status::create([
                'nomor_rm' => $pasien->no_rm,
                'pasien_id' => $request->pasien,
                'nomor_register' => $no_registrasi,
                'tanggal_kujungan' => $request->tanggal_kunjungan,
                'register_id' => $pendaftaran->id,
                'status_panggil' => 0,
                'status_pendaftaran' => 1,
                'Status_aplikasi' => 1,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Pasien berhasil didaftarkan.',
                'noantrian' => $antrianBaru,
                'data' => $data
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Terjadi kesalahan pada server',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function pendaftaranbatal(Request $request)
    {
        try {

            $pendaftaran = Pendaftaran_status::find($request->batalid_delete);

            // Pastikan data ditemukan
            if (!$pendaftaran) {
                return redirect()->back()->with('error', 'Pendaftaran tidak ditemukan.');
            }


            $datapendaftaran = Pendaftaran::where('nomor_register', $pendaftaran->nomor_register)
                ->where('tanggal_kujungan', $pendaftaran->tanggal_kujungan)
                ->first();

            $penjamin = penjamin::find($datapendaftaran->Penjamin);
            if ($penjamin->nama == 'BPJS') {

                $poli = poli::find($datapendaftaran->poli_id)->first();

                $databpjs = [
                    "tanggalperiksa" => Carbon::parse($pendaftaran->tanggal_kunjungan)->format('Y-m-d'),
                    "kodepoli" => $poli->kode,
                    "nomorkartu" => $datapendaftaran->pasien->no_bpjs,
                    "alasan" => $request->alasanpembatalan,
                ];

                // $this->PcareController->delete_ws_antria_bpjs($databpjs); harus buat controller pcare full??
            }


           $pemeriksaan = Pendaftaran::where('nomor_register', $pendaftaran->nomor_register)
                ->where('tanggal_kujungan', $pendaftaran->tanggal_kujungan)
                ->where('pasien_id', $pendaftaran->pasien_id)
                ->first();

            if ($pemeriksaan) {
                // Hapus status terkait
                $pemeriksaan->status()?->delete();

                // Hapus pendaftaran
                $pemeriksaan->delete();
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
}
