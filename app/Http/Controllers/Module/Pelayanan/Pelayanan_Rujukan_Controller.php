<?php

namespace App\Http\Controllers\Module\Pelayanan;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Module\Integrasi\BPJS\Pcare_Controller;
use App\Models\Module\Pelayanan\Pelayanan;
use App\Models\Module\Pelayanan\Rujukan;
use App\Models\Module\Pasien\Pasien_History;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Illuminate\Http\RedirectResponse;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf;

class Pelayanan_Rujukan_Controller extends Controller
{
    /**
     * Display the rujukan form for a specific patient
     */
    public function show(Request $request, $norawat): InertiaResponse
    {
        try {
            $nomor_register = base64_decode($norawat);

            // Get patient data
            $pelayanan = Pelayanan::with(['pasien', 'pendaftaran.penjamin'])
                ->where('nomor_register', $nomor_register)
                ->first();

            // If no patient data from database, use dummy data
            if (!$pelayanan) {
                $dummyPatientData = [
                    'nomor_rm' => 'DUM001',
                    'nama' => 'Pasien Dummy',
                    'nomor_register' => 'DUMREG001',
                    'jenis_kelamin' => 'Laki-laki',
                    'penjamin' => 'Umum',
                    'tanggal_lahir' => '1990-01-01',
                    'umur' => '35 Tahun',
                    'no_bpjs' => '123456789012345'
                ];
                $patientData = $dummyPatientData;
            } else {
                // Calculate age
                $umur = ($pelayanan->pasien && $pelayanan->pasien->tanggal_lahir)
                    ? Carbon::parse($pelayanan->pasien->tanggal_lahir)->diffInYears(Carbon::now()) . ' Tahun'
                    : '0 Tahun';

                // Prepare patient data
                $patientData = [
                    'nomor_rm' => $pelayanan->nomor_rm,
                    'nama' => $pelayanan->pasien->nama ?? '',
                    'nomor_register' => $pelayanan->nomor_register,
                    'jenis_kelamin' => $pelayanan->pasien->seks ?? '',
                    'penjamin' => optional($pelayanan->pendaftaran->penjamin)->nama ?? '',
                    'tanggal_lahir' => $pelayanan->pasien->tanggal_lahir ?? '',
                    'umur' => $umur,
                    'no_bpjs' => $pelayanan->pasien->no_bpjs ?? ''
                ];
            }

            // Dummy data for Ref_TACC
            $refTacc = [
                [
                    'kdTacc' => '1',
                    'nmTacc' => 'Tidak Urgen',
                    'alasanTacc' => [
                        'Kondisi pasien tidak memungkinkan untuk dirujuk',
                        'Pasien menolak dirujuk',
                        'Fasilitas kesehatan tujuan tidak tersedia'
                    ]
                ],
                [
                    'kdTacc' => '2',
                    'nmTacc' => 'Urgen',
                    'alasanTacc' => [
                        'Kondisi pasien memerlukan perawatan segera',
                        'Fasilitas penunjang tidak tersedia',
                        'Dokter spesialis tidak tersedia'
                    ]
                ],
                [
                    'kdTacc' => '3',
                    'nmTacc' => 'Emergensi',
                    'alasanTacc' => [
                        'Kondisi pasien mengancam jiwa',
                        'Memerlukan tindakan segera',
                        'Kondisi pasien tidak stabil'
                    ]
                ]
            ];

            // Dummy data for subspesialis
            $subspesialis = [
                ['kode' => 'ANA', 'nama' => 'Anak'],
                ['kode' => 'ANAK', 'nama' => 'Anak'],
                ['kode' => 'BED', 'nama' => 'Bedah'],
                ['kode' => 'GIG', 'nama' => 'Gigi'],
                ['kode' => 'INT', 'nama' => 'Penyakit Dalam'],
                ['kode' => 'KLT', 'nama' => 'Kulit dan Kelamin'],
                ['kode' => 'MAT', 'nama' => 'Mata'],
                ['kode' => 'SAR', 'nama' => 'Saraf'],
                ['kode' => 'THT', 'nama' => 'THT'],
                ['kode' => 'UMU', 'nama' => 'Umum']
            ];

            // Dummy data for sarana
            $sarana = [
                ['kode' => '1', 'nama' => 'Ambulans'],
                ['kode' => '2', 'nama' => 'Ruang Operasi'],
                ['kode' => '3', 'nama' => 'ICU'],
                ['kode' => '4', 'nama' => 'Hemodialisis'],
                ['kode' => '5', 'nama' => 'Laboratorium'],
                ['kode' => '6', 'nama' => 'Radiologi']
            ];

            // Dummy data for spesialis
            $spesialis = [
                ['kode' => 'ANA', 'nama' => 'Anak'],
                ['kode' => 'BED', 'nama' => 'Bedah'],
                ['kode' => 'GIG', 'nama' => 'Gigi'],
                ['kode' => 'INT', 'nama' => 'Penyakit Dalam'],
                ['kode' => 'KLT', 'nama' => 'Kulit dan Kelamin'],
                ['kode' => 'MAT', 'nama' => 'Mata'],
                ['kode' => 'SAR', 'nama' => 'Saraf'],
                ['kode' => 'THT', 'nama' => 'THT'],
                ['kode' => 'UMU', 'nama' => 'Umum']
            ];

            // Ambil data rujukan yang sudah ada (jika ada)
            $existingRujukan = Rujukan::where('nomor_register', $nomor_register)->first();

            return Inertia::render('module/pelayanan/rujukan/rujukan', [
                'pelayanan' => $patientData,
                'Ref_TACC' => $refTacc,
                'subspesialis' => $subspesialis,
                'sarana' => $sarana,
                'spesialis' => $spesialis,
                'existingRujukan' => $existingRujukan
            ]);
        } catch (\Exception $e) {
            return Inertia::render('module/pelayanan/rujukan/rujukan', [
                'errors' => ['error' => 'Gagal memuat data rujukan: ' . $e->getMessage()]
            ]);
        }
    }

    /**
     * Store a new rujukan
     */
    public function store(Request $request)
    {
        try {
            // Validate request data
            $validated = $request->validate([
                'jenis_rujukan' => 'required|string',
                'tujuan_rujukan' => 'required|string',
                'opsi_rujukan' => 'required|string',
                // Add more validation rules as needed
            ]);

            // Save to database
            $rujukanData = [
                'nomor_rm' => $request->input('nomor_rm'),
                'nomor_register' => $request->input('no_rawat'),
                'penjamin' => $request->input('penjamin'),
                'jenis_rujukan' => $validated['jenis_rujukan'],
                'tujuan_rujukan' => $validated['tujuan_rujukan'],
                'opsi_rujukan' => $validated['opsi_rujukan'],
                // Spesialis
                'sarana' => $request->input('sarana'),
                'kategori_rujukan' => $request->input('kategori_rujukan'),
                'alasanTacc' => $request->input('alasanTacc'),
                'spesialis' => $request->input('spesialis'),
                'sub_spesialis' => $request->input('sub_spesialis'),
                'tanggal_rujukan' => $request->input('tanggal_rujukan'),
                'tujuan_rujukan_spesialis' => $request->input('tujuan_rujukan_spesialis'),
                // Rujukan Khusus
                'igd_rujukan_khusus' => $request->input('igd_rujukan_khusus'),
                'subspesialis_khusus' => $request->input('subspesialis_khusus'),
                'tanggal_rujukan_khusus' => $request->input('tanggal_rujukan_khusus'),
                'tujuan_rujukan_khusus' => $request->input('tujuan_rujukan_khusus'),
            ];

            // Log data yang akan disimpan untuk debugging
            Log::info('Saving rujukan data:', $rujukanData);

            $created = Rujukan::create($rujukanData);

            // Simpan ke Pasien History (best-effort)
            try {
                $pelayananRow = Pelayanan::with('pasien')
                    ->where('nomor_register', (string) $request->input('no_rawat', ''))
                    ->first();
                $namaPasien = optional(optional($pelayananRow)->pasien)->nama ?? '';
                Pasien_History::create([
                    'no_rm' => (string) $request->input('nomor_rm', ''),
                    'nama' => $namaPasien,
                    'history' => [
                        'type' => 'rujukan_tambah',
                        'nomor_register' => (string) $request->input('no_rawat', ''),
                        'jenis_rujukan' => (string) $validated['jenis_rujukan'],
                        'tujuan_rujukan' => (string) $validated['tujuan_rujukan'],
                        'opsi_rujukan' => (string) $validated['opsi_rujukan'],
                        'spesialis' => (string) $request->input('spesialis', ''),
                        'sub_spesialis' => (string) $request->input('sub_spesialis', ''),
                        'tanggal_rujukan' => (string) $request->input('tanggal_rujukan', ''),
                        'tujuan_rujukan_spesialis' => (string) $request->input('tujuan_rujukan_spesialis', ''),
                        'igd_rujukan_khusus' => (string) $request->input('igd_rujukan_khusus', ''),
                        'subspesialis_khusus' => (string) $request->input('subspesialis_khusus', ''),
                        'tanggal_rujukan_khusus' => (string) $request->input('tanggal_rujukan_khusus', ''),
                        'tujuan_rujukan_khusus' => (string) $request->input('tujuan_rujukan_khusus', ''),
                    ],
                ]);
            } catch (\Exception $e) {
                Log::error('Failed to save Pasien_History (rujukan_tambah): ' . $e->getMessage());
            }

            Log::info('Rujukan created successfully with ID: ' . $created->id);

            if ($request->expectsJson() || $request->ajax()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Rujukan berhasil disimpan ke database',
                    'id' => $created->id,
                    'data' => $created
                ]);
            }
            return redirect()->back()->with('success', 'Rujukan berhasil disimpan ke database');
        } catch (\Exception $e) {
            if ($request->expectsJson() || $request->ajax()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Gagal menyimpan rujukan: ' . $e->getMessage(),
                ], 500);
            }
            return redirect()->back()->with('error', 'Gagal menyimpan rujukan: ' . $e->getMessage());
        }
    }

    /**
     * Update an existing rujukan
     */
    public function update(Request $request, $norawat)
    {
        try {
            // Validate request data
            $validated = $request->validate([
                'jenis_rujukan' => 'required|string',
                'tujuan_rujukan' => 'required|string',
                'opsi_rujukan' => 'required|string',
                // Add more validation rules as needed
            ]);

            // Update in database by nomor_register
            $rujukan = Rujukan::where('nomor_register', $norawat)->first();
            if (!$rujukan) {
                // If not exist, create new entry for safety
                $rujukan = new Rujukan();
                $rujukan->nomor_register = $norawat;
            }
            $rujukan->fill([
                'nomor_rm' => $request->input('nomor_rm', $rujukan->nomor_rm),
                'penjamin' => $request->input('penjamin', $rujukan->penjamin),
                'jenis_rujukan' => $validated['jenis_rujukan'],
                'tujuan_rujukan' => $validated['tujuan_rujukan'],
                'opsi_rujukan' => $validated['opsi_rujukan'],
                // Spesialis
                'sarana' => $request->input('sarana'),
                'kategori_rujukan' => $request->input('kategori_rujukan'),
                'alasanTacc' => $request->input('alasanTacc'),
                'spesialis' => $request->input('spesialis'),
                'sub_spesialis' => $request->input('sub_spesialis'),
                'tanggal_rujukan' => $request->input('tanggal_rujukan'),
                'tujuan_rujukan_spesialis' => $request->input('tujuan_rujukan_spesialis'),
                // Rujukan Khusus
                'igd_rujukan_khusus' => $request->input('igd_rujukan_khusus'),
                'subspesialis_khusus' => $request->input('subspesialis_khusus'),
                'tanggal_rujukan_khusus' => $request->input('tanggal_rujukan_khusus'),
                'tujuan_rujukan_khusus' => $request->input('tujuan_rujukan_khusus'),
            ]);
            $rujukan->save();

            if ($request->expectsJson() || $request->ajax()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Rujukan berhasil diperbarui',
                    'id' => $rujukan->id,
                ]);
            }

            // Simpan ke Pasien History (best-effort)
            try {
                $pelayananRow = Pelayanan::with('pasien')
                    ->where('nomor_register', (string) $norawat)
                    ->first();
                $namaPasien = optional(optional($pelayananRow)->pasien)->nama ?? '';
                Pasien_History::create([
                    'no_rm' => (string) $request->input('nomor_rm', ''),
                    'nama' => $namaPasien,
                    'history' => [
                        'type' => 'rujukan_edit',
                        'nomor_register' => (string) $norawat,
                        'jenis_rujukan' => (string) $validated['jenis_rujukan'],
                        'tujuan_rujukan' => (string) $validated['tujuan_rujukan'],
                        'opsi_rujukan' => (string) $validated['opsi_rujukan'],
                        'spesialis' => (string) $request->input('spesialis', ''),
                        'sub_spesialis' => (string) $request->input('sub_spesialis', ''),
                        'tanggal_rujukan' => (string) $request->input('tanggal_rujukan', ''),
                        'tujuan_rujukan_spesialis' => (string) $request->input('tujuan_rujukan_spesialis', ''),
                        'igd_rujukan_khusus' => (string) $request->input('igd_rujukan_khusus', ''),
                        'subspesialis_khusus' => (string) $request->input('subspesialis_khusus', ''),
                        'tanggal_rujukan_khusus' => (string) $request->input('tanggal_rujukan_khusus', ''),
                        'tujuan_rujukan_khusus' => (string) $request->input('tujuan_rujukan_khusus', ''),
                    ],
                ]);
            } catch (\Exception $e) {
                Log::error('Failed to save Pasien_History (rujukan_edit): ' . $e->getMessage());
            }

            return redirect()
                ->back()
                ->with('success', 'Rujukan berhasil diperbarui');
        } catch (\Exception $e) {
            if ($request->expectsJson() || $request->ajax()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Gagal memperbarui rujukan: ' . $e->getMessage(),
                ], 500);
            }
            return redirect()->back()->with('error', 'Gagal memperbarui rujukan: ' . $e->getMessage());
        }
    }

    /**
     * Proxy: Get faskes rujukan by subspesialis and sarana (PCare)
     */
    public function pcareFaskesRujukanSubspesialis(Request $request)
    {
        try {
            $validated = $request->validate([
                'subspesialis' => 'required|string',
                'sarana' => 'required|string',
                'tgl' => 'required|date_format:Y-m-d',
            ]);

            $pcare = app(Pcare_Controller::class);
            $tglFormatted = \Carbon\Carbon::createFromFormat('Y-m-d', $validated['tgl'])->format('d-m-Y');
            return $pcare->get_faskes_rujukan_subspesialis(
                $validated['subspesialis'],
                $validated['sarana'],
                $tglFormatted
            );
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Proxy: Get faskes rujukan khusus by jenis khusus and no kartu (PCare)
     */
    public function pcareFaskesRujukanKhusus(Request $request)
    {
        try {
            $validated = $request->validate([
                'khusus' => 'required|string',
                'nokartu' => 'required|string',
                'tgl' => 'required|date_format:Y-m-d',
            ]);

            $pcare = app(Pcare_Controller::class);
            $tglFormatted = \Carbon\Carbon::createFromFormat('Y-m-d', $validated['tgl'])->format('d-m-Y');
            return $pcare->get_faskes_rujukan_khusus(
                $validated['khusus'],
                $validated['nokartu'],
                $tglFormatted
            );
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Proxy: Get faskes rujukan khusus subspesialis (PCare)
     */
    public function pcareFaskesRujukanKhususSubspesialis(Request $request)
    {
        try {
            $validated = $request->validate([
                'khusus' => 'required|string',
                'subspesialis' => 'required|string',
                'nokartu' => 'required|string',
                'tgl' => 'required|date_format:Y-m-d',
            ]);

            $pcare = app(Pcare_Controller::class);
            $tglFormatted = \Carbon\Carbon::createFromFormat('Y-m-d', $validated['tgl'])->format('d-m-Y');
            return $pcare->get_faskes_rujukan_khusus_subspesialis(
                $validated['khusus'],
                $validated['subspesialis'],
                $validated['nokartu'],
                $tglFormatted
            );
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cetak surat rujukan ke PDF
     */
    public function cetakSuratRujukan($no_rawat)
    {
        // Ambil data pelayanan beserta relasi yang umum dipakai
        $pelayanan = Pelayanan::with(['poli', 'dokter.namauser', 'pasien', 'pendaftaran.penjamin'])
            ->where('nomor_register', $no_rawat)
            ->first();

        if (!$pelayanan) {
            abort(404, 'Data tidak ditemukan');
        }

        // Ambil rujukan yang sudah disimpan
        $rujukan = Rujukan::where('nomor_register', $no_rawat)->first();

        // Data diagnosa: fallback '-' bila belum tersedia model/tabel diagnosa
        $diagnosa = '-';

        // Nama fasilitas (FKTP) dari config aplikasi sebagai fallback
        $fktp = config('app.name', '-');

        $data = [
            'nomor_registrasi' => $pelayanan->nomor_register ?? '-',
            'fktp'             => $fktp,
            'nama_pasien'      => optional($pelayanan->pasien)->nama ?? '-',
            'nomor_rm'         => $pelayanan->nomor_rm ?? '-',
            'tanggal_lahir'    => optional($pelayanan->pasien)->tanggal_lahir ?? '-',
            'jenis_kelamin'    => optional($pelayanan->pasien)->seks ?? '-',
            'penjamin'         => optional(optional($pelayanan->pendaftaran)->penjamin)->nama ?? '-',
            'dokter_pengirim'  => optional(optional($pelayanan->dokter)->namauser)->name ?? '-',
            'diagnosa'         => $diagnosa,
            'tanggal_rujukan'  => $rujukan->tanggal_rujukan ?? $rujukan->tanggal_rujukan_khusus ?? '-',
            'keterangan'       => 'Rujukan untuk pemeriksaan lebih lanjut',
            'no_rujukan'       => $pelayanan->kunjungan ?? '-',
            'no_bpjs'          => optional($pelayanan->pasien)->no_bpjs ?? '-',
            'subspesialis'     => $rujukan->sub_spesialis ?? $rujukan->subspesialis_khusus ?? '-',
            'lokasi'           => $rujukan->tujuan_rujukan_spesialis ?? $rujukan->tujuan_rujukan_khusus ?? null,
        ];

        $pdf = Pdf::loadView('pdf.rujukan', $data)->setPaper('a4', 'landscape');
        return $pdf->stream('rujukan-' . ($pelayanan->nomor_rm ?? 'pasien') . '.pdf');
    }
}
