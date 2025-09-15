<?php

namespace App\Http\Controllers\Module\Pelayanan;

use App\Http\Controllers\Controller;
use App\Models\Module\Pelayanan\Pelayanan;
use App\Models\Module\Pelayanan\Pelayanan_Permintaan;
use App\Models\Module\Pelayanan\Pelayanan_Soap_Dokter_Icd;
use App\Models\Module\Pelayanan\Pelayanan_Soap_Dokter;
use App\Models\Module\Master\Data\Medis\Radiologi_Pemeriksaan;
use App\Models\Module\Pasien\Pasien_History;
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
                'radiologiPemeriksaans' => Radiologi_Pemeriksaan::orderBy('nama')->get(['id', 'nama']),
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
            $validated['status'] = 0; // draft/pending
            $validated['no_rawat'] = $validated['nomor_register'];
            // Optional enrich
            try {
                $pel = Pelayanan::where('nomor_register', $validated['no_rawat'])->first();
                if ($pel) {
                    $validated['nomor_rm'] = $pel->nomor_rm ?? null;
                }
            } catch (\Exception $e) {
            }

            // Save to database
            Pelayanan_Permintaan::create($validated);

            // Simpan ke CPPT history
            try {
                Pasien_History::create([
                    'no_rm' => $validated['nomor_rm'] ?? '',
                    'nama' => '',
                    'history' => [
                        'type' => 'permintaan_tambah',
                        'no_rawat' => $validated['no_rawat'],
                        'timestamp' => now()->toISOString(),
                        'data' => [
                            'nomor_register' => $validated['no_rawat'],
                            'jenis_permintaan' => $validated['jenis_permintaan'],
                            'detail_permintaan' => $validated['detail_permintaan'] ?? [],
                            'judul' => $request->input('judul'),
                            'keterangan' => $request->input('keterangan'),
                        ],
                    ],
                ]);
            } catch (\Exception $e) {
            }

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

            // Simpan ke CPPT history (edit)
            try {
                \App\Models\Module\Pasien\Pasien_History::create([
                    'no_rm' => '',
                    'nama' => '',
                    'history' => [
                        'type' => 'permintaan_edit',
                        'no_rawat' => $nomor_register,
                        'timestamp' => now()->toISOString(),
                        'data' => [
                            'nomor_register' => $nomor_register,
                            'jenis_permintaan' => $validated['jenis_permintaan'],
                            'detail_permintaan' => $validated['detail_permintaan'] ?? [],
                        ],
                    ],
                ]);
            } catch (\Exception $e) {
            }

            return redirect()
                ->back()
                ->with('success', 'Permintaan berhasil diperbarui');
        } catch (\Exception $e) {
            return redirect()
                ->back()
                ->with('error', 'Gagal memperbarui permintaan: ' . $e->getMessage());
        }
    }

    /**
     * Cetak/preview permintaan sebagai halaman HTML (siap dicetak)
     */
    public function cetak(Request $request, $norawat)
    {
        try {
            $nomor_register = base64_decode($norawat, true) ?: $norawat;
            $jenis = $request->query('jenis', 'surat_sakit');
            $detail = $request->query('detail');
            $detailArray = [];
            if (is_string($detail)) {
                try {
                    $detailArray = json_decode($detail, true) ?: [];
                } catch (\Throwable $e) {
                    $detailArray = [];
                }
            }

            $viewMap = [
                'radiologi' => 'pdf.permintaan_radiologi',
                'laboratorium' => 'pdf.permintaan_laboratorium',
                'skdp' => 'pdf.permintaan_skd',
                'surat_sehat' => 'pdf.permintaan_sehat',
                'surat_sakit' => 'pdf.permintaan_sakit',
                'surat_kematian' => 'pdf.permintaan_kematian',
            ];

            $view = $viewMap[$jenis] ?? $viewMap['surat_sakit'];

            $pelayanan = Pelayanan::with([
                'pasien',
                'pendaftaran.penjamin',
                'pendaftaran.dokter',
                'pendaftaran.poli'
            ])->where('nomor_register', $nomor_register)->first();

            $icdData = Pelayanan_Soap_Dokter_Icd::where('no_rawat', $nomor_register)->first();
            $soapDokter = Pelayanan_Soap_Dokter::where('no_rawat', $nomor_register)->orderByDesc('id')->first();

            // Map common fields expected by blade views
            $pasien = $pelayanan?->pasien;
            $pendaftaran = $pelayanan?->pendaftaran;
            $poli = $pendaftaran?->poli;
            $dokter = $pendaftaran?->dokter;

            $common = [
                'namaKlinik' => config('app.name', 'Klinik'),
                'alamatKlinik' => config('app.alamat', ''),
                'nama_pasien' => $pasien->nama ?? '',
                'umur' => $pasien && $pasien->tanggal_lahir ? \Carbon\Carbon::parse($pasien->tanggal_lahir)->diffInYears(\Carbon\Carbon::now()) . ' Tahun' : '',
                'jenis_kelamin' => ($pasien->seks ?? '') === '1' ? 'Laki-laki' : (($pasien->seks ?? '') === '2' ? 'Perempuan' : ($pasien->seks ?? '')),
                'tanggal_lahir' => $pasien->tanggal_lahir ?? '',
                'alamat' => trim(($pasien->alamat ?? '') . ' ' . ($pasien->desa ?? '')),
                'penjamin' => optional($pendaftaran?->penjamin)->nama ?? '',
                'dokter_pengirim' => $dokter->nama ?? '',
                'poli' => $poli->nama ?? '',
                'now' => \Carbon\Carbon::now(),
                'judul' => $request->query('judul'),
                'keterangan' => $request->query('keterangan'),
            ];

            $payload = [];
            if ($jenis === 'radiologi') {
                $payload = [
                    'radData' => $detailArray['items'] ?? [],
                    'diagnosa' => $detailArray['diagnosa'] ?? '',
                    'tanggal' => $detailArray['tanggal_periksa'] ?? now()->toDateTimeString(),
                    'catatan' => $detailArray['catatan'] ?? '',
                ];
            } elseif ($jenis === 'laboratorium') {
                $payload = [
                    'labItems' => $detailArray['items'] ?? [],
                    'diagnosa' => $detailArray['diagnosa'] ?? '',
                    'tanggal' => $detailArray['tanggal_periksa'] ?? now()->toDateTimeString(),
                    'catatan' => $detailArray['catatan'] ?? '',
                ];
            } elseif ($jenis === 'skdp') {
                $payload = [
                    'data' => $detailArray,
                ];
            } elseif ($jenis === 'surat_sehat') {
                $payload = [
                    'data' => $detailArray,
                ];
            } elseif ($jenis === 'surat_kematian') {
                $payload = [
                    'data' => $detailArray,
                ];
            } else { // surat_sakit
                $payload = [
                    'diagnosis_utama' => $detailArray['diagnosis_utama'] ?? '',
                    'diagnosis_penyerta_1' => $detailArray['diagnosis_penyerta_1'] ?? '',
                    'diagnosis_penyerta_2' => $detailArray['diagnosis_penyerta_2'] ?? '',
                    'diagnosis_penyerta_3' => $detailArray['diagnosis_penyerta_3'] ?? '',
                    'komplikasi_1' => $detailArray['komplikasi_1'] ?? '',
                    'komplikasi_2' => $detailArray['komplikasi_2'] ?? '',
                    'komplikasi_3' => $detailArray['komplikasi_3'] ?? '',
                    'lama_istirahat' => $detailArray['lama_istirahat'] ?? 0,
                    'terhitung_mulai' => $detailArray['terhitung_mulai'] ?? null,
                ];
            }

            return view($view, array_merge($common, $payload));
        } catch (\Exception $e) {
            return response('Gagal memuat halaman cetak: ' . $e->getMessage(), 500);
        }
    }
}
