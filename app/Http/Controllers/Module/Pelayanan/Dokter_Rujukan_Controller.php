<?php

namespace App\Http\Controllers\Module\Pelayanan;

use App\Http\Controllers\Controller;
use App\Models\Module\Pelayanan\Pelayanan;
use App\Models\Module\Pelayanan\Pelayanan_Rujukan;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Illuminate\Http\RedirectResponse;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

class Dokter_Rujukan_Controller extends Controller
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

            return Inertia::render('module/pelayanan/rujukan/rujukan', [
                'pelayanan' => $patientData,
                'Ref_TACC' => $refTacc,
                'subspesialis' => $subspesialis,
                'sarana' => $sarana,
                'spesialis' => $spesialis
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
    public function store(Request $request): RedirectResponse
    {
        try {
            // Validate request data
            $validated = $request->validate([
                'nomor_register' => ['required', 'string'],
                'jenis_rujukan' => 'required|string',
                'tujuan_rujukan' => 'required|string',
                'opsi_rujukan' => 'required|string',
                'tanggal_rujukan' => 'nullable|date',
                'sarana' => 'nullable|string',
                'sub_spesialis' => 'nullable|string',
            ]);

            // Add auth info
            $validated['user_input_id'] = Auth::id() ?? 1;
            $validated['user_input_name'] = Auth::user()->name ?? 'System';
            $validated['no_rawat'] = $validated['nomor_register'];
            $validated['tanggal_rujukan'] = $validated['tanggal_rujukan'] ?? now();

            // Save to database
            Pelayanan_Rujukan::create($validated);

            return redirect()
                ->back()
                ->with('success', 'Rujukan berhasil disimpan');
        } catch (\Exception $e) {
            return redirect()
                ->back()
                ->with('error', 'Gagal menyimpan rujukan: ' . $e->getMessage());
        }
    }

    /**
     * Update an existing rujukan
     */
    public function update(Request $request, $norawat): RedirectResponse
    {
        try {
            // Decode nomor register from route param
            $nomor_register = base64_decode($norawat, true) ?: $norawat;

            // Validate request data
            $validated = $request->validate([
                'jenis_rujukan' => 'required|string',
                'tujuan_rujukan' => 'required|string',
                'opsi_rujukan' => 'required|string',
                'tanggal_rujukan' => 'nullable|date',
                'sarana' => 'nullable|string',
                'sub_spesialis' => 'nullable|string',
            ]);

            // Find existing rujukan
            $rujukan = Pelayanan_Rujukan::where('no_rawat', $nomor_register)->first();
            
            if (!$rujukan) {
                return redirect()
                    ->back()
                    ->with('error', 'Data rujukan tidak ditemukan');
            }

            // Add auth info
            $validated['user_input_id'] = Auth::id() ?? $rujukan->user_input_id;
            $validated['user_input_name'] = Auth::user()->name ?? $rujukan->user_input_name;

            // Update database
            $rujukan->update($validated);

            return redirect()
                ->back()
                ->with('success', 'Rujukan berhasil diperbarui');
        } catch (\Exception $e) {
            return redirect()
                ->back()
                ->with('error', 'Gagal memperbarui rujukan: ' . $e->getMessage());
        }
    }
}
