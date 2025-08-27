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
use Illuminate\Support\Facades\Log;
use App\Models\Module\pelayanan;

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


        // 🔹 Ambil semua pasien
    public function getPasienList()
    {
        $pasien = Pasien::select('id', 'nama', 'no_rm')->get();

        return response()->json([
            'success' => true,
            'data' => $pasien
        ]);
    }

    // 🔹 Ambil semua poli
    public function getPoliList()
    {
        $poli = Poli::select('id', 'nama')->get();

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

    // 🔹 Ambil dokter berdasarkan poli + filter jadwal aktif
    public function getDokterByPoli(Request $request)
    {
        $request->validate([
            'poli_id' => 'required|integer',
            'tanggal' => 'nullable|date',
        ]);

        $tanggal = $request->tanggal ?? now()->toDateString();

        $dokter = Dokter::where('poli', $request->poli_id)
            ->whereHas('jadwal', function ($query) use ($tanggal) {
                $query->whereDate('start', $tanggal);
            })
            ->with('namauser:id,name') // ambil nama dari tabel users
            ->get();

        return response()->json([
            'success' => true,
            'data' => $dokter
        ]);
    }

    public function getMasterData()
{
    return response()->json([
        'pasien'   => Pasien::select('id','nama','no_rm')->get(),
        'poli'     => Poli::select('id','nama')->get(),
        'penjamin' => Penjamin::select('id','nama')->get(),
        'dokter'   => Dokter::with('namauser:id,name')->get(),
    ]);
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

            $pendaftaran = Pendaftaran_status::find($request->batalid_delete);

            // Pastikan data ditemukan
            if (!$pendaftaran) {
                return redirect()->back()->with('error', 'Pendaftaran tidak ditemukan.');
            }


            $datapendaftaran = Pendaftaran::where('nomor_register', $pendaftaran->nomor_register)
                ->where('tanggal_kujungan', $pendaftaran->tanggal_kujungan)
                ->first();

            $penjamin = penjamin::find($datapendaftaran->Penjamin);
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

    public function pendaftaranhadir(Request $request)
    {
        try {

            $pendaftaran = Pendaftaran_status::find($request->hadirid_delete);

            // Pastikan data ditemukan
            if (!$pendaftaran) {
                return redirect()->back()->with('error', 'Pendaftaran tidak ditemukan.');
            }

            $datapendaftaran = Pendaftaran::where('nomor_register', $pendaftaran->nomor_register)
                ->where('tanggal_kujungan', $pendaftaran->tanggal_kujungan)
                ->first();

            pelayanan::updateOrCreate([
                'nomor_rm' => $datapendaftaran->nomor_rm,
                'pasien_id' => $datapendaftaran->pasien_id,
                'nomor_register' => $datapendaftaran->nomor_register,
                'tanggal_kujungan' => $datapendaftaran->tanggal_kujungan,
                'poli_id' => $datapendaftaran->poli_id,
                'dokter_id' => $datapendaftaran->dokter_id,
            ]);

            $penjamin = penjamin::find($datapendaftaran->Penjamin);

            if ($penjamin->nama == 'BPJS') {

                $poli = poli::where('id', $datapendaftaran->poli_id)->first();


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

                // try {
                //     $response = $this->PcareController->post_pendaftaran_bpjs($pendaftaranpcare);

                //     if (in_array((int)$response->getStatusCode(), [200, 201])) {
                //         $data = json_decode($response->getContent(), true);

                //         if (isset($data['data']['message'])) {
                //             $no_urut = $data['data']['message'];

                //             $pendaftaran_nourut = Pendaftaran::where('nomor_register', $pendaftaran->nomor_register)
                //                 ->first();

                //             Log::info('Data pendaftaran_nourut dan no_urut', [
                //                 'pendaftaran_nourut' => $pendaftaran_nourut,
                //                 'no_urut' => $no_urut
                //             ]);

                //             if ($pendaftaran_nourut) {
                //                 $pendaftaran_nourut->update([
                //                     'no_urut' => $no_urut
                //                 ]);
                //                 // Update status_pendaftaran jika sukses
                //                 $pendaftaran->update([
                //                     'status_pendaftaran' => 2
                //                 ]);
                //             } else {
                //                 Log::warning('Data pendaftaran tidak ditemukan untuk update no_urut', [
                //                     'nomor_register' => $pendaftaran->nomor_register,
                //                     'tanggal_kujungan' => $pendaftaran->tanggal_kujungan
                //                 ]);
                //             }
                //         } else {
                //             Log::warning('Pcare response tidak memiliki message.', $data);
                //             return response()->json([
                //                 'success' => false,
                //                 'message' => 'Pendaftaran gagal: response dari BPJS tidak valid.'
                //             ], 500);
                //         }
                //     } else {
                //         return response()->json([
                //             'success' => false,
                //             'message' => 'Gagal mendaftarkan ke BPJS. Status: ' . $response->getStatusCode()
                //         ], 500);
                //     }

                // }
                // catch (\Exception $e) {
                //     Log::error('Gagal post_pendaftaran_bpjs: ' . $e->getMessage());
                // }

            } else {
                // Perbarui status_pendaftaran menjadi 0 (batal)
                $pendaftaran->status_pendaftaran = 2;
                $pendaftaran->save();
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
