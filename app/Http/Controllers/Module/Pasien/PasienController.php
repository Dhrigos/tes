<?php

namespace App\Http\Controllers\Module\Pasien;

use App\Http\Controllers\Controller;
use App\Models\Module\Pasien\Pasien;
use App\Models\Module\Pasien\Pasien_History;
use App\Models\Module\Master\Data\Umum\Kelamin;
use App\Models\Module\Master\Data\Umum\Goldar;
use App\Models\Module\Master\Data\Umum\Pernikahan;
use App\Models\Module\Master\Data\Umum\Agama;
use App\Models\Module\Master\Data\Umum\Pendidikan;
use App\Models\Module\Master\Data\Umum\Pekerjaan;
use App\Models\Module\Master\Data\Umum\Suku;
use App\Models\Module\Master\Data\Umum\Bangsa;
use App\Models\Module\Master\Data\Umum\Bahasa;
use App\Models\Module\Master\Data\Umum\Asuransi;
use Illuminate\Support\Facades\DB;
use Illuminate\Container\Attributes\Log;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log as FacadesLog;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use Laravolt\Indonesia\Models\Province;
use Laravolt\Indonesia\Models\City;
use Laravolt\Indonesia\Models\District;
use Laravolt\Indonesia\Models\Village;
use App\Http\Controllers\Module\Integrasi\BPJS\Pcare_Controller;
use App\Models\Module\Pemdaftaran\Antrian_Pasien;
use Illuminate\Support\Str;

class PasienController extends Controller
{
    public function index()
    {
        // Load data pasien dengan pagination untuk menghindari memory exhausted
        $pasiens = Pasien::with('goldarRelation', 'provinsi', 'kabupaten', 'kecamatan', 'desa')->paginate(50);

        // Hitung statistik dengan query yang lebih efisien
        $pasienallold = Pasien::where('verifikasi', 2)->count();
        $pasienallnewnow = Pasien::whereMonth('created_at', now()->month)->count();
        $pasienall = Pasien::count();
        $pasiennoverif = Pasien::where('verifikasi', 1)->count();

        // Data master untuk dropdown menggunakan Laravolt Indonesia - hanya load yang diperlukan
        $provinsi = Province::select('id', 'name', 'code')->orderBy('name')->get();

        // Data master lainnya - hanya load yang diperlukan
        $kelamin = Kelamin::select('id', 'nama')->get();
        $goldar = Goldar::select('id', 'nama', 'rhesus')->get();
        $pernikahan = Pernikahan::select('id', 'nama')->get();
        $agama = Agama::select('id', 'nama')->get();
        $pendidikan = Pendidikan::select('id', 'nama')->get();
        $pekerjaan = Pekerjaan::select('id', 'name')->get();
        $suku = Suku::select('id', 'nama')->get();
        $bangsa = Bangsa::select('id', 'nama')->get();
        $bahasa = Bahasa::select('id', 'nama')->get();
        $asuransi = Asuransi::select('id', 'nama')->get();

        return Inertia::render('module/pasien/pasien', compact(
            'pasiens',
            'pasienallold',
            'pasienallnewnow',
            'pasienall',
            'pasiennoverif',
            'provinsi',
            'kelamin',
            'goldar',
            'pernikahan',
            'agama',
            'pendidikan',
            'pekerjaan',
            'suku',
            'bangsa',
            'bahasa',
            'asuransi'
        ));
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
    public function store(Request $request)
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
            'nik'                 => $nik,
            'nama'                => $data['data']['nama'] ?? $request->nama,
            'tanggal_lahir'       => $request->tgl_lahir,
            'seks'                => $request->kelamin,
            'telepon'             => $data['data']['noHP'] ?? $request->telepon,
            'alamat'              => $request->alamat,
            'goldar'              => $request->goldar,
            'pernikahan'          => $request->pernikahan,
            'no_bpjs'             => $data['data']['noKartu'],
            'tgl_exp_bpjs'        => $data['data']['tglAkhirBerlaku'],
            'kelas_bpjs'          => $data['data']['jnsKelas']['nama'],
            'jenis_peserta_bpjs'  => $data['data']['jnsPeserta']['nama'],
            'provide'             => $data['data']['kdProviderPst']['nmProvider'],
            'kodeprovide'         => $data['data']['kdProviderPst']['kdProvider'],
            'hubungan_keluarga'   => $data['data']['hubunganKeluarga'],
            'kewarganegaraan'     => "wni",
            'verifikasi'          => 1,
            'foto'                => $fotoPath,
        ];

        // Pastikan UUID terisi saat insert pertama kali (kolom uuid NOT NULL)
        $existing = Pasien::where('nik', $nik)
            ->where('no_bpjs', $pasienData['no_bpjs'])
            ->first();

        if ($existing) {
            $existing->update($pasienData);
            $pasien = $existing;
            if (empty($pasien->uuid)) {
                $pasien->uuid = Str::uuid()->toString();
                $pasien->save();
            }
        } else {
            $pasien = Pasien::create(array_merge($pasienData, [
                'uuid' => Str::uuid()->toString(),
                'no_rm' => $this->createNoRM(),
            ]));
        }

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
    public function verifikasi(Request $request)
    {
        $data = $request->validate([
            'nomor_rm' => 'required',
            'nama' => 'sometimes',
            'nik' => 'sometimes',
            'tempat_lahir' => 'sometimes',
            'tanggal_lahir' => 'sometimes|date',
            'provinsi' => 'sometimes',
            'kabupaten' => 'sometimes',
            'kecamatan' => 'sometimes',
            'desa' => 'sometimes',
            'rt' => 'sometimes',
            'rw' => 'sometimes',
            'kode_pos' => 'sometimes',
            'alamat' => 'sometimes',
            'noka' => 'sometimes|nullable',
            'noihs' => 'sometimes|nullable',
            'jenis_kartu' => 'sometimes|nullable',
            'kelas' => 'sometimes|nullable',
            'provide' => 'sometimes|nullable',
            'kodeprovide' => 'sometimes|nullable',
            'hubungan_keluarga' => 'sometimes|nullable',
            'tgl_exp_bpjs' => 'sometimes|nullable',
            'seks' => 'sometimes',
            'goldar' => 'sometimes',
            'pernikahan' => 'sometimes',
            'kewarganegaraan' => 'sometimes',
            'agama' => 'sometimes',
            'pendidikan' => 'sometimes',
            'status_kerja' => 'sometimes',
            'telepon' => 'sometimes',
            'suku' => 'sometimes',
            'bangsa' => 'sometimes',
            'bahasa' => 'sometimes',
            'penjamin_2' => 'sometimes|nullable',
            'penjamin_2_info' => 'sometimes|nullable',
            'penjamin_3' => 'sometimes|nullable',
            'penjamin_3_info' => 'sometimes|nullable',
            'aktif_penjamin_2' => 'nullable',
            'aktif_penjamin_3' => 'nullable',
        ]);

        $pasien = Pasien::with('goldarRelation')->where('no_rm', $request->nomor_rm)->first();

        if (!$pasien) {
            return redirect()->back()->withErrors(['msg' => 'Pasien tidak ditemukan']);
        }


        // Cek kelengkapan data untuk verifikasi (gunakan fallback ke data existing)
        $isDataComplete = $this->checkDataCompleteness($request, $pasien);

        // Ambil kode untuk alamat dari ID atau CODE yang dikirim, fallback ke nilai existing
        $provinsiKode = $request->filled('provinsi') ? $this->resolveRegionCode($request->provinsi, Province::class) : $pasien->provinsi_kode;
        $kabupatenKode = $request->filled('kabupaten') ? $this->resolveRegionCode($request->kabupaten, City::class) : $pasien->kabupaten_kode;
        $kecamatanKode = $request->filled('kecamatan') ? $this->resolveRegionCode($request->kecamatan, District::class) : $pasien->kecamatan_kode;
        $desaKode = $request->filled('desa') ? $this->resolveRegionCode($request->desa, Village::class) : $pasien->desa_kode;
        FacadesLog::info('[Verifikasi] Resolve wilayah', compact('provinsiKode', 'kabupatenKode', 'kecamatanKode', 'desaKode'));

        $aktifPenjamin2 = $request->boolean('aktif_penjamin_2');
        $aktifPenjamin3 = $request->boolean('aktif_penjamin_3');

        $pasien->update([
            'nik' => $request->has('nik') ? $request->nik : $pasien->nik,
            'tempat_lahir' => $request->has('tempat_lahir') ? $request->tempat_lahir : $pasien->tempat_lahir,
            'tanggal_lahir' => $request->has('tanggal_lahir') ? $request->tanggal_lahir : $pasien->tanggal_lahir,
            'provinsi_kode' => $provinsiKode,
            'kabupaten_kode' => $kabupatenKode,
            'kecamatan_kode' => $kecamatanKode,
            'desa_kode' => $desaKode,
            'rt' => $request->has('rt') ? $request->rt : $pasien->rt,
            'rw' => $request->has('rw') ? $request->rw : $pasien->rw,
            'kode_pos' => $request->has('kode_pos') ? $request->kode_pos : $pasien->kode_pos,
            'alamat' => $request->has('alamat') ? $request->alamat : $pasien->alamat,
            'no_bpjs' => $request->has('noka') ? $request->noka : $pasien->no_bpjs,
            'kode_ihs' => $request->has('noihs') ? $request->noihs : $pasien->kode_ihs,
            'jenis_peserta_bpjs' => $request->has('jenis_kartu') ? $request->jenis_kartu : $pasien->jenis_peserta_bpjs,
            'kelas_bpjs' => $request->has('kelas') ? $request->kelas : $pasien->kelas_bpjs,
            'provide' => $request->has('provide') ? $request->provide : $pasien->provide,
            'kodeprovide' => $request->has('kodeprovide') ? $request->kodeprovide : $pasien->kodeprovide,
            'hubungan_keluarga' => $request->has('hubungan_keluarga') ? $request->hubungan_keluarga : $pasien->hubungan_keluarga,
            'tgl_exp_bpjs' => $request->has('tgl_exp_bpjs') ? $request->tgl_exp_bpjs : $pasien->tgl_exp_bpjs,
            'seks' => $request->has('seks') ? $request->seks : $pasien->seks,
            'goldar' => $request->has('goldar') ? $request->goldar : $pasien->goldar,
            'pernikahan' => $request->has('pernikahan') ? $request->pernikahan : $pasien->pernikahan,
            'kewarganegaraan' => $request->has('kewarganegaraan') ? $request->kewarganegaraan : $pasien->kewarganegaraan,
            'agama' => $request->has('agama') ? $request->agama : $pasien->agama,
            'pendidikan' => $request->has('pendidikan') ? $request->pendidikan : $pasien->pendidikan,
            'pekerjaan' => $request->has('status_kerja') ? $request->status_kerja : $pasien->pekerjaan,
            'telepon' => $request->has('telepon') ? $request->telepon : $pasien->telepon,
            'suku' => $request->has('suku') ? $request->suku : $pasien->suku,
            'bangsa' => $request->has('bangsa') ? $request->bangsa : $pasien->bangsa,
            'bahasa' => $request->has('bahasa') ? $request->bahasa : $pasien->bahasa,
            'penjamin_2_nama' => $aktifPenjamin2 ? $request->penjamin_2 : null,
            'penjamin_2_no' => $aktifPenjamin2 ? $request->penjamin_2_info : null,
            'penjamin_3_nama' => $aktifPenjamin3 ? $request->penjamin_3 : null,
            'penjamin_3_no' => $aktifPenjamin3 ? $request->penjamin_3_info : null,
            'verifikasi' => $isDataComplete ? 2 : 1, // Otomatis set status berdasarkan kelengkapan
        ]);

        if ($request->hasFile('profile_image')) {
            $file = $request->file('profile_image');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->storeAs('public/pasien', $filename);
            $pasien->update(['foto' => $filename]);
        }


        $message = $isDataComplete ? 'Data pasien berhasil dilengkapi dan terverifikasi!' : 'Data pasien berhasil diperbarui, namun masih perlu dilengkapi!';

        // Realtime sync ke remote apps jika grup=1
        if ((string) env('PASIEN_SYNC_GROUP', '0') === '1') {
            $this->sendPasienSyncToRemotes($pasien, 'upsert');
        }

        // Log untuk debugging
        FacadesLog::info('Pasien verifikasi berhasil', [
            'no_rm' => $request->nomor_rm,
            'goldar' => $request->goldar,
            'is_complete' => $isDataComplete
        ]);

        return redirect()->back()->with('success', $message);
    }

    public function update(Request $request)
    {
        // Validasi field wajib untuk verifikasi - gunakan nama field yang sama dengan form
        $request->validate([
            'nomor_rm' => 'required',
            'nama' => 'required',
            'nik' => 'required',
            'tempat_lahir' => 'required',
            'tanggal_lahir' => 'required|date',
            'provinsi' => 'required',
            'kabupaten' => 'required',
            'kecamatan' => 'required',
            'desa' => 'required',
            'rt' => 'required',
            'rw' => 'required',
            'kode_pos' => 'required',
            'alamat' => 'required',
            'noka' => 'nullable',
            'noihs' => 'nullable',
            'jenis_kartu' => 'nullable',
            'kelas' => 'nullable',
            'provide' => 'nullable',
            'kodeprovide' => 'nullable',
            'hubungan_keluarga' => 'nullable',
            'tgl_exp_bpjs' => 'nullable',
            'seks' => 'required',
            'goldar' => 'required',
            'pernikahan' => 'required',
            'kewarganegaraan' => 'required',
            'agama' => 'required',
            'pendidikan' => 'required',
            'status_kerja' => 'required',
            'telepon' => 'required',
            'suku' => 'required',
            'bangsa' => 'required',
            'bahasa' => 'required',
            'penjamin_2' => 'nullable',
            'penjamin_2_info' => 'nullable',
            'penjamin_3' => 'nullable',
            'penjamin_3_info' => 'nullable',
            'aktif_penjamin_2' => 'nullable',
            'aktif_penjamin_3' => 'nullable',
        ]);

        $pasien = Pasien::with('goldarRelation')->where('no_rm', $request->nomor_rm)->first();

        if (!$pasien) {
            return redirect()->back()->withErrors(['msg' => 'Pasien tidak ditemukan']);
        }

        // Cek apakah semua field wajib telah diisi untuk menentukan status verifikasi
        $isDataComplete = $this->checkDataCompleteness($request);

        // Ambil kode untuk alamat dari ID atau CODE yang dikirim
        $provinsiKode = $this->resolveRegionCode($request->provinsi, Province::class) ?? ($request->provinsi ?: null);
        $kabupatenKode = $this->resolveRegionCode($request->kabupaten, City::class) ?? ($request->kabupaten ?: null);
        $kecamatanKode = $this->resolveRegionCode($request->kecamatan, District::class) ?? ($request->kecamatan ?: null);
        $desaKode = $this->resolveRegionCode($request->desa, Village::class) ?? ($request->desa ?: null);
        FacadesLog::info('[Update] Resolve wilayah', compact('provinsiKode', 'kabupatenKode', 'kecamatanKode', 'desaKode'));

        $aktifPenjamin2 = $request->boolean('aktif_penjamin_2');
        $aktifPenjamin3 = $request->boolean('aktif_penjamin_3');

        $updateData = [
            'nik' => $request->nik,
            'tempat_lahir' => $request->tempat_lahir,
            'tanggal_lahir' => $request->tanggal_lahir,
            'provinsi_kode' => $provinsiKode,
            'kabupaten_kode' => $kabupatenKode,
            'kecamatan_kode' => $kecamatanKode,
            'desa_kode' => $desaKode,
            'rt' => $request->rt,
            'rw' => $request->rw,
            'kode_pos' => $request->kode_pos,
            'alamat' => $request->alamat,
            'no_bpjs' => $request->noka,
            'kode_ihs' => $request->noihs,
            'jenis_peserta_bpjs' => $request->jenis_kartu,
            'kelas_bpjs' => $request->kelas,
            'provide' => $request->provide,
            'kodeprovide' => $request->kodeprovide,
            'hubungan_keluarga' => $request->hubungan_keluarga,
            'tgl_exp_bpjs' => $request->tgl_exp_bpjs,
            'seks' => $request->seks,
            'goldar' => $request->goldar,
            'pernikahan' => $request->pernikahan,
            'kewarganegaraan' => $request->kewarganegaraan,
            'agama' => $request->agama,
            'pendidikan' => $request->pendidikan,
            'pekerjaan' => $request->status_kerja,
            'telepon' => $request->telepon,
            'suku' => $request->suku,
            'bangsa' => $request->bangsa,
            'bahasa' => $request->bahasa,
            'penjamin_2_nama' => $aktifPenjamin2 ? $request->penjamin_2 : null,
            'penjamin_2_no' => $aktifPenjamin2 ? $request->penjamin_2_info : null,
            'penjamin_3_nama' => $aktifPenjamin3 ? $request->penjamin_3 : null,
            'penjamin_3_no' => $aktifPenjamin3 ? $request->penjamin_3_info : null,
            'verifikasi' => $isDataComplete ? 2 : 1, // Otomatis set status verifikasi
        ];

        $pasien->update($updateData);

        // Realtime sync ke remote apps jika grup=1
        if ((string) env('PASIEN_SYNC_GROUP', '0') === '1') {
            $fresh = $pasien->fresh();
            $this->sendPasienSyncToRemotes($fresh, 'upsert');
        }

        if ($request->hasFile('profile_image')) {
            $file = $request->file('profile_image');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->storeAs('public/pasien', $filename);
            $pasien->update(['foto' => $filename]);
        }
    }

    /**
     * Endpoint untuk menerima apply sinkronisasi pasien dari remote apps
     */
    public function syncApply(Request $request)
    {
        $payload = $request->validate([
            'event' => 'required|string',
            'data' => 'required|array',
            'data.no_rm' => 'required|string',
        ]);

        $data = $payload['data'];
        $lookup = ['no_rm' => $data['no_rm']];

        // Ambil field yang aman untuk di-update
        $write = collect($data)->only([
            'uuid',
            'no_rm',
            'nik',
            'nama',
            'kode_ihs',
            'tempat_lahir',
            'tanggal_lahir',
            'no_bpjs',
            'tgl_exp_bpjs',
            'kelas_bpjs',
            'jenis_peserta_bpjs',
            'provide',
            'kodeprovide',
            'hubungan_keluarga',
            'alamat',
            'rt',
            'rw',
            'kode_pos',
            'kewarganegaraan',
            'seks',
            'agama',
            'pendidikan',
            'goldar',
            'pernikahan',
            'pekerjaan',
            'telepon',
            'provinsi_kode',
            'kabupaten_kode',
            'kecamatan_kode',
            'desa_kode',
            'suku',
            'bahasa',
            'bangsa',
            'verifikasi',
            'penjamin_2_nama',
            'penjamin_2_no',
            'penjamin_3_nama',
            'penjamin_3_no',
            'foto'
        ])->toArray();

        // Upsert berdasarkan no_rm
        Pasien::updateOrCreate($lookup, $write);

        return response()->json(['status' => 'ok']);
    }



    private function sendPasienSyncToRemotes(Pasien $pasien, string $event): void
    {
        try {
            $json = [
                'event' => $event,
                'data' => [
                    'uuid' => $pasien->uuid,
                    'no_rm' => $pasien->no_rm,
                    'nik' => $pasien->nik,
                    'nama' => $pasien->nama,
                    'kode_ihs' => $pasien->kode_ihs,
                    'tempat_lahir' => $pasien->tempat_lahir,
                    'tanggal_lahir' => $pasien->tanggal_lahir,
                    'no_bpjs' => $pasien->no_bpjs,
                    'tgl_exp_bpjs' => $pasien->tgl_exp_bpjs,
                    'kelas_bpjs' => $pasien->kelas_bpjs,
                    'jenis_peserta_bpjs' => $pasien->jenis_peserta_bpjs,
                    'provide' => $pasien->provide,
                    'kodeprovide' => $pasien->kodeprovide,
                    'hubungan_keluarga' => $pasien->hubungan_keluarga,
                    'alamat' => $pasien->alamat,
                    'rt' => $pasien->rt,
                    'rw' => $pasien->rw,
                    'kode_pos' => $pasien->kode_pos,
                    'kewarganegaraan' => $pasien->kewarganegaraan,
                    'seks' => $pasien->seks,
                    'agama' => $pasien->agama,
                    'pendidikan' => $pasien->pendidikan,
                    'goldar' => $pasien->goldar,
                    'pernikahan' => $pasien->pernikahan,
                    'pekerjaan' => $pasien->pekerjaan,
                    'telepon' => $pasien->telepon,
                    'provinsi_kode' => $pasien->provinsi_kode,
                    'kabupaten_kode' => $pasien->kabupaten_kode,
                    'kecamatan_kode' => $pasien->kecamatan_kode,
                    'desa_kode' => $pasien->desa_kode,
                    'suku' => $pasien->suku,
                    'bahasa' => $pasien->bahasa,
                    'bangsa' => $pasien->bangsa,
                    'verifikasi' => $pasien->verifikasi,
                    'penjamin_2_nama' => $pasien->penjamin_2_nama,
                    'penjamin_2_no' => $pasien->penjamin_2_no,
                    'penjamin_3_nama' => $pasien->penjamin_3_nama,
                    'penjamin_3_no' => $pasien->penjamin_3_no,
                    'foto' => $pasien->foto,
                ],
            ];

            $endpoints = preg_split('/\s*,\s*/', (string) env('PASIEN_SYNC_REMOTES', ''), -1, PREG_SPLIT_NO_EMPTY);
            $token = env('PASIEN_SYNC_TOKEN');
            if (!$endpoints || !$token) {
                return;
            }

            foreach ($endpoints as $url) {
                try {
                    Http::withHeaders(['X-Sync-Token' => $token])
                        ->timeout(3)
                        ->post(rtrim($url, '/') . '/api/sync/pasien/upsert', $json);
                } catch (\Throwable $e) {
                    // Jangan ganggu proses utama
                }
            }
        } catch (\Throwable $e) {
            // Diabaikan
        }
    }





    /**
     * Method helper untuk mengecek kelengkapan data
     */
    private function checkDataCompleteness($request, $pasien = null)
    {
        $requiredFields = [
            'nik',
            'tempat_lahir',
            'tanggal_lahir',
            'provinsi',
            'kabupaten',
            'kecamatan',
            'desa',
            'rt',
            'rw',
            'kode_pos',
            'alamat',
            'seks',
            'goldar',
            'pernikahan',
            'kewarganegaraan',
            'agama',
            'pendidikan',
            'status_kerja',
            'telepon',
            'suku',
            'bangsa',
            'bahasa'
        ];

        if ($pasien) {
            // Peta fallback dari field request ke kolom pasien
            $fallbackMap = [
                'nik' => 'nik',
                'tempat_lahir' => 'tempat_lahir',
                'tanggal_lahir' => 'tanggal_lahir',
                'provinsi' => 'provinsi_kode',
                'kabupaten' => 'kabupaten_kode',
                'kecamatan' => 'kecamatan_kode',
                'desa' => 'desa_kode',
                'rt' => 'rt',
                'rw' => 'rw',
                'kode_pos' => 'kode_pos',
                'alamat' => 'alamat',
                'seks' => 'seks',
                'goldar' => 'goldar',
                'pernikahan' => 'pernikahan',
                'kewarganegaraan' => 'kewarganegaraan',
                'agama' => 'agama',
                'pendidikan' => 'pendidikan',
                'status_kerja' => 'pekerjaan',
                'telepon' => 'telepon',
                'suku' => 'suku',
                'bangsa' => 'bangsa',
                'bahasa' => 'bahasa',
            ];

            foreach ($requiredFields as $field) {
                $hasValue = !empty($request->$field);
                if (!$hasValue) {
                    $patientAttr = $fallbackMap[$field] ?? null;
                    if (!$patientAttr || empty($pasien->$patientAttr)) {
                        return false;
                    }
                }
            }
        } else {
            foreach ($requiredFields as $field) {
                if (empty($request->$field)) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Menyelesaikan nilai wilayah menjadi code, menerima input berupa ID atau CODE.
     */
    private function resolveRegionCode($value, $modelClass)
    {
        if (empty($value)) {
            return null;
        }

        // Utamakan mencari berdasarkan code terlebih dahulu
        $record = $modelClass::where('code', $value)->first();
        if ($record) {
            return $record->code;
        }

        // Jika tidak ketemu dan input numeric, coba cari berdasarkan ID
        if (is_numeric($value)) {
            $record = $modelClass::find($value);
            if ($record) {
                return $record->code;
            }
        }

        // Terakhir, kembalikan value apa adanya (diasumsikan sudah berupa code)
        return $value;
    }

    public function panggil($id)
    {
        $pasien = Pasien::findOrFail($id);

        // Logika untuk memanggil pasien
        // Bisa ditambahkan ke antrian panggilan atau notifikasi

        return response()->json([
            'success' => true,
            'message' => "Pasien {$pasien->nama} berhasil dipanggil"
        ]);
    }

    // Method untuk cascading dropdown daerah
    public function getKabupaten($provinceId)
    {
        try {
            // Cari provinsi berdasarkan ID untuk mendapatkan code
            $province = Province::find($provinceId);

            if (!$province) {
                return response()->json([]);
            }

            $kabupaten = City::where('province_code', $province->code)
                ->orderBy('name')
                ->get(['id', 'name', 'code', 'province_code']);

            return response()->json($kabupaten);
        } catch (\Exception $e) {
            FacadesLog::error('Error getting kabupaten: ' . $e->getMessage());
            return response()->json([]);
        }
    }

    public function getKecamatan($regencyId)
    {
        try {
            // Cari kabupaten berdasarkan ID untuk mendapatkan code
            $regency = City::find($regencyId);

            if (!$regency) {
                return response()->json([]);
            }

            $kecamatan = District::where('city_code', $regency->code)
                ->orderBy('name')
                ->get(['id', 'name', 'code', 'city_code']);

            return response()->json($kecamatan);
        } catch (\Exception $e) {
            FacadesLog::error('Error getting kecamatan: ' . $e->getMessage());
            return response()->json([]);
        }
    }

    public function getDesa($districtId)
    {
        try {
            // Cari kecamatan berdasarkan ID untuk mendapatkan code
            $district = District::find($districtId);

            if (!$district) {
                return response()->json([]);
            }

            $desa = Village::where('district_code', $district->code)
                ->orderBy('name')
                ->get(['id', 'name', 'code', 'district_code']);

            return response()->json($desa);
        } catch (\Exception $e) {
            FacadesLog::error('Error getting desa: ' . $e->getMessage());
            return response()->json([]);
        }
    }


    // Ambil pasien yang dishare dalam grup klinik
    public function shared(Request $request)
    {
        // Validasi input kode_klinik
        $request->validate([
            'kode_klinik' => 'required|string'
        ]);

        $kodeKlinikRequest = $request->kode_klinik;

        // Ambil setting kode klinik dan kode grup dari web_settings
        $setting = DB::table('web_settings')
            ->select('kode_klinik', 'kode_group_klinik')
            ->first();

        if (!$setting) {
            return response()->json([
                'status' => 'error',
                'message' => 'Setting web klinik belum tersedia.'
            ], 404);
        }

        // Cek apakah kode klinik request sesuai dengan setting
        if ($setting->kode_klinik != $kodeKlinikRequest) {
            return response()->json([
                'status' => 'error',
                'message' => 'Kode klinik tidak sesuai.'
            ], 403);
        }

        // Ambil semua pasien (tidak ada filter is_shared atau relasi clinic)
        $patients = Pasien::all();

        // Ambil no_rm dari patients
        $noRmList = $patients->pluck('no_rm')->filter()->unique()->values();

        // Ambil histori sesuai no_rm
        $histories = Pasien_History::whereIn('no_rm', $noRmList)
            ->orderBy('created_at', 'desc')
            ->get()
            ->groupBy('no_rm')
            ->map(function ($items) {
                return $items->map(function ($row) {
                    return [
                        'id' => $row->id,
                        'no_rm' => $row->no_rm,
                        'nama' => $row->nama,
                        'history' => $row->history,
                        'created_at' => optional($row->created_at)->toISOString(),
                        'updated_at' => optional($row->updated_at)->toISOString(),
                    ];
                })->all();
            });

        // Gabungkan histories ke tiap pasien
        $patientsWithHistories = $patients->map(function ($patient) use ($histories) {
            return [                
                $patient,
                // tambahkan kolom pasien lain sesuai kebutuhan                
                'histories' => $histories->get($patient->no_rm, []),
            ];
        });
        return response()->json([
            'status' => 'success',
            'data'   => $patientsWithHistories,
        ]);
        
    }
}
