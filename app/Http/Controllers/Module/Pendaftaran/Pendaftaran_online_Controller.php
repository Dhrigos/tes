<?php

namespace App\Http\Controllers\Module\Pendaftaran;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Module\Integrasi\BPJS\Pcare_Controller;
use App\Models\Module\Master\Data\Umum\Goldar;
use App\Models\Module\Master\Data\Umum\Kelamin;
use App\Models\Module\Master\Data\Umum\Pernikahan;
use App\Models\Module\Pasien\Pasien;
use App\Models\Module\Pemdaftaran\Antrian_Pasien;
use Illuminate\Http\Request;
use Inertia\Inertia;

class Pendaftaran_online_Controller extends Controller
{
    public function index()
    {
        $kelamin = Kelamin::all();
        $goldar = Goldar::all();
        $pernikahan = Pernikahan::all();
        return Inertia::render('module/pendaftaran-online/index', [
            'kelamin' => $kelamin,
            'goldar' => $goldar,
            'pernikahan' => $pernikahan
        ]);
    }
    
    private function createNoRM()
    {
        // Ambil No RM terbesar di database
        $lastNoRM = Pasien::max('no_rm');

        if ($lastNoRM) {
            // Jika ada data, tambahkan 1 ke No RM terakhir
            $newNoRM = str_pad((int)$lastNoRM + 1, 6, '0', STR_PAD_LEFT);
        } else {
            // Jika tidak ada data pasien, mulai dari 000001
            $newNoRM = '000001';
        }

        return $newNoRM;
    }

    public function add(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
            'nik' => 'required|string|max:20',
            'tgl_lahir' => 'required|date',
            'kelamin' => 'required',
            'telepon' => 'nullable|string|max:20',
            'alamat' => 'nullable|string|max:255',
            'goldar' => 'nullable',
            'pernikahan' => 'nullable',
            'foto' => 'nullable|image|max:2048',
        ]);

        // Simpan foto jika ada
        $fotoPath = null;
        if ($request->hasFile('foto')) {
            $fotoPath = $request->file('foto')->store('pasien_foto', 'public');
        }

        $pcareController = new Pcare_Controller();
        $response = $pcareController->get_peserta($request->nik); // harus return JsonResponse

        // Ambil data JSON langsung
        $data = json_decode($response->getContent(), true); // decode ke array

        $nik = $request->nik ?? $data['data']['noKTP'];

        if (!$nik) {
            return redirect()->back()->with('error', 'NIK pasien wajib diisi!');
        }
        // // Simpan data pasien baru (ganti dengan model pasien Anda)
        $pasienData = [
            'nama'                => $data['data']['nama'] ?? $request->nama,
            'tgl_lahir'           => $request->tgl_lahir,
            'kelamin'             => $request->kelamin,
            'telepon'             => $data['data']['noHP'] ?? $request->telepon,
            'alamat'              => $request->alamat,
            'goldar'              => $request->goldar,
            'pernikahan'          => $request->pernikahan,
            'no_bpjs'             => $data['data']['noKartu'],
            'tgl_exp_bpjs'        => $data['data']['tglAkhirBerlaku'],
            'kelas_bpjs'          => $data['data']['jnsKelas']['nama'],
            'jenis_peserta_bpjs'  => $data['data']['jnsPeserta']['nama'],
            'provide'            => $data['data']['kdProviderPst']['nmProvider'],
            'kodeprovide'        => $data['data']['kdProviderPst']['kdProvider'],
            'hubungan_keluarga'   => $data['data']['hubunganKeluarga'],
            'kewarganegaraan'     => "wni",
            'verifikasi'          => 1,
            'foto'                => $fotoPath,
        ];

        // Gunakan updateOrCreate untuk mencegah duplikasi
        $pasien = Pasien::updateOrCreate(
            [
                'nik'    => $nik,
                'no_bpjs'=> $pasienData['no_bpjs'],
            ],
            array_merge($pasienData, [
                'no_rm' => $this->createNoRM(), // hanya buat no_rm baru jika record baru
            ])
        );

        $antrianData = $this->generateNomorAntrian('A');

        $antrian = Antrian_Pasien::create([
            'pasien_id' => $pasien->id,
            'prefix'    => $antrianData['prefix'],
            'nomor'     => $antrianData['nomor'],
            'tanggal'   => $antrianData['tanggal'],
        ]);

        $antrianRecord = $antrian->prefix . '-' . $antrian->nomor;


        return redirect()->back()->with([
            'success'       => 'Pasien berhasil didaftarkan atau diperbarui!',
            'nomor_antrian' => $antrianRecord, // ambil field nomor, bukan object
        ]);


    }

    private function generateNomorAntrian($prefix = 'A')
    {
        $today = now()->toDateString();

        // Ambil antrian terakhir hari ini untuk prefix tertentu
        $lastAntrian = Antrian_Pasien::where('prefix', $prefix)
            ->whereDate('tanggal', $today)
            ->orderBy('nomor', 'desc')
            ->first();

        $nomor = $lastAntrian ? $lastAntrian->nomor + 1 : 1;

        return [
            'prefix' => $prefix,
            'nomor' => $nomor,
            'tanggal' => $today
        ];
    }

}
