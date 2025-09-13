<?php

namespace App\Http\Controllers\Module\Pelayanan;

use App\Http\Controllers\Controller;
use App\Models\Module\Pelayanan\Pelayanan;
use App\Models\Module\Pelayanan\Pelayanan_Soap_Bidan;
use App\Models\Module\Pelayanan\Pelayanan_Soap_Bidan_Obat;
use App\Models\Module\Master\Data\Medis\Penggunaan_Obat;
use App\Models\Module\Pelayanan\Pelayanan_Soap_Bidan_Icd;
use App\Models\Module\Pelayanan\Pelayanan_Soap_Bidan_Tindakan;
use App\Models\Module\Pelayanan\Pelayanan_status;
use App\Models\Module\Pelayanan\Pelayanan_So_Perawat;
use App\Models\Module\Pelayanan\Pelayanan_Soap_Konfirmasi;
use App\Models\Module\Pelayanan\Pelayanan_Soap_Konfirmasi_File;
use App\Services\PelayananStatusService;
use App\Models\Module\Pelayanan\Gcs\Gcs_Eye;
use App\Models\Module\Pelayanan\Gcs\Gcs_Verbal;
use App\Models\Module\Pelayanan\Gcs\Gcs_Motorik;
use App\Models\Module\Pelayanan\Gcs\Gcs_Kesadaran;
use App\Models\Module\Master\Data\Medis\Htt_Pemeriksaan;
use App\Models\Module\Master\Data\Medis\Icd10;
use App\Models\Module\Master\Data\Medis\Icd9;
use App\Models\Module\Master\Data\Medis\Jenis_Diet;
use App\Models\Module\Master\Data\Medis\Makanan;
use App\Models\Module\Master\Data\Medis\Tindakan;
use App\Models\Module\Master\Data\Medis\Alergi;
use App\Models\Module\Pelayanan\Pelayanan_Soap_Bidan_Diet;
use App\Models\Module\Pasien\Pasien_History;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use App\Models\Module\Pemdaftaran\Pendaftaran;
use App\Models\Module\Pemdaftaran\Pendaftaran_status;

class Pelayanan_Soap_Bidan_Controller extends Controller
{
    /**
     * Save patient history to pasien_histories table
     */
    private function savePatientHistory($data, $type = 'soap_dokter')
    {
        try {
            $historyData = [
                'no_rm' => $data['nomor_rm'] ?? '',
                'nama' => $data['nama'] ?? '',
                'history' => [
                    'type' => $type,
                    'no_rawat' => $data['no_rawat'] ?? '',
                    'timestamp' => now()->toISOString(),
                    'data' => $data
                ]
            ];

            // Enrich with doctor and clinic names for CPPT
            try {
                $noRawatForLookup = $historyData['history']['no_rawat'] ?? '';
                if (!empty($noRawatForLookup)) {
                    $pelayananForMeta = \App\Models\Module\Pelayanan\Pelayanan::with(['dokter.namauser'])
                        ->where('nomor_register', $noRawatForLookup)
                        ->first();
                    if ($pelayananForMeta) {
                        $dokterName = optional(optional($pelayananForMeta->dokter)->namauser)->name
                            ?? (optional($pelayananForMeta->dokter)->nama ?? null);
                        $klinikName = optional(\App\Models\Settings\Web_Setting::first())->nama;
                        if (!empty($dokterName)) {
                            $historyData['history']['dokter_name'] = $dokterName;
                            $historyData['history']['data']['dokter_name'] = $dokterName;
                        }
                        if (!empty($klinikName)) {
                            $historyData['history']['klinik_name'] = $klinikName;
                            $historyData['history']['data']['klinik_name'] = $klinikName;
                        }
                    }
                }
            } catch (\Exception $metaEx) {
                // ignore enrichment failure
            }

            Pasien_History::create($historyData);
        } catch (\Exception $e) {
            // Log error but don't fail the main operation
            Log::error('Failed to save patient history: ' . $e->getMessage());
        }
    }

    /**
     * Display a listing of SOAP dokter data
     */
    public function index(): InertiaResponse
    {
        try {
            $today = Carbon::today();

            // Filter pasien yang akan dilayani bidan berdasarkan poli
            // Asumsi: poli dengan nama mengandung "Bidan", "Kebidanan", atau "Maternitas"
            $pelayanans = Pelayanan::with(['pasien', 'poli', 'dokter.namauser', 'pendaftaran.penjamin'])
                ->whereDate('tanggal_kujungan', '=', $today)
                ->whereHas('poli', function ($query) {
                    $query->where('nama', 'like', '%Bidan%')
                        ->orWhere('nama', 'like', '%Kebidanan%')
                        ->orWhere('nama', 'like', '%Maternitas%')
                        ->orWhere('nama', 'like', '%Perempuan%');
                })
                ->orderBy('created_at', 'desc')
                ->get()
                ->unique('nomor_register')
                ->values();

            $nomorRegisters = $pelayanans->pluck('nomor_register')->all();

            $statusMap = Pelayanan_status::whereIn('nomor_register', $nomorRegisters)
                ->get()->keyBy('nomor_register');

            $pelayananData = [];
            foreach ($pelayanans as $p) {
                $ps = $statusMap->get($p->nomor_register);
                $statusDaftar = (int)optional($ps)->status_daftar ?? 0;
                $statusPerawat = (int)optional($ps)->status_perawat ?? 0;
                $statusBidan = (int)optional($ps)->status_bidan ?? 0;

                // Hanya tampilkan di daftar bidan jika perawat sudah selesai (status_perawat = 2)
                if ($statusPerawat < 2) {
                    continue;
                }

                $tindakan = 'panggil';
                if (!($statusDaftar < 2 || $statusPerawat < 2)) {
                    if ($statusBidan === 0) {
                        $tindakan = 'panggil';
                    } elseif ($statusBidan === 1) {
                        // Step 1 (bidan berjalan): selalu tampilkan SOAP, tidak ada Edit di tahap ini
                        $tindakan = 'soap';
                    } elseif ($statusBidan === 2) {
                        // tindakan lanjutan (rujukan, permintaan, edit)
                        $tindakan = 'edit';
                    } elseif ($statusBidan === 3) {
                        // half complete: ada permintaan radiologi/lab, butuh konfirmasi
                        $tindakan = 'half_complete';
                    } elseif ($statusBidan === 4) {
                        // pelayanan selesai penuh
                        $tindakan = 'Complete';
                    }
                }

                $pelayananData[] = [
                    'id' => $p->id,
                    'nomor_rm' => $p->nomor_rm,
                    'nomor_register' => $p->nomor_register,
                    'tanggal_kujungan' => $p->tanggal_kujungan,
                    'poli_id' => $p->poli_id,
                    'bidan_id' => $p->dokter_id, // Menggunakan dokter_id sebagai bidan_id untuk sementara
                    'tindakan_button' => $tindakan,
                    'pasien' => [
                        'nama' => optional($p->pasien)->nama ?? '-',
                    ],
                    'poli' => [
                        'nama' => optional($p->poli)->nama ?? '-',
                    ],
                    'bidan' => [
                        'id' => $p->dokter_id,
                        'namauser' => [
                            'name' => optional(optional($p->dokter)->namauser)->name ?? (optional($p->dokter)->nama ?? '-'),
                        ],
                    ],
                    'pendaftaran' => [
                        'antrian' => optional($p->pendaftaran)->antrian ?? '-',
                    ],
                    'status_daftar' => $statusDaftar,
                    'status_perawat' => $statusPerawat,
                    'status_bidan' => $statusBidan,
                    'can_call' => ($statusDaftar >= 2 && $statusPerawat >= 2 && $statusBidan === 0),
                ];
            }

            return Inertia::render('module/pelayanan/soap-bidan/index', [
                'pelayanan' => $pelayananData
            ]);
        } catch (\Exception $e) {
            return Inertia::render('module/pelayanan/soap-bidan/index', [
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
    public function show(Request $request, $norawat): InertiaResponse|RedirectResponse
    {
        try {
            $nomor_register = base64_decode($norawat);

            // Get patient data
            $pelayanan = Pelayanan::with(['pasien', 'pendaftaran.penjamin'])
                ->where('nomor_register', $nomor_register)
                ->first();

            // Get SOAP bidan data (may be null for create mode)
            $soapDokter = Pelayanan_Soap_Bidan::where('no_rawat', $nomor_register)->first();

            // Get existing diet data
            $existingDietData = Pelayanan_Soap_Bidan_Diet::where('no_rawat', $nomor_register)->get();

            // Prefill: saved ICDs, tindakan, and obat - combined ICD10 and ICD9 in single row
            $savedIcd = Pelayanan_Soap_Bidan_Icd::where('no_rawat', $nomor_register)->first();
            $savedIcd10 = [];
            $savedIcd9 = [];

            if ($savedIcd) {
                // If ICD10 exists, add to savedIcd10 array
                if ($savedIcd->kode_icd10) {
                    $savedIcd10[] = [
                        'kode' => $savedIcd->kode_icd10,
                        'nama' => $savedIcd->nama_icd10,
                        'priority' => $savedIcd->priority_icd10,
                    ];
                }

                // If ICD9 exists, add to savedIcd9 array
                if ($savedIcd->kode_icd9) {
                    $savedIcd9[] = [
                        'kode' => $savedIcd->kode_icd9,
                        'nama' => $savedIcd->nama_icd9,
                    ];
                }
            }

            $savedTindakan = Pelayanan_Soap_Bidan_Tindakan::where('no_rawat', $nomor_register)
                ->select('kode_tindakan as kode', 'jenis_tindakan as nama', 'kategori_tindakan as kategori', 'jenis_pelaksana as pelaksana', 'harga')
                ->get();

            $savedObat = Pelayanan_Soap_Bidan_Obat::where('no_rawat', $nomor_register)
                ->select('penanda', 'nama_obat', 'instruksi', 'signa', 'satuan_gudang', 'penggunaan')
                ->get();

            // Get SO Perawat data to display hasil perawat on doctor's page
            $soPerawat = Pelayanan_So_Perawat::where('no_rawat', $nomor_register)->first();

            // Guard akses pemeriksaan dokter: daftar harus 2 dan perawat 2
            $status = app(PelayananStatusService::class)->ambilStatus($nomor_register);
            $statusDaftar = $status['status_daftar'];
            $statusPerawat = $status['status_perawat'];
            if ($statusDaftar < 2 || $statusPerawat < 2) {
                return redirect()
                    ->route('pelayanan.soap-bidan.index')
                    ->with('error', 'Tahap sebelumnya belum selesai (pendaftaran/perawat)');
            }

            // Jika dokter mulai memeriksa (dibuka halaman ini), tandai dokter berjalan dan pastikan perawat selesai
            if (($status['status_dokter'] ?? 0) === 0) {
                app(PelayananStatusService::class)->tandaiDokterBerjalan($nomor_register); // =1
                app(PelayananStatusService::class)->tandaiPerawatFinal($nomor_register); // perawat =3
            }

            // Jika data pasien tidak ditemukan, kembalikan ke index dengan pesan
            if (!$pelayanan) {
                return redirect()
                    ->route('pelayanan.soap-bidan.index')
                    ->with('error', 'Data pasien tidak ditemukan');
            } else {
                // Calculate age in readable format (simplified)
                $umur = '0 Tahun';
                if ($pelayanan->pasien && $pelayanan->pasien->tanggal_lahir) {
                    $birthDate = Carbon::parse($pelayanan->pasien->tanggal_lahir);
                    $now = Carbon::now();

                    $interval = $birthDate->diff($now);
                    $years = $interval->y;
                    $months = $interval->m;
                    $days = $interval->d;

                    $umur = $years . ' Tahun';
                    if ($months > 0) {
                        $umur .= ' ' . $months . ' Bulan';
                    }
                    if ($days > 0) {
                        $umur .= ' ' . $days . ' Hari';
                    }
                }

                // Format gender
                $jenis_kelamin_raw = $pelayanan->pasien->seks ?? ($soapDokter->seks ?? '');
                $jenis_kelamin = '';
                if ($jenis_kelamin_raw == '1' || $jenis_kelamin_raw == 'L' || $jenis_kelamin_raw == 'Laki-laki') {
                    $jenis_kelamin = 'Laki-laki';
                } elseif ($jenis_kelamin_raw == '2' || $jenis_kelamin_raw == 'P' || $jenis_kelamin_raw == 'Perempuan') {
                    $jenis_kelamin = 'Perempuan';
                } else {
                    $jenis_kelamin = $jenis_kelamin_raw; // fallback to original value
                }

                // Prepare patient data
                $patientData = [
                    'nomor_rm' => $pelayanan->nomor_rm,
                    'nama' => $pelayanan->pasien->nama ?? ($soapDokter->nama ?? ''),
                    'nomor_register' => $pelayanan->nomor_register,
                    'jenis_kelamin' => $jenis_kelamin,
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

            // Get Diet master data
            $jenisDiet = Jenis_Diet::all();
            $makanan = Makanan::all();

            // Get Tindakan master data
            $tindakan = Tindakan::all();

            // Get Alergi master data
            $alergiData = Alergi::all();
            if ($alergiData->isEmpty()) {
                try {
                    $alergiData = DB::table('alergi')->get();
                } catch (\Exception $e) {
                    // ignore fallback failure
                }
            }


            return Inertia::render('module/pelayanan/soap-bidan/pemeriksaan', [
                'pelayanan' => $patientData,
                'soap_bidan' => $soapDokter, // null for create mode, data for edit mode
                'so_perawat' => $soPerawat,
                'existing_diet_data' => $existingDietData,
                'gcs_eye' => $gcsEye,
                'gcs_verbal' => $gcsVerbal,
                'gcs_motorik' => $gcsMotorik,
                'gcs_kesadaran' => $gcsKesadaran,
                'htt_pemeriksaan' => $httPemeriksaan,
                'icd10' => $icd10,
                'icd9' => $icd9,
                'jenis_diet' => $jenisDiet,
                'makanan' => $makanan,
                'tindakan' => $tindakan,
                'alergi_data' => $alergiData,
                'norawat' => $norawat,
                // Prefill bundles for edit mode
                'saved_icd10' => $savedIcd10,
                'saved_icd9' => $savedIcd9,
                'tindakan_list_saved' => $savedTindakan,
                'obat_saved' => $savedObat,
                // Provide penggunaan obat master list to frontend (model-based, no API)
                'penggunaan_obat' => Penggunaan_Obat::select('id', 'nama')->orderBy('nama')->get(),
            ]);
        } catch (\Exception $e) {
            return Inertia::render('module/pelayanan/soap-bidan/index', [
                'pelayanan' => [],
                'flash' => ['error' => 'Gagal memuat data pemeriksaan: ' . $e->getMessage()]
            ]);
        }
    }

    /**
     * Save diet data to Pelayanan_Soap_Dokter_Diet table
     */
    private function saveDietData($dietList, $validated)
    {
        if (!empty($dietList)) {
            // Upsert diet data (prevent duplicate on edit)
            foreach ($dietList as $diet) {
                Pelayanan_Soap_Bidan_Diet::updateOrCreate(
                    [
                        'no_rawat' => $validated['no_rawat'],
                        'jenis_diet' => $diet['jenis_diet'] ?? '',
                        'jenis_diet_makanan' => $diet['jenis_diet_makanan'] ?? '',
                        'jenis_diet_makanan_tidak' => $diet['jenis_diet_makanan_tidak'] ?? '',
                    ],
                    [
                        'nomor_rm' => $validated['nomor_rm'],
                        'nama' => $validated['nama'],
                        'seks' => $validated['seks'],
                        'penjamin' => $validated['penjamin'],
                        'tanggal_lahir' => $validated['tanggal_lahir'],
                    ]
                );
            }
        }
    }

    /**
     * Store new SOAP dokter data
     */
    public function store(Request $request): RedirectResponse
    {
        try {
            $validated = $request->validate([
                'nomor_rm' => 'required|string',
                'nama' => 'required|string',
                'no_rawat' => 'required|string',
                'sex' => 'nullable|string',
                'seks' => 'nullable|string',
                'penjamin' => 'nullable|string',
                'tanggal_lahir' => 'nullable|date',
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
                'htt' => 'nullable|string',
                'anamnesa' => 'nullable|string',
                'assesmen' => 'nullable|string',
                'expertise' => 'nullable|string',
                'evaluasi' => 'nullable|string',
                'plan' => 'nullable|string',
                'status_apotek' => 'nullable|integer',
                'odontogram' => 'nullable|string',
                'Decayed' => 'nullable|string',
                'Missing' => 'nullable|string',
                'Filled' => 'nullable|string',
                'Oclusi' => 'nullable|string',
                'Palatinus' => 'nullable|string',
                'Mandibularis' => 'nullable|string',
                'Platum' => 'nullable|string',
                'Diastema' => 'nullable|string',
                'Anomali' => 'nullable|string',
                'diet_jenis' => 'nullable|array',
                'diet_anjuran' => 'nullable|array',
                'diet_pantangan' => 'nullable|array',
                'tindakan_kode' => 'nullable|array',
                'tindakan_nama' => 'nullable|array',
                'tindakan_pelaksana' => 'nullable|array',
                'tindakan_harga' => 'nullable|array',
                'tableData' => 'nullable|string',
                'icd10_code' => 'nullable|array',
                'icd10_name' => 'nullable|array',
                'icd10_priority' => 'nullable|array',
                'icd9_code' => 'nullable|array',
                'icd9_name' => 'nullable|array',
                'tindakan_kode' => 'nullable|array',
                'tindakan_nama' => 'nullable|array',
                'tindakan_kategori' => 'nullable|array',
                'tindakan_pelaksana' => 'nullable|array',
                'tindakan_harga' => 'nullable|array',
                'resep_data' => 'nullable|string',
            ]);

            // Extract diet data
            $dietList = [];
            if (!empty($validated['diet_jenis']) && is_array($validated['diet_jenis'])) {
                foreach ($validated['diet_jenis'] as $index => $jenis) {
                    if (!empty($jenis)) {
                        $dietList[] = [
                            'jenis_diet' => $jenis,
                            'jenis_diet_makanan' => $validated['diet_anjuran'][$index] ?? '',
                            'jenis_diet_makanan_tidak' => $validated['diet_pantangan'][$index] ?? '',
                        ];
                    }
                }
            }

            // Extract obat data
            $obatData = [];
            if (!empty($validated['resep_data'])) {
                $obatData = json_decode($validated['resep_data'], true) ?? [];
            }

            // Set status_apotek based on resep_data presence
            $validated['status_apotek'] = empty($obatData) ? 1 : 0;

            // Extract ICD data
            $icd10Data = [];
            if (!empty($validated['icd10_code']) && is_array($validated['icd10_code'])) {
                foreach ($validated['icd10_code'] as $index => $code) {
                    $icd10Data[] = [
                        'code' => $code,
                        'name' => $validated['icd10_name'][$index] ?? '',
                        'priority' => $validated['icd10_priority'][$index] ?? ''
                    ];
                }
            }

            $icd9Data = [];
            if (!empty($validated['icd9_code']) && is_array($validated['icd9_code'])) {
                foreach ($validated['icd9_code'] as $index => $code) {
                    $icd9Data[] = [
                        'code' => $code,
                        'name' => $validated['icd9_name'][$index] ?? '',
                        'priority' => $validated['icd9_priority'][$index] ?? ''
                    ];
                }
            }

            // Extract tindakan data
            $tindakanData = [];
            if (!empty($validated['tindakan_nama']) && is_array($validated['tindakan_nama'])) {
                // Frontend sends tindakan data as separate arrays that need to be grouped by index
                // Each tindakan has kode, nama, kategori, pelaksana, and harga at the same index
                $count = count($validated['tindakan_nama']);
                for ($i = 0; $i < $count; $i++) {
                    $tindakanData[] = [
                        'kode' => $validated['tindakan_kode'][$i] ?? '',
                        'nama' => $validated['tindakan_nama'][$i] ?? '',
                        'kategori' => $validated['tindakan_kategori'][$i] ?? '',
                        'pelaksana' => $validated['tindakan_pelaksana'][$i] ?? '',
                        'harga' => $validated['tindakan_harga'][$i] ?? '0'
                    ];
                }
            }


            if (isset($validated['sex']) && !isset($validated['seks'])) {
                $validated['seks'] = $validated['sex'];
                unset($validated['sex']);
            }

            // Set default value for status_apotek if not set
            if (!isset($validated['status_apotek'])) {
                $validated['status_apotek'] = 0; // skip apotek for now
            }

            // Remove diet, obat, ICD, and tindakan fields from main validated data
            unset($validated['diet_jenis'], $validated['diet_anjuran'], $validated['diet_pantangan']);
            unset($validated['resep_data']);
            unset($validated['icd10_code'], $validated['icd10_name'], $validated['icd10_priority']);
            unset($validated['icd9_code'], $validated['icd9_name']);
            unset($validated['tindakan_kode'], $validated['tindakan_nama'], $validated['tindakan_kategori'], $validated['tindakan_pelaksana'], $validated['tindakan_harga']);

            // If tensi empty but sistol/distol present, compose it
            if ((empty($validated['tensi']) || $validated['tensi'] === null)
                && !empty($validated['sistol']) && !empty($validated['distol'])
            ) {
                $validated['tensi'] = $validated['sistol'] . '/' . $validated['distol'];
            }

            // Normalisasi tableData jika datang sebagai string JSON (fallback)
            if (!empty($validated['tableData']) && is_string($validated['tableData'])) {
                $decoded = json_decode($validated['tableData'], true);
                $validated['tableData'] = is_array($decoded) ? $decoded : [];
            }

            // Create or update SOAP dokter record using updateOrCreate
            $soapDokter = Pelayanan_Soap_Bidan::updateOrCreate(
                ['no_rawat' => $validated['no_rawat']], // Prevent duplicate
                $validated
            );

            // Save diet records to Pelayanan_Soap_Dokter_Diet table
            if ($soapDokter) {
                $this->saveDietData($dietList, $validated);
            }

            // Save ICD data to pelayanan_soap_bidan_icds table (upsert) - combined ICD10 and ICD9 in single row
            if ($soapDokter && (!empty($icd10Data) || !empty($icd9Data))) {
                // Get the first ICD10 and ICD9 data to combine in one row
                $icd10 = !empty($icd10Data) ? $icd10Data[0] : null;
                $icd9 = !empty($icd9Data) ? $icd9Data[0] : null;

                // Save combined ICD data in single row
                Pelayanan_Soap_Bidan_Icd::updateOrCreate([
                    'no_rawat' => $validated['no_rawat'],
                ], [
                    'nomor_rm' => $validated['nomor_rm'],
                    'nama' => $validated['nama'],
                    'seks' => $validated['seks'],
                    'penjamin' => $validated['penjamin'],
                    'tanggal_lahir' => $validated['tanggal_lahir'],
                    'kode_icd10' => $icd10['code'] ?? null,
                    'nama_icd10' => $icd10['name'] ?? null,
                    'priority_icd10' => $icd10['priority'] ?? null,
                    'kode_icd9' => $icd9['code'] ?? null,
                    'nama_icd9' => $icd9['name'] ?? null,
                ]);
            }

            // Save tindakan data to pelayanan_soap_bidan_tindakans table (upsert)
            if ($soapDokter && !empty($tindakanData)) {
                // Save tindakan data
                foreach ($tindakanData as $tindakan) {
                    // Handle multiple pelaksana if needed
                    $jenisPelaksana = is_array($tindakan['pelaksana']) ? implode(', ', $tindakan['pelaksana']) : $tindakan['pelaksana'];

                    Pelayanan_Soap_Bidan_Tindakan::updateOrCreate([
                        'no_rawat' => $validated['no_rawat'],
                        'kode_tindakan' => $tindakan['kode'],
                    ], [
                        'nomor_rm' => $validated['nomor_rm'],
                        'nama' => $validated['nama'],
                        'seks' => $validated['seks'],
                        'penjamin' => $validated['penjamin'],
                        'tanggal_lahir' => $validated['tanggal_lahir'],
                        'jenis_tindakan' => $tindakan['nama'],
                        'kategori_tindakan' => $tindakan['kategori'],
                        'jenis_pelaksana' => $jenisPelaksana,
                        'harga' => $tindakan['harga'],
                        'status_kasir' => '0', // Default status
                    ]);
                }
            }

            // Save obat data to pelayanan_soap_bidan_obats table (sync: delete then insert all)
            if ($soapDokter) {
                // Always sync obat to reflect latest state from client
                Pelayanan_Soap_Bidan_Obat::where('no_rawat', $validated['no_rawat'])->delete();
                if (!empty($obatData)) {
                    $rows = [];
                    foreach ($obatData as $obat) {
                        if (empty($obat['nama_obat'])) continue;
                        $rows[] = [
                            'no_rawat' => $validated['no_rawat'],
                            'nomor_rm' => $validated['nomor_rm'],
                            'nama' => $validated['nama'],
                            'seks' => $validated['seks'],
                            'penjamin' => $validated['penjamin'],
                            'tanggal_lahir' => $validated['tanggal_lahir'],
                            'penanda' => $obat['penanda'] ?? '',
                            'nama_obat' => $obat['nama_obat'] ?? '',
                            'instruksi' => $obat['instruksi'] ?? '',
                            'signa' => $obat['signa'] ?? '',
                            'satuan_gudang' => $obat['satuan_gudang'] ?? '',
                            'penggunaan' => $obat['penggunaan'] ?? '',
                            'created_at' => now(),
                            'updated_at' => now(),
                        ];
                    }
                    if (!empty($rows)) {
                        Pelayanan_Soap_Bidan_Obat::insert($rows);
                    }
                }
            }

            // Set status dokter berjalan saat simpan pertama dan kunci perawat final (3)
            app(PelayananStatusService::class)->tandaiDokterBerjalan($validated['no_rawat']);
            app(PelayananStatusService::class)->tandaiPerawatFinal($validated['no_rawat']);
            // Permintaan: saat create juga langsung tandai dokter selesai tahap pemeriksaan (2)
            app(PelayananStatusService::class)->tandaiDokterSelesai($validated['no_rawat']);

            // Save to patient history with enriched assessment/plan context
            $historyPayload = $validated;
            // Pastikan no_rawat terisi untuk enrichment metadata
            $historyPayload['no_rawat'] = $validated['no_rawat'] ?? null;
            $historyPayload['assessment'] = [
                'diagnosis_icd10' => $icd10Data,
                'diagnosis_icd9' => $icd9Data,
                'tindakan' => $tindakanData,
                'resep_obat' => $obatData,
            ];
            $historyPayload['plan_detail'] = [
                'expertise' => $validated['expertise'] ?? '',
                'evaluasi' => $validated['evaluasi'] ?? '',
                'rencana' => $validated['plan'] ?? '',
            ];
            $this->savePatientHistory($historyPayload, 'soap_dokter_tambah');

            return redirect()
                ->route('pelayanan.soap-bidan.index')
                ->with('success', 'SOAP Bidan berhasil disimpan');
        } catch (\Exception $e) {
            return redirect()
                ->back()
                ->with('error', 'Gagal menyimpan SOAP Bidan: ' . $e->getMessage());
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
                'nomor_rm' => 'nullable|string',
                'nama' => 'nullable|string',
                'sex' => 'nullable|string',
                'seks' => 'nullable|string',
                'penjamin' => 'nullable|string',
                'tanggal_lahir' => 'nullable|date',
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
                'htt' => 'nullable|string',
                'anamnesa' => 'nullable|string',
                'assesmen' => 'nullable|string',
                'expertise' => 'nullable|string',
                'evaluasi' => 'nullable|string',
                'plan' => 'nullable|string',
                'diet_list' => 'nullable|array',
                'diet_list.*.jenis_diet' => 'nullable|string',
                'diet_list.*.jenis_diet_makanan' => 'nullable|string',
                'diet_list.*.jenis_diet_makanan_tidak' => 'nullable|string',
                'tableData' => 'nullable|string',
                'status_apotek' => 'nullable|integer',
                'obat' => 'nullable|array',
                'resep_data' => 'nullable|string',
                'icd10_code' => 'nullable|array',
                'icd10_name' => 'nullable|array',
                'icd10_priority' => 'nullable|array',
                'icd9_code' => 'nullable|array',
                'icd9_name' => 'nullable|array',
                'tindakan_kode' => 'nullable|array',
                'tindakan_nama' => 'nullable|array',
                'tindakan_kategori' => 'nullable|array',
                'tindakan_pelaksana' => 'nullable|array',
                'tindakan_harga' => 'nullable|array',
            ]);

            // Extract diet data
            $dietList = $validated['diet_list'] ?? [];

            // Extract obat data
            $obatData = $validated['obat'] ?? [];
            if (empty($obatData) && !empty($validated['resep_data'])) {
                $decoded = json_decode($validated['resep_data'], true);
                if (is_array($decoded)) {
                    $obatData = $decoded;
                }
            }

            // Set status_apotek based on resep presence on update
            $validated['status_apotek'] = empty($obatData) ? 1 : 0;

            // Extract ICD data
            $icd10Data = [];
            if (!empty($validated['icd10_code']) && is_array($validated['icd10_code'])) {
                foreach ($validated['icd10_code'] as $index => $code) {
                    $icd10Data[] = [
                        'code' => $code,
                        'name' => $validated['icd10_name'][$index] ?? '',
                        'priority' => $validated['icd10_priority'][$index] ?? ''
                    ];
                }
            }

            $icd9Data = [];
            if (!empty($validated['icd9_code']) && is_array($validated['icd9_code'])) {
                foreach ($validated['icd9_code'] as $index => $code) {
                    $icd9Data[] = [
                        'code' => $code,
                        'name' => $validated['icd9_name'][$index] ?? '',
                        'priority' => $validated['icd9_priority'][$index] ?? ''
                    ];
                }
            }

            // Extract tindakan data
            $tindakanData = [];
            if (!empty($validated['tindakan_nama']) && is_array($validated['tindakan_nama'])) {
                // Frontend sends tindakan data as separate arrays that need to be grouped by index
                // Each tindakan has kode, nama, kategori, pelaksana, and harga at the same index
                $count = count($validated['tindakan_nama']);
                for ($i = 0; $i < $count; $i++) {
                    $tindakanData[] = [
                        'kode' => $validated['tindakan_kode'][$i] ?? '',
                        'nama' => $validated['tindakan_nama'][$i] ?? '',
                        'kategori' => $validated['tindakan_kategori'][$i] ?? '',
                        'pelaksana' => $validated['tindakan_pelaksana'][$i] ?? '',
                        'harga' => $validated['tindakan_harga'][$i] ?? '0'
                    ];
                }
            }

            // Convert sex to seks if needed
            if (isset($validated['sex']) && !isset($validated['seks'])) {
                $validated['seks'] = $validated['sex'];
                unset($validated['sex']);
            }

            // Remove diet, obat, ICD, and tindakan fields from main validated data
            unset($validated['diet_list'], $validated['obat'], $validated['resep_data']);
            unset($validated['icd10_code'], $validated['icd10_name'], $validated['icd10_priority']);
            unset($validated['icd9_code'], $validated['icd9_name'], $validated['icd9_priority']);
            unset($validated['tindakan_kode'], $validated['tindakan_nama'], $validated['tindakan_kategori'], $validated['tindakan_pelaksana'], $validated['tindakan_harga']);

            // If tensi empty but sistol/distol present, compose it
            if ((empty($validated['tensi']) || $validated['tensi'] === null)
                && !empty($validated['sistol']) && !empty($validated['distol'])
            ) {
                $validated['tensi'] = $validated['sistol'] . '/' . $validated['distol'];
            }

            // Normalisasi tableData jika datang sebagai string JSON (fallback)
            if (!empty($validated['tableData']) && is_string($validated['tableData'])) {
                $decoded = json_decode($validated['tableData'], true);
                $validated['tableData'] = is_array($decoded) ? $decoded : [];
            }

            // Ensure status_apotek set per resep presence
            $soapDokter = Pelayanan_Soap_Bidan::where('no_rawat', $nomor_register)->first();
            if (!$soapDokter) {
                return redirect()
                    ->route('pelayanan.soap-bidan.index')
                    ->with('error', 'Data SOAP Bidan tidak ditemukan');
            }

            $soapDokter->update($validated);

            // Save diet records to Pelayanan_Soap_Dokter_Diet table
            $this->saveDietData($dietList, array_merge($validated, ['no_rawat' => $nomor_register]));

            // Save ICD data to pelayanan_soap_bidan_icds table (upsert) - combined ICD10 and ICD9 in single row
            if (!empty($icd10Data) || !empty($icd9Data)) {
                // Get the first ICD10 and ICD9 data to combine in one row
                $icd10 = !empty($icd10Data) ? $icd10Data[0] : null;
                $icd9 = !empty($icd9Data) ? $icd9Data[0] : null;

                // Save combined ICD data in single row
                Pelayanan_Soap_Bidan_Icd::updateOrCreate([
                    'no_rawat' => $nomor_register,
                ], [
                    'nomor_rm' => $validated['nomor_rm'] ?? $soapDokter->nomor_rm,
                    'nama' => $validated['nama'] ?? $soapDokter->nama,
                    'seks' => $validated['seks'] ?? $soapDokter->seks,
                    'penjamin' => $validated['penjamin'] ?? $soapDokter->penjamin,
                    'tanggal_lahir' => $validated['tanggal_lahir'] ?? $soapDokter->tanggal_lahir,
                    'kode_icd10' => $icd10['code'] ?? null,
                    'nama_icd10' => $icd10['name'] ?? null,
                    'priority_icd10' => $icd10['priority'] ?? null,
                    'kode_icd9' => $icd9['code'] ?? null,
                    'nama_icd9' => $icd9['name'] ?? null,
                ]);
            }

            // Save tindakan data to pelayanan_soap_bidan_tindakans table (upsert)
            if (!empty($tindakanData)) {
                // Save tindakan data
                foreach ($tindakanData as $tindakan) {
                    // Handle multiple pelaksana if needed
                    $jenisPelaksana = is_array($tindakan['pelaksana']) ? implode(', ', $tindakan['pelaksana']) : $tindakan['pelaksana'];

                    Pelayanan_Soap_Bidan_Tindakan::updateOrCreate([
                        'no_rawat' => $nomor_register,
                        'kode_tindakan' => $tindakan['kode'],
                    ], [
                        'nomor_rm' => $validated['nomor_rm'] ?? $soapDokter->nomor_rm,
                        'nama' => $validated['nama'] ?? $soapDokter->nama,
                        'seks' => $validated['seks'] ?? $soapDokter->seks,
                        'penjamin' => $validated['penjamin'] ?? $soapDokter->penjamin,
                        'tanggal_lahir' => $validated['tanggal_lahir'] ?? $soapDokter->tanggal_lahir,
                        'jenis_tindakan' => $tindakan['nama'],
                        'kategori_tindakan' => $tindakan['kategori'],
                        'jenis_pelaksana' => $jenisPelaksana,
                        'harga' => $tindakan['harga'],
                        'status_kasir' => '0', // Default status
                    ]);
                }
            }

            // Update obat data - sync (delete by no_rawat then insert all)
            // Fetch patient snapshot for demographic fields
            $pelayanan = Pelayanan::with(['pasien', 'pendaftaran.penjamin'])
                ->where('nomor_register', $nomor_register)
                ->first();
            Pelayanan_Soap_Bidan_Obat::where('no_rawat', $nomor_register)->delete();
            if (!empty($obatData)) {
                $rows = [];
                foreach ($obatData as $obat) {
                    if (empty($obat['nama_obat'])) continue;
                    $rows[] = [
                        'no_rawat' => $nomor_register,
                        'nomor_rm' => $pelayanan->nomor_rm ?? '',
                        'nama' => optional($pelayanan->pasien)->nama ?? '',
                        'seks' => optional($pelayanan->pasien)->seks ?? '',
                        'penjamin' => optional(optional($pelayanan->pendaftaran)->penjamin)->nama ?? '',
                        'tanggal_lahir' => optional($pelayanan->pasien)->tanggal_lahir ?? '',
                        'penanda' => $obat['penanda'] ?? '',
                        'nama_obat' => $obat['nama_obat'] ?? '',
                        'instruksi' => $obat['instruksi'] ?? '',
                        'signa' => $obat['signa'] ?? '',
                        'satuan_gudang' => $obat['satuan_gudang'] ?? '',
                        'penggunaan' => $obat['penggunaan'] ?? '',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
                if (!empty($rows)) {
                    Pelayanan_Soap_Bidan_Obat::insert($rows);
                }
            }

            // Saat update, pastikan status dokter minimal berjalan (1)
            app(PelayananStatusService::class)->tandaiDokterBerjalan($nomor_register);
            // Tandai dokter selesai tahap pemeriksaan (2)
            app(PelayananStatusService::class)->tandaiDokterSelesai($nomor_register);

            // Save to patient history with enriched assessment/plan context
            $historyPayload = $validated;
            // Pastikan no_rawat terisi untuk enrichment metadata
            $historyPayload['no_rawat'] = $nomor_register;
            $historyPayload['assessment'] = [
                'diagnosis_icd10' => $icd10Data,
                'diagnosis_icd9' => $icd9Data,
                'tindakan' => $tindakanData,
                'resep_obat' => $obatData,
            ];
            $historyPayload['plan_detail'] = [
                'expertise' => $validated['expertise'] ?? '',
                'evaluasi' => $validated['evaluasi'] ?? '',
                'rencana' => $validated['plan'] ?? '',
            ];
            $this->savePatientHistory($historyPayload, 'soap_dokter_edit');

            return redirect()
                ->route('pelayanan.soap-bidan.index')
                ->with('success', 'SOAP Bidan berhasil diperbarui');
        } catch (\Exception $e) {
            return redirect()
                ->back()
                ->with('error', 'Gagal memperbarui SOAP Bidan: ' . $e->getMessage());
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

            // Update atau buat status pendaftaran menjadi 3 (selesai) dan tandai dokter complete (3)
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

            // Dokter selesai layanan penuh: set 4 (pelayanan selesai penuh)
            app(PelayananStatusService::class)->tandaiDokterSelesaiPenuh($nomor_register);

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
     * Mark doctor as present/started (hadir/berjalan)
     */
    public function hadirDokter(Request $request, $norawat): JsonResponse
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

            // Tandai dokter mulai memeriksa dan set timestamp panggil dokter, serta kunci perawat final (3)
            app(\App\Services\PelayananStatusService::class)->tandaiDokterBerjalan($nomor_register);
            app(\App\Services\PelayananStatusService::class)->setWaktuPanggilDokter($nomor_register);
            app(\App\Services\PelayananStatusService::class)->tandaiPerawatFinal($nomor_register);

            return response()->json([
                'success' => true,
                'message' => 'Pasien dipanggil untuk pemeriksaan dokter'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memanggil pasien: ' . $e->getMessage()
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

    /**
     * Halaman konfirmasi setelah ada permintaan (radiologi/lab) - status 3
     */
    public function konfirmasi(Request $request, string $norawat): InertiaResponse
    {
        $nomor_register = base64_decode($norawat, true);
        $pelayanan = Pelayanan::with(['pasien', 'pendaftaran.penjamin'])
            ->where('nomor_register', $nomor_register)
            ->first();

        $patientData = [
            'nomor_rm' => $pelayanan->nomor_rm ?? '',
            'nama' => optional($pelayanan->pasien)->nama ?? '',
            'nomor_register' => $pelayanan->nomor_register ?? '',
            'jenis_kelamin' => optional($pelayanan->pasien)->seks ?? '',
            'penjamin' => optional(optional($pelayanan->pendaftaran)->penjamin)->nama ?? '',
            'tanggal_lahir' => optional($pelayanan->pasien)->tanggal_lahir ?? '',
            'umur' => '',
        ];

        return Inertia::render('module/pelayanan/soap-bidan/konfirmasi', [
            'pelayanan' => $patientData,
            'norawat' => $norawat,
        ]);
    }

    /**
     * Simpan konfirmasi SOAP dengan file upload
     */
    public function storeKonfirmasi(Request $request, string $norawat): JsonResponse
    {
        try {
            $nomor_register = base64_decode($norawat, true);
            if ($nomor_register === false || $nomor_register === '') {
                return response()->json([
                    'success' => false,
                    'message' => 'Parameter tidak valid'
                ], 400);
            }

            $validated = $request->validate([
                'nomor_rm' => 'required|string',
                'nama' => 'required|string',
                'seks' => 'nullable|string',
                'penjamin' => 'nullable|string',
                'tanggal_lahir' => 'nullable|string',
                'umur' => 'nullable|string',
                'keterangan' => 'nullable|string',
                'files' => 'nullable|array',
                'files.*.file' => 'required|file|max:10240', // 10MB max per file
                'files.*.description' => 'nullable|string|max:500',
            ]);

            // Buat atau update konfirmasi
            $konfirmasi = Pelayanan_Soap_Konfirmasi::updateOrCreate(
                ['no_rawat' => $nomor_register],
                [
                    'nomor_rm' => $validated['nomor_rm'],
                    'nama' => $validated['nama'],
                    'seks' => $validated['seks'],
                    'penjamin' => $validated['penjamin'],
                    'tanggal_lahir' => $validated['tanggal_lahir'],
                    'umur' => $validated['umur'],
                    'keterangan' => $validated['keterangan'],
                ]
            );

            // Simpan file upload jika ada
            if (!empty($validated['files'])) {
                foreach ($validated['files'] as $fileData) {
                    $file = $fileData['file'];
                    $description = $fileData['description'] ?? '';

                    // Simpan file ke storage
                    $storedPath = Pelayanan_Soap_Konfirmasi_File::storeUploaded($file);

                    // Simpan metadata file ke database
                    Pelayanan_Soap_Konfirmasi_File::create([
                        'konfirmasi_id' => $konfirmasi->id,
                        'original_name' => $file->getClientOriginalName(),
                        'stored_path' => $storedPath,
                        'mime_type' => $file->getClientMimeType(),
                        'size_kb' => (int) round($file->getSize() / 1024),
                        'description' => $description,
                    ]);
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Konfirmasi berhasil disimpan',
                'data' => $konfirmasi->load('files')
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan konfirmasi: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Ambil daftar file konfirmasi untuk preview
     */
    public function getFiles(Request $request, string $norawat): JsonResponse
    {
        try {
            $nomor_register = base64_decode($norawat, true);
            if ($nomor_register === false || $nomor_register === '') {
                return response()->json([
                    'success' => false,
                    'message' => 'Parameter tidak valid'
                ], 400);
            }

            $konfirmasi = Pelayanan_Soap_Konfirmasi::with('files')
                ->where('no_rawat', $nomor_register)
                ->first();

            if (!$konfirmasi) {
                return response()->json([
                    'success' => true,
                    'data' => []
                ]);
            }

            return response()->json([
                'success' => true,
                'data' => $konfirmasi->files->map(function ($file) {
                    return [
                        'id' => $file->id,
                        'original_name' => $file->original_name,
                        'url' => $file->url,
                        'mime_type' => $file->mime_type,
                        'size_kb' => $file->size_kb,
                        'description' => $file->description,
                        'created_at' => $file->created_at->format('d/m/Y H:i'),
                    ];
                })
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data file: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Handle bidan hadir (panggil pasien)
     */
    public function hadirBidan(string $norawat): JsonResponse
    {
        try {
            $nomor_register = base64_decode($norawat, true);
            if ($nomor_register === false || $nomor_register === '') {
                return response()->json([
                    'success' => false,
                    'message' => 'Parameter tidak valid'
                ], 400);
            }

            $pelayananStatusService = new PelayananStatusService();
            $pelayananStatusService->tandaiBidanBerjalan($nomor_register);
            $pelayananStatusService->setWaktuPanggilBidan($nomor_register);

            return response()->json([
                'success' => true,
                'message' => 'Pasien berhasil dipanggil untuk bidan'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memanggil pasien: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Handle bidan selesai (setengah selesai - butuh konfirmasi)
     */
    public function setengahSelesaiPasien(string $norawat): JsonResponse
    {
        try {
            $nomor_register = base64_decode($norawat, true);
            if ($nomor_register === false || $nomor_register === '') {
                return response()->json([
                    'success' => false,
                    'message' => 'Parameter tidak valid'
                ], 400);
            }

            $pelayananStatusService = new PelayananStatusService();
            $pelayananStatusService->tandaiBidanPelayananSelesai($nomor_register);

            return response()->json([
                'success' => true,
                'message' => 'Pasien ditandai setengah selesai (butuh konfirmasi)'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menandai pasien setengah selesai: ' . $e->getMessage()
            ], 500);
        }
    }
}
