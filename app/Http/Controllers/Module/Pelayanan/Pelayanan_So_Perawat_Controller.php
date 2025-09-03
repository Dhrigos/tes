<?php

namespace App\Http\Controllers\Module\Pelayanan;

use App\Http\Controllers\Controller;
use App\Models\Module\Pelayanan\Pelayanan;
use App\Models\Module\Pelayanan\Pelayanan_So_Perawat;
use App\Models\Module\Pelayanan\Pelayanan_status;
use App\Services\PelayananStatusService;
use App\Models\Module\SDM\Dokter;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Illuminate\Http\RedirectResponse;
use App\Models\Module\Pelayanan\Gcs\Gcs_Eye;
use App\Models\Module\Pelayanan\Gcs\Gcs_Verbal;
use App\Models\Module\Pelayanan\Gcs\Gcs_Motorik;
use App\Models\Module\Pelayanan\Gcs\Gcs_Kesadaran;

class Pelayanan_So_Perawat_Controller extends Controller
{
    /**
     * Display a listing of pelayanan data for perawat
     */
    public function index(): InertiaResponse
    {
        try {
            // Ambil daftar pelayanan HARI INI, join dengan SO Perawat untuk tentukan state tindakan
            $today = Carbon::today();
            
            // Untuk testing, ambil data dari beberapa hari terakhir
            $pelayanans = Pelayanan::with(['pasien', 'poli', 'dokter.namauser', 'pendaftaran.penjamin'])
                ->whereDate('tanggal_kujungan', '>=', $today->subDays(7))
                ->whereNotNull('dokter_id') // Pastikan ada dokter_id
                ->get()
                ->map(function ($pelayanan) {
                    // Get SO Perawat status
                    $soPerawat = Pelayanan_So_Perawat::where('no_rawat', $pelayanan->nomor_register)->first();
                    $ps = Pelayanan_status::where('nomor_register', $pelayanan->nomor_register)->first();
                    $statusDaftar = (int)($ps->status_daftar ?? 0);
                    $statusPerawat = (int)($ps->status_perawat ?? 0);
                    $statusDokter = (int)($ps->status_dokter ?? 0);

                    // Determine tindakan button based on status
                    $tindakanButton = 'panggil'; // default
                    if ($statusPerawat === 0) {
                        $tindakanButton = 'panggil';
                    } elseif ($statusPerawat === 1) {
                        $tindakanButton = 'soap';
                    } elseif ($statusPerawat === 2) {
                        $tindakanButton = $soPerawat ? 'edit' : 'soap';
                    }

                    return [
                        'id' => $pelayanan->id,
                        'nomor_rm' => $pelayanan->nomor_rm,
                        'nomor_register' => $pelayanan->nomor_register,
                        'tanggal_kujungan' => $pelayanan->tanggal_kujungan,
                        'poli_id' => $pelayanan->poli_id,
                        'dokter_id' => $pelayanan->dokter_id,
                        'tindakan_button' => $tindakanButton,
                        'status_daftar' => $statusDaftar,
                        'status_perawat' => $statusPerawat,
                        'status_dokter' => $statusDokter,
                        'pasien' => $pelayanan->pasien,
                        'poli' => $pelayanan->poli,
                        'dokter' => $pelayanan->dokter,
                        'pendaftaran' => $pelayanan->pendaftaran,
                    ];
                });

            // Logging dihapus

            // Jika tidak ada data hari ini, kembalikan array kosong
            if ($pelayanans->count() === 0) {
                $pelayanans = collect([]);
            }

            return Inertia::render('module/pelayanan/so-perawat/index', [
                'pelayanans' => $pelayanans,
            ]);
        } catch (\Exception $e) {
            return Inertia::render('module/pelayanan/so-perawat/index', [
                'pelayanans' => [],
                'errors' => ['error' => 'Gagal memuat data: ' . $e->getMessage()]
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

            $pelayanan = Pelayanan::with(['pasien', 'pendaftaran.penjamin'])->where('nomor_register', $nomor_register)->first();

            if (!$pelayanan) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data pelayanan tidak ditemukan'
                ], 404);
            }

            // Update status: hadir perawat (berbeda dengan hadir daftar di modul pendaftaran)
            Pelayanan_status::updateOrCreate(
                ['nomor_register' => $nomor_register],
                ['status_perawat' => 1]
            );

            return response()->json([
                'success' => true,
                'message' => 'Pasien berhasil ditandai hadir untuk pemeriksaan perawat'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menandai pasien hadir: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark patient as not present (tidak hadir)
     */
    public function tidakHadirPasien(Request $request, $norawat): JsonResponse
    {
        try {
            $nomor_register = base64_decode($norawat);

            $pelayanan = Pelayanan::with(['pasien', 'pendaftaran.penjamin'])->where('nomor_register', $nomor_register)->first();

            if (!$pelayanan) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data pelayanan tidak ditemukan'
                ], 404);
            }

            // Update status: tidak hadir perawat
            Pelayanan_status::updateOrCreate(
                ['nomor_register' => $nomor_register],
                ['status_perawat' => 0]
            );

            return response()->json([
                'success' => true,
                'message' => 'Pasien berhasil ditandai tidak hadir untuk pemeriksaan perawat'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menandai pasien tidak hadir: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the pemeriksaan page for a specific patient (unified create/edit)
     */
    public function show(Request $request, $norawat): InertiaResponse|RedirectResponse
    {
        try {
            $nomor_register = base64_decode($norawat);

            // Get patient data
            $pelayanan = Pelayanan::with(['pasien', 'pendaftaran.penjamin'])
                ->where('nomor_register', $nomor_register)
                ->first();

            // Get SO Perawat data (may be null for create mode)
            $soPerawat = Pelayanan_So_Perawat::where('no_rawat', $nomor_register)->first();

            // Cek status untuk guard masuk ke pemeriksaan perawat: daftar harus 2 dan perawat 0 atau 1
            $ps = Pelayanan_status::where('nomor_register', $nomor_register)->first();
            $statusDaftar = (int)($ps->status_daftar ?? 0);
            $statusPerawat = (int)($ps->status_perawat ?? 0);
            
            // Untuk testing, kita skip guard dulu
            // if ($statusDaftar < 2) {
            //     // Redirect kembali ke index dengan pesan untuk konfirmasi hadir daftar dahulu
            //     return redirect()
            //         ->route('pelayanan.so-perawat.index')
            //         ->with('error', 'Pasien belum konfirmasi hadir pada tahap pendaftaran');
            // }

            // If no patient data from database, use dummy data
            if (!$pelayanan) {
                $dummyPatientData = [
                    'nomor_rm' => 'DUM001',
                    'nama' => 'Pasien Dummy',
                    'nomor_register' => 'DUMREG001',
                    'jenis_kelamin' => 'Laki-laki',
                    'penjamin' => 'Umum',
                    'tanggal_lahir' => '1990-01-01',
                    'umur' => '35 Tahun'
                ];
                $patientData = $dummyPatientData;
            } else {
                // Calculate age
                $umur = ($pelayanan->pasien && $pelayanan->pasien->tanggal_lahir)
                    ? Carbon::parse($pelayanan->pasien->tanggal_lahir)->diffInYears(Carbon::now()) . ' Tahun'
                    : '0 Tahun';

                // Prepare patient data
                $patientData = [
                    'nomor_rm' => $pelayanan->nomor_rm,
                    'nama' => $pelayanan->pasien->nama ?? ($soPerawat->nama ?? ''),
                    'nomor_register' => $pelayanan->nomor_register,
                    'jenis_kelamin' => $pelayanan->pasien->seks ?? ($soPerawat->seks ?? ''),
                    'penjamin' => optional($pelayanan->pendaftaran->penjamin)->nama ?? ($soPerawat->penjamin ?? ''),
                    'tanggal_lahir' => $pelayanan->pasien->tanggal_lahir ?? ($soPerawat->tanggal_lahir ?? ''),
                    'umur' => $umur
                ];
            }

            // Get GCS data
            $gcsEye = Gcs_Eye::all();
            $gcsVerbal = Gcs_Verbal::all();
            $gcsMotorik = Gcs_Motorik::all();
            $gcsKesadaran = Gcs_Kesadaran::all();

            // Get HTT data
            $httPemeriksaan = \App\Models\Module\Master\Data\Medis\Htt_Pemeriksaan::with('htt_subpemeriksaans')->get();

            // Get Alergi data
            $alergiData = \App\Models\Module\Master\Data\Medis\Alergi::all();
            
            // Fallback: try direct database query if model fails
            if ($alergiData->isEmpty()) {
                try {
                    $alergiData = DB::table('alergi')->get();
                } catch (\Exception $e) {
                    // silent
                }
            }
            
            // Logging debug alergi dihapus

            // Logging kirim data dihapus

            return Inertia::render('module/pelayanan/so-perawat/pemeriksaan', [
                'pelayanan' => $patientData,
                'so_perawat' => $soPerawat, // null for create mode, data for edit mode
                'gsc_eye' => $gcsEye,
                'gcs_verbal' => $gcsVerbal,
                'gcs_motorik' => $gcsMotorik,
                'gcs_kesadaran' => $gcsKesadaran,
                'htt_pemeriksaan' => $httPemeriksaan,
                'alergi_data' => $alergiData,
                'norawat' => $norawat
            ]);
        } catch (\Exception $e) {
            return Inertia::render('module/pelayanan/so-perawat/pemeriksaan', [
                'errors' => ['error' => 'Gagal memuat data pemeriksaan: ' . $e->getMessage()]
            ]);
        }
    }

    /**
     * Store new SO Perawat data
     */
    public function store(Request $request): RedirectResponse
    {
        try {
            $validated = $request->validate([
                'no_rawat' => 'nullable|string',
                'nomor_rm' => 'nullable|string',
                'nama' => 'nullable|string',
                'seks' => 'nullable|string',
                'penjamin' => 'nullable|string',
                'tanggal_lahir' => 'nullable|string',
                'umur' => 'nullable|string',
                'sistol' => 'nullable|string',
                'distol' => 'nullable|string',
                'tensi' => 'nullable|string',
                'suhu' => 'nullable|string',
                'nadi' => 'nullable|string',
                'rr' => 'nullable|string',
                'tinggi' => 'nullable|string',
                'berat' => 'nullable|string',
                'spo2' => 'nullable|string',
                'lingkar_perut' => 'nullable|string',
                'nilai_bmi' => 'nullable|string',
                'status_bmi' => 'nullable|string',
                'jenis_alergi' => 'nullable|string',
                'alergi' => 'nullable|string',
                'eye' => 'nullable|string',
                'verbal' => 'nullable|string',
                'motorik' => 'nullable|string',
                'kesadaran' => 'nullable|string',
                'summernote' => 'nullable|string',
                'tableData' => 'nullable|string',
                'files' => 'nullable',
            ]);


            // If tensi empty but sistol/distol present, compose it
            if ((empty($validated['tensi']) || $validated['tensi'] === null)
                && !empty($validated['sistol']) && !empty($validated['distol'])) {
                $validated['tensi'] = $validated['sistol'] . '/' . $validated['distol'];
            }

            // Normalize tableData JSON string to array (follow SIMRS behavior)
            if (!empty($validated['tableData']) && is_string($validated['tableData'])) {
                $decoded = json_decode($validated['tableData'], true);
                $validated['tableData'] = is_array($decoded) ? $decoded : [];
            }

            // Create new SO Perawat record
            Pelayanan_So_Perawat::create($validated);


            if (!empty($validated['no_rawat'])) {
                app(PelayananStatusService::class)->tandaiPerawatSelesai($validated['no_rawat']);
            }

            return redirect()
                ->route('pelayanan.so-perawat.index')
                ->with('success', 'SO Perawat berhasil disimpan');
        } catch (\Exception $e) {
            return redirect()
                ->back()
                ->with('error', 'Gagal menyimpan SO Perawat: ' . $e->getMessage());
        }
    }

    /**
     * Update SO Perawat data
     */
    public function update(Request $request, string $norawat): RedirectResponse
    {
        try {
            $nomor_register = base64_decode($norawat);

            $validated = $request->validate([
                'no_rawat' => 'nullable|string',
                'nomor_rm' => 'nullable|string',
                'nama' => 'nullable|string',
                'seks' => 'nullable|string',
                'penjamin' => 'nullable|string',
                'tanggal_lahir' => 'nullable|string',
                'umur' => 'nullable|string',
                'sistol' => 'nullable|string',
                'distol' => 'nullable|string',
                'tensi' => 'nullable|string',
                'suhu' => 'nullable|string',
                'nadi' => 'nullable|string',
                'rr' => 'nullable|string',
                'tinggi' => 'nullable|string',
                'berat' => 'nullable|string',
                'spo2' => 'nullable|string',
                'lingkar_perut' => 'nullable|string',
                'nilai_bmi' => 'nullable|string',
                'status_bmi' => 'nullable|string',
                'jenis_alergi' => 'nullable|string',
                'alergi' => 'nullable|string',
                'eye' => 'nullable|string',
                'verbal' => 'nullable|string',
                'motorik' => 'nullable|string',
                'kesadaran' => 'nullable|string',
                'summernote' => 'nullable|string',
                'tableData' => 'nullable|string',
                'files' => 'nullable',
            ]);

            $so = Pelayanan_So_Perawat::where('no_rawat', $nomor_register)->first();
            if (!$so) {
                return redirect()
                    ->route('pelayanan.so-perawat.index')
                    ->with('error', 'Data SO Perawat tidak ditemukan');
            }


            // If tensi empty but sistol/distol present, compose it
            if ((empty($validated['tensi']) || $validated['tensi'] === null)
                && !empty($validated['sistol']) && !empty($validated['distol'])) {
                $validated['tensi'] = $validated['sistol'] . '/' . $validated['distol'];
            }

            // Normalize tableData JSON string to array
            if (!empty($validated['tableData']) && is_string($validated['tableData'])) {
                $decoded = json_decode($validated['tableData'], true);
                $validated['tableData'] = is_array($decoded) ? $decoded : [];
            }

            $so->update($validated);

            // Setelah pemeriksaan perawat disimpan, set perawat=2; dokter tetap 0 menunggu hadir dokter
            app(PelayananStatusService::class)->tandaiPerawatSelesai($nomor_register);

            return redirect()
                ->route('pelayanan.so-perawat.index')
                ->with('success', 'SO Perawat berhasil diperbarui');
        } catch (\Exception $e) {
            return redirect()
                ->back()
                ->with('error', 'Gagal memperbarui SO Perawat: ' . $e->getMessage());
        }
    }

    /**
     * Edit SO Perawat data for a specific patient
     */
    public function edit(Request $request, string $norawat): InertiaResponse
    {
        return $this->show($request, $norawat);
    }
}
