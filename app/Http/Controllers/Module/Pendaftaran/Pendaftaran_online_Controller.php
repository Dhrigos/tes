<?php

namespace App\Http\Controllers\Module\Pendaftaran;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Module\Integrasi\BPJS\Pcare_Controller;
use App\Models\Module\SDM\Dokter;
use App\Models\Module\Master\Data\Umum\Goldar;
use App\Models\Module\Master\Data\Umum\Kelamin;
use App\Models\Module\Master\Data\Umum\Pernikahan;
use App\Models\Module\Master\Data\Medis\Poli;
use App\Models\Module\Master\Data\Umum\Loket;
use App\Models\Module\Pasien\Pasien;
use App\Models\Module\Pemdaftaran\Antrian_Pasien;
use App\Models\Module\Pemdaftaran\Pendaftaran;
use App\Models\Module\Master\Data\Umum\Penjamin as PenjaminModel;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;

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

    public function ambilAntrian(Request $request)
    {
        $request->validate([
            'penjamin' => 'required|in:umum,bpjs',
            'search' => 'required|string', // nama/nik/no_bpjs
            'poli_id' => 'required',
            'dokter_id' => 'nullable',
            'tanggal' => 'required|date',
            'jam' => 'required|string',
        ]);

        try {
            $search = $request->input('search');

            $pasien = Pasien::select('id', 'nama', 'no_rm', 'nik', 'no_bpjs')
                ->where(function ($q) use ($search, $request) {
                    $q->where('nama', 'like', '%' . $search . '%')
                        ->orWhere('nik', $search)
                        ->orWhere('no_bpjs', $search);
                })
                ->orderBy('nama', 'asc')
                ->first();

            if (!$pasien) {
                return redirect()->back()->with('error', 'Pasien tidak ditemukan, mohon pastikan nama/NIK/BPJS benar.');
            }

            $tanggalWaktu = Carbon::parse($request->input('tanggal') . ' ' . $request->input('jam') . ':00');

            // Generate antrian based on poli_id
            $antrianData = $this->generateAntrian($request->poli_id);

            $antrian = Antrian_Pasien::create([
                'pasien_id' => $pasien->id,
                'prefix'    => $antrianData['prefix'],
                'nomor'     => $antrianData['nomor'],
                'tanggal'   => $antrianData['tanggal'],
            ]);

            $nomorAntrian = $antrianData['full_number'];

            // Ambil label poli/dokter jika tersedia (opsional, hindari error jika model tak ada)
            $poliNama = null;
            $dokterNama = null;
            try {
                if ($request->poli_id) {
                    $poliModel = Poli::find($request->poli_id);
                    $poliNama = $poliModel->nama ?? null;
                }
            } catch (\Throwable $e) {
                $poliNama = null;
            }
            try {
                if ($request->dokter_id) {
                    $dokterModel = Dokter::find($request->dokter_id);
                    $dokterNama = ($dokterModel->namauser->name ?? $dokterModel->nama) ?? null;
                }
            } catch (\Throwable $e) {
                $dokterNama = null;
            }

            // Opsional: buat entri pendaftaran agar langsung tercatat di modul pendaftaran
            try {
                $poliId = $request->input('poli_id');
                // Cari ID penjamin (gunakan nama berisi 'UMUM' atau 'BPJS') jika ada
                $penjaminId = null;
                $penjaminStr = strtolower((string) $request->input('penjamin'));
                if ($penjaminStr === 'umum' || $penjaminStr === 'bpjs') {
                    $penjaminRow = PenjaminModel::whereRaw('LOWER(nama) LIKE ?', ['%' . $penjaminStr . '%'])->first();
                    $penjaminId = $penjaminRow->id ?? null;
                }

                // Generate nomor register mengikuti generator utama
                $nomorRegister = $this->generateNomorRegister(
                    $request->input('tanggal'),
                    $request->input('jam'),
                    $pasien
                );

                // Buat pendaftaran hanya jika poli tersedia
                if (!empty($poliId)) {
                    $pend = Pendaftaran::create([
                        'nomor_register'    => $nomorRegister,
                        'tanggal_kujungan'  => $request->input('tanggal') . ' ' . $request->input('jam') . ':00',
                        'nomor_rm'          => $pasien->no_rm,
                        'antrian'           => $nomorAntrian,
                        'pasien_id'         => $pasien->id,
                        'poli_id'           => (int) $poliId,
                        'dokter_id'         => $request->input('dokter_id') ? (int) $request->input('dokter_id') : null,
                        'Penjamin'          => $penjaminId,
                        'status'            => 2, // 1=offline, 2=online, 3=bpjs/mjkn
                    ]);
                }
            } catch (\Throwable $e) {
                // Jangan gagalkan alur online; cukup lanjutkan
            }

            return redirect()->back()->with([
                'success' => 'Nomor antrian berhasil dibuat.',
                'nomor_antrian' => $nomorAntrian,
                'no_rm' => $pasien->no_rm,
                'tanggal_daftar' => Carbon::parse($antrianData['tanggal'])->locale('id')->translatedFormat('d F Y'),
                'poli_nama' => $poliNama,
                'dokter_nama' => $dokterNama,
                'penjamin' => $request->penjamin,
            ]);
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Gagal mengambil antrian: ' . $e->getMessage());
        }
    }

    private function generateNomorRegister($tanggal, $jam, $pasien)
    {
        $tanggalObj = Carbon::parse($tanggal);
        // Format menjadi 02092025 (ddmmyyyy)
        $tanggalStr = $tanggalObj->format('dmY');

        // Angka acak 3 digit (mulai 100)
        $angkaAcak = str_pad((string) random_int(100, 999), 3, '0', STR_PAD_LEFT);

        // Jam hadir HH (2 digit)
        $jamDigits = preg_replace('/[^0-9]/', '', (string) $jam);
        $jamhadir = str_pad(substr($jamDigits, 0, 2), 2, '0', STR_PAD_LEFT);

        // Kode kelamin: 01 laki, 02 perempuan (fallback 00 jika tidak diketahui)
        $kodeKelamin = '00';
        $seks = (string) ($pasien->seks ?? '');
        if ($seks === '1' || $seks === 'L' || strtolower($seks) === 'laki-laki') {
            $kodeKelamin = '01';
        } elseif ($seks === '2' || $seks === 'P' || strtolower($seks) === 'perempuan') {
            $kodeKelamin = '02';
        }

        return $angkaAcak . '-' . $kodeKelamin . $jamhadir . '-' . $tanggalStr;
    }

    private function determineLoketForRegistration($penjamin)
    {
        // Determine appropriate loket based on penjamin type
        // For now, return null to use default 'A' prefix
        // This can be enhanced to route different penjamin types to different lokets
        
        $penjaminStr = strtolower((string) $penjamin);
        
        // BPJS patients might go to a specific loket
        if ($penjaminStr === 'bpjs') {
            // Try to find BPJS-specific loket
            $bpjsLoket = Loket::where('nama', 'like', '%BPJS%')
                ->orWhere('nama', 'like', '%B%')
                ->first();
            return $bpjsLoket ? $bpjsLoket->id : null;
        }
        
        // UMUM patients go to general loket A
        if ($penjaminStr === 'umum') {
            $umumLoket = Loket::where('nama', 'like', '%A%')
                ->orWhere('nama', 'like', '%UMUM%')
                ->first();
            return $umumLoket ? $umumLoket->id : null;
        }
        
        return null; // Default to 'A' prefix
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

        // Get poli_id from the request or set a default (you might want to handle this differently)
        $poliId = $request->poli_id ?? 1; 
        $antrianData = $this->generateAntrian($poliId);

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

    private function generateAntrian($poliId, $dokterId = null)
    {
        $today = now()->toDateString();
        
        // Get loket based on poli_id
        $loket = Loket::where('poli_id', $poliId)->first();
        
        if (!$loket) {
            // Fallback if no loket is found
            $prefix = 'A'; // Default prefix
        } else {
            $prefix = strtoupper($loket->nama);
        }

        // Get the last antrian for this prefix today from pendaftaran table
        $lastPendaftaran = Pendaftaran::where('antrian', 'like', $prefix . '-%')
            ->whereDate('created_at', $today)
            ->orderBy('antrian', 'desc')
            ->first();

        // Find the next number
        $nextNumber = 1;
        
        if ($lastPendaftaran) {
            $lastNumber = (int) substr($lastPendaftaran->antrian, strlen($prefix) + 1);
            if ($lastNumber > 0) {
                $nextNumber = $lastNumber + 1;
            }
        }

        return [
            'prefix' => $prefix,
            'nomor' => $nextNumber,
            'tanggal' => $today,
            'full_number' => $prefix . '-' . $nextNumber
        ];
    }

    public function cetakAntrian(Request $request)
    {
        $validated = $request->validate([
            'no_rm' => 'required|string',
            'nomor_antrian' => 'required|string',
            'tanggal_daftar' => 'required|string',
            'poli' => 'nullable|string',
            'dokter' => 'nullable|string',
        ]);

        $data = [
            'no_rm' => $validated['no_rm'],
            'nomor_antrian' => $validated['nomor_antrian'],
            'tanggal_daftar' => Carbon::parse($validated['tanggal_daftar'])->locale('id')->translatedFormat('d F Y'),
            'poli' => $validated['poli'] ?? '-',
            'dokter' => $validated['dokter'] ?? '-',
        ];

        $pdf = Pdf::loadView('pdf.nomor_antrian', $data)->setPaper([0, 0, 226.77, 283.46], 'portrait'); // ~80x100mm
        return $pdf->stream('antrian-' . preg_replace('/\s+/', '-', $data['nomor_antrian']) . '.pdf');
    }

}
