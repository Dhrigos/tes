<?php

namespace App\Http\Controllers\Module\Pelayanan;

use App\Http\Controllers\Controller;
use App\Models\Module\Pelayanan\Pelayanan;
use App\Models\Module\Pelayanan\Pelayanan_status;
use App\Models\Module\SDM\Dokter;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Illuminate\Http\RedirectResponse;
use App\Models\Module\Pelayanan\Gcs\Gcs_Eye;
use App\Models\Module\Pelayanan\Gcs\Gcs_Verbal;
use App\Models\Module\Pelayanan\Gcs\Gcs_Motorik;
use App\Models\Module\Pelayanan\Gcs\Gcs_Kesadaran;

class PelayananController extends Controller
{
    /**
     * Display a listing of pelayanan data (general)
     */
    public function index(): InertiaResponse
    {
        try {
            $today = Carbon::today();
            $pelayanans = Pelayanan::with(['pasien', 'poli', 'dokter.namauser', 'pendaftaran.penjamin'])
                ->whereDate('tanggal_kujungan', '=', $today)
                ->orderBy('created_at', 'desc')
                ->get()
                ->unique('nomor_register')
                ->values();

            return Inertia::render('module/pelayanan/index', [
                'pelayanans' => $pelayanans,
            ]);
        } catch (\Exception $e) {
            return Inertia::render('module/pelayanan/index', [
                'pelayanans' => [],
                'errors' => ['error' => 'Gagal memuat data: ' . $e->getMessage()]
            ]);
        }
    }

    /**
     * Get dokter by poli for dropdown selection
     */
    public function getDokterByPoli(Request $request): JsonResponse
    {
        try {
            $poliId = $request->get('poli_id');
            $hari = $request->get('hari');

            $query = Dokter::with('namauser')
                ->where('poli_id', $poliId)
                ->where('aktif', 1);

            if (!empty($hari)) {
                $query->whereRaw('LOWER(hari) = ?', [strtolower($hari)]);
            }

            $dokters = $query->get();

            return response()->json($dokters);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data dokter: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update dokter for a specific patient
     */
    public function updateDokter(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'nomor_register' => 'required|string',
                'dokter_id' => 'required|integer',
            ]);

            $pelayanan = Pelayanan::where('nomor_register', $validated['nomor_register'])->first();
            if (!$pelayanan) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data pelayanan tidak ditemukan'
                ], 404);
            }

            $pelayanan->update([
                'dokter_id' => $validated['dokter_id'],
                'user_update_id' => Auth::id() ?? 1,
                'user_update_name' => Auth::user()->name ?? 'System',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Dokter berhasil diperbarui'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui dokter: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show SOAP Dokter page (redirects to SOAP Dokter Controller)
     */
    public function show(Request $request, $norawat): RedirectResponse
    {
        return redirect()->route('pelayanan.soap-dokter.show', $norawat);
    }

    /**
     * Edit SOAP Dokter page (redirects to SOAP Dokter Controller)
     */
    public function edit(Request $request, string $norawat): RedirectResponse
    {
        return redirect()->route('pelayanan.soap-dokter.edit', $norawat);
    }

    /**
     * Store SOAP Dokter data (redirects to SOAP Dokter Controller)
     */
    public function store(Request $request): RedirectResponse
    {
        return redirect()->route('pelayanan.soap-dokter.store');
    }

    /**
     * Update SOAP Dokter data (redirects to SOAP Dokter Controller)
     */
    public function update(Request $request, string $norawat): RedirectResponse
    {
        return redirect()->route('pelayanan.soap-dokter.update', $norawat);
    }

}
