<?php

namespace App\Http\Controllers\Module\SDM;

use App\Http\Controllers\Controller;
use App\Models\Module\SDM\Dokter;
use App\Models\Module\Master\Data\Medis\Poli;
use App\Models\Module\Master\Data\Manajemen\Posker;
use App\Models\Module\Master\Data\Umum\Kelamin;
use App\Models\Module\Master\Data\Umum\Goldar;
use App\Models\Module\Master\Data\Umum\Pernikahan;
use App\Models\Module\Master\Data\Umum\Agama;
use App\Models\Module\Master\Data\Umum\Pendidikan;
use App\Models\Module\Master\Data\Umum\Suku;
use App\Models\Module\Master\Data\Umum\Bangsa;
use App\Models\Module\Master\Data\Umum\Bahasa;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Laravolt\Indonesia\Models\Province;
use Laravolt\Indonesia\Models\City;
use Laravolt\Indonesia\Models\District;
use Laravolt\Indonesia\Models\Village;
use Illuminate\Support\Facades\Storage;
use App\Models\Module\SDM\DokterPendidikan;
use App\Models\Module\SDM\DokterPelatihan;
use App\Models\Module\SDM\DokterJadwal;

class Dokter_Controller extends Controller
{
    public function index()
    {
        // Load data dokter dengan relasi
        $dokters = Dokter::with(['namapoli', 'namastatuspegawai', 'jadwals'])
            ->orderBy('created_at', 'desc')
            ->paginate(50);

        // Transform data untuk frontend
        $dokters->getCollection()->transform(function ($dokter) {
            // Tambahkan data provinsi, kabupaten, kecamatan, desa untuk editing
            if ($dokter->provinsi_kode) {
                $dokter->provinsi_data = Province::where('code', $dokter->provinsi_kode)->first();
            }
            if ($dokter->kabupaten_kode) {
                $dokter->kabupaten_data = City::where('code', $dokter->kabupaten_kode)->first();
            }
            if ($dokter->kecamatan_kode) {
                $dokter->kecamatan_data = District::where('code', $dokter->kecamatan_kode)->first();
            }
            if ($dokter->desa_kode) {
                $dokter->desa_data = Village::where('code', $dokter->desa_kode)->first();
            }
            return $dokter;
        });

        // Hitung statistik
        $totalDokter = Dokter::count();
        $dokterVerifikasi = Dokter::where('verifikasi', 2)->count();
        $dokterBelumVerifikasi = Dokter::where('verifikasi', 1)->count();
        $dokterBulanIni = Dokter::whereMonth('created_at', now()->month)->count();

        // Data master untuk dropdown
        $poli = Poli::select('id', 'nama')->orderBy('nama')->get();
        $posker = Posker::select('id', 'nama')->orderBy('nama')->get();
        $provinsi = Province::select('id', 'name', 'code')->orderBy('name')->get();
        $kelamin = Kelamin::select('id', 'nama')->get();
        $goldar = Goldar::select('id', 'nama', 'rhesus')->get();
        $pernikahan = Pernikahan::select('id', 'nama')->get();
        $agama = Agama::select('id', 'nama')->get();
        $pendidikan = Pendidikan::select('id', 'nama')->get();
        $suku = Suku::select('id', 'nama')->get();
        $bangsa = Bangsa::select('id', 'nama')->get();
        $bahasa = Bahasa::select('id', 'nama')->get();

        return Inertia::render('module/sdm/dokter/index', compact(
            'dokters',
            'totalDokter',
            'dokterVerifikasi',
            'dokterBelumVerifikasi',
            'dokterBulanIni',
            'poli',
            'posker',
            'provinsi',
            'kelamin',
            'goldar',
            'pernikahan',
            'agama',
            'pendidikan',
            'suku',
            'bangsa',
            'bahasa'
        ));
    }

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'nama' => 'required|string|max:255',
            'nik' => 'nullable|string|max:16',
            'npwp' => 'nullable|string|max:20',
            'poli' => 'nullable|integer',
            'kode' => 'required|string|max:20|unique:dokters,kode',
            'kode_satu' => 'nullable|string|max:20',
            'tgl_masuk' => 'nullable|date',
            'status_pegawaian' => 'nullable|integer',
            'sip' => 'nullable|string|max:50',
            'exp_spri' => 'nullable|date',
            'str' => 'nullable|string|max:50',
            'exp_str' => 'nullable|date',
            'tempat_lahir' => 'nullable|string|max:100',
            'tanggal_lahir' => 'nullable|date',
            'alamat' => 'nullable|string',
            'rt' => 'nullable|string|max:3',
            'rw' => 'nullable|string|max:3',
            'kode_pos' => 'nullable|string|max:5',
            'kewarganegaraan' => 'nullable|string|max:50',
            'seks' => 'nullable|string|in:L,P',
            'agama' => 'nullable|integer',
            'pendidikan' => 'nullable|integer',
            'goldar' => 'nullable|integer',
            'pernikahan' => 'nullable|integer',
            'telepon' => 'nullable|string|max:15',
            'provinsi' => 'nullable|integer',
            'kabupaten' => 'nullable|integer',
            'kecamatan' => 'nullable|integer',
            'desa' => 'nullable|integer',
            'suku' => 'nullable|integer',
            'bahasa' => 'nullable|integer',
            'bangsa' => 'nullable|integer',
            'foto' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        // Mapping alamat dari kode langsung bila dikirim, jika tidak fallback dari ID
        $provinsiKode = $request->input('provinsi_kode') ?? ($request->provinsi ? Province::find($request->provinsi)?->code : null);
        $kabupatenKode = $request->input('kabupaten_kode') ?? ($request->kabupaten ? City::find($request->kabupaten)?->code : null);
        $kecamatanKode = $request->input('kecamatan_kode') ?? ($request->kecamatan ? District::find($request->kecamatan)?->code : null);
        $desaKode = $request->input('desa_kode') ?? ($request->desa ? Village::find($request->desa)?->code : null);


        $dokterData = array_merge($validatedData, [
            'provinsi_kode' => $provinsiKode,
            'kabupaten_kode' => $kabupatenKode,
            'kecamatan_kode' => $kecamatanKode,
            'desa_kode' => $desaKode,
            'verifikasi' => 1,
        ]);

        // Hapus field yang tidak ada di fillable
        unset($dokterData['provinsi'], $dokterData['kabupaten'], $dokterData['kecamatan'], $dokterData['desa']);

        $dokter = Dokter::create($dokterData);

        // Handle upload foto
        if ($request->hasFile('foto')) {
            $file = $request->file('foto');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->storeAs('public/dokter', $filename);
            $dokter->update(['foto' => $filename]);
        }

        $message = 'Data dokter berhasil ditambahkan, namun masih perlu dilengkapi!';

        return back()->with('success', $message);
    }

    public function verifikasi(Request $request)
    {
        $validated = $request->validate([
            'dokter_id' => 'required|exists:dokters,id',
            'pendidikans' => 'array',
            'pendidikans.*.jenjang' => 'required|string|max:100',
            'pendidikans.*.institusi' => 'nullable|string|max:255',
            'pendidikans.*.tahun_lulus' => 'nullable|string|max:10',
            'pendidikans.*.nomor_ijazah' => 'nullable|string|max:100',
            'pendidikans.*.file_ijazah' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:4096',
            'pelatihans' => 'array',
            'pelatihans.*.nama_pelatihan' => 'required|string|max:255',
            'pelatihans.*.penyelenggara' => 'nullable|string|max:255',
            'pelatihans.*.tanggal_mulai' => 'nullable|date',
            'pelatihans.*.tanggal_selesai' => 'nullable|date|after_or_equal:pelatihans.*.tanggal_mulai',
            'pelatihans.*.nomor_sertifikat' => 'nullable|string|max:100',
            'pelatihans.*.file_sertifikat' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:4096',
        ]);

        $dokter = Dokter::findOrFail($validated['dokter_id']);

        // Simpan pendidikans
        if ($request->has('pendidikans')) {
            foreach ($request->pendidikans as $item) {
                $data = [
                    'dokter_id' => $dokter->id,
                    'jenjang' => $item['jenjang'] ?? '',
                    'institusi' => $item['institusi'] ?? null,
                    'tahun_lulus' => $item['tahun_lulus'] ?? null,
                    'nomor_ijazah' => $item['nomor_ijazah'] ?? null,
                ];
                if (isset($item['file_ijazah']) && $item['file_ijazah'] instanceof \Illuminate\Http\UploadedFile) {
                    $path = $item['file_ijazah']->store('public/dokter/ijazah');
                    $data['file_ijazah'] = basename($path);
                }
                DokterPendidikan::create($data);
            }
        }

        // Simpan pelatihans
        if ($request->has('pelatihans')) {
            foreach ($request->pelatihans as $item) {
                $data = [
                    'dokter_id' => $dokter->id,
                    'nama_pelatihan' => $item['nama_pelatihan'] ?? '',
                    'penyelenggara' => $item['penyelenggara'] ?? null,
                    'tanggal_mulai' => $item['tanggal_mulai'] ?? null,
                    'tanggal_selesai' => $item['tanggal_selesai'] ?? null,
                    'nomor_sertifikat' => $item['nomor_sertifikat'] ?? null,
                ];
                if (isset($item['file_sertifikat']) && $item['file_sertifikat'] instanceof \Illuminate\Http\UploadedFile) {
                    $path = $item['file_sertifikat']->store('public/dokter/sertifikat');
                    $data['file_sertifikat'] = basename($path);
                }
                DokterPelatihan::create($data);
            }
        }

        // Update status verifikasi
        $dokter->update(['verifikasi' => 2]);

        return back()->with('success', 'Data verifikasi dokter berhasil disimpan.');
    }

    public function jadwal(Request $request)
    {
        $validated = $request->validate([
            'dokter_id' => 'required|exists:dokters,id',
            'items' => 'array',
            'items.*.hari' => 'required|string|max:20',
            'items.*.jam_mulai' => 'nullable',
            'items.*.jam_selesai' => 'nullable',
            'items.*.kuota' => 'nullable',
            'items.*.aktif' => 'boolean',
        ]);

        $dokterId = $validated['dokter_id'];
        $items = $request->input('items', []);

        foreach ($items as $item) {
            $jamMulai = $item['jam_mulai'] ?? null;
            $jamSelesai = $item['jam_selesai'] ?? null;
            // Normalisasi format waktu ke H:i jika ada
            if (!empty($jamMulai)) {
                $ts = strtotime($jamMulai);
                $jamMulai = $ts ? date('H:i', $ts) : null;
            }
            if (!empty($jamSelesai)) {
                $ts = strtotime($jamSelesai);
                $jamSelesai = $ts ? date('H:i', $ts) : null;
            }
            // Validasi manual: jam_selesai harus > jam_mulai jika keduanya ada
            if ($jamMulai && $jamSelesai && strtotime($jamSelesai) <= strtotime($jamMulai)) {
                return back()->with('error', 'Jam selesai harus lebih besar dari jam mulai.');
            }

            DokterJadwal::updateOrCreate(
                ['dokter_id' => $dokterId, 'hari' => $item['hari']],
                [
                    'jam_mulai' => $jamMulai,
                    'jam_selesai' => $jamSelesai,
                    'kuota' => isset($item['kuota']) ? (int) $item['kuota'] : 0,
                    'aktif' => (bool) ($item['aktif'] ?? false),
                ]
            );
        }

        return back()->with('success', 'Jadwal dokter berhasil disimpan.');
    }

    public function hapusJadwal(Request $request)
    {
        $validated = $request->validate([
            'dokter_id' => 'required|exists:dokters,id',
            'hari' => 'required|string|max:20',
        ]);

        DokterJadwal::where('dokter_id', $validated['dokter_id'])
            ->where('hari', $validated['hari'])
            ->delete();

        return back()->with('success', 'Jadwal dokter dihapus.');
    }

    public function update(Request $request, $id)
    {
        $dokter = Dokter::findOrFail($id);

        $validatedData = $request->validate([
            'nama' => 'sometimes|required|string|max:255',
            'nik' => 'nullable|string|max:16',
            'npwp' => 'nullable|string|max:20',
            'poli' => 'nullable|integer',
            'kode' => 'required|string|max:20|unique:dokters,kode,' . $id,
            'kode_satu' => 'nullable|string|max:20',
            'tgl_masuk' => 'nullable|date',
            'status_pegawaian' => 'nullable|integer',
            'sip' => 'nullable|string|max:50',
            'exp_spri' => 'nullable|date',
            'str' => 'nullable|string|max:50',
            'exp_str' => 'nullable|date',
            'tempat_lahir' => 'nullable|string|max:100',
            'tanggal_lahir' => 'nullable|date',
            'alamat' => 'nullable|string',
            'rt' => 'nullable|string|max:3',
            'rw' => 'nullable|string|max:3',
            'kode_pos' => 'nullable|string|max:5',
            'kewarganegaraan' => 'nullable|string|max:50',
            'seks' => 'nullable|string|in:L,P',
            'agama' => 'nullable|integer',
            'pendidikan' => 'nullable|integer',
            'goldar' => 'nullable|integer',
            'pernikahan' => 'nullable|integer',
            'telepon' => 'nullable|string|max:15',
            'provinsi' => 'nullable|integer',
            'kabupaten' => 'nullable|integer',
            'kecamatan' => 'nullable|integer',
            'desa' => 'nullable|integer',
            'suku' => 'nullable|integer',
            'bahasa' => 'nullable|integer',
            'bangsa' => 'nullable|integer',
            'foto' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        // Mapping alamat dari kode langsung bila dikirim, jika tidak fallback dari ID
        $provinsiKode = $request->input('provinsi_kode') ?? ($request->provinsi ? Province::find($request->provinsi)?->code : null);
        $kabupatenKode = $request->input('kabupaten_kode') ?? ($request->kabupaten ? City::find($request->kabupaten)?->code : null);
        $kecamatanKode = $request->input('kecamatan_kode') ?? ($request->kecamatan ? District::find($request->kecamatan)?->code : null);
        $desaKode = $request->input('desa_kode') ?? ($request->desa ? Village::find($request->desa)?->code : null);

        // Cek kelengkapan data untuk verifikasi
        $isDataComplete = $this->checkDataCompleteness($validatedData);
        // Cek kelengkapan data untuk verifikasi (ikut mempertimbangkan data pendidikan)
        $isDataComplete = $this->checkDataCompleteness($validatedData, $dokter);
        $currentVerification = (int) ($dokter->verifikasi ?? 1);
        // Jika sudah verifikasi=2, pertahankan 2; jika masih 1, hitung ulang
        $newVerification = $currentVerification === 2 ? 2 : ($isDataComplete ? 2 : 1);

        $dokterData = array_merge($validatedData, [
            'provinsi_kode' => $provinsiKode,
            'kabupaten_kode' => $kabupatenKode,
            'kecamatan_kode' => $kecamatanKode,
            'desa_kode' => $desaKode,
            'verifikasi' => $newVerification,
        ]);

        // Hapus field yang tidak ada di fillable
        unset($dokterData['provinsi'], $dokterData['kabupaten'], $dokterData['kecamatan'], $dokterData['desa']);

        $dokter->update($dokterData);

        // Handle upload foto
        if ($request->hasFile('foto')) {
            $file = $request->file('foto');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->storeAs('public/dokter', $filename);
            $dokter->update(['foto' => $filename]);
        }

        $message = $newVerification === 2
            ? 'Data dokter berhasil diperbarui dan terverifikasi!'
            : 'Data dokter berhasil diperbarui, namun masih perlu dilengkapi!';

        return back()->with('success', $message);
    }

    public function destroy($id)
    {
        $dokter = Dokter::findOrFail($id);
        $dokter->delete();

        return back()->with('success', 'Data dokter berhasil dihapus!');
    }

    // Cascading dropdown methods
    public function getKabupaten($provinceId)
    {
        try {
            $province = Province::find($provinceId);
            if (!$province) {
                return response()->json(['error' => 'Province not found'], 404);
            }

            $cities = City::where('province_code', $province->code)
                ->select('id', 'name', 'code')
                ->orderBy('name')
                ->get();

            return response()->json($cities);
        } catch (\Exception $e) {
            Log::error('Error fetching kabupaten: ' . $e->getMessage());
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    public function getKecamatan($cityId)
    {
        try {
            $city = City::find($cityId);
            if (!$city) {
                return response()->json(['error' => 'City not found'], 404);
            }

            $districts = District::where('city_code', $city->code)
                ->select('id', 'name', 'code')
                ->orderBy('name')
                ->get();

            return response()->json($districts);
        } catch (\Exception $e) {
            Log::error('Error fetching kecamatan: ' . $e->getMessage());
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    public function getDesa($districtId)
    {
        try {
            $district = District::find($districtId);
            if (!$district) {
                return response()->json(['error' => 'District not found'], 404);
            }

            $villages = Village::where('district_code', $district->code)
                ->select('id', 'name', 'code')
                ->orderBy('name')
                ->get();

            return response()->json($villages);
        } catch (\Exception $e) {
            Log::error('Error fetching desa: ' . $e->getMessage());
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    private function checkDataCompleteness($data, $dokter = null)
    {
        $requiredFields = [
            'nik',
            'kode',
            'tempat_lahir',
            'tanggal_lahir',
            'alamat',
            'seks',
            'telepon'
        ];

        foreach ($requiredFields as $field) {
            if (empty($data[$field])) {
                return false;
            }
        }

        // Wajib ada data pendidikan: gunakan field 'pendidikan' (non-0) atau relasi pendidikans sudah terisi
        $pendidikanValue = $data['pendidikan'] ?? null;
        $hasPendidikanFromField = ! is_null($pendidikanValue) && (int) $pendidikanValue !== 0;
        $hasPendidikanFromRelation = $dokter ? $dokter->pendidikans()->exists() : false;

        if (! $hasPendidikanFromField && ! $hasPendidikanFromRelation) {
            return false;
        }

        return true;
    }

    public function getAvailable(Request $request)
    {
        $hari = $request->query('hari');
        $waktu = $request->query('waktu');

        // Validasi input
        if (!$hari || !$waktu) {
            return response()->json(['message' => 'Hari dan waktu harus diisi'], 400);
        }

        // Ambil dokter berdasarkan jadwal (contoh: ada kolom jadwal_hari & jadwal_waktu)
        $dokter = Dokter::with('namauser') // relasi ke tabel users
            ->where('jadwal_hari', $hari)
            ->where('jadwal_waktu', $waktu)
            ->where('is_active', 1) // hanya ambil yang aktif
            ->get();

        return response()->json($dokter);
    }

}
