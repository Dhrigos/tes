<?php

namespace App\Http\Controllers\Module\Pelayanan;

use App\Http\Controllers\Controller;
use App\Models\Module\Pelayanan\Pelayanan;
use App\Models\Module\Pelayanan\Pelayanan_status;
use App\Models\Module\SDM\Dokter;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use App\Models\Module\Pelayanan\Gcs\Gcs_Eye;
use App\Models\Module\Pelayanan\Gcs\Gcs_Verbal;
use App\Models\Module\Pelayanan\Gcs\Gcs_Motorik;
use App\Models\Module\Pelayanan\Gcs\Gcs_Kesadaran;
use App\Models\Module\Pelayanan\SoapDokter\PelayananSoapDokterObat;
use App\Models\Module\Pelayanan\SoapDokter\PelayananSoapDokterTindakan;
use App\Models\Module\Pelayanan\SoapDokter\PelayananSoapDokterIcd;
use App\Models\Module\Pelayanan\SoapDokter\PelayananSoapDokter;
use App\Models\Module\Pelayanan\PelayananRujukan;
use App\Models\Module\Pelayanan\PelayananPermintaan;
use App\Models\Module\Pelayanan\PelayananSoPerawat;
use App\Models\Module\Pelayanan\PelayananStatus;
use App\Models\Module\Pelayanan\Pelayanan_So_Perawat;
use App\Models\Module\Pelayanan\Pelayanan_Soap_Dokter;
use App\Services\PelayananStatusService;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Query\Exception as QueryException;
use Illuminate\Database\QueryException as DatabaseQueryException;
use Exception;
use Illuminate\Support\Facades\Log;
use App\Models\Module\Pasien\Pasien_History;

class PelayananController extends Controller
{
    /**
     * Hapus catatan dengan aman dari tabel yang mungkin tidak ada
     *
     * @param string $table
     * @param array $conditions
     * @return bool
     */
    private function hapusDariTabel($table, $conditions = [])
    {
        try {
            // Periksa apakah tabel ada terlebih dahulu
            if (Schema::hasTable($table)) {
                Log::info("Tabel {$table} tidak ada, melewati penghapusan");
                return true; // Dianggap berhasil karena tidak ada yang perlu dihapus
            }

            // Jika tabel ada, lakukan penghapusan
            $query = DB::table($table);

            foreach ($conditions as $column => $value) {
                if (is_array($value)) {
                    $query->whereIn($column, $value);
                } else {
                    $query->where($column, $value);
                }
            }

            $deleted = $query->delete();
            Log::info("Dihapus {$deleted} catatan dari tabel {$table}");

            return true;
        } catch (DatabaseQueryException $e) {
            Log::warning("Gagal menghapus dari tabel {$table}: " . $e->getMessage());
            return false; // Gagal tetapi tidak melempar exception
        } catch (Exception $e) {
            Log::warning("Error tidak terduga saat menghapus dari tabel {$table}: " . $e->getMessage());
            return false; // Gagal tetapi tidak melempar exception
        }
    }

    
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
        } catch (Exception $e) {
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
        } catch (Exception $e) {
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
        } catch (Exception $e) {
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

    /**
     * Batalkan pelayanan dan hapus data terkait
     * 
     * @param string $norawat Base64 encoded nomor register
     * @return JsonResponse
     */
    public function batalPelayanan(Request $request, string $norawat): JsonResponse
    {
        try {
            // Decode base64 norawat
            $nomorRegister = base64_decode($norawat);

            if (!$nomorRegister) {
                return response()->json([
                    'success' => false,
                    'message' => 'Nomor register tidak valid'
                ], 400);
            }

            DB::beginTransaction();

            // 2. Hapus data terkait SOAP Dokter dengan cara yang lebih aman
            $soapDokterTable = 'pelayanan_soap_dokters'; // Default table name

            $soapDokterIds = DB::table($soapDokterTable)
                ->where('nomor_register', $nomorRegister)
                ->pluck('id')->toArray();

            if (!empty($soapDokterIds)) {
                // Hapus data terkait dengan cara yang aman
                $this->hapusDariTabel('pelayanan_soap_dokter_obats', ['soap_dokter_id' => $soapDokterIds]);
                $this->hapusDariTabel('pelayanan_soap_dokter_tindakans', ['soap_dokter_id' => $soapDokterIds]);
                $this->hapusDariTabel('pelayanan_soap_dokter_icds', ['soap_dokter_id' => $soapDokterIds]);
                $this->hapusDariTabel('pelayanan_soap_dokter_diets', ['soap_dokter_id' => $soapDokterIds]);

                // Hapus data SOAP dokter utama
                $this->hapusDariTabel($soapDokterTable, ['id' => $soapDokterIds]);
            }

            // 3. Hapus data rujukan dan permintaan dengan cara yang aman
            if (class_exists('App\Models\Module\Pelayanan\PelayananRujukan')) {
                $this->hapusDariTabel('pelayanan_rujukans', ['nomor_register' => $nomorRegister]);
            }

            if (class_exists('App\Models\Module\Pelayanan\PelayananPermintaan')) {
                $this->hapusDariTabel('pelayanan_permintaans', ['nomor_register' => $nomorRegister]);
            }

            // 4. Hapus data SO Perawat dengan cara yang aman
            if (class_exists('App\Models\Module\Pelayanan\PelayananSoPerawat')) {
                $this->hapusDariTabel('pelayanan_so_perawats', ['nomor_register' => $nomorRegister]);
            }

            // 5. Update status pelayanan
            Pelayanan_status::where('nomor_register', $nomorRegister)
                ->update([
                    'status_pendaftaran' => '0', // Set status_pendaftaran to 0 for cancellation
                    'updated_at' => now()
                ]);

            // 6. Update status di tabel pelayanans
            Pelayanan::where('nomor_register', $nomorRegister)
                ->update([
                    'status' => 'batal',
                    'updated_at' => now()
                ]);

            // 7. Jika ada relasi dengan pendaftaran, update juga statusnya dan simpan alasan batal
            // Note: Uncomment and adjust if Pendaftaran model is available
            // if (class_exists('App\Models\Module\Pendaftaran\Pendaftaran')) {
            //     $pendaftaran = \App\Models\Module\Pendaftaran\Pendaftaran::where('nomor_register', $nomorRegister)->first();
            //     if ($pendaftaran) {
            //         $pendaftaran->update([
            //             'status' => 'batal',
            //             'alasan_batal' => $request->input('alasan_batal'),
            //             'updated_at' => now()
            //         ]);
            //     }
            // }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Data pelayanan berhasil dibatalkan dan dihapus'
            ]);
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Gagal membatalkan pelayanan: ' . $e->getMessage(), [
                'nomor_register' => $nomorRegister ?? null,
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal membatalkan pelayanan: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get CPPT timeline data for a specific patient
     * 
     * @param string $nomor_rm
     * @return JsonResponse
     */
    public function getCpptTimeline(string $nomor_rm): JsonResponse
    {
        try {
            // Ambil history pasien berdasarkan no_rm
            $histories = Pasien_History::where('no_rm', $nomor_rm)
                ->orderBy('created_at', 'desc')
                ->get();

            $entries = [];

            foreach ($histories as $hist) {
                $history = $hist->history ?? [];
                $type = $history['type'] ?? '';
                // Normalisasi type menjadi base_type dan action (tambah/edit)
                $baseType = $type;
                $actionType = null;
                if (str_contains($type, '_tambah')) {
                    $baseType = str_replace('_tambah', '', $type);
                    $actionType = 'tambah';
                } elseif (str_contains($type, '_edit')) {
                    $baseType = str_replace('_edit', '', $type);
                    $actionType = 'edit';
                }
                $data = $history['data'] ?? [];
                $noRawat = $history['no_rawat'] ?? ($data['no_rawat'] ?? null);

                // Ambil nama dokter & klinik jika tersimpan; fallback ke lookup Pelayanan
                $dokterName = $history['dokter_name'] ?? ($data['dokter_name'] ?? null);
                $perawatName = $history['perawat_name'] ?? ($data['perawat_name'] ?? null);
                $klinikName = $history['klinik_name'] ?? ($data['klinik_name'] ?? null);
                if ((!$dokterName || !$klinikName) && !empty($noRawat)) {
                    try {
                        $pelayananMeta = Pelayanan::with(['dokter.namauser'])
                            ->where('nomor_register', $noRawat)
                            ->first();
                        if ($pelayananMeta) {
                            if (!$dokterName) {
                                $dokterName = optional(optional($pelayananMeta->dokter)->namauser)->name
                                    ?? (optional($pelayananMeta->dokter)->nama ?? null);
                            }
                            // Ambil nama klinik dari web_settings
                            $klinikName = $klinikName ?? optional(\App\Models\Settings\Web_Setting::first())->nama;
                        }
                    } catch (\Exception $metaEx) {
                        // abaikan error lookup
                    }
                }

                $soapDetails = [];

                // Hanya bangun SOAP details untuk SOAP Dokter atau SO Perawat
                $tableData = $data['tableData'] ?? [];
                if (is_string($tableData)) {
                    $decoded = json_decode($tableData, true);
                    $tableData = is_array($decoded) ? $decoded : [];
                }

                if ($baseType === 'soap_dokter') {
                    $subjectiveParts = [];
                    if (!empty($data['anamnesa'])) {
                        $subjectiveParts[] = trim((string) $data['anamnesa']);
                    }
                    if (!empty($tableData['keluhanList']) && is_array($tableData['keluhanList'])) {
                        $keluhanText = "Daftar Keluhan:\n";
                        foreach ($tableData['keluhanList'] as $keluhan) {
                            $text = '- ' . ($keluhan['keluhan'] ?? '');
                            if (!empty($keluhan['durasi'])) {
                                $text .= ' (' . $keluhan['durasi'] . ')';
                            }
                            $keluhanText .= $text . "\n";
                        }
                        $subjectiveParts[] = trim($keluhanText);
                    }
                    $soapDetails[] = [
                        'tipe_soap' => 'subjective',
                        'content' => !empty($subjectiveParts) ? trim(implode("\n\n", $subjectiveParts)) : '-',
                    ];
                } elseif ($baseType === 'so_perawat') {
                    $subjectiveText = '-';
                    if (!empty($tableData['keluhanList']) && is_array($tableData['keluhanList'])) {
                        $keluhanText = "Daftar Keluhan:\n";
                        foreach ($tableData['keluhanList'] as $keluhan) {
                            $text = '- ' . ($keluhan['keluhan'] ?? '');
                            if (!empty($keluhan['durasi'])) {
                                $text .= ' (' . $keluhan['durasi'] . ')';
                            }
                            $keluhanText .= $text . "\n";
                        }
                        $subjectiveText = trim($keluhanText);
                    }
                    $soapDetails[] = [
                        'tipe_soap' => 'subjective',
                        'content' => $subjectiveText,
                    ];
                }

                // Objective - hanya untuk SOAP
                if ($baseType === 'soap_dokter' || $baseType === 'so_perawat') {
                    $objectiveParts = [];
                    foreach (['tensi', 'suhu', 'nadi', 'rr', 'spo2', 'berat', 'tinggi', 'nilai_bmi', 'alergi'] as $key) {
                        if (!empty($data[$key])) {
                            switch ($key) {
                                case 'suhu':
                                    $objectiveParts[] = 'Suhu: ' . $data[$key] . '°C';
                                    break;
                                case 'nadi':
                                    $objectiveParts[] = 'Nadi: ' . $data[$key] . '/menit';
                                    break;
                                case 'rr':
                                    $objectiveParts[] = 'RR: ' . $data[$key] . '/menit';
                                    break;
                                case 'spo2':
                                    $objectiveParts[] = 'SpO2: ' . $data[$key] . '%';
                                    break;
                                case 'berat':
                                    $objectiveParts[] = 'Berat: ' . $data[$key] . ' kg';
                                    break;
                                case 'tinggi':
                                    $objectiveParts[] = 'Tinggi: ' . $data[$key] . ' cm';
                                    break;
                                case 'nilai_bmi':
                                    $objectiveParts[] = 'BMI: ' . $data[$key];
                                    break;
                                case 'alergi':
                                    $objectiveParts[] = 'Alergi: ' . $data[$key];
                                    break;
                                default:
                                    $objectiveParts[] = 'Tensi: ' . $data[$key];
                            }
                        }
                    }

                    $objectiveExtra = '';
                    if (!empty($tableData['httItems']) && is_array($tableData['httItems'])) {
                        $httText = ($baseType === 'soap_dokter' ? 'HTT / Temuan Objektif:' : 'Tindakan Perawat (HTT):') . "\n";
                        foreach ($tableData['httItems'] as $htt) {
                            $line = '- ' . ($htt['pemeriksaan'] ?? '');
                            if (!empty($htt['subPemeriksaan'])) {
                                $line .= ' - ' . $htt['subPemeriksaan'];
                            }
                            if (!empty($htt['detail'])) {
                                $line .= ': ' . $htt['detail'];
                            }
                            $httText .= $line . "\n";
                        }
                        $objectiveExtra = trim($httText);
                    }

                    $objectiveContent = trim((!empty($objectiveParts) ? implode(', ', $objectiveParts) : '') . (strlen($objectiveExtra) ? "\n" . $objectiveExtra : ''));
                    $soapDetails[] = [
                        'tipe_soap' => 'objective',
                        'content' => $objectiveContent !== '' ? $objectiveContent : '-',
                    ];

                    // Assessment & Plan (only meaningful for SOAP Dokter)
                    $soapDetails[] = [
                        'tipe_soap' => 'assessment',
                        'content' => $baseType === 'soap_dokter' && !empty($data['assesmen']) ? $data['assesmen'] : '-',
                    ];
                    $soapDetails[] = [
                        'tipe_soap' => 'plan',
                        'content' => $baseType === 'soap_dokter' && !empty($data['plan']) ? $data['plan'] : '-',
                    ];
                }

                // Tentukan profesi untuk card
                // - soap_dokter => dokter
                // - so_perawat => perawat
                // - permintaan/rujukan => dokter (sesuai permintaan UI)
                $profesi = 'perawat';
                if ($baseType === 'soap_dokter' || $baseType === 'permintaan' || $baseType === 'rujukan') {
                    $profesi = 'dokter';
                }

                $entries[] = [
                    'id' => ($baseType === 'soap_dokter' ? 'soap_' : 'so_') . ($hist->id),
                    'nomor_register' => $noRawat,
                    'tanggal_waktu' => optional($hist->created_at)->toISOString(),
                    'profesi' => $profesi,
                    'aksi' => $actionType, // null, 'tambah', atau 'edit'
                    'nama_dokter' => $profesi === 'dokter' ? $dokterName : null,
                    'nama_perawat' => $profesi === 'perawat' ? $perawatName : null,
                    'nama_klinik' => $klinikName,
                    'catatan_tambahan' => null,
                    'soap_details' => $soapDetails,
                    // Sertakan payload history asli untuk rendering Assessment/Plan detail di frontend
                    'history' => $hist->history,
                ];
            }

            return response()->json([
                'success' => true,
                'entries' => $entries,
            ]);
        } catch (\Exception $e) {
            Log::error('Gagal memuat catatan pemeriksaan: ' . $e->getMessage(), [
                'nomor_rm' => $nomor_rm,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal memuat catatan pemeriksaan: ' . $e->getMessage(),
                'entries' => [],
            ], 500);
        }
    }
}
