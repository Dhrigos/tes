<?php

namespace App\Http\Controllers\Module\SDM;

use App\Http\Controllers\Controller;
use App\Models\Module\SDM\Staff;
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
use Inertia\Inertia;
use Laravolt\Indonesia\Models\Province;
use Laravolt\Indonesia\Models\City;
use Laravolt\Indonesia\Models\District;
use Laravolt\Indonesia\Models\Village;
use Carbon\Carbon;

class Staff_Controller extends Controller
{
    public function index()
    {
        // Load data staff dengan relasi dan eager loading untuk data wilayah
        $staffs = Staff::with(['namastatuspegawai'])
            ->orderBy('created_at', 'desc')
            ->paginate(50);

        // Ambil semua kode wilayah yang unik untuk query batch
        $provinsiCodes = $staffs->getCollection()->pluck('provinsi_kode')->filter()->unique()->values();
        $kabupatenCodes = $staffs->getCollection()->pluck('kabupaten_kode')->filter()->unique()->values();
        $kecamatanCodes = $staffs->getCollection()->pluck('kecamatan_kode')->filter()->unique()->values();
        $desaCodes = $staffs->getCollection()->pluck('desa_kode')->filter()->unique()->values();

        // Query batch untuk data wilayah (hanya 4 query)
        $provinsiData = Province::whereIn('code', $provinsiCodes)->get()->keyBy('code');
        $kabupatenData = City::whereIn('code', $kabupatenCodes)->get()->keyBy('code');
        $kecamatanData = District::whereIn('code', $kecamatanCodes)->get()->keyBy('code');
        $desaData = Village::whereIn('code', $desaCodes)->get()->keyBy('code');

        // Transform data untuk frontend dengan data yang sudah di-cache
        $staffs->getCollection()->transform(function ($staff) use ($provinsiData, $kabupatenData, $kecamatanData, $desaData) {
            // Tambahkan data provinsi, kabupaten, kecamatan, desa untuk editing
            if ($staff->provinsi_kode && isset($provinsiData[$staff->provinsi_kode])) {
                $staff->provinsi_data = $provinsiData[$staff->provinsi_kode];
            }
            if ($staff->kabupaten_kode && isset($kabupatenData[$staff->kabupaten_kode])) {
                $staff->kabupaten_data = $kabupatenData[$staff->kabupaten_kode];
            }
            if ($staff->kecamatan_kode && isset($kecamatanData[$staff->kecamatan_kode])) {
                $staff->kecamatan_data = $kecamatanData[$staff->kecamatan_kode];
            }
            if ($staff->desa_kode && isset($desaData[$staff->desa_kode])) {
                $staff->desa_data = $desaData[$staff->desa_kode];
            }
            return $staff;
        });


        $totalStaff = Staff::count();
        $staffBulanIni = Staff::whereYear('created_at', now()->year)
            ->whereMonth('created_at', now()->month)
            ->count();

        // Data master untuk dropdown (bisa di-cache jika diperlukan)
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

        return Inertia::render('module/sdm/staff/index', compact(
            'staffs',
            'totalStaff',
            'staffBulanIni',
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
            'tgl_masuk' => 'nullable|date',
            'status_pegawaian' => 'nullable|integer',
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
            'profile' => 'nullable|file|image|max:2048',
            // Bisa menerima ID (integer) atau CODE (string angka)
            'provinsi' => 'nullable',
            'kabupaten' => 'nullable',
            'kecamatan' => 'nullable',
            'desa' => 'nullable',
            'suku' => 'nullable|integer',
            'bahasa' => 'nullable|integer',
            'bangsa' => 'nullable|integer',
        ]);

        // Mapping alamat: terima langsung *_kode atau fallback dari provinsi/kabupaten/kecamatan/desa (ID/CODE)
        $provinsiInput = $request->input('provinsi_kode') ?? $request->input('provinsi');
        $kabupatenInput = $request->input('kabupaten_kode') ?? $request->input('kabupaten');
        $kecamatanInput = $request->input('kecamatan_kode') ?? $request->input('kecamatan');
        $desaInput = $request->input('desa_kode') ?? $request->input('desa');

        $provinsiKode = $this->resolveProvinceCode($provinsiInput);
        $kabupatenKode = $this->resolveCityCode($kabupatenInput);
        $kecamatanKode = $this->resolveDistrictCode($kecamatanInput);
        $desaKode = $this->resolveVillageCode($desaInput);

        $user_id = User::create([
            'name' => $validatedData['nama'],
            'username' => $validatedData['nik'],
            'email' => strtolower(str_replace(' ', '_', $validatedData['nama'])) . '@dolphinhealthtech.co.id',
            'password' => bcrypt(Carbon::parse($validatedData['tanggal_lahir'])->format('Ymd')),
        ]);

        $staffData = array_merge($validatedData, [
            'provinsi_kode' => $provinsiKode,
            'kabupaten_kode' => $kabupatenKode,
            'kecamatan_kode' => $kecamatanKode,
            'desa_kode' => $desaKode,
            'users' => $user_id->id,
        ]);

        // Hapus field yang tidak ada di fillable
        unset($staffData['provinsi'], $staffData['kabupaten'], $staffData['kecamatan'], $staffData['desa']);

        // Handle upload profile photo
        if ($request->hasFile('profile')) {
            $path = $request->file('profile')->store('public/staff');
            $staffData['profile'] = basename($path);
        }

        $staff = Staff::create($staffData);

        return back()->with('success', 'Data staff berhasil ditambahkan!');
    }

    public function update(Request $request, $id)
    {
        $staff = Staff::findOrFail($id);



        $validatedData = $request->validate([
            'nama' => 'sometimes|required|string|max:255',
            'nik' => 'nullable|string|max:16',
            'npwp' => 'nullable|string|max:20',
            'tgl_masuk' => 'nullable|date',
            'status_pegawaian' => 'nullable|integer',
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
            'profile' => 'nullable|file|image|max:2048',
            // Bisa menerima ID (integer) atau CODE (string angka)
            'provinsi' => 'nullable',
            'kabupaten' => 'nullable',
            'kecamatan' => 'nullable',
            'desa' => 'nullable',
            'suku' => 'nullable|integer',
            'bahasa' => 'nullable|integer',
            'bangsa' => 'nullable|integer',
        ]);


        // Mapping alamat: terima langsung *_kode atau fallback dari provinsi/kabupaten/kecamatan/desa (ID/CODE)
        $provinsiInput = $request->input('provinsi_kode') ?? $request->input('provinsi');
        $kabupatenInput = $request->input('kabupaten_kode') ?? $request->input('kabupaten');
        $kecamatanInput = $request->input('kecamatan_kode') ?? $request->input('kecamatan');
        $desaInput = $request->input('desa_kode') ?? $request->input('desa');

        $provinsiKode = $this->resolveProvinceCode($provinsiInput);
        $kabupatenKode = $this->resolveCityCode($kabupatenInput);
        $kecamatanKode = $this->resolveDistrictCode($kecamatanInput);
        $desaKode = $this->resolveVillageCode($desaInput);

        $staffData = array_merge($validatedData, [
            'provinsi_kode' => $provinsiKode,
            'kabupaten_kode' => $kabupatenKode,
            'kecamatan_kode' => $kecamatanKode,
            'desa_kode' => $desaKode,
        ]);

        // Hapus field yang tidak ada di fillable
        unset($staffData['provinsi'], $staffData['kabupaten'], $staffData['kecamatan'], $staffData['desa']);

        // Handle upload profile photo
        if ($request->hasFile('profile')) {
            $path = $request->file('profile')->store('public/staff');
            $staffData['profile'] = basename($path);
        }

        $staff->update($staffData);
        $staff->refresh();

        // Sinkronisasi akun user saat edit
        try {
            $generatedEmail = strtolower(str_replace(' ', '_', $staff->nama)) . '@dolphinhealthtech.co.id';

            // 1) Tentukan user id yang valid
            $linkedUser = null;
            if (! empty($staff->users)) {
                $linkedUser = User::find($staff->users);
            }
            if (! $linkedUser) {
                $linkedUser = User::where('username', $staff->nik)
                    ->orWhere('email', $generatedEmail)
                    ->first();
                if ($linkedUser && $staff->users != $linkedUser->id) {
                    $staff->update(['users' => $linkedUser->id]);
                    $staff->refresh();
                }
            }

            // 2) Jika masih belum ada user, buat baru
            if (! $linkedUser) {
                $linkedUser = User::create([
                    'name' => $staff->nama,
                    'username' => $staff->nik,
                    'email' => $generatedEmail,
                    'password' => bcrypt(Carbon::parse(($validatedData['tanggal_lahir'] ?? $staff->tanggal_lahir))->format('Ymd')),
                ]);
                $staff->update(['users' => $linkedUser->id]);
                $staff->refresh();
            }

            // 3) Update user terhubung dengan payload terbaru
            $updatePayload = [
                'name' => $staff->nama,
                'username' => $staff->nik,
                'email' => $generatedEmail,
            ];
            if (array_key_exists('tanggal_lahir', $validatedData) && ! is_null($validatedData['tanggal_lahir'])) {
                $updatePayload['password'] = bcrypt(Carbon::parse($validatedData['tanggal_lahir'])->format('Ymd'));
            }
            User::where('id', $linkedUser->id)->update($updatePayload);
        } catch (\Throwable $e) {
            // Abaikan error sinkronisasi user agar update tetap berhasil
        }

        return back()->with('success', 'Data staff berhasil diperbarui!');
    }

    public function destroy($id)
    {
        $staff = Staff::findOrFail($id);
        // Hapus akun user terkait (robust): pakai relasi id, atau fallback username/email
        try {
            $generatedEmail = strtolower(str_replace(' ', '_', $staff->nama)) . '@dolphinhealthtech.co.id';

            $linkedUser = null;
            if (! empty($staff->users)) {
                $linkedUser = User::find($staff->users);
            }
            if (! $linkedUser) {
                $linkedUser = User::where('username', $staff->nik)
                    ->orWhere('email', $generatedEmail)
                    ->first();
            }
            if ($linkedUser) {
                $linkedUser->delete();
            }
        } catch (\Throwable $e) {
            // Abaikan error penghapusan user agar proses lanjut
        }
        $staff->delete();

        return back()->with('success', 'Data staff berhasil dihapus!');
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
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }



    // Helpers: terima ID atau CODE, kembalikan CODE atau null (OPTIMIZED)
    private function resolveProvinceCode($value)
    {
        if (!$value) return null;

        // Jika sudah berupa kode (2 digit), langsung return
        if (is_string($value) && strlen($value) == 2 && is_numeric($value)) {
            return $value;
        }

        // Cache query dengan select minimal
        static $provinceCache = null;
        if ($provinceCache === null) {
            $provinceCache = Province::select('id', 'code')->get()->keyBy('id');
        }

        // Cari berdasarkan ID dari cache
        return isset($provinceCache[$value]) ? $provinceCache[$value]->code : null;
    }

    private function resolveCityCode($value)
    {
        if (!$value) return null;

        // Jika sudah berupa kode (4 digit), langsung return
        if (is_string($value) && strlen($value) == 4 && is_numeric($value)) {
            return $value;
        }

        // Cache query dengan select minimal
        static $cityCache = null;
        if ($cityCache === null) {
            $cityCache = City::select('id', 'code')->get()->keyBy('id');
        }

        return isset($cityCache[$value]) ? $cityCache[$value]->code : null;
    }

    private function resolveDistrictCode($value)
    {
        if (!$value) return null;

        // Jika sudah berupa kode (6 digit), langsung return
        if (is_string($value) && strlen($value) == 6 && is_numeric($value)) {
            return $value;
        }

        // Cache query dengan select minimal
        static $districtCache = null;
        if ($districtCache === null) {
            $districtCache = District::select('id', 'code')->get()->keyBy('id');
        }

        return isset($districtCache[$value]) ? $districtCache[$value]->code : null;
    }

    private function resolveVillageCode($value)
    {
        if (!$value) return null;

        // Jika sudah berupa kode (10 digit), langsung return
        if (is_string($value) && strlen($value) == 10 && is_numeric($value)) {
            return $value;
        }

        // Cache query dengan select minimal
        static $villageCache = null;
        if ($villageCache === null) {
            $villageCache = Village::select('id', 'code')->get()->keyBy('id');
        }

        return isset($villageCache[$value]) ? $villageCache[$value]->code : null;
    }
}
