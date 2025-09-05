<?php

namespace App\Http\Controllers\Module\Pelayanan;

use App\Http\Controllers\Controller;
use App\Models\Module\Pelayanan\Pelayanan;
use App\Models\Module\Pelayanan\Pelayanan_Soap_Dokter;
use App\Models\Module\Pelayanan\Pelayanan_Soap_Dokter_Obat;
use App\Models\Module\Pelayanan\Pelayanan_Soap_Dokter_Icd;
use App\Models\Module\Pelayanan\Pelayanan_Soap_Dokter_Tindakan;
use App\Models\Module\Pelayanan\Pelayanan_status;
use App\Models\Module\Pelayanan\Pelayanan_So_Perawat;
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
use App\Models\Module\Pelayanan\Pelayanan_Soap_Dokter_Diet;
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

class Pelayanan_Soap_Dokter_Controller extends Controller
{
    /**
     * Display a listing of SOAP dokter data
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

            $nomorRegisters = $pelayanans->pluck('nomor_register')->all();

            $statusMap = Pelayanan_status::whereIn('nomor_register', $nomorRegisters)
                ->get()->keyBy('nomor_register');

            $pelayananData = [];
            foreach ($pelayanans as $p) {
                $ps = $statusMap->get($p->nomor_register);
                $statusDaftar = (int)optional($ps)->status_daftar ?? 0;
                $statusPerawat = (int)optional($ps)->status_perawat ?? 0;
                $statusDokter = (int)optional($ps)->status_dokter ?? 0;

                // Hanya tampilkan di daftar dokter jika perawat sudah selesai (status_perawat = 2)
                if ($statusPerawat < 2) {
                    continue;
                }

                $tindakan = 'panggil';
                if (!($statusDaftar < 2 || $statusPerawat < 2)) {
                    if ($statusDokter === 0) {
                        $tindakan = 'panggil';
                    } elseif ($statusDokter === 1) {
                        // saat pemeriksaan dokter berjalan, jika sudah ada SOAP, tampilkan edit
                        $existingSoap = Pelayanan_Soap_Dokter::where('no_rawat', $p->nomor_register)->first();
                        $tindakan = $existingSoap ? 'edit' : 'soap';
                    } elseif ($statusDokter === 2) {
                        // tindakan lanjutan (rujukan, permintaan, edit)
                        $tindakan = 'edit';
                    } elseif ($statusDokter === 3) {
                        // pelayanan selesai
                        $tindakan = 'Complete';
                    }
                }

                $pelayananData[] = [
                    'id' => $p->id,
                    'nomor_rm' => $p->nomor_rm,
                    'nomor_register' => $p->nomor_register,
                    'tanggal_kujungan' => $p->tanggal_kujungan,
                    'poli_id' => $p->poli_id,
                    'dokter_id' => $p->dokter_id,
                    'tindakan_button' => $tindakan,
                    'pasien' => [
                        'nama' => optional($p->pasien)->nama ?? '-',
                    ],
                    'poli' => [
                        'nama' => optional($p->poli)->nama ?? '-',
                    ],
                    'dokter' => [
                        'id' => $p->dokter_id,
                        'namauser' => [
                            'name' => optional(optional($p->dokter)->namauser)->name ?? (optional($p->dokter)->nama ?? '-'),
                        ],
                    ],
                    'dokter_name' => optional(optional($p->dokter)->namauser)->name ?? (optional($p->dokter)->nama ?? '-'),
                    'pendaftaran' => [
                        'antrian' => optional($p->pendaftaran)->antrian ?? '-',
                    ],
                    'status_daftar' => $statusDaftar,
                    'status_perawat' => $statusPerawat,
                    'status_dokter' => $statusDokter,
                    'can_call' => ($statusDaftar >= 2 && $statusPerawat >= 2 && $statusDokter === 0),
                ];
            }

            return Inertia::render('module/pelayanan/soap-dokter/index', [
                'pelayanan' => $pelayananData
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
    public function show(Request $request, $norawat): InertiaResponse|RedirectResponse
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

            // Get existing diet data
            $existingDietData = Pelayanan_Soap_Dokter_Diet::where('no_rawat', $nomor_register)->get();

            // Get SO Perawat data to display hasil perawat on doctor's page
            $soPerawat = Pelayanan_So_Perawat::where('no_rawat', $nomor_register)->first();

            // Guard akses pemeriksaan dokter: daftar harus 2 dan perawat 2
            $status = app(PelayananStatusService::class)->ambilStatus($nomor_register);
            $statusDaftar = $status['status_daftar'];
            $statusPerawat = $status['status_perawat'];
            if ($statusDaftar < 2 || $statusPerawat < 2) {
                return redirect()
                    ->route('pelayanan.so-dokter.index')
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
                    ->route('pelayanan.so-dokter.index')
                    ->with('error', 'Data pasien tidak ditemukan');
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

            // Get Diet master data
            $jenisDiet = Jenis_Diet::all();
            $makanan = Makanan::all();

            Log::info('SOAP Dokter Show - About to render view with data', [
                'patient_data' => $patientData,
                'soap_dokter_exists' => $soapDokter ? true : false,
                'norawat' => $norawat
            ]);

            return Inertia::render('module/pelayanan/soap-dokter/pemeriksaan', [
                'pelayanan' => $patientData,
                'soap_dokter' => $soapDokter, // null for create mode, data for edit mode
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
     * Save diet data to Pelayanan_Soap_Dokter_Diet table
     */
    private function saveDietData($dietList, $validated)
    {
        if (!empty($dietList)) {
            // Delete existing diet records for this patient
            Pelayanan_Soap_Dokter_Diet::where('no_rawat', $validated['no_rawat'])->delete();
            
            // Save diet data
            foreach ($dietList as $diet) {
                Pelayanan_Soap_Dokter_Diet::create([
                    'nomor_rm' => $validated['nomor_rm'],
                    'nama' => $validated['nama'],
                    'no_rawat' => $validated['no_rawat'],
                    'seks' => $validated['seks'],
                    'penjamin' => $validated['penjamin'],
                    'tanggal_lahir' => $validated['tanggal_lahir'],
                    'jenis_diet' => $diet['jenis_diet'] ?? '',
                    'jenis_diet_makanan' => $diet['jenis_diet_makanan'] ?? '',
                    'jenis_diet_makanan_tidak' => $diet['jenis_diet_makanan_tidak'] ?? '',
                ]);
            }
        }
    }

    /**
            $obatData = $validated['obat'] ?? [];

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
                // Each tindakan has a nama, pelaksana, and harga at the same index
                $count = count($validated['tindakan_nama']);
                for ($i = 0; $i < $count; $i++) {
                    $tindakanData[] = [
                        'nama' => $validated['tindakan_nama'][$i] ?? '',
                        'pelaksana' => $validated['tindakan_pelaksana'][$i] ?? '',
                        'harga' => $validated['tindakan_harga'][$i] ?? '0'
                    ];
                }
            }

            // Remove diet, obat, ICD, and tindakan fields from main validated data
            unset($validated['diet_list'], $validated['obat']);
            unset($validated['icd10_code'], $validated['icd10_name'], $validated['icd10_priority']);
            unset($validated['icd9_code'], $validated['icd9_name'], $validated['icd9_priority']);
            unset($validated['tindakan_nama'], $validated['tindakan_pelaksana'], $validated['tindakan_harga']);

            // If tensi empty but sistol/distol present, compose it
            if ((empty($validated['tensi']) || $validated['tensi'] === null)
                && !empty($validated['sistol']) && !empty($validated['distol'])
            ) {
                $validated['tensi'] = $validated['sistol'] . '/' . $validated['distol'];
            }

            // Lengkapi identitas pasien jika tidak dikirim dari frontend
            if (empty($validated['nomor_rm']) || empty($validated['nama'])) {
                $pel = Pelayanan::with(['pasien', 'pendaftaran.penjamin'])
                    ->where('nomor_register', $validated['no_rawat'])
                    ->first();
                if ($pel) {
                    $validated['nomor_rm'] = $validated['nomor_rm'] ?? ($pel->nomor_rm ?? '');
                    $validated['nama'] = $validated['nama'] ?? (optional($pel->pasien)->nama ?? '');
                    $validated['seks'] = $validated['seks'] ?? (optional($pel->pasien)->seks ?? '');
                    $validated['penjamin'] = $validated['penjamin'] ?? (optional(optional($pel->pendaftaran)->penjamin)->nama ?? '');
                    $validated['tanggal_lahir'] = $validated['tanggal_lahir'] ?? (optional($pel->pasien)->tanggal_lahir ?? '');
                    $validated['umur'] = $validated['umur'] ?? '';
                }
            }

            // Normalisasi tableData jika datang sebagai string JSON (fallback)
            if (!empty($validated['tableData']) && is_string($validated['tableData'])) {
                $decoded = json_decode($validated['tableData'], true);
                $validated['tableData'] = is_array($decoded) ? $decoded : [];
            }

            // Create new SOAP dokter record
            if (!isset($validated['status_apotek'])) {
                $validated['status_apotek'] = 0; // skip apotek for now
            }
            $soapDokter = Pelayanan_Soap_Dokter::create($validated);

            // Save diet records to Pelayanan_Soap_Dokter_Diet table
            if ($soapDokter) {
                $this->saveDietData($dietList, $validated);
            }

            // Save ICD data to pelayanan_soap_dokter_icds table
            if ($soapDokter && (!empty($icd10Data) || !empty($icd9Data))) {
                // Delete existing ICD records for this patient
                Pelayanan_Soap_Dokter_Icd::where('no_rawat', $validated['no_rawat'])->delete();
                
                // Save ICD10 data
                foreach ($icd10Data as $icd) {
                    Pelayanan_Soap_Dokter_Icd::create([
                        'nomor_rm' => $validated['nomor_rm'],
                        'nama' => $validated['nama'],
                        'no_rawat' => $validated['no_rawat'],
                        'seks' => $validated['seks'],
                        'penjamin' => $validated['penjamin'],
                        'tanggal_lahir' => $validated['tanggal_lahir'],
                        'nama_icd10' => $icd['name'],
                        'kode_icd10' => $icd['code'],
                        'priority_icd10' => $icd['priority'],
                    ]);
                }
                
                // Save ICD9 data
                foreach ($icd9Data as $icd) {
                    Pelayanan_Soap_Dokter_Icd::create([
                        'nomor_rm' => $validated['nomor_rm'],
                        'nama' => $validated['nama'],
                        'no_rawat' => $validated['no_rawat'],
                        'seks' => $validated['seks'],
                        'penjamin' => $validated['penjamin'],
                        'tanggal_lahir' => $validated['tanggal_lahir'],
                        'nama_icd9' => $icd['name'],
                        'kode_icd9' => $icd['code'],
                        'priority_icd9' => $icd['priority'] ?? '',
                    ]);
                }
            }

            // Save tindakan data to pelayanan_soap_dokter_tindakans table
            if ($soapDokter && !empty($tindakanData)) {
                // Delete existing tindakan records for this patient
                Pelayanan_Soap_Dokter_Tindakan::where('no_rawat', $validated['no_rawat'])->delete();
                
                // Save tindakan data
                foreach ($tindakanData as $tindakan) {
                    // Handle multiple pelaksana if needed
                    $jenisPelaksana = is_array($tindakan['pelaksana']) ? implode(', ', $tindakan['pelaksana']) : $tindakan['pelaksana'];
                    
                    Pelayanan_Soap_Dokter_Tindakan::create([
                        'nomor_rm' => $validated['nomor_rm'],
                        'nama' => $validated['nama'],
                        'no_rawat' => $validated['no_rawat'],
                        'seks' => $validated['seks'],
                        'penjamin' => $validated['penjamin'],
                        'tanggal_lahir' => $validated['tanggal_lahir'],
                        'jenis_tindakan' => $tindakan['nama'],
                        'jenis_pelaksana' => $jenisPelaksana,
                        'harga' => $tindakan['harga'],
                        'status_kasir' => '0', // Default status
                    ]);
                }
            }

            // Save obat data to pelayanan_soap_dokter_obats table
            if ($soapDokter && !empty($obatData)) {
                foreach ($obatData as $obat) {
                    if (!empty($obat['nama_obat']) && !empty($obat['jumlah'])) {
                        Pelayanan_Soap_Dokter_Obat::create([
                            'nomor_rm' => $validated['nomor_rm'],
                            'nama' => $validated['nama'],
                            'no_rawat' => $validated['no_rawat'],
                            'seks' => $validated['seks'],
                            'penjamin' => $validated['penjamin'],
                            'tanggal_lahir' => $validated['tanggal_lahir'],
                            'penanda' => $obat['penanda'] ?? '',
                            'nama_obat' => $obat['nama_obat'],
                            'jumlah' => (int)$obat['jumlah'],
                            'instruksi' => $obat['instruksi'] ?? '',
                            'signa' => $obat['signa'] ?? '',
                            'satuan_gudang' => $obat['satuan_gudang'] ?? '',
                            'penggunaan' => $obat['penggunaan'] ?? '',
                        ]);
                    }
                }
            }


            // Set status dokter berjalan saat simpan pertama dan kunci perawat final (3)
            app(PelayananStatusService::class)->tandaiDokterBerjalan($validated['no_rawat']);
            app(PelayananStatusService::class)->tandaiPerawatFinal($validated['no_rawat']);

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
                'diet_list' => 'nullable|array',
                'diet_list.*.jenis_diet' => 'nullable|string',
                'diet_list.*.jenis_diet_makanan' => 'nullable|string',
                'diet_list.*.jenis_diet_makanan_tidak' => 'nullable|string',
                'tableData' => 'nullable|array',
                'status_apotek' => 'nullable|integer',
                'obat' => 'nullable|array',
                'icd10_code' => 'nullable|array',
                'icd10_name' => 'nullable|array',
                'icd10_priority' => 'nullable|array',
                'icd9_code' => 'nullable|array',
                'icd9_name' => 'nullable|array',
                'tindakan_nama' => 'nullable|array',
                'tindakan_pelaksana' => 'nullable|array',
                'tindakan_harga' => 'nullable|array',
            ]);

            // Extract diet data
            $dietList = $validated['diet_list'] ?? [];

            // Extract obat data
            $obatData = $validated['obat'] ?? [];

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
                // Each tindakan has a nama, pelaksana, and harga at the same index
                $count = count($validated['tindakan_nama']);
                for ($i = 0; $i < $count; $i++) {
                    $tindakanData[] = [
                        'nama' => $validated['tindakan_nama'][$i] ?? '',
                        'pelaksana' => $validated['tindakan_pelaksana'][$i] ?? '',
                        'harga' => $validated['tindakan_harga'][$i] ?? '0'
                    ];
                }
            }

            // Remove diet, obat, ICD, and tindakan fields from main validated data
            unset($validated['diet_list'], $validated['obat']);
            unset($validated['icd10_code'], $validated['icd10_name'], $validated['icd10_priority']);
            unset($validated['icd9_code'], $validated['icd9_name'], $validated['icd9_priority']);
            unset($validated['tindakan_nama'], $validated['tindakan_pelaksana'], $validated['tindakan_harga']);

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

            if (!isset($validated['status_apotek'])) {
                $validated['status_apotek'] = 0; // skip apotek for now
            }
            $soapDokter = Pelayanan_Soap_Dokter::where('no_rawat', $nomor_register)->first();
            if (!$soapDokter) {
                return redirect()
                    ->route('pelayanan.so-dokter.index')
                    ->with('error', 'Data SOAP Dokter tidak ditemukan');
            }

            $soapDokter->update($validated);

            // Save diet records to Pelayanan_Soap_Dokter_Diet table
            $this->saveDietData($dietList, array_merge($validated, ['no_rawat' => $nomor_register]));

            // Save ICD data to pelayanan_soap_dokter_icds table
            if (!empty($icd10Data) || !empty($icd9Data)) {
                // Delete existing ICD records for this patient
                Pelayanan_Soap_Dokter_Icd::where('no_rawat', $nomor_register)->delete();
                
                // Save ICD10 data
                foreach ($icd10Data as $icd) {
                    Pelayanan_Soap_Dokter_Icd::create([
                        'nomor_rm' => $validated['nomor_rm'],
                        'nama' => $validated['nama'],
                        'no_rawat' => $nomor_register,
                        'seks' => $validated['seks'],
                        'penjamin' => $validated['penjamin'],
                        'tanggal_lahir' => $validated['tanggal_lahir'],
                        'nama_icd10' => $icd['name'],
                        'kode_icd10' => $icd['code'],
                        'priority_icd10' => $icd['priority'],
                    ]);
                }
                
                // Save ICD9 data
                foreach ($icd9Data as $icd) {
                    Pelayanan_Soap_Dokter_Icd::create([
                        'nomor_rm' => $validated['nomor_rm'],
                        'nama' => $validated['nama'],
                        'no_rawat' => $nomor_register,
                        'seks' => $validated['seks'],
                        'penjamin' => $validated['penjamin'],
                        'tanggal_lahir' => $validated['tanggal_lahir'],
                        'nama_icd9' => $icd['name'],
                        'kode_icd9' => $icd['code'],
                        'priority_icd9' => $icd['priority'] ?? '',
                    ]);
                }
            }

            // Save tindakan data to pelayanan_soap_dokter_tindakans table
            if (!empty($tindakanData)) {
                // Delete existing tindakan records for this patient
                Pelayanan_Soap_Dokter_Tindakan::where('no_rawat', $nomor_register)->delete();
                
                // Save tindakan data
                foreach ($tindakanData as $tindakan) {
                    // Handle multiple pelaksana if needed
                    $jenisPelaksana = is_array($tindakan['pelaksana']) ? implode(', ', $tindakan['pelaksana']) : $tindakan['pelaksana'];
                    
                    Pelayanan_Soap_Dokter_Tindakan::create([
                        'nomor_rm' => $validated['nomor_rm'],
                        'nama' => $validated['nama'],
                        'no_rawat' => $nomor_register,
                        'seks' => $validated['seks'],
                        'penjamin' => $validated['penjamin'],
                        'tanggal_lahir' => $validated['tanggal_lahir'],
                        'jenis_tindakan' => $tindakan['nama'],
                        'jenis_pelaksana' => $jenisPelaksana,
                        'harga' => $tindakan['harga'],
                        'status_kasir' => '0', // Default status
                    ]);
                }
            }

            // Update obat data - delete existing and create new ones
            if (!empty($obatData)) {
                // Delete existing obat records for this patient
                Pelayanan_Soap_Dokter_Obat::where('no_rawat', $nomor_register)->delete();
                
                // Get patient data for obat records
                $pelayanan = Pelayanan::with(['pasien', 'pendaftaran.penjamin'])
                    ->where('nomor_register', $nomor_register)
                    ->first();
                
                // Create new obat records
                foreach ($obatData as $obat) {
                    if (!empty($obat['nama_obat']) && !empty($obat['jumlah'])) {
                        Pelayanan_Soap_Dokter_Obat::create([
                            'nomor_rm' => $pelayanan->nomor_rm ?? '',
                            'nama' => optional($pelayanan->pasien)->nama ?? '',
                            'no_rawat' => $nomor_register,
                            'seks' => optional($pelayanan->pasien)->seks ?? '',
                            'penjamin' => optional(optional($pelayanan->pendaftaran)->penjamin)->nama ?? '',
                            'tanggal_lahir' => optional($pelayanan->pasien)->tanggal_lahir ?? '',
                            'penanda' => $obat['penanda'] ?? '',
                            'nama_obat' => $obat['nama_obat'],
                            'jumlah' => (int)$obat['jumlah'],
                            'instruksi' => $obat['instruksi'] ?? '',
                            'signa' => $obat['signa'] ?? '',
                            'satuan_gudang' => $obat['satuan_gudang'] ?? '',
                            'penggunaan' => $obat['penggunaan'] ?? '',
                        ]);
                    }
                }
            }

            // Saat update, pastikan status dokter minimal berjalan (1)
            app(PelayananStatusService::class)->tandaiDokterBerjalan($nomor_register);

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

            // Dokter selesai layanan penuh: set 3 (pelayanan selesai)
            app(PelayananStatusService::class)->tandaiDokterPelayananSelesai($nomor_register);

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

            // Tandai dokter mulai memeriksa dan kunci perawat final (3)
            app(\App\Services\PelayananStatusService::class)->tandaiDokterBerjalan($nomor_register);
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
}
