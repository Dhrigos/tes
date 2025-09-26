<?php

namespace App\Http\Controllers\Module\Integrasi\BPJS;

use App\Http\Controllers\Controller;
use App\Models\Module\Master\Data\Medis\Poli;
use App\Models\Module\Master\Data\Umum\Loket;
use App\Models\Module\Master\Data\Umum\Penjamin;
use App\Models\Module\Pasien\Pasien;
use App\Models\Module\Pemdaftaran\Pendaftaran;
use App\Models\Module\Pemdaftaran\Pendaftaran_status;
use App\Models\Module\Pemdaftaran\Antrian_Pasien;
use App\Models\Module\Pelayanan\Pelayanan_status;
use App\Models\Module\Pelayanan;
use App\Models\Module\SDM\Dokter;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

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

        // Jika valid, buat token dengan masa berlaku 5 menit
        $token = $this->createStatelessToken($username);

        return response()->json([
            'response' => ['token' => $token],
            'metadata' => ['message' => 'Ok', 'code' => 200]
        ]);
    }

    // ================= Stateless Token Helpers =================
    private function createStatelessToken(string $username): string
    {
        $header = ['alg' => 'HS256', 'typ' => 'JWT'];
        $now = Carbon::now()->timestamp;
        $payload = [
            'sub' => $username,
            'iat' => $now,
            'iss' => 'mjkn-api',
            // Token berlaku selama 5 menit (300 detik)
            'exp' => $now + 300
        ];

        $h = $this->b64urlEncode(json_encode($header));
        $p = $this->b64urlEncode(json_encode($payload));
        $s = $this->b64urlEncode(hash_hmac('sha256', $h . '.' . $p, $this->tokenSecret(), true));
        return $h . '.' . $p . '.' . $s;
    }

    private function verifyStatelessToken(string $token): bool
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) return false;
        [$h, $p, $s] = $parts;
        $calc = $this->b64urlEncode(hash_hmac('sha256', $h . '.' . $p, $this->tokenSecret(), true));
        if (!hash_equals($calc, $s)) return false;
        $payload = json_decode($this->b64urlDecode($p), true);
        if (!is_array($payload)) return false;
        // Periksa masa berlaku token (exp)
        $now = Carbon::now()->timestamp;
        if (!isset($payload['exp']) || !is_numeric($payload['exp'])) {
            return false;
        }
        if ($now > (int) $payload['exp']) {
            return false; // token kadaluarsa
        }
        return true;
    }

    private function b64urlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private function b64urlDecode(string $data): string
    {
        $remainder = strlen($data) % 4;
        if ($remainder) {
            $padlen = 4 - $remainder;
            $data .= str_repeat('=', $padlen);
        }
        return base64_decode(strtr($data, '-_', '+/')) ?: '';
    }

    private function tokenSecret(): string
    {
        $secret = (string) env('MJKN_TOKEN_SECRET', '');
        if (!$secret) {
            $secret = (string) config('app.key');
        }
        return $secret ?: 'mjkn-fallback-secret';
    }

    public function post_antrian(Request $request)
    {
        // === 1. Validasi Token ===
        $token = $request->header('x-token');
        $user = $request->header('x-username');

        if (!$token || !$this->verifyStatelessToken($token)) {
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
                'metadata' => ['message' => 'Praktek telah selesai untuk jam tersebut', 'code' => 201]
            ]);
        }

        // === 4. Cek dan ambil pasien ===
        $pasien = null;
        if ($data['norm']) {
            $pasien = Pasien::where('no_rm', $data['norm'])->first();
        }
        if (!$pasien) {
            $pasien = Pasien::where('nik', $data['nik'])
                ->orWhere('no_bpjs', $data['nomorkartu'])
                ->first();

            if (!$pasien) {
                return response()->json([
                    'metadata' => [
                        'message' => "No Kartu ({$data['nomorkartu']}) dan NIK ({$data['nik']}) belum terdata",
                        'code' => 202
                    ]
                ], 200);
            }
        }

        // === 5. Cari Poli dan Dokter ===
        $poli = Poli::where('kode', $data['kodepoli'])->first();
        $dokter = Dokter::where('kode', $data['kodedokter'])->first();
        if (!$poli || !$dokter) {
            return response()->json([
                'metadata' => ['message' => 'Poli atau Dokter tidak ditemukan', 'code' => 201]
            ]);
        }

        // === 6. Cegah pendaftaran ganda pada tanggal, poli, dan dokter yang sama
        // Tidak bergantung pada Pendaftaran_status karena MJKN tidak selalu menulisnya
        $adaDaftarAktif = Pendaftaran::where('nomor_rm', $pasien->no_rm)
            ->whereDate('tanggal_kujungan', $tgl)
            ->where('poli_id', $poli->id)
            ->where('dokter_id', $dokter->id)
            ->exists();

        if ($adaDaftarAktif) {
            return response()->json([
                'metadata' => [
                    'message' => 'Anda sudah ambil antrian di tanggal ini',
                    'code' => 201
                ]
            ]);
        }

        // === 9. Simpan antrian ===
        $antrian = Loket::where('poli_id', $poli->id)->first();

        $tglcek = Carbon::parse($data['tanggalperiksa']);
        $last = Pendaftaran::where('antrian', 'like', $antrian->nama . '-%')
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


        // Generate nomor_register mengikuti modul pendaftaran
        $tanggalObj = Carbon::parse($tgl);
        $tanggalStr = $tanggalObj->format('dmY');

        // Ambil jam hadir dari awal jam praktek (HH)
        $jamStart = explode('-', $jampraktek)[0] ?? '';
        $jamDigits = preg_replace('/[^0-9]/', '', (string) $jamStart);
        $jamhadir = str_pad(substr($jamDigits, 0, 2), 2, '0', STR_PAD_LEFT);

        // Kode kelamin: 01 laki, 02 perempuan, 00 jika tidak diketahui
        $kodeKelamin = '00';
        $seks = (string) ($pasien->seks ?? '');
        if ($seks === '1' || strtoupper($seks) === 'L' || strtolower($seks) === 'laki-laki') {
            $kodeKelamin = '01';
        } elseif ($seks === '2' || strtoupper($seks) === 'P' || strtolower($seks) === 'perempuan') {
            $kodeKelamin = '02';
        }

        $prefix = $kodeKelamin . $jamhadir . '-' . $tanggalStr;

        $no_registrasi = DB::transaction(function () use ($tanggalObj, $prefix) {
            $lastRegister = Pendaftaran::whereDate('tanggal_kujungan', $tanggalObj->toDateString())
                ->where('nomor_register', 'like', '___-' . $prefix)
                ->lockForUpdate()
                ->orderBy('nomor_register', 'desc')
                ->first();

            $lastNumber = 0;
            if ($lastRegister) {
                $lastNumber = (int) substr($lastRegister->nomor_register, 0, 3);
            }

            $nextNumber = str_pad((string) ($lastNumber + 1), 3, '0', STR_PAD_LEFT);
            return $nextNumber . '-' . $prefix;
        }, 3);

        // Tentukan Penjamin JKN (BPJS)
        $penjamin = Penjamin::where('nama', 'like', '%BPJS%')->first();
        if (!$penjamin) {
            // Fallback buat entri BPJS jika belum ada
            $penjamin = Penjamin::firstOrCreate(['nama' => 'BPJS']);
        }
        $penjamin_id = $penjamin->id;

        // Gunakan jam sekarang untuk tanggal_kujungan pada tanggal periksa
        $tanggalKunjungan = $tgl . ' ' . now()->format('H:i:s');

        Pendaftaran::create([
            'nomor_rm' => $pasien->no_rm,
            'pasien_id' => $pasien->id,
            'nomor_register' => $no_registrasi,
            'tanggal_kujungan' => $tanggalKunjungan,
            'poli_id' => $poli->id,
            'dokter_id' => $dokter->id,
            'Penjamin' => $penjamin_id,
            'antrian' => $antrianBaru,
            'status' => 3, // 1=offline, 2=online, 3=bpjs/mjkn
        ]);

        // Simpan status kehadiran di pelayanan_statuses (0: belum hadir, 1: terdaftar, 2: hadir)
        Pelayanan_status::updateOrCreate(
            ['nomor_register' => $no_registrasi],
            [
                'nomor_register' => $no_registrasi,
                'pasien_id' => $pasien->id,
                'tanggal_kujungan' => $tanggalKunjungan,
                'status_daftar' => 1,
            ]
        );

        // Ambil antrean terakhir yang sudah dipanggil (status_panggil = 1) pada tanggal dan dokter yang sama
        $antrianTerakhirDipanggil = Pendaftaran::whereHas('status', function ($q) {
                $q->where('status_panggil', 1);
            })
            ->where('dokter_id', $dokter->id)
            ->whereDate('tanggal_kujungan', $tgl)
            ->orderByDesc('id')
            ->value('antrian');

        // Ekstrak angka antrean
        $angkaAntrean = 0;
        if (preg_match('/\d+/', $antrianBaru, $matchAntrean)) {
            $angkaAntrean = (int) $matchAntrean[0];
        }

        $angkaPanggil = 0;
        if ($antrianTerakhirDipanggil && preg_match('/\d+/', $antrianTerakhirDipanggil, $matchPanggil)) {
            $angkaPanggil = (int) $matchPanggil[0];
        }

        // Sisa antrean = nomor saya - nomor yang sedang dipanggil (tidak boleh negatif)
        $sisaAntrean = max(0, $angkaAntrean - $angkaPanggil);

        // Normalisasi format tanpa dash (contoh: A12)
        $nomorAntreanOut = str_replace('-', '', $antrianBaru);
        $antreanPanggilOut = $antrianTerakhirDipanggil ? str_replace('-', '', $antrianTerakhirDipanggil) : '';

        // === 11. Response sesuai spesifikasi ===
        return response()->json([
            'response' => [
                'nomorantrean' => $nomorAntreanOut,
                'angkaantrean' => $nextNumber,
                'namapoli' => $poli->nama,
                'sisaantrean' => (string) $sisaAntrean,
                'antreanpanggil' => $antreanPanggilOut,
                'keterangan' => 'Apabila antrean terlewat harap mengambil antrean kembali.'
            ],
            'metadata' => [
                'message' => 'Ok',
                'code' => 200
            ]
        ]);
    }

    public function get_status_antrian(Request $request, $kode_poli, $tanggal)
    {
        // === 1. Validasi Token ===
        $token = $request->header('x-token');
        $user = $request->header('x-username');

        if (!$token || !$this->verifyStatelessToken($token)) {
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
            $query->whereDate('jam_mulai', $hariIni);
        }])
            ->where('poli', $poli->id) // << ini filter langsung di tabel dokter
            ->whereHas('jadwal', function ($query) use ($hariIni) {
                $query->whereDate('jam_mulai', $hariIni);
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

        // Resolusi dinamis ID Penjamin BPJS
        $bpjsPenjaminId = Penjamin::where('nama', 'like', '%BPJS%')->value('id') ?? 2;

        foreach ($jadwalList as $dokter) {
            foreach ($dokter->jadwal as $jadwal) {
                $dokter_id = $dokter->id;
                $jampraktek = Carbon::parse($jadwal->start)->format('H:i') . '-' . Carbon::parse($jadwal->end)->format('H:i');

                $totalJKN = Pendaftaran::whereDate('tanggal_kujungan', $tanggal)
                    ->where('dokter_id', $dokter_id)
                    ->where('Penjamin', $bpjsPenjaminId)
                    ->count();

                $totalNonJKN = Pendaftaran::whereDate('tanggal_kujungan', $tanggal)
                    ->where('dokter_id', $dokter_id)
                    ->where('Penjamin', '!=', $bpjsPenjaminId)
                    ->count();

                $sudahDilayani = Pendaftaran::join('pendaftaran_statuses as status', 'pendaftarans.nomor_register', '=', 'status.nomor_register')
                    ->whereDate('pendaftarans.tanggal_kujungan', $tanggal)
                    ->where('pendaftarans.dokter_id', $dokter_id)
                    ->where('status.status_pendaftaran', 2)
                    ->count();

                $totalAntrean = $totalJKN + $totalNonJKN;
                $sisaAntrean = $totalAntrean - $sudahDilayani;

                // Ambil antrean terakhir yang dipanggil (dari pendaftarans.antrian) untuk dokter & tanggal tersebut
                $antrean_panggil = Pendaftaran::whereHas('status', function ($q) {
                        $q->where('status_panggil', 1);
                    })
                    ->where('dokter_id', $dokter_id)
                    ->whereDate('tanggal_kujungan', $tanggal)
                    ->orderByDesc('id')
                    ->value('antrian');

                $responseData[] = [
                    'namapoli' => $poli->nama,
                    'totalantrean' => (string) $totalAntrean,
                    'sisaantrean' => $sisaAntrean,
                    'antreanpanggil' => $antrean_panggil ?: '',
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

        if (!$token || !$this->verifyStatelessToken($token)) {
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
        $pendaftaran = Pendaftaran::where('pasien_id', $pasien->id)
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
        $no_urut_saya_out = str_replace('-', '', (string) $no_urut_saya_raw); // Output tanpa dash: A20
        $dokter = $pendaftaran->dokter;

        // 5. Ambil nomor antrean yang sedang dipanggil
        $dipanggil = Pendaftaran_status::whereHas('pendaftaran', function ($q) use ($dokter, $tanggal) {
            $q->whereDate('tanggal_kujungan', $tanggal)
                ->where('dokter_id', $dokter->id);
        })
            ->where('status_panggil', 1)
            ->orderByDesc('id')
            ->first();

        $no_urut_dipanggil = $dipanggil ? (int) Str::after($dipanggil->no_urut, '-') : 0;
        $antrean_panggil_out = $dipanggil ? str_replace('-', '', (string) $dipanggil->no_urut) : '';

        // 6. Hitung sisa antrean dan estimasi waktu tunggu
        $avg_time = $poli->avg_service_time ?? 10;
        $sisa_antrian = max(0, $no_urut_saya - $no_urut_dipanggil);
        $waktu_tunggu = $sisa_antrian * $avg_time * 60; // tidak dikirim dalam response sesuai spesifikasi

        // 7. Response
        return response()->json([
            'response' => [
                'nomorantrean' => $no_urut_saya_out,
                'namapoli' => $poli->nama,
                'sisaantrean' => (string) $sisa_antrian,
                'antreanpanggil' => $antrean_panggil_out,
                'keterangan' => ''
            ],
            'metadata' => [
                'message' => 'Ok',
                'code' => 200
            ]
        ]);
    }

    public function batalkan_antrian(Request $request)
    {
        // === 1. Validasi Token ===
        $token = $request->header('x-token');
        $user = $request->header('x-username');

        if (!$token || !$this->verifyStatelessToken($token)) {
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

        // Batasi hanya untuk pendaftaran MJKN (status=3) dan penjamin BPJS
        $bpjsPenjaminId = Penjamin::where('nama', 'like', '%BPJS%')->value('id') ?? 2;

        $antrian = Pendaftaran::where('pasien_id', $pasien->id)
            ->where('poli_id', $poli->id)
            ->whereDate('tanggal_kujungan', $tanggal)
            ->where('Penjamin', $bpjsPenjaminId)
            ->where('status', 3)
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

        $status = Pendaftaran_status::where('nomor_register', $antrian->nomor_register)
                ->orderBy('created_at', 'desc')
                ->first();


        if (!$antrian->status) {
            return response()->json([
                'metadata' => [
                    'message' => 'Antrian tidak ditemukan (sudah dibatalkan)',
                    'code' => 201
                ]
            ]);
        }

        if ($status && (string) $status->status_panggil !== "0") {
            return response()->json([
                'metadata' => [
                    'message' => 'Pasien sudah check-in atau sudah dilayani, tidak dapat dibatalkan',
                    'code' => 201
                ]
            ]);
        }

        // === 3. Hapus antrian ===

        DB::transaction(function () use ($status, $antrian) {
            // Hapus data terkait pelayanan_statuses dan pelayanans untuk nomor_register ini
            Pelayanan_status::where('nomor_register', $antrian->nomor_register)->delete();
            Pelayanan::where('nomor_register', $antrian->nomor_register)->delete();
            Pendaftaran::where('nomor_register', $antrian->nomor_register)->delete();

            // Hapus baris pendaftaran agar tidak tampil lagi
            $antrian->delete();
        });

        return response()->json([
            'metadata' => ['message' => 'Ok', 'code' => 200]
        ]);
    }

    public function set_pasien_baru(Request $request)
    {
        // === 1. Validasi Token ===
        $token = $request->header('x-token');
        $user = $request->header('x-username');

        if (!$token || !$this->verifyStatelessToken($token)) {
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
        if (Pasien::where('nik', $data['nik'])->exists()) {
            return response()->json([
                'metadata' => [
                    'message' => 'NIK ' . $data['nik'] . ' sudah terdaftar',
                    'code' => 201
                ]
            ]);
        }


        if (Pasien::where('no_bpjs', $data['nomorkartu'])->orWhere('nik', $data['nik'])->exists()) {
            return response()->json([
                'metadata' => [
                    'message' => 'No Kartu dan NIK sudah terdaftar sebagai Pasien Baru',
                    'code' => 201
                ]
            ]);
        }

        // === Generate ID Baru (otomatis manual karena tidak autoincrement) ===
        $last = Pasien::where('id', 'not like', '100%')->orderByDesc('id')->first();
        $newId = $last ? $last->id + 1 : 1;

        // Normalisasi jenis kelamin: 'L'/'1' => '1' (laki), 'P'/'2' => '2' (perempuan)
        $jkInput = strtoupper((string)($data['jeniskelamin'] ?? ''));
        $seksNormalized = ($jkInput === 'L' || $jkInput === '1') ? '1' : (($jkInput === 'P' || $jkInput === '2') ? '2' : (string)($data['jeniskelamin'] ?? ''));

        // === Simpan ke Database === (sertakan uuid karena kolom tidak nullable)
        $pasien = Pasien::create([
            'uuid'          => Str::uuid()->toString(),
            'no_rm'         => str_pad($newId, 6, '0', STR_PAD_LEFT),
            'nama'          => $data['nama'],
            'alamat'        => $data['alamat'],
            'tanggal_lahir' => $data['tanggallahir'],
            'seks'          => $seksNormalized,
            'nik'           => $data['nik'],
            'no_bpjs'       => $data['nomorkartu'],
            'telepon'       => $data['nohp'] ?? '-',
            'kewarganegaraan'=> 'wni',
            'rt' => $data['rt'],
            'rw' => $data['rw'],
            'verifikasi' => '1'
        ]);

        // === Buat Nomor Antrian ===
        $tanggalHariIni = Carbon::now()->toDateString();

        $jumlahAntrianHariIni = Antrian_Pasien::whereDate('created_at', $tanggalHariIni)->count();

        $nomorAntrian = 'A-' . ($jumlahAntrianHariIni + 1);

        // Simpan ke antrean
        Antrian_Pasien::create([
            'pasien_id'     => $pasien->id,
            'prefix'        => 'A',
            'nomor'         => $jumlahAntrianHariIni + 1,
            'tanggal'       => $tanggalHariIni,
        ]);


        return response()->json([
            'response' => ['norm' => (string) $pasien->no_rm],
            'metadata' => [
                'message' => 'Harap datang ke admisi untuk melengkapi data rekam medis',
                'code' => 200
            ]
        ]);
    }
}
