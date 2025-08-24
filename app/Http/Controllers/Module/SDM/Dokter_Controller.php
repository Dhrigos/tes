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

class Dokter_Controller extends Controller
{
    public function index()
    {
        // Load data dokter dengan relasi
        $dokters = Dokter::with(['namapoli', 'namastatuspegawai'])
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

        // Mapping alamat dari ID ke kode
        $provinsiKode = $request->provinsi ? Province::find($request->provinsi)?->code : null;
        $kabupatenKode = $request->kabupaten ? City::find($request->kabupaten)?->code : null;
        $kecamatanKode = $request->kecamatan ? District::find($request->kecamatan)?->code : null;
        $desaKode = $request->desa ? Village::find($request->desa)?->code : null;

        // Cek kelengkapan data untuk verifikasi
        $isDataComplete = $this->checkDataCompleteness($validatedData);

        $dokterData = array_merge($validatedData, [
            'provinsi_kode' => $provinsiKode,
            'kabupaten_kode' => $kabupatenKode,
            'kecamatan_kode' => $kecamatanKode,
            'desa_kode' => $desaKode,
            'verifikasi' => $isDataComplete ? 2 : 1,
            'user_id_input' => Auth::id(),
            'user_name_input' => Auth::user()->name,
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

        $message = $isDataComplete ? 'Data dokter berhasil ditambahkan dan terverifikasi!' : 'Data dokter berhasil ditambahkan, namun masih perlu dilengkapi!';

        return back()->with('success', $message);
    }

    public function update(Request $request, $id)
    {
        $dokter = Dokter::findOrFail($id);

        $validatedData = $request->validate([
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

        // Mapping alamat dari ID ke kode
        $provinsiKode = $request->provinsi ? Province::find($request->provinsi)?->code : null;
        $kabupatenKode = $request->kabupaten ? City::find($request->kabupaten)?->code : null;
        $kecamatanKode = $request->kecamatan ? District::find($request->kecamatan)?->code : null;
        $desaKode = $request->desa ? Village::find($request->desa)?->code : null;

        // Cek kelengkapan data untuk verifikasi
        $isDataComplete = $this->checkDataCompleteness($validatedData);

        $dokterData = array_merge($validatedData, [
            'provinsi_kode' => $provinsiKode,
            'kabupaten_kode' => $kabupatenKode,
            'kecamatan_kode' => $kecamatanKode,
            'desa_kode' => $desaKode,
            'verifikasi' => $isDataComplete ? 2 : 1,
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

        $message = $isDataComplete ? 'Data dokter berhasil diperbarui dan terverifikasi!' : 'Data dokter berhasil diperbarui, namun masih perlu dilengkapi!';

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

    private function checkDataCompleteness($data)
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

        return true;
    }
}
