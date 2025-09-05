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
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Query\Exception as QueryException;
use Illuminate\Support\Facades\Log;

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
        } catch (QueryException $e) {
            Log::warning("Gagal menghapus dari tabel {$table}: " . $e->getMessage());
            return false; // Gagal tetapi tidak melempar exception
        } catch (\Exception $e) {
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
            if (class_exists('App\Models\Module\Pelayanan\SoapDokter\PelayananSoapDokter')) {
                $soapDokterModel = new PelayananSoapDokter();
                $soapDokterTable = $soapDokterModel->getTable();
            }
            
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
            PelayananStatus::where('nomor_register', $nomorRegister)
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
            if (class_exists('App\Models\Module\Pendaftaran\Pendaftaran')) {
                $pendaftaran = \App\Models\Module\Pendaftaran\Pendaftaran::where('nomor_register', $nomorRegister)->first();
                if ($pendaftaran) {
                    $pendaftaran->update([
                        'status' => 'batal',
                        'alasan_batal' => $request->input('alasan_batal'),
                        'updated_at' => now()
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Data pelayanan berhasil dibatalkan dan dihapus'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Gagal membatalkan pelayanan: ' . $e->getMessage(), [
                'nomor_register' => $nomorRegister ?? null,
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Gagal membatalkan pelayanan: ' . $e->getMessage()
            ], 500);
        }
    }
}
