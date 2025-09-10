<?php

namespace App\Http\Controllers\Module\Integrasi\BPJS;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class MJKN_Controller extends Controller
{
    public function get_token(Request $request)
    {
        // Ambil dari header, fallback ke default jika tidak ada
        $username = $request->header('x-username');
        $password = $request->header('x-password');

        // Validasi terhadap hardcoded sistem user
        $system_user_name = 'jkn_mobile';
        $system_password  = 'omega123';

        if ($username !== $system_user_name || $password !== $system_password) {
            return response()->json([
                'metadata' => [
                    'message' => 'Username atau Password Tidak Sesuai',
                    'code' => 201
                ]
            ], 401);
        }

        // Jika valid, kirim token
        $token = $this->get_jwtx();

        // Hapus token yang sudah expired
        token_mjkn::where('expired', '<', Carbon::now())->delete();

        // Simpan token baru dengan waktu expired 10 menit dari sekarang
        $inserted = token_mjkn::create([
            'token' => $token,
            'expired' => Carbon::now()->addMinutes(10) // Ubah ke 10 menit sesuai permintaan
        ]);

        if ($inserted) {
            return response()->json([
                "response" => ["token" => $token],
                "metadata" => ["message" => "Ok", "code" => 200]
            ]);
        } else {
            return response()->json([
                "metadata" => [
                    "message" => "Token baru tidak dapat disimpan di database system.",
                    "code" => 201
                ]
            ], 500);
        }
    }

    private function get_jwtx()
    {
        $seed = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9eyJ1aWQiOiI1ZjFlOTYyMGY1NmZmNzNjYTNlMGFmNGEiLCJmdWxsTmFtZSI6IkdhdGV3YXkgU3lzdGVtIiwiZmlyc3ROYW1lIjoiR2F0ZXdheSIsIm1pZGRsZU5hbWUiOiIiLCJsYXN0TmFtZSI6IlN5c3RlbSIsIm1vYmlsZXBob25lIjoiNjI4OTU0MDYxODIwOTAiLCJjb3VudHJ5Q29kZSI6IiIsInJvbGUiOiJjbGllbnQiLCJleHAiOjE1OTYxNTM1OTkwMDAsImlhdCI6MTU5NTkzMTQwMCwiaX";
        $token = '';
        $length = strlen($seed);

        for ($i = 0; $i < $length; $i++) {
            $token .= substr($seed, rand(0, $length - 1), 1);
        }

        return $token;
    }

    public function get_antrian(Request $request)
    {
        // === 1. Validasi Token ===
        $token = $request->header('x-token');
        $user = $request->header('x-username');

        if (!$token || !token_mjkn::where('token', $token)->where('expired', '>=', now())->exists()) {
            return response()->json([
                'metadata' => ['message' => 'Token Expired', 'code' => 201]
            ], 401);
        }

        if (!$user || $user !== 'jkn_mobile') {
            return response()->json([
                'metadata' => ['message' => 'User tidak diizinkan', 'code' => 201]
            ], 403);
        }



        // === 2. Validasi Input JSON ===
        $data = $request->validate([
            'nomorkartu' => 'required|numeric|digits:13',
            'tanggalperiksa' => 'required|date_format:Y-m-d',
            'kodepoli' => 'required|string',
            'nik' => 'required|numeric',
            'norm' => 'nullable|string',
            'nohp' => 'required|string',
            'kodedokter' => 'required|numeric',
            'jampraktek' => 'required|string'
        ]);

        // === 3. Validasi jam praktek dan tanggal ===

        $jampraktek = $data['jampraktek'];
        $tgl = $data['tanggalperiksa'];

        $tglcek = Carbon::parse($data['tanggalperiksa']);
        $hariIni = now()->startOfDay();

        if ($tglcek->lt($hariIni)) {
            return response()->json([
                'metadata' => ['message' => 'Tanggal tidak boleh mundur ke belakang', 'code' => 201]
            ]);
        }

        $jam_tutup = explode(':', explode('-', $jampraktek)[1])[0];
        $jam_now = now()->format('H');
        if ( $jam_now >= $jam_tutup) {
            return response()->json([
                'metadata' => ['message' => 'Format tanggal tidak boleh mundur', 'code' => 201]
            ]);
        }
        $tglcek = Carbon::parse($data['tanggalperiksa']);
        $hariIni = now()->startOfDay();

        if ($tglcek->lt($hariIni)) {
            return response()->json([
                'metadata' => ['message' => 'Tanggal tidak boleh mundur ke belakang', 'code' => 201]
            ]);
        }

        // === 4. Cek dan ambil pasien ===
        $pasien = null;
        if ($data['norm']) {
            $pasien = pasien::where('no_rm', $data['norm'])->first();
        }
        if (!$pasien) {
            $pasien = pasien::where('nik', $data['nik'])
                ->orWhere('no_bpjs', $data['nomorkartu'])
                ->first();

            if (!$pasien) {
                return response()->json([
                    'metadata' => [
                        'message' => "No Kartu ({$data['nomorkartu']}) dan NIK ({$data['nik']}) belum terdata",
                        'code' => '202'
                    ]
                ]);
            }
        }

        // === 5. Cari Poli dan Dokter ===
        $poli = poli::where('kode', $data['kodepoli'])->first();
        $dokter = dokter::where('kode', $data['kodedokter'])->first();
        if (!$poli || !$dokter) {
            return response()->json([
                'metadata' => ['message' => 'Poli atau Dokter tidak ditemukan', 'code' => 201]
            ]);
        }

        // === 6. Cek antrian ganda ===
        $tglLike = $tgl . '%';
        $adaDaftarAktif = Pendaftaran_rawat_jalan::where('nomor_rm', $pasien->no_rm)
            ->whereDate('tanggal_kujungan', $tgl)
            ->whereHas('status', function ($query) {
                $query->where('status_pendaftaran', '!=', 0);
            })
            ->exists();

        if ($adaDaftarAktif) {
            return response()->json([
                'metadata' => [
                    'message' => 'Anda sudah ambil antrian di tanggal ini',
                    'code' => 201
                ]
            ]);
        }


        // === 8. Hitung kuota ===
        $kuotajkn = 30;
        $kuotanonjkn = 30;
        $penjamin_id = 1;

        $jkn_count = Pendaftaran_rawat_jalan::where('dokter_id', $dokter->id)
            ->whereDate('tanggal_kujungan', $tgl)
            ->where('penjamin', $penjamin_id)->count();

        $nonjkn_count = Pendaftaran_rawat_jalan::where('dokter_id', $dokter->id)
            ->whereDate('tanggal_kujungan', $tgl)
            ->where('penjamin', '!=', $penjamin_id)->count();

        $sisakuotajkn = $kuotajkn - $jkn_count;
        $sisakuotanonjkn = $kuotanonjkn - $nonjkn_count;

        // === 9. Simpan antrian ===
        $antrian = loket::where('poli_id', $poli->id)->first();

        $tglcek = Carbon::parse($data['tanggalperiksa']);
        $last = Pendaftaran_rawat_jalan::where('antrian', 'like', $antrian->nama . '-%')
            ->whereDate('created_at', $tglcek)
            ->orderBy('created_at', 'desc')
            ->first();

        if ($last) {
            // Ambil angka terakhir dan increment
            $lastNumber = (int) str_replace($antrian->nama . '-', '', $last->antrian);
            $nextNumber = $lastNumber + 1;
        } else {
            // Jika belum ada antrian hari ini, mulai dari 1
            $nextNumber = 1;
        }

        $antrianBaru = $antrian->nama . '-' . $nextNumber;


        $tanggal = Carbon::parse($request->tanggal_kunjungan);
        $tanggalKode = $tanggal->format('y') . str_pad($tanggal->dayOfYear, 3, '0', STR_PAD_LEFT); // Contoh: 25113

        // Angka acak 4 digit
        $angkaAcak = mt_rand(1000, 9999); // Contoh: 1234

        // Gabungkan format akhir: 1234-25113
        $no_registrasi = $angkaAcak . '-' . $tanggalKode;

        $pendaftaran = Pendaftaran_rawat_jalan::create([
            'nomor_rm' => $pasien->no_rm,
            'pasien_id' => $pasien->id,
            'nomor_register' => $no_registrasi,
            'tanggal_kujungan' => $tgl . 'T00:00',
            'poli_id' => $poli->id,
            'dokter_id' => $dokter->id,
            'Penjamin' => $penjamin_id,
            'antrian' => $antrianBaru,
        ]);

        Pendaftaran_rawat_jalan_status::create([
            'nomor_rm' => $pasien->no_rm,
            'pasien_id' => $pasien->id,
            'nomor_register' => $no_registrasi,
            'tanggal_kujungan' => $tgl . 'T00:00',
            'register_id' => $pendaftaran->id,
            'status_panggil' => 0,
            'status_pendaftaran' => 1,
            'Status_aplikasi' => 3
        ]);

        $data = Pendaftaran_rawat_jalan_status::with('pendaftaran')->where('status_panggil', 1)->first();

        $antrianTerbaru = Pendaftaran_rawat_jalan::whereHas('status', function ($query) {
                $query->where('status_pendaftaran', 2);
            })
            ->whereDate('created_at', $tanggal) // filter sesuai tanggal
            ->orderBy('antrian', 'desc')
            ->pluck('antrian')
            ->first(); // ambil 1 data paling atas

        $angkaAntrean = 0;
        $angkaPanggil = 0;

        if (preg_match('/\d+/', $antrianBaru, $matchAntrean)) {
            $angkaAntrean = intval($matchAntrean[0]);
        }

        if (preg_match('/\d+/', $antrianTerbaru, $matchPanggil)) {
            $angkaPanggil = intval($matchPanggil[0]);
        }

       $sisaAntrean = max(0, $angkaPanggil - $angkaAntrean);


        // === 11. Response ===
        return response()->json([
            'response' => [
                'kodebooking' => $no_registrasi,
                'norm' => $pasien->no_rm,
                'namapoli' => $poli->nama,
                'namadokter' => $dokter->namauser->name,
                'sisakuotajkn' => $sisakuotajkn - 1,
                'kuotajkn' => $kuotajkn,
                'sisakuotanonjkn' => $sisakuotanonjkn,
                'kuotanonjkn' => $kuotanonjkn,
                'nomorantrean' => $antrianBaru,
                'angkaantrean' => $nextNumber,
                'sisaantrean' => $sisaAntrean,
                'antreanpanggil' => $antrianTerbaru,
                'status_panggil' => $data->pendaftaran->antrian ?? null,
                'keterangan' => 'Apabila antiran terlewat harap ambil antrian kembali.'
            ],
            'metadata' => [
                'message' => 'OK',
                'code' => 200
            ]
        ]);
    }

    public function get_status_antrian(Request $request, $kode_poli, $tanggal)
    {
        // === 1. Validasi Token ===
        $token = $request->header('x-token');
        $user = $request->header('x-username');

        if (!$token || !token_mjkn::where('token', $token)->where('expired', '>=', now())->exists()) {
            return response()->json([
                'metadata' => ['message' => 'Token Expired', 'code' => 201]
            ], 401);
        }

        if (!$user || $user !== 'jkn_mobile') {
            return response()->json([
                'metadata' => ['message' => 'User tidak diizinkan', 'code' => 201]
            ], 403);
        }

        // === Validasi Format Tanggal ===
        if (!preg_match("/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$/", $tanggal)) {
            return response()->json([
                'metadata' => ['message' => 'Format Tanggal Tidak Sesuai, gunakan yyyy-mm-dd', 'code' => 201]
            ]);
        }

        // === Ambil Poli ===
        $poli = Poli::where('kode', $kode_poli)->first();
        // Debugging sementara
        if (!$poli) {
            logger("Poli dengan kode '{$kode_poli}' tidak ditemukan.");
            return response()->json([
                'metadata' => ['message' => 'Poli Tidak Ditemukan', 'code' => 201]
            ]);
        }


        // === Ambil Semua Jadwal Dokter di Poli Ini ===
        $hariIni = Carbon::today();

        $jadwalList = Dokter::with(['namauser', 'jadwal' => function ($query) use ($hariIni) {
            $query->whereDate('start', $hariIni);
        }])
            ->where('poli', $poli->id) // << ini filter langsung di tabel dokter
            ->whereHas('jadwal', function ($query) use ($hariIni) {
                $query->whereDate('start', $hariIni);
            })
            ->get();

        if ($jadwalList->isEmpty()) {
            return response()->json([
                'metadata' => ['message' => 'Tidak ada jadwal dokter hari ini di poli ini', 'code' => 201]
            ]);
        }

        // === Set Kuota Default ===
        $kuotajkn = 30;
        $kuotanonjkn = 30;

        $responseData = [];

        foreach ($jadwalList as $dokter) {
            foreach ($dokter->jadwal as $jadwal) {
                $dokter_id = $dokter->id;
                $jampraktek = Carbon::parse($jadwal->start)->format('H:i') . '-' . Carbon::parse($jadwal->end)->format('H:i');

                $totalJKN = Pendaftaran_rawat_jalan::whereDate('tanggal_kujungan', $tanggal)
                    ->where('dokter_id', $dokter_id)
                    ->where('penjamin', 2)
                    ->count();

                $totalNonJKN = Pendaftaran_rawat_jalan::whereDate('tanggal_kujungan', $tanggal)
                    ->where('dokter_id', $dokter_id)
                    ->where('penjamin', '!=', 2)
                    ->count();

                $sudahDilayani = Pendaftaran_rawat_jalan::join('pendaftaran_rawat_jalan_statuses as status', 'pendaftaran_rawat_jalans.nomor_register', '=', 'status.nomor_register')
                    ->whereDate('pendaftaran_rawat_jalans.tanggal_kujungan', $tanggal)
                    ->where('pendaftaran_rawat_jalans.dokter_id', $dokter_id)
                    ->where('status.status_pendaftaran', 2)
                    ->count();

                $totalAntrean = $totalJKN + $totalNonJKN;
                $sisaAntrean = $totalAntrean - $sudahDilayani;

                $dipanggil = Pendaftaran_rawat_jalan_status::whereHas('pendaftaran', function ($q) use ($dokter_id, $tanggal) {
                    $q->whereDate('tanggal_kujungan', $tanggal)
                        ->where('dokter_id', $dokter_id);
                })->where('status_panggil', 1)->orderByDesc('id')->first();

                $antrean_panggil = $dipanggil ? $dipanggil->no_urut : null;

                $responseData[] = [
                    'namapoli' => $poli->nama,
                    'totalantrean' => $totalAntrean,
                    'sisaantrean' => $sisaAntrean,
                    'antreanpanggil' => $antrean_panggil ? 'A' . $dokter->id . '-' . $antrean_panggil : '',
                    'keterangan' => '',
                    'kodedokter' => $dokter->kode,
                    'namadokter' => $dokter->namauser->name ?? $dokter->nama,
                    'jampraktek' => $jampraktek,
                ];
            }
        }


        return response()->json([
            'response' => $responseData,
            'metadata' => [
                'message' => 'Ok',
                'code' => 200
            ]
        ]);
    }

    public function get_sisa_antrian(Request $request, $nomorkartu, $kodepoli, $tanggal)
    {
        // === 1. Validasi Token ===
        $token = $request->header('x-token');
        $user = $request->header('x-username');

        if (!$token || !token_mjkn::where('token', $token)->where('expired', '>=', now())->exists()) {
            return response()->json([
                'metadata' => ['message' => 'Token Expired', 'code' => 201]
            ], 401);
        }

        if (!$user || $user !== 'jkn_mobile') {
            return response()->json([
                'metadata' => ['message' => 'User tidak diizinkan', 'code' => 201]
            ], 403);
        }

        // 1. Validasi tanggal
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $tanggal)) {
            return response()->json([
                'metadata' => ['message' => 'Format Tanggal Tidak Valid (yyyy-mm-dd)', 'code' => 201]
            ]);
        }

        // 2. Ambil pasien berdasarkan nomor kartu
        $pasien = Pasien::where('no_bpjs', $nomorkartu)->first();
        if (!$pasien) {
            return response()->json([
                'metadata' => ['message' => 'Pasien tidak ditemukan', 'code' => 201]
            ]);
        }

        // 3. Ambil Poli
        $poli = Poli::where('kode', $kodepoli)->first();
        if (!$poli) {
            return response()->json([
                'metadata' => ['message' => 'Poli tidak ditemukan', 'code' => 201]
            ]);
        }

        // 4. Ambil pendaftaran pasien hari ini
        $pendaftaran = Pendaftaran_rawat_jalan::where('pasien_id', $pasien->id)
            ->where('poli_id', $poli->id)
            ->whereDate('tanggal_kujungan', $tanggal)
            ->first();

        if (!$pendaftaran) {
            return response()->json([
                'metadata' => ['message' => 'Tidak ditemukan antrian pada tanggal ini untuk pasien', 'code' => 201]
            ]);
        }

        $no_urut_saya_raw = $pendaftaran->antrian; // Contoh: A-20
        $no_urut_saya = (int) Str::after($no_urut_saya_raw, '-');
        $dokter = $pendaftaran->dokter;

        // 5. Ambil nomor antrean yang sedang dipanggil
        $dipanggil = Pendaftaran_rawat_jalan_status::whereHas('pendaftaran', function ($q) use ($dokter, $tanggal) {
            $q->whereDate('tanggal_kujungan', $tanggal)
                ->where('dokter_id', $dokter->id);
        })
            ->where('status_panggil', 1)
            ->orderByDesc('id')
            ->first();

        $no_urut_dipanggil = $dipanggil ? (int) Str::after($dipanggil->no_urut, '-') : 0;

        // 6. Hitung sisa antrean dan estimasi waktu tunggu
        $avg_time = $poli->avg_service_time ?? 10;
        $sisa_antrian = max(0, $no_urut_saya - $no_urut_dipanggil);
        $waktu_tunggu = $sisa_antrian * $avg_time * 60;

        // 7. Response
        return response()->json([
            'response' => [
                'nomorantrean' => $no_urut_saya_raw,
                'namapoli' => $poli->nama,
                'namadokter' => $dokter->namauser->name ?? $dokter->nama,
                'sisaantrean' => $sisa_antrian,
                'antreanpanggil' => $dipanggil ? $dipanggil->no_urut : '',
                'waktutunggu' => $waktu_tunggu,
                'keterangan' => ''
            ],
            'metadata' => [
                'message' => 'OK',
                'code' => 200
            ]
        ]);
    }

    public function batalkan_antrian(Request $request)
    {
        // === 1. Validasi Token ===
        $token = $request->header('x-token');
        $user = $request->header('x-username');

        if (!$token || !token_mjkn::where('token', $token)->where('expired', '>=', now())->exists()) {
            return response()->json([
                'metadata' => ['message' => 'Token Expired', 'code' => 201]
            ], 401);
        }

        if (!$user || $user !== 'jkn_mobile') {
            return response()->json([
                'metadata' => ['message' => 'User tidak diizinkan', 'code' => 201]
            ], 403);
        }

        // === 2. Validasi Request Body ===
        $validated = $request->validate([
            'nomorkartu' => 'required|string',
            'kodepoli' => 'required|string',
            'tanggalperiksa' => 'required|date_format:Y-m-d',
            'keterangan' => 'required|string'
        ]);

        $nomorKartu = $validated['nomorkartu'];
        $kodePoli = $validated['kodepoli'];
        $tanggal = $validated['tanggalperiksa'];
        $keterangan = $validated['keterangan'];

        $pasien = Pasien::where('no_bpjs', $nomorKartu)->first();
        if (!$pasien) {
            return response()->json([
                'metadata' => ['message' => 'Pasien tidak ditemukan', 'code' => 201]
            ]);
        }

        $poli = Poli::where('kode', $kodePoli)->first();
        if (!$poli) {
            return response()->json([
                'metadata' => ['message' => 'Poli tidak ditemukan', 'code' => 201]
            ]);
        }

        $antrian = Pendaftaran_rawat_jalan::where('pasien_id', $pasien->id)
            ->where('poli_id', $poli->id)
            ->whereDate('tanggal_kujungan', $tanggal)
            ->with('status') // tetap ambil relasi status
            ->orderBy('created_at', 'desc')
            ->first();


        if (!$antrian) {
            return response()->json([
                'metadata' => [
                    'message' => 'Antrian tidak ditemukan',
                    'code' => 201
                ]
            ]);
        }

        $status = Pendaftaran_rawat_jalan_status::where('nomor_register', $antrian->nomor_register)
                ->orderBy('created_at', 'desc')
                ->first();


        if (!$antrian->status || $antrian->status->status_pendaftaran == 0) {
            return response()->json([
                'metadata' => [
                    'message' => 'Antrian tidak ditemukan (sudah dibatalkan)',
                    'code' => 201
                ]
            ]);
        }
        if ($status->status_panggil != 0) {
            return response()->json([
                'metadata' => [
                    'message' => 'Pasien sudah check-in atau sudah dilayani, tidak dapat dibatalkan',
                    'code' => 201
                ]
            ]);
        }

        // === 3. Hapus antrian ===

        $status->status_pendaftaran = 0; // Set status_pendaftaran ke 0 (batal)
        $status->save();



        return response()->json([
            'metadata' => ['message' => 'Ok', 'code' => 200]
        ]);
    }

    public function set_pasien_baru(Request $request)
    {
        // === 1. Validasi Token ===
        $token = $request->header('x-token');
        $user = $request->header('x-username');

        if (!$token || !token_mjkn::where('token', $token)->where('expired', '>=', now())->exists()) {
            return response()->json([
                'metadata' => ['message' => 'Token Expired', 'code' => 201]
            ], 401);
        }

        if (!$user || $user !== 'jkn_mobile') {
            return response()->json([
                'metadata' => ['message' => 'User tidak diizinkan', 'code' => 201]
            ], 403);
        }

        $data = $request->all();

        // === Validasi Data Dasar ===
        $validator = Validator::make($data, [
            'nomorkartu'    => 'required',
            'nik'           => 'required',
            'nomorkk'       => 'required',
            'nama'          => 'required',
            'jeniskelamin'  => 'required',
            'tanggallahir'  => 'required',
            'alamat'        => 'required',
            'kodeprop'      => 'required',
            'namaprop'      => 'required',
            'kodedati2'     => 'required',
            'namadati2'     => 'required',
            'kodekec'       => 'required',
            'namakec'       => 'required',
            'kodekel'       => 'required',
            'namakel'       => 'required',
            'rw'            => 'required',
            'rt'            => 'required',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'metadata' => [
                    'message' => $validator->errors()->first(),
                    'code' => 201
                ]
            ]);
        }

        // === Cek Pasien Sudah Terdaftar ===
        if (pasien::where('nik', $data['nik'])->exists()) {
            return response()->json([
                'metadata' => [
                    'message' => 'NIK ' . $data['nik'] . ' sudah terdaftar',
                    'code' => 201
                ]
            ]);
        }


        if (pasien::where('no_bpjs', $data['nomorkartu'])->orWhere('nik', $data['nik'])->exists()) {
            return response()->json([
                'metadata' => [
                    'message' => 'No Kartu dan NIK sudah terdaftar sebagai Pasien Baru',
                    'code' => 201
                ]
            ]);
        }

        // === Generate ID Baru (otomatis manual karena tidak autoincrement) ===
        $last = pasien::where('id', 'not like', '100%')->orderByDesc('id')->first();
        $newId = $last ? $last->id + 1 : 1;

        // === Simpan ke Database ===
        $pasien = pasien::create([
            'no_rm'         => str_pad($newId, 6, '0', STR_PAD_LEFT),
            'nama'          => $data['nama'],
            'alamat'        => $data['alamat'],
            'tanggal_lahir' => $data['tanggallahir'],
            'seks'          => $data['jeniskelamin'],
            'nik'           => $data['nik'],
            'no_bpjs'       => $data['nomorkartu'],
            'telepon'       => $data['nohp'] ?? '-',
        ]);

        // === Buat Nomor Antrian ===
        $tanggalHariIni = Carbon::now()->toDateString();

        $jumlahAntrianHariIni = pasien_antrian::whereDate('created_at', $tanggalHariIni)->count();

        $nomorAntrian = 'A-' . ($jumlahAntrianHariIni + 1);

        // Simpan ke antrean
        pasien_antrian::create([
            'pasien_id'     => $pasien->id,
            'nomor_antrian' => $nomorAntrian,
            'status_panggil'=> 0,
        ]);


        return response()->json([
            'response' => ['norm' => (string) $newId],
            'metadata' => [
                'message' => 'Harap datang ke admisi untuk melengkapi data rekam medis',
                'code' => 200
            ]
        ]);
    }
}
