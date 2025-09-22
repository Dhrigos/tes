<?php

namespace App\Http\Controllers\Module\Pelayanan;

use App\Http\Controllers\Controller;
use App\Models\Module\Pelayanan\Pelayanan;
use App\Models\Module\Pelayanan\Pelayanan_Permintaan;
use App\Models\Module\Pelayanan\Pelayanan_Soap_Dokter_Icd;
use App\Models\Module\Pelayanan\Pelayanan_Soap_Dokter;
use App\Models\Module\Pelayanan\Permintaan_Cetak;
use App\Models\Module\Master\Data\Medis\Radiologi_Pemeriksaan;
use App\Models\Module\Pasien\Pasien_History;
use App\Services\PelayananStatusService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Illuminate\Http\RedirectResponse;
use Carbon\Carbon;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

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
                // Enrich dokter_name & klinik_name
                $dokterName = null;
                $klinikName = optional(Web_Setting::first())->nama;
                try {
                    $pelayananMeta = Pelayanan::with(['dokter.namauser'])
                        ->where('nomor_register', $validated['no_rawat'])
                        ->first();
                    if ($pelayananMeta) {
                        $dokterName = optional(optional($pelayananMeta->dokter)->namauser)->name
                            ?? (optional($pelayananMeta->dokter)->nama ?? null);
                    }
                } catch (\Throwable $e) {}

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
                            'dokter_name' => $dokterName,
                            'klinik_name' => $klinikName,
                        ],
                        'dokter_name' => $dokterName,
                        'klinik_name' => $klinikName,
                    ],
                ]);
            } catch (\Exception $e) {
            }

            // Update status dokter berdasarkan jenis permintaan
            $this->updateDokterStatus($validated['no_rawat'], $validated['jenis_permintaan']);

            return redirect()
                ->route('pelayanan.soap-dokter.index')
                ->with('success', 'Permintaan berhasil disimpan');
        } catch (\Exception $e) {
            return redirect()
                ->back()
                ->with('error', 'Gagal menyimpan permintaan: ' . $e->getMessage());
        }
    }

    /**
     * Store permintaan via API (JSON response)
     */
    public function storeApi(Request $request): JsonResponse
    {
        try {
            // Validate request data
            $validated = $request->validate([
                'nomor_register' => ['required', 'string'],
                'jenis_permintaan' => ['required', 'string', Rule::in(['radiologi', 'laboratorium', 'surat_sakit', 'surat_sehat', 'surat_kematian', 'skdp'])],
                'detail_permintaan' => ['nullable', 'array'],
                'judul' => ['nullable', 'string'],
                'keterangan' => ['nullable', 'string'],
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
                // ignore error
            }

            // Save to database
            $permintaan = Pelayanan_Permintaan::create($validated);

            // Simpan ke CPPT history
            try {
                // Enrich dokter_name & klinik_name
                $dokterName = null;
                $klinikName = optional(Web_Setting::first())->nama;
                try {
                    $pelayananMeta = Pelayanan::with(['dokter.namauser'])
                        ->where('nomor_register', $validated['no_rawat'])
                        ->first();
                    if ($pelayananMeta) {
                        $dokterName = optional(optional($pelayananMeta->dokter)->namauser)->name
                            ?? (optional($pelayananMeta->dokter)->nama ?? null);
                    }
                } catch (\Throwable $e) {}

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
                            'dokter_name' => $dokterName,
                            'klinik_name' => $klinikName,
                        ],
                        'dokter_name' => $dokterName,
                        'klinik_name' => $klinikName,
                    ],
                ]);
            } catch (\Exception $e) {
                // ignore error
            }

            // Update status dokter berdasarkan jenis permintaan
            $this->updateDokterStatus($validated['no_rawat'], $validated['jenis_permintaan']);

            return response()->json([
                'success' => true,
                'message' => 'Permintaan berhasil disimpan',
                'data' => $permintaan
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan permintaan: ' . $e->getMessage()
            ], 500);
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
                Pasien_History::create([
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

            // Update status dokter berdasarkan jenis permintaan
            $this->updateDokterStatus($nomor_register, $validated['jenis_permintaan']);

            return redirect()
                ->route('pelayanan.soap-dokter.index')
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

            // Simpan data cetak ke database
            $this->saveCetakData($nomor_register, $jenis, $detailArray, $request);
            
            // Update status menjadi printed saat halaman cetak dibuka
            $this->markAsPrintedOnCetak($nomor_register, $jenis);

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

            // Normalisasi alamat: jika field desa berupa object/array JSON, ambil hanya nama/text
            $alamatText = '';
            try {
                $alamatBase = (string) ($pasien->alamat ?? '');
                $desaRaw = $pasien->desa ?? '';
                $desaName = '';
                if (is_array($desaRaw)) {
                    $desaName = (string) ($desaRaw['name'] ?? $desaRaw['nama'] ?? '');
                } elseif (is_object($desaRaw)) {
                    $desaName = (string) ($desaRaw->name ?? $desaRaw->nama ?? '');
                } else {
                    // assume string or scalar
                    $desaName = (string) $desaRaw;
                }
                $alamatText = trim(trim($alamatBase) . ' ' . trim($desaName));
            } catch (\Throwable $e) {
                $alamatText = (string) ($pasien->alamat ?? '');
            }

            $common = [
                'namaKlinik' => config('app.name', 'Klinik'),
                'alamatKlinik' => config('app.alamat', ''),
                'nama_pasien' => $pasien->nama ?? '',
                'umur' => $pasien && $pasien->tanggal_lahir ? \Carbon\Carbon::parse($pasien->tanggal_lahir)->diffInYears(\Carbon\Carbon::now()) . ' Tahun' : '',
                'jenis_kelamin' => ($pasien->seks ?? '') === '1' ? 'Laki-laki' : (($pasien->seks ?? '') === '2' ? 'Perempuan' : ($pasien->seks ?? '')),
                'tanggal_lahir' => $pasien->tanggal_lahir ?? '',
                'alamat' => $alamatText,
                'penjamin' => optional($pendaftaran?->penjamin)->nama ?? '',
                'dokter_pengirim' => $dokter->nama ?? '',
                'poli' => $poli->nama ?? '',
                'no_bpjs' => $pasien->no_bpjs ?? '',
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
                    'labData' => $detailArray['items'] ?? [],
                    'diagnosa' => $detailArray['diagnosa'] ?? '',
                    'tanggal' => $detailArray['tanggal_periksa'] ?? now()->toDateTimeString(),
                    'catatan' => $detailArray['catatan'] ?? '',
                ];
            } elseif ($jenis === 'skdp') {
                $payload = [
                    'kode_surat' => $detailArray['kode_surat'] ?? '',
                    'tgl_pemeriksaan' => $detailArray['tanggal_pemeriksaan'] ?? now()->toDateTimeString(),
                    'untuk' => $detailArray['untuk'] ?? '',
                    'pada' => $detailArray['pada'] ?? '',
                    'poli_unit' => $detailArray['poli_unit'] ?? '',
                    'alasan1' => $detailArray['alasan1'] ?? '',
                    'alasan2' => $detailArray['alasan2'] ?? '',
                    'rencana1' => $detailArray['rencana1'] ?? '',
                    'rencana2' => $detailArray['rencana2'] ?? '',
                    'sep_bpjs' => $detailArray['sep_bpjs'] ?? '',
                    'diagnosa' => $detailArray['diagnosa'] ?? '',
                    'jumlah_hari' => $detailArray['jumlah_hari'] ?? 0,
                    'tgl_awal' => $detailArray['tgl_awal'] ?? now()->toDateString(),
                    'tgl_akhir' => $detailArray['tgl_akhir'] ?? now()->addDays(($detailArray['jumlah_hari'] ?? 0) - 1)->toDateString(),
                ];
            } elseif ($jenis === 'surat_sehat') {
                $payload = [
                    'tgl_periksa' => $detailArray['tgl_periksa'] ?? now()->toDateString(),
                    'sistole' => $detailArray['sistole'] ?? '',
                    'diastole' => $detailArray['diastole'] ?? '',
                    'suhu' => $detailArray['suhu'] ?? '',
                    'berat' => $detailArray['berat'] ?? '',
                    'respiratory_rate' => $detailArray['respiratory_rate'] ?? '',
                    'nadi' => $detailArray['nadi'] ?? '',
                    'tinggi' => $detailArray['tinggi'] ?? '',
                    'buta_warna_status' => $detailArray['buta_warna_status'] ?? 'Tidak',
                ];
            } elseif ($jenis === 'surat_kematian') {
                $payload = [
                    'tgl_periksa' => $detailArray['tgl_periksa'] ?? now()->toDateString(),
                    'tanggal_meninggal' => $detailArray['tanggal_meninggal'] ?? '',
                    'jam_meninggal' => $detailArray['jam_meninggal'] ?? '',
                    'ref_tgl_jam' => $detailArray['ref_tgl_jam'] ?? '',
                    'penyebab_kematian' => $detailArray['penyebab_kematian'] ?? 'Sakit',
                    'penyebab_lainnya' => $detailArray['penyebab_lainnya'] ?? '',
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

            // Tambahkan parameter auto print
            $autoPrint = $request->query('auto_print', false);
            $common['auto_print'] = $autoPrint;
            
            // Set ukuran A5 potret untuk semua surat permintaan
            $pdf = Pdf::loadView($view, array_merge($common, $payload))->setPaper('a5', 'portrait');
            return $pdf->stream('permintaan-' . ($pelayanan->nomor_rm ?? 'pasien') . '.pdf');
        } catch (\Exception $e) {
            return response('Gagal memuat halaman cetak: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Update status menjadi printed saat halaman cetak dibuka
     */
    private function markAsPrintedOnCetak(string $nomorRegister, string $jenis): void
    {
        try {
            $cetak = Permintaan_Cetak::where('no_rawat', $nomorRegister)
                ->where('jenis_permintaan', $jenis)
                ->orderBy('created_at', 'desc')
                ->first();

            if ($cetak) {
                $cetak->update([
                    'status' => 'printed',
                    'tanggal_cetak' => now(),
                    'printed_by' => Auth::id() ?? Auth::user()?->name ?? 'system',
                ]);
            }
        } catch (\Exception $e) {
            // Log error but don't fail the request
            Log::error('Failed to mark as printed on cetak: ' . $e->getMessage());
        }
    }

    /**
     * Simpan data cetak ke database
     */
    private function saveCetakData(string $nomorRegister, string $jenis, array $detailArray, Request $request): void
    {
        try {
            // Ambil nomor RM dari pelayanan
            $nomorRm = null;
            try {
                $pelayanan = Pelayanan::where('nomor_register', $nomorRegister)->first();
                $nomorRm = $pelayanan?->nomor_rm;
            } catch (\Exception $e) {
                // ignore error
            }

            // Cek apakah sudah ada data cetak untuk no_rawat dan jenis yang sama
            $existingCetak = Permintaan_Cetak::where('no_rawat', $nomorRegister)
                ->where('jenis_permintaan', $jenis)
                ->orderBy('created_at', 'desc')
                ->first();

            $cetakData = [
                'no_rawat' => $nomorRegister,
                'nomor_rm' => $nomorRm,
                'jenis_permintaan' => $jenis,
                'detail_permintaan' => $detailArray,
                'judul' => $request->query('judul'),
                'keterangan' => $request->query('keterangan'),
                'created_by' => Auth::id() ?? Auth::user()?->name ?? 'system',
            ];

            if ($existingCetak) {
                // Update data yang sudah ada (baik draft maupun printed)
                $existingCetak->update($cetakData);
            } else {
                // Buat data baru hanya jika belum ada sama sekali
                Permintaan_Cetak::create($cetakData);
            }
        } catch (\Exception $e) {
            // Log error but don't fail the request
            Log::error('Failed to save cetak data: ' . $e->getMessage());
        }
    }

    /**
     * Ambil data cetak yang tersimpan berdasarkan no_rawat
     */
    public function getCetakData(Request $request, $norawat)
    {
        try {
            $nomor_register = base64_decode($norawat, true) ?: $norawat;
            $jenis = $request->query('jenis');

            $query = Permintaan_Cetak::where('no_rawat', $nomor_register);

            if ($jenis) {
                $query->where('jenis_permintaan', $jenis);
            }

            $cetakData = $query->orderBy('created_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $cetakData
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data cetak: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update status cetak menjadi printed
     */
    public function markAsPrinted(Request $request, $id)
    {
        try {
            $cetak = Permintaan_Cetak::findOrFail($id);
            
            $cetak->update([
                'status' => 'printed',
                'tanggal_cetak' => now(),
                'printed_by' => Auth::id() ?? Auth::user()?->name ?? 'system',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Status cetak berhasil diperbarui'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui status cetak: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Hapus data cetak
     */
    public function deleteCetakData($id)
    {
        try {
            $cetak = Permintaan_Cetak::findOrFail($id);
            $cetak->delete();

            return response()->json([
                'success' => true,
                'message' => 'Data cetak berhasil dihapus'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus data cetak: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update status dokter berdasarkan jenis permintaan
     */
    private function updateDokterStatus(string $nomorRegister, string $jenisPermintaan): void
    {
        try {
            $statusService = new PelayananStatusService();

            // Tentukan apakah pasien berada di alur KIA (Bidan) berdasarkan poli
            $isKia = false;
            try {
                $pelayanan = Pelayanan::with(['pendaftaran.poli'])
                    ->where('nomor_register', $nomorRegister)
                    ->first();
                $kodePoli = strtoupper((string) optional(optional($pelayanan?->pendaftaran)->poli)->kode);
                $isKia = ($kodePoli === 'K');
            } catch (\Throwable $e) {
                // fallback: anggap bukan KIA jika gagal ambil data
                $isKia = false;
            }

            // Status 3 untuk radiologi & laboratorium (perlu konfirmasi)
            // Status 4 untuk jenis lainnya (selesai)
            $targetStatus = in_array($jenisPermintaan, ['radiologi', 'laboratorium']) ? 3 : 4;

            if ($isKia) {
                $statusService->setStatusBidan($nomorRegister, $targetStatus);
            } else {
                $statusService->setStatusDokter($nomorRegister, $targetStatus);
            }
        } catch (\Exception $e) {
            // Log error but don't fail the request
            Log::error('Failed to update dokter status: ' . $e->getMessage());
        }
    }
}
