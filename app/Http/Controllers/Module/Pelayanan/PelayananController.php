<?php

namespace App\Http\Controllers\Module\Pelayanan;

use App\Http\Controllers\Controller;
use App\Models\Module\Pelayanan\Pelayanan;
use App\Models\Module\Pelayanan\Pelayanan_So_Perawat;
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
     * Display a listing of pelayanan data for perawat
     */
    public function index(): InertiaResponse
    {
        try {
            $dummyData = [
                [
                    'id' => 1,
                    'nomor_rm' => '000001',
                    'nomor_register' => 'REG001',
                    'tanggal_kujungan' => '2025-08-28',
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
                    'tanggal_kujungan' => '2025-08-28',
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

            // Ambil daftar pelayanan HARI INI, join dengan SO Perawat untuk tentukan state tindakan
            $today = Carbon::today();
            $pelayanans = Pelayanan::with(['pasien', 'poli', 'dokter.namauser', 'pendaftaran.penjamin'])
                ->whereDate('tanggal_kujungan', '=', $today)
                ->orderBy('created_at', 'desc')
                ->get()
                // Hindari duplikasi baris untuk nomor_register yang sama
                ->unique('nomor_register')
                ->values();

            $nomorRegisters = $pelayanans->pluck('nomor_register')->all();

            // Ambil semua SO Perawat yang terkait dengan nomor_register hari ini untuk lookup cepat
            $soMap = Pelayanan_So_Perawat::whereIn('no_rawat', $nomorRegisters)
                ->get()
                ->keyBy('no_rawat');

            // Ambil status pelayanan untuk menentukan tahapan panggil/periksa/selesai
            $pelayananStatusMap = Pelayanan_status::whereIn('nomor_register', $nomorRegisters)
                ->get()->keyBy('nomor_register');

            $pelayananData = [];
            foreach ($pelayanans as $p) {
                $so = $soMap->get($p->nomor_register);

                // Tentukan tindakan_button berdasarkan status pelayanan
                // status_daftar: 0 belum, 1 dipanggil/ruang, 2 selesai daftar
                // status_perawat: 0 belum, 1 dipanggil/ruang, 2 selesai perawat, 3 complete
                $tindakan = 'panggil';
                $statusPerawat = null;
                $statusDokter = null;
                $statusDaftar = null;
                $ps = $pelayananStatusMap->get($p->nomor_register);
                if ($ps) {
                    $statusDaftar = (int)($ps->status_daftar ?? 0);
                    $statusPerawat = (int)($ps->status_perawat ?? 0);
                    $statusDokter = (int)($ps->status_dokter ?? 0);

                    if ($statusDaftar < 2) {
                        // Di UI tidak ada Hadir (Daftar), tampilkan Panggil namun disabled via flag
                        $tindakan = 'panggil';
                    } else {
                        if ($statusPerawat === 0) {
                            $tindakan = 'panggil';
                        } elseif ($statusPerawat === 1) {
                            $tindakan = 'soap';
                        } elseif ($statusPerawat === 2) {
                            $tindakan = 'edit';
                        } elseif ($statusPerawat === 3) {
                            $tindakan = 'complete';
                        }
                    }
                }

                $statusLabelMap = [
                    0 => 'Menunggu dipanggil',
                    1 => 'Dipanggil / Dalam pemeriksaan',
                    2 => 'Selesai tahap',
                    3 => 'Selesai (complete)'
                ];
                $statusLabel = $statusLabelMap[$statusPerawat ?? 0] ?? 'Menunggu dipanggil';

                $pelayananData[] = [
                    'id' => $p->id,
                    'nomor_rm' => $p->nomor_rm,
                    'nomor_register' => $p->nomor_register,
                    'tanggal_kujungan' => $p->tanggal_kujungan,
                    'poli_id' => $p->poli_id,
                    'dokter_id' => $p->dokter_id,
                    'tindakan_button' => $tindakan,
                    'pasien' => [
                        'nama' => optional($p->pasien)->nama ?? ($so->nama ?? ''),
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
                    // String fallback agar frontend mudah menampilkan nama dokter
                    'dokter_name' => optional(optional($p->dokter)->namauser)->name ?? (optional($p->dokter)->nama ?? '-'),
                    'pendaftaran' => [
                        'antrian' => optional($p->pendaftaran)->antrian ?? '-',
                    ],
                    // Status untuk kontrol UI
                    'status_daftar' => $statusDaftar ?? 0,
                    'status_perawat' => $statusPerawat ?? 0,
                    'status_dokter' => $statusDokter ?? 0,
                    'status_label' => $statusLabel,
                    'can_hadir_daftar' => false,
                    'can_selesai_daftar' => false,
                    'can_call' => ($statusDaftar ?? 0) === 2 && ($statusPerawat ?? 0) === 0,
                    'can_soap' => ($statusPerawat ?? 0) === 1,
                    'can_edit' => ($statusPerawat ?? 0) === 2,
                    'is_complete' => ($statusPerawat ?? 0) === 3,
                ];
            }

            return Inertia::render('module/pelayanan/so-perawat/index', [
                'pelayanan' => $pelayananData
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
     * Edit SO Perawat data for a specific patient (now uses pemeriksaan component)
     */
    public function edit(Request $request, string $norawat): InertiaResponse
    {
        return $this->show($request, $norawat);
    }

    /**
     * Store new SO Perawat data
     */
    public function store(Request $request): RedirectResponse
    {
        try {
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
                'kesadaran' => 'nullable|string',
                'summernote' => 'nullable|string',
            ]);

            // Fill Auth info
            $validated['user_input_id'] = Auth::id() ?? 1;
            $validated['user_input_name'] = Auth::user()->name ?? 'System';

            // If tensi empty but sistol/distol present, compose it
            if ((empty($validated['tensi']) || $validated['tensi'] === null)
                && !empty($validated['sistol']) && !empty($validated['distol'])) {
                $validated['tensi'] = $validated['sistol'] . '/' . $validated['distol'];
            }

            // Create new SO Perawat record
            Pelayanan_So_Perawat::create($validated);

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
            ]);

            $so = Pelayanan_So_Perawat::where('no_rawat', $nomor_register)->first();
            if (!$so) {
                return redirect()
                    ->route('pelayanan.so-perawat.index')
                    ->with('error', 'Data SO Perawat tidak ditemukan');
            }

            // Fill Auth info
            $validated['user_input_id'] = Auth::id() ?? $so->user_input_id;
            $validated['user_input_name'] = Auth::user()->name ?? $so->user_input_name;

            // If tensi empty but sistol/distol present, compose it
            if ((empty($validated['tensi']) || $validated['tensi'] === null)
                && !empty($validated['sistol']) && !empty($validated['distol'])) {
                $validated['tensi'] = $validated['sistol'] . '/' . $validated['distol'];
            }

            $so->update($validated);

            // Setelah pemeriksaan perawat disimpan, set perawat=2; dokter tetap 0 menunggu hadir dokter
            Pelayanan_status::updateOrCreate(
                ['nomor_register' => $nomor_register],
                ['status_perawat' => 2]
            );
            // legacy update dihapus

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

            // Check if SO Perawat already exists
            $existingSo = Pelayanan_So_Perawat::where('no_rawat', $nomor_register)->first();

            // Create initial SO Perawat record if not exists
            if (!$existingSo) {
                Pelayanan_So_Perawat::create([
                    'nomor_rm' => $pelayanan->nomor_rm,
                    'nama' => $pelayanan->pasien->nama,
                    'no_rawat' => $nomor_register,
                    'seks' => $pelayanan->pasien->seks ?? 'L',
                    'penjamin' => optional($pelayanan->pendaftaran->penjamin)->nama ?? 'Umum',
                    'tanggal_lahir' => $pelayanan->pasien->tanggal_lahir,
                    'umur' => ($pelayanan->pasien && $pelayanan->pasien->tanggal_lahir)
                        ? Carbon::parse($pelayanan->pasien->tanggal_lahir)->diffInYears(Carbon::now()) . ' Tahun'
                        : '0 Tahun',
                    'user_input_id' => Auth::id() ?? 1,
                    'user_input_name' => Auth::user()->name ?? 'System',
                ]);
            }

            // Update status: hadir perawat (berbeda dengan hadir daftar di modul pendaftaran)
            $currentStatus = Pelayanan_status::firstOrNew(['nomor_register' => $nomor_register]);
            $currentStatus->pasien_id = $pelayanan->pasien_id;
            $currentStatus->tanggal_kujungan = $pelayanan->tanggal_kujungan;

            // Hadir perawat: set ke 1 (dipanggil perawat) hanya jika daftar sudah selesai (2). Tidak mengubah status_daftar di sini.
            if ((int)($currentStatus->status_daftar ?? 0) === 2) {
                $currentStatus->status_perawat = 1;
            }

            $currentStatus->save();
            // legacy update dihapus (tidak lagi memakai pendaftaran_statuses)

            return response()->json([
                'success' => true,
                'message' => $existingSo ? 'Pasien sudah dipanggil sebelumnya' : 'Pasien berhasil dipanggil dan siap untuk pemeriksaan'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memanggil pasien: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Tandai tahap pendaftaran sebagai selesai (status_daftar = 2)
     */
    public function selesaiDaftar(Request $request, $norawat): JsonResponse
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

            $status = Pelayanan_status::firstOrNew(['nomor_register' => $nomor_register]);
            $status->pasien_id = $pelayanan->pasien_id;
            $status->tanggal_kujungan = $pelayanan->tanggal_kujungan;
            $status->status_daftar = 2;
            $status->save();

            return response()->json([
                'success' => true,
                'message' => 'Pendaftaran ditandai selesai'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyelesaikan pendaftaran: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Konfirmasi hadir untuk tahap dokter (status_dokter = 1) setelah perawat selesai.
     */
    public function hadirDokter(Request $request, $norawat): JsonResponse
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

            $status = Pelayanan_status::firstOrNew(['nomor_register' => $nomor_register]);
            // Hanya boleh hadir dokter jika daftar selesai (2) dan perawat selesai (2)
            if ((int)($status->status_daftar ?? 0) === 2 && (int)($status->status_perawat ?? 0) === 2) {
                $status->status_dokter = 1;
                $status->pasien_id = $pelayanan->pasien_id;
                $status->tanggal_kujungan = $pelayanan->tanggal_kujungan;
                $status->save();

                return response()->json([
                    'success' => true,
                    'message' => 'Pasien hadir untuk pemeriksaan dokter'
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Selesaikan tahap pendaftaran dan perawat terlebih dahulu'
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengubah status dokter: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Tandai pasien selesai di tahap dokter (status_dokter = 2)
     */
    public function selesaiDokter(Request $request, $norawat): JsonResponse
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

            $status = Pelayanan_status::firstOrNew(['nomor_register' => $nomor_register]);
            // Hanya bisa selesai dokter jika sudah hadir dokter (1)
            if ((int)($status->status_dokter ?? 0) >= 1) {
                $status->status_dokter = 2;
                $status->save();

                return response()->json([
                    'success' => true,
                    'message' => 'Pemeriksaan dokter ditandai selesai'
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Pasien belum hadir untuk dokter'
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyelesaikan pemeriksaan dokter: ' . $e->getMessage()
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

            // Normalisasi nilai poliId ke string (kolom poli bertipe string di DB)
            $poliFilter = (string) $poliId;

            $dokters = Dokter::with(['namauser'])
                ->where('poli', $poliFilter)
                ->whereHas('jadwal', function ($query) use ($datetime) {
                    $query->where('aktif', true);
                    if (!empty($datetime)) {
                        try {
                            $date = Carbon::parse($datetime);
                        } catch (\Exception $e) {
                            // Fallback: gunakan tanggal sekarang bila format tidak valid
                            $date = Carbon::now();
                        }
                        $hariMapping = [
                            0 => 'Minggu',
                            1 => 'Senin',
                            2 => 'Selasa',
                            3 => 'Rabu',
                            4 => 'Kamis',
                            5 => 'Jumat',
                            6 => 'Sabtu',
                        ];
                        $hari = $hariMapping[$date->dayOfWeek] ?? null;
                        if (!empty($hari)) {
                            $query->whereRaw('LOWER(hari) = ?', [strtolower($hari)]);
                        }
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
            if ($statusDaftar < 2) {
                // Redirect kembali ke index dengan pesan untuk konfirmasi hadir daftar dahulu
                return redirect()
                    ->route('pelayanan.so-perawat.index')
                    ->with('error', 'Pasien belum konfirmasi hadir pada tahap pendaftaran');
            }

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

            return Inertia::render('module/pelayanan/so-perawat/pemeriksaan', [
                'pelayanan' => $patientData,
                'so_perawat' => $soPerawat, // null for create mode, data for edit mode
                'gsc_eye' => $gcsEye,
                'gcs_verbal' => $gcsVerbal,
                'gcs_motorik' => $gcsMotorik,
                'gcs_kesadaran' => $gcsKesadaran,
                'htt_pemeriksaan' => $httPemeriksaan,
                'norawat' => $norawat
            ]);
        } catch (\Exception $e) {
            return Inertia::render('module/pelayanan/so-perawat/pemeriksaan', [
                'errors' => ['error' => 'Gagal memuat data pemeriksaan: ' . $e->getMessage()]
            ]);
        }
    }
}
