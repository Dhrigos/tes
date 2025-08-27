<?php

namespace App\Http\Controllers\Module\Pelayanan;

use App\Http\Controllers\Controller;
use App\Models\Module\Pelayanan\Pelayanan;
use App\Models\Module\Pelayanan\Pelayanan_So_Perawat;
use App\Models\Module\SDM\Dokter;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class PelayananController extends Controller
{
    /**
     * Display a listing of pelayanan data for perawat
     */
    public function index(): InertiaResponse
    {
        try {
            $pelayanan = Pelayanan::with([
                'pasien',
                'poli', 
                'dokter.namauser',
                'pendaftaran',
                'pelayanan_so'
            ])->get();

            // Add tindakan_button logic
            $pelayanan = $pelayanan->map(function ($item) {
                $soPerawat = $item->pelayanan_so->first();
                
                if (!$soPerawat) {
                    $item->tindakan_button = 'panggil';
                } elseif ($soPerawat && !$item->pelayanan_soap->count()) {
                    $item->tindakan_button = 'soap';
                } elseif ($item->pelayanan_soap->count() && !$item->icd) {
                    $item->tindakan_button = 'edit';
                } else {
                    $item->tindakan_button = 'Complete';
                }

                return $item;
            });

            return Inertia::render('module/pelayanan/so-perawat/index', [
                'pelayanan' => $pelayanan
            ]);
        } catch (\Exception $e) {
            return Inertia::render('module/pelayanan/so-perawat/index', [
                'pelayanan' => [],
                'errors' => [
                    'error' => 'Gagal mengambil data pelayanan: ' . $e->getMessage()
                ]
            ]);
        }
    }

    /**
     * Mark patient as present (hadir)
     */
    public function hadirPasien(Request $request, $norawat): JsonResponse
    {
        try {
            $nomor_register = base64_decode($norawat);
            
            $pelayanan = Pelayanan::where('nomor_register', $nomor_register)->first();
            
            if (!$pelayanan) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data pelayanan tidak ditemukan'
                ], 404);
            }

            // Check if SO Perawat already exists
            $existingSo = Pelayanan_So_Perawat::where('no_rawat', $nomor_register)->first();
            
            if ($existingSo) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pasien sudah dipanggil sebelumnya'
                ], 400);
            }

            // Create initial SO Perawat record
            Pelayanan_So_Perawat::create([
                'nomor_rm' => $pelayanan->nomor_rm,
                'nama' => $pelayanan->pasien->nama,
                'no_rawat' => $nomor_register,
                'seks' => $pelayanan->pasien->jenis_kelamin ?? 'L',
                'penjamin' => $pelayanan->pendaftaran->penjamin ?? 'Umum',
                'tanggal_lahir' => $pelayanan->pasien->tanggal_lahir,
                'umur' => $pelayanan->pasien->umur ?? '0',
                'user_input_id' => Auth::id() ?? 1,
                'user_input_name' => Auth::user()->name ?? 'System',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Pasien berhasil dipanggil dan siap untuk pemeriksaan'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memanggil pasien: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update dokter for pelayanan
     */
    public function updateDokter(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'rubahdokter_id' => 'required|exists:pelayanans,id',
                'dokter_id_update' => 'required|exists:dokters,id',
            ]);

            $pelayanan = Pelayanan::find($request->rubahdokter_id);
            $pelayanan->dokter_id = $request->dokter_id_update;
            $pelayanan->save();

            return response()->json([
                'success' => true,
                'message' => 'Dokter berhasil diupdate'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengupdate dokter: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get dokter by poli and datetime
     */
    public function getDokterByPoli(Request $request, $poliId): JsonResponse
    {
        try {
            $datetime = $request->get('datetime');
            
            $dokters = Dokter::with('namauser')
                ->whereHas('jadwal', function ($query) use ($poliId, $datetime) {
                    $query->where('poli_id', $poliId);
                    if ($datetime) {
                        $date = Carbon::parse($datetime);
                        $dayOfWeek = $date->dayOfWeek; // 0 = Sunday, 1 = Monday, etc.
                        $query->where('hari', $dayOfWeek);
                    }
                })
                ->get();

            return response()->json($dokters);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data dokter: ' . $e->getMessage()
            ], 500);
        }
    }
}
