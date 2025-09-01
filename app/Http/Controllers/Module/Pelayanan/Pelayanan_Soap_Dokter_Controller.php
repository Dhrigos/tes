<?php

namespace App\Http\Controllers\Module\Pelayanan;

use App\Http\Controllers\Controller;
use App\Models\Module\Pelayanan\Pelayanan;
use App\Models\Module\Pelayanan\Pelayanan_Soap_Dokter;
use App\Models\Module\Pelayanan\Pelayanan_Soap_Dokter_Obat;
use App\Models\Module\Pelayanan\Pelayanan_Soap_Dokter_Icd;
use App\Models\Module\Pelayanan\Pelayanan_Soap_Dokter_Tindakan;
use App\Models\Module\Pelayanan\Gcs\Gcs_Eye;
use App\Models\Module\Pelayanan\Gcs\Gcs_Verbal;
use App\Models\Module\Pelayanan\Gcs\Gcs_Motorik;
use App\Models\Module\Pelayanan\Gcs\Gcs_Kesadaran;
use App\Models\Module\Master\Data\Medis\Htt_Pemeriksaan;
use App\Models\Module\Master\Data\Medis\Icd10;
use App\Models\Module\Master\Data\Medis\Icd9;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\Module\Pemdaftaran\Pendaftaran;
use App\Models\Module\Pemdaftaran\Pendaftaran_status;

class Pelayanan_Soap_Dokter_Controller extends Controller
{
    /**
     * Display a listing of SOAP dokter data
     */
    public function index(): InertiaResponse
    {
        try {
            // Untuk saat ini menggunakan dummy data
            // Nantinya akan diambil dari database
            $dummyData = [
                [
                    'id' => 1,
                    'nomor_rm' => '000001',
                    'nomor_register' => 'REG001',
                    'tanggal_kunjungan' => '2025-08-28',
                    'poli_id' => 1,
                    'dokter_id' => 1,
                    'tindakan_button' => 'panggil',
                    'pasien' => ['nama' => 'Budi Santoso'],
                    'poli' => ['nama' => 'Poli Umum'],
                    'dokter' => [
                        'id' => 1,
                        'namauser' => ['name' => 'Dr. Ahmad'],
                    ],
                    'pendaftaran' => ['antrian' => 'A01'],
                ],
                [
                    'id' => 2,
                    'nomor_rm' => '000002',
                    'nomor_register' => 'REG002',
                    'tanggal_kunjungan' => '2025-08-28',
                    'poli_id' => 2,
                    'dokter_id' => 2,
                    'tindakan_button' => 'soap',
                    'pasien' => ['nama' => 'Citra Lestari'],
                    'poli' => ['nama' => 'Poli Gigi'],
                    'dokter' => [
                        'id' => 2,
                        'namauser' => ['name' => 'Dr. Anisa'],
                    ],
                    'pendaftaran' => ['antrian' => 'B02'],
                ],
                [
                    'id' => 3,
                    'nomor_rm' => '000003',
                    'nomor_register' => 'REG003',
                    'tanggal_kunjungan' => '2025-08-28',
                    'poli_id' => 1,
                    'dokter_id' => 1,
                    'tindakan_button' => 'edit',
                    'pasien' => ['nama' => 'Dewi Anggraini'],
                    'poli' => ['nama' => 'Poli Umum'],
                    'dokter' => [
                        'id' => 1,
                        'namauser' => ['name' => 'Dr. Ahmad'],
                    ],
                    'pendaftaran' => ['antrian' => 'A03'],
                ],
                [
                    'id' => 4,
                    'nomor_rm' => '000004',
                    'nomor_register' => 'REG004',
                    'tanggal_kunjungan' => '2025-08-28',
                    'poli_id' => 3,
                    'dokter_id' => 3,
                    'tindakan_button' => 'Complete',
                    'pasien' => ['nama' => 'Eko Prasetyo'],
                    'poli' => ['nama' => 'Poli Anak'],
                    'dokter' => [
                        'id' => 3,
                        'namauser' => ['name' => 'Dr. Budi'],
                    ],
                    'pendaftaran' => ['antrian' => 'C01'],
                ],
            ];

            return Inertia::render('module/pelayanan/soap-dokter/index', [
                'pelayanan' => $dummyData
            ]);
        } catch (\Exception $e) {
            return Inertia::render('module/pelayanan/soap-dokter/index', [
                'pelayanan' => [],
                'errors' => [
                    'error' => 'Gagal mengambil data pelayanan: ' . $e->getMessage()
                ]
            ]);
        }
    }

    /**
     * Display the SOAP dokter page for a specific patient
     */
    public function show(Request $request, $norawat): InertiaResponse
    {
        try {
            $nomor_register = base64_decode($norawat);
            Log::info('SOAP Dokter Show - Norawat: ' . $norawat . ', Decoded: ' . $nomor_register);

            // Get patient data
            $pelayanan = Pelayanan::with(['pasien', 'pendaftaran.penjamin'])
                ->where('nomor_register', $nomor_register)
                ->first();

            // Get SOAP dokter data (may be null for create mode)
            $soapDokter = Pelayanan_Soap_Dokter::where('no_rawat', $nomor_register)->first();

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
                    'nama' => $pelayanan->pasien->nama ?? ($soapDokter->nama ?? ''),
                    'nomor_register' => $pelayanan->nomor_register,
                    'jenis_kelamin' => $pelayanan->pasien->seks ?? ($soapDokter->seks ?? ''),
                    'penjamin' => optional($pelayanan->pendaftaran->penjamin)->nama ?? ($soapDokter->penjamin ?? ''),
                    'tanggal_lahir' => $pelayanan->pasien->tanggal_lahir ?? ($soapDokter->tanggal_lahir ?? ''),
                    'umur' => $umur
                ];
            }

            // Get related data
            $gcsEye = Gcs_Eye::all();
            $gcsVerbal = Gcs_Verbal::all();
            $gcsMotorik = Gcs_Motorik::all();
            $gcsKesadaran = Gcs_Kesadaran::all();

            // Get HTT data
            $httPemeriksaan = Htt_Pemeriksaan::with('htt_subpemeriksaans')->get();

            // Get ICD data
            $icd10 = Icd10::all();
            $icd9 = Icd9::all();

            Log::info('SOAP Dokter Show - About to render view with data', [
                'patient_data' => $patientData,
                'soap_dokter_exists' => $soapDokter ? true : false,
                'norawat' => $norawat
            ]);

            return Inertia::render('module/pelayanan/soap-dokter/pemeriksaan', [
                'pelayanan' => $patientData,
                'soap_dokter' => $soapDokter, // null for create mode, data for edit mode
                'gcs_eye' => $gcsEye,
                'gcs_verbal' => $gcsVerbal,
                'gcs_motorik' => $gcsMotorik,
                'gcs_kesadaran' => $gcsKesadaran,
                'htt_pemeriksaan' => $httPemeriksaan,
                'icd10' => $icd10,
                'icd9' => $icd9,
                'norawat' => $norawat
            ]);
        } catch (\Exception $e) {
            return Inertia::render('module/pelayanan/soap-dokter/index', [
                'pelayanan' => [],
                'flash' => ['error' => 'Gagal memuat data pemeriksaan: ' . $e->getMessage()]
            ]);
        }
    }

    /**
     * Store new SOAP dokter data
     */
    public function store(Request $request): RedirectResponse
    {
        try {
            $validated = $request->validate([
                'no_rawat' => 'required|string',
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
                'htt' => 'nullable|string',
                'anamnesa' => 'nullable|string',
                'assesmen' => 'nullable|string',
                'expertise' => 'nullable|string',
                'evaluasi' => 'nullable|string',
                'plan' => 'nullable|string',
                'tableData' => 'nullable|array',
            ]);

            // Fill Auth info
            $validated['user_input_id'] = Auth::id() ?? 1;
            $validated['user_input_name'] = Auth::user()->name ?? 'System';

            // If tensi empty but sistol/distol present, compose it
            if ((empty($validated['tensi']) || $validated['tensi'] === null)
                && !empty($validated['sistol']) && !empty($validated['distol'])
            ) {
                $validated['tensi'] = $validated['sistol'] . '/' . $validated['distol'];
            }

            // Create new SOAP dokter record
            Pelayanan_Soap_Dokter::create($validated);

            return redirect()
                ->route('pelayanan.so-dokter.index')
                ->with('success', 'SOAP Dokter berhasil disimpan');
        } catch (\Exception $e) {
            return redirect()
                ->back()
                ->with('error', 'Gagal menyimpan SOAP Dokter: ' . $e->getMessage());
        }
    }

    /**
     * Update SOAP dokter data
     */
    public function update(Request $request, string $norawat): RedirectResponse
    {
        try {
            $nomor_register = base64_decode($norawat);

            $validated = $request->validate([
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
                'htt' => 'nullable|string',
                'anamnesa' => 'nullable|string',
                'assesmen' => 'nullable|string',
                'expertise' => 'nullable|string',
                'evaluasi' => 'nullable|string',
                'plan' => 'nullable|string',
                'tableData' => 'nullable|array',
            ]);

            $soap = Pelayanan_Soap_Dokter::where('no_rawat', $nomor_register)->first();
            if (!$soap) {
                return redirect()
                    ->route('pelayanan.so-dokter.index')
                    ->with('error', 'Data SOAP Dokter tidak ditemukan');
            }

            // Fill Auth info
            $validated['user_input_id'] = Auth::id() ?? $soap->user_input_id;
            $validated['user_input_name'] = Auth::user()->name ?? $soap->user_input_name;

            // If tensi empty but sistol/distol present, compose it
            if ((empty($validated['tensi']) || $validated['tensi'] === null)
                && !empty($validated['sistol']) && !empty($validated['distol'])
            ) {
                $validated['tensi'] = $validated['sistol'] . '/' . $validated['distol'];
            }

            $soap->update($validated);

            return redirect()
                ->route('pelayanan.so-dokter.index')
                ->with('success', 'SOAP Dokter berhasil diperbarui');
        } catch (\Exception $e) {
            return redirect()
                ->back()
                ->with('error', 'Gagal memperbarui SOAP Dokter: ' . $e->getMessage());
        }
    }

    /**
     * Mark patient as finished (selesai)
     */
    public function selesaiPasien(Request $request, $norawat): JsonResponse
    {
        try {
            $nomor_register = base64_decode($norawat, true);
            if ($nomor_register === false || $nomor_register === '') {
                return response()->json([
                    'success' => false,
                    'message' => 'Parameter tidak valid'
                ], 400);
            }

            $pelayanan = Pelayanan::where('nomor_register', $nomor_register)->first();

            if (!$pelayanan) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data pelayanan tidak ditemukan'
                ], 404);
            }

            $pendaftaran = Pendaftaran::with('status')
                ->where('nomor_register', $nomor_register)
                ->first();

            if (!$pendaftaran) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data pendaftaran tidak ditemukan'
                ], 404);
            }

            // Update atau buat status pendaftaran menjadi 3 (selesai)
            if ($pendaftaran->status) {
                $pendaftaran->status->update(['status_pendaftaran' => 3]);
            } else {
                Pendaftaran_status::create([
                    'register_id'        => $pendaftaran->id,
                    'nomor_rm'           => $pendaftaran->nomor_rm,
                    'pasien_id'          => $pendaftaran->pasien_id,
                    'nomor_register'     => $pendaftaran->nomor_register,
                    'tanggal_kujungan'   => $pendaftaran->tanggal_kujungan,
                    'status_panggil'     => 0,
                    'status_pendaftaran' => 3,
                    'Status_aplikasi'    => null,
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Pasien berhasil diselesaikan'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyelesaikan pasien: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Edit SOAP dokter data for a specific patient
     */
    public function edit(Request $request, string $norawat): InertiaResponse
    {
        return $this->show($request, $norawat);
    }
}
