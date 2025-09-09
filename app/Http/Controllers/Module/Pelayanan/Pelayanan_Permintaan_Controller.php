<?php

namespace App\Http\Controllers\Module\Pelayanan;

use App\Http\Controllers\Controller;
use App\Models\Module\Pelayanan\Pelayanan;
use App\Models\Module\Pelayanan\Pelayanan_Permintaan;
use App\Models\Module\Pelayanan\Pelayanan_Soap_Dokter_Icd;
use App\Models\Module\Pelayanan\Pelayanan_Soap_Dokter;
use App\Models\Module\Master\Data\Medis\Radiologi_Pemeriksaan;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Illuminate\Http\RedirectResponse;
use Carbon\Carbon;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Auth;

class Pelayanan_Permintaan_Controller extends Controller
{
    /**
     * Display the permintaan form for a specific patient
     */
    public function show(Request $request, $norawat): InertiaResponse
    {
        try {
            $nomor_register = base64_decode($norawat);

            // Get patient data with all necessary relations
            $pelayanan = Pelayanan::with([
                'pasien', 
                'pendaftaran.penjamin',
                'pendaftaran.dokter',
                'pendaftaran.poli'
            ])
                ->where('nomor_register', $nomor_register)
                ->first();

            // Get ICD data from Pelayanan_Soap_Dokter_Icd
            $icdData = Pelayanan_Soap_Dokter_Icd::where('no_rawat', $nomor_register)->first();

            // Get latest SOAP Dokter (vital signs) for Surat Sehat prefill
            $soapDokter = Pelayanan_Soap_Dokter::where('no_rawat', $nomor_register)
                ->orderByDesc('id')
                ->first();

            // If no patient data from database, use dummy data
            if (!$pelayanan) {
                $dummyPatientData = [
                    'nomor_rm' => 'DUM001',
                    'nama' => 'Pasien Dummy',
                    'nomor_register' => 'DUMREG001',
                    'jenis_kelamin' => 'Laki-laki',
                    'penjamin' => 'Umum',
                    'tanggal_lahir' => '1990-01-01',
                    'umur' => '35 Tahun',
                    'no_bpjs' => '123456789012345',
                    'dokter' => 'Dr. Dummy',
                    'poli' => 'Poli Dummy',
                    'icd_data' => null
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
                    'nama' => $pelayanan->pasien->nama ?? '',
                    'nomor_register' => $pelayanan->nomor_register,
                    'jenis_kelamin' => $pelayanan->pasien->seks ?? '',
                    'penjamin' => optional($pelayanan->pendaftaran->penjamin)->nama ?? '',
                    'tanggal_lahir' => $pelayanan->pasien->tanggal_lahir ?? '',
                    'umur' => $umur,
                    'no_bpjs' => $pelayanan->pasien->no_bpjs ?? '',
                    'dokter' => optional($pelayanan->pendaftaran->dokter)->nama ?? '',
                    'poli' => optional($pelayanan->pendaftaran->poli)->nama ?? '',
                    'icd_data' => $icdData ? [
                        'diagnosis_utama' => $icdData->kode_icd10 ? $icdData->kode_icd10 . ' - ' . $icdData->nama_icd10 : '',
                        'diagnosis_utama_priority' => $icdData->priority_icd10 ?? '',
                        'diagnosis_penyerta_1' => $icdData->kode_icd9 ? $icdData->kode_icd9 . ' - ' . $icdData->nama_icd9 : '',
                    ] : null,
                    'sehat_data' => $soapDokter ? [
                        // map vitals to Surat Sehat fields
                        'tgl_periksa' => null,
                        'sistole' => (string) ($soapDokter->sistol ?? ''),
                        'diastole' => (string) ($soapDokter->distol ?? ''),
                        'suhu' => (string) ($soapDokter->suhu ?? ''),
                        'berat' => (string) ($soapDokter->berat ?? ''),
                        'respiratory_rate' => (string) ($soapDokter->rr ?? ''),
                        'nadi' => (string) ($soapDokter->nadi ?? ''),
                        'tinggi' => (string) ($soapDokter->tinggi ?? ''),
                        'buta_warna_status' => 'Tidak',
                        'buta_warna_check' => false,
                    ] : null
                ];
            }

            return Inertia::render('module/pelayanan/permintaan/permintaan', [
                'pelayanan' => $patientData,
                'norawat' => $norawat,
                'radiologiPemeriksaans' => Radiologi_Pemeriksaan::orderBy('nama')->get(['id','nama']),
            ]);
        } catch (\Exception $e) {
            return Inertia::render('module/pelayanan/permintaan/permintaan', [
                'errors' => ['error' => 'Gagal memuat data permintaan: ' . $e->getMessage()],
                'norawat' => $norawat,
            ]);
        }
    }

    /**
     * Store a new permintaan
     */
    public function store(Request $request): RedirectResponse
    {
        try {
            // Validate request data
            $validated = $request->validate([
                'nomor_register' => ['required', 'string'],
                'jenis_permintaan' => ['required', 'string', Rule::in(['radiologi', 'laboratorium', 'surat_sakit', 'surat_sehat', 'surat_kematian', 'skdp'])],
                'detail_permintaan' => ['nullable', 'array'],
            ]);

            // Add auth info
            $validated['tanggal_permintaan'] = now();
            $validated['status'] = 'pending';
            $validated['no_rawat'] = $validated['nomor_register'];

            // Save to database
            Pelayanan_Permintaan::create($validated);

            return redirect()
                ->back()
                ->with('success', 'Permintaan berhasil disimpan');
        } catch (\Exception $e) {
            return redirect()
                ->back()
                ->with('error', 'Gagal menyimpan permintaan: ' . $e->getMessage());
        }
    }

    /**
     * Update an existing permintaan
     */
    public function update(Request $request, $norawat): RedirectResponse
    {
        try {
            // Decode nomor register from route param if base64, fallback to raw
            $nomor_register = base64_decode($norawat, true) ?: $norawat;

            // Validate request data
            $validated = $request->validate([
                'jenis_permintaan' => ['required', 'string', Rule::in(['radiologi', 'laboratorium', 'surat_sakit', 'surat_sehat', 'surat_kematian', 'skdp'])],
                'detail_permintaan' => ['nullable', 'array'],
            ]);

            // Find existing permintaan
            $permintaan = Pelayanan_Permintaan::where('no_rawat', $nomor_register)->first();
            
            if (!$permintaan) {
                return redirect()
                    ->back()
                    ->with('error', 'Data permintaan tidak ditemukan');
            }

            // Add auth info

            // Update database
            $permintaan->update($validated);

            return redirect()
                ->back()
                ->with('success', 'Permintaan berhasil diperbarui');
        } catch (\Exception $e) {
            return redirect()
                ->back()
                ->with('error', 'Gagal memperbarui permintaan: ' . $e->getMessage());
        }
    }
}
