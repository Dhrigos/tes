<?php

namespace App\Http\Controllers\Module\SDM;

use App\Http\Controllers\Controller;
use App\Models\perawat;
use App\Models\Module\Master\Data\Manajemen\Posker;
use App\Models\Module\Master\Data\Umum\Kelamin;
use App\Models\Module\Master\Data\Umum\Goldar;
use App\Models\Module\Master\Data\Umum\Pernikahan;
use App\Models\Module\Master\Data\Umum\Agama;
use App\Models\Module\Master\Data\Umum\Pendidikan;
use App\Models\Module\Master\Data\Umum\Suku;
use App\Models\Module\Master\Data\Umum\Bangsa;
use App\Models\Module\Master\Data\Umum\Bahasa;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Laravolt\Indonesia\Models\Province;
use Laravolt\Indonesia\Models\City;
use Laravolt\Indonesia\Models\District;
use Laravolt\Indonesia\Models\Village;


class Perawat_controller extends Controller
{
    public function index()
    {
        // Load data staff dengan relasi dan eager loading untuk data wilayah
        $perawats = Perawat::with(['namastatuspegawai'])
            ->orderBy('created_at', 'desc')
            ->paginate(50);

        // Ambil semua kode wilayah yang unik untuk query batch
        $provinsiCodes = $perawats->getCollection()->pluck('provinsi_kode')->filter()->unique()->values();
        $kabupatenCodes = $perawats->getCollection()->pluck('kabupaten_kode')->filter()->unique()->values();
        $kecamatanCodes = $perawats->getCollection()->pluck('kecamatan_kode')->filter()->unique()->values();
        $desaCodes = $perawats->getCollection()->pluck('desa_kode')->filter()->unique()->values();

        // Query batch untuk data wilayah (hanya 4 query)
        $provinsiData = Province::whereIn('code', $provinsiCodes)->get()->keyBy('code');
        $kabupatenData = City::whereIn('code', $kabupatenCodes)->get()->keyBy('code');
        $kecamatanData = District::whereIn('code', $kecamatanCodes)->get()->keyBy('code');
        $desaData = Village::whereIn('code', $desaCodes)->get()->keyBy('code');

        // Transform data untuk frontend dengan data yang sudah di-cache
        $perawats->getCollection()->transform(function ($perawat) use ($provinsiData, $kabupatenData, $kecamatanData, $desaData) {
            // Tambahkan data provinsi, kabupaten, kecamatan, desa untuk editing
            if ($perawat->provinsi_kode && isset($provinsiData[$perawat->provinsi_kode])) {
                $perawat->provinsi_data = $provinsiData[$perawat->provinsi_kode];
            }
            if ($perawat->kabupaten_kode && isset($kabupatenData[$perawat->kabupaten_kode])) {
                $perawat->kabupaten_data = $kabupatenData[$perawat->kabupaten_kode];
            }
            if ($perawat->kecamatan_kode && isset($kecamatanData[$perawat->kecamatan_kode])) {
                $perawat->kecamatan_data = $kecamatanData[$perawat->kecamatan_kode];
            }
            if ($perawat->desa_kode && isset($desaData[$perawat->desa_kode])) {
                $perawat->desa_data = $desaData[$perawat->desa_kode];
            }
            return $perawat;
        });


        $totalPerawat = Perawat::count();
        $perawatVerifikasi = Perawat::where('verifikasi', 2)->count();
        $perawatBelumVerifikasi = Perawat::where('verifikasi', 1)->count();
        $perawatBulanIni = Perawat::whereYear('created_at', now()->year)
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

        return Inertia::render('module/sdm/perawat/index', compact(
            'perawats',
            'totalPerawat',
            'perawatVerifikasi',
            'perawatBelumVerifikasi',
            'perawatBulanIni',
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

        $perawatData = array_merge($validatedData, [
            'provinsi_kode' => $provinsiKode,
            'kabupaten_kode' => $kabupatenKode,
            'kecamatan_kode' => $kecamatanKode,
            'desa_kode' => $desaKode,
        ]);

        // Hapus field yang tidak ada di fillable (hanya unset jika ada)
        if (isset($perawatData['provinsi'])) unset($perawatData['provinsi']);
        if (isset($perawatData['kabupaten'])) unset($perawatData['kabupaten']);
        if (isset($perawatData['kecamatan'])) unset($perawatData['kecamatan']);
        if (isset($perawatData['desa'])) unset($perawatData['desa']);

        // Handle upload profile photo
        if ($request->hasFile('profile')) {
            $path = $request->file('profile')->store('public/perawat');
            $perawatData['profile'] = basename($path);
        } else {
            // Remove profile field if no file uploaded to avoid null value
            unset($perawatData['profile']);
        }

        $perawat = Perawat::create($perawatData);

        return back()->with('success', 'Data perawat berhasil ditambahkan!');
    }



    private function resolveProvinceCode($value)
    {
        if (!$value) return null;
        $byCode = Province::where('code', $value)->first();
        if ($byCode) return $byCode->code;
        $byId = Province::find($value);
        return $byId?->code;
    }

    private function resolveCityCode($value)
    {
        if (!$value) return null;
        $byCode = City::where('code', $value)->first();
        if ($byCode) return $byCode->code;
        $byId = City::find($value);
        return $byId?->code;
    }

    private function resolveDistrictCode($value)
    {
        if (!$value) return null;
        $byCode = District::where('code', $value)->first();
        if ($byCode) return $byCode->code;
        $byId = District::find($value);
        return $byId?->code;
    }

    private function resolveVillageCode($value)
    {
        if (!$value) return null;
        $byCode = Village::where('code', $value)->first();
        if ($byCode) return $byCode->code;
        $byId = Village::find($value);
        return $byId?->code;
    }
}
