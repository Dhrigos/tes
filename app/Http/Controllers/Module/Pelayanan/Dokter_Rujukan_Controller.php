<?php

namespace App\Http\Controllers\Module\Pelayanan;

use App\Http\Controllers\Controller;
use App\Models\Module\Pelayanan\Pelayanan;
use App\Models\Module\Pelayanan\Pelayanan_Rujukan;
use App\Models\Module\Pelayanan\Pelayanan_Soap_Dokter;
use App\Models\Module\Pelayanan\Pelayanan_Soap_Dokter_Icd;
use App\Models\Module\Pelayanan\Gcs\Gcs_Kesadaran;
use App\Models\Module\Master\Data\Medis\Sarana;
use App\Models\Module\Master\Data\Medis\Spesialis;
use App\Models\Module\Master\Data\Medis\Subspesialis;
use App\Models\Settings\Web_Setting;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class Dokter_Rujukan_Controller extends Controller
{
    /**
     * Inertia page to show rujukan form (for React view consumers)
     */
    public function show(Request $request, $norawat): InertiaResponse
    {
        try {
            $nomor_register = base64_decode($norawat);

            $pelayanan = Pelayanan::with(['pasien', 'pendaftaran.penjamin'])
                ->where('nomor_register', $nomor_register)
                ->first();

            if (!$pelayanan) {
                $patientData = [
                    'nomor_rm' => '',
                    'nama' => '',
                    'nomor_register' => $nomor_register,
                    'jenis_kelamin' => '',
                    'penjamin' => '',
                    'tanggal_lahir' => '',
                    'umur' => '0 Tahun 0 Bulan 0 Hari',
                    'no_bpjs' => ''
                ];
            } else {
                $umur = '0 Tahun 0 Bulan 0 Hari';
                if ($pelayanan->pasien && $pelayanan->pasien->tanggal_lahir) {
                    $tgl_lahir = Carbon::createFromFormat('Y-m-d', $pelayanan->pasien->tanggal_lahir);
                    $diff = $tgl_lahir->diff(Carbon::now());
                    $umur = $diff->y . ' Tahun ' . $diff->m . ' Bulan ' . $diff->d . ' Hari';
                }

                $jkRaw = optional($pelayanan->pasien)->seks ?? null;
                $jenisKelamin = $jkRaw === 1 || $jkRaw === '1' ? 'Laki-laki' : ($jkRaw === 2 || $jkRaw === '2' ? 'Perempuan' : ($jkRaw ?? ''));

                $patientData = [
                    'nomor_rm' => $pelayanan->nomor_rm,
                    'nama' => optional($pelayanan->pasien)->nama ?? '',
                    'nomor_register' => $pelayanan->nomor_register,
                    'jenis_kelamin' => $jenisKelamin,
                    'penjamin' => optional(optional($pelayanan->pendaftaran)->penjamin)->nama ?? '',
                    'tanggal_lahir' => optional($pelayanan->pasien)->tanggal_lahir ?? '',
                    'umur' => $umur,
                    'no_bpjs' => optional($pelayanan->pasien)->no_bpjs ?? ''
                ];
            }

            // minimal data for selects to avoid frontend errors
            $refTacc = [
                [
                    'kdTacc' => '-1',
                    'nmTacc' => 'Tanpa TACC',
                    'alasanTacc' => []
                ],
            ];

            return Inertia::render('module/pelayanan/rujukan/rujukan', [
                'pelayanan' => $patientData,
                'Ref_TACC' => $refTacc,
                'subspesialis' => [],
                'sarana' => [],
                'spesialis' => [],
            ]);
        } catch (\Exception $e) {
            return Inertia::render('module/pelayanan/rujukan/rujukan', [
                'pelayanan' => [
                    'nomor_rm' => '',
                    'nama' => '',
                    'nomor_register' => '',
                    'jenis_kelamin' => '',
                    'penjamin' => '',
                    'tanggal_lahir' => '',
                    'umur' => '',
                    'no_bpjs' => ''
                ],
                'errors' => ['error' => 'Gagal memuat data rujukan: ' . $e->getMessage()]
            ]);
        }
    }

    public function index($norawat)
    {
        $nomor_rawat = base64_decode($norawat);
        $title = "Pelayanan";
        $pelayanan = Pelayanan::with('poli', 'dokter.namauser', 'pasien', 'pendaftaran.penjamin')
            ->where('nomor_register', $nomor_rawat)
            ->first();

        if ($pelayanan && $pelayanan->pasien && $pelayanan->pasien->tanggal_lahir) {
            $tgl_lahir = Carbon::createFromFormat('Y-m-d', $pelayanan->pasien->tanggal_lahir);
            $diff = $tgl_lahir->diff(Carbon::now());
            $umur = $diff->y . ' Tahun ' . $diff->m . ' Bulan ' . $diff->d . ' Hari';
        } else {
            $umur = '0 Tahun 0 Bulan 0 Hari';
        }

        $sarana = Sarana::all();
        $spesialis = Spesialis::all();
        $subspesialis = Subspesialis::all();

        $alasanComplication = Pelayanan_Soap_Dokter_Icd::where('no_rawat', $nomor_rawat)
            ->where('priority_icd10', 'Primary')
            ->get()
            ->map(function ($item) {
                return $item->kode_icd10 . ' - ' . $item->nama_icd10;
            })
            ->toArray();

        $Ref_TACC = [
            [
                "kdTacc" => "-1",
                "nmTacc" => "Tanpa TACC",
                "alasanTacc" => []
            ],
            [
                "kdTacc" => "1",
                "nmTacc" => "Time",
                "alasanTacc" => ["< 3 Hari", ">= 3 - 7 Hari", ">= 7 Hari"]
            ],
            [
                "kdTacc" => "2",
                "nmTacc" => "Age",
                "alasanTacc" => [
                    "< 1 Bulan",
                    ">= 1 Bulan s/d < 12 Bulan",
                    ">= 1 Tahun s/d < 5 Tahun",
                    ">= 5 Tahun s/d < 12 Tahun",
                    ">= 12 Tahun s/d < 55 Tahun",
                    ">= 55 Tahun"
                ]
            ],
            [
                "kdTacc" => "3",
                "nmTacc" => "Complication",
                "alasanTacc" => $alasanComplication
            ],
            [
                "kdTacc" => "4",
                "nmTacc" => "Comorbidity",
                "alasanTacc" => ["< 3 Hari", ">= 3 - 7 Hari", ">= 7 Hari"]
            ]
        ];

        $jkRaw = optional($pelayanan->pasien)->seks ?? null;
        $jenisKelamin = $jkRaw === 1 || $jkRaw === '1' ? 'Laki-laki' : ($jkRaw === 2 || $jkRaw === '2' ? 'Perempuan' : ($jkRaw ?? ''));

        $patientData = [
            'nomor_rm' => $pelayanan->nomor_rm ?? '',
            'nama' => optional($pelayanan->pasien)->nama ?? '',
            'nomor_register' => $pelayanan->nomor_register ?? $nomor_rawat,
            'jenis_kelamin' => $jenisKelamin,
            'penjamin' => optional(optional($pelayanan->pendaftaran)->penjamin)->nama ?? '',
            'tanggal_lahir' => optional($pelayanan->pasien)->tanggal_lahir ?? '',
            'umur' => $umur,
            'no_bpjs' => optional($pelayanan->pasien)->no_bpjs ?? '',
        ];

        return Inertia::render('module/pelayanan/rujukan/rujukan', [
            'title' => $title,
            'Ref_TACC' => $Ref_TACC,
            'pelayanan' => $patientData,
            'sarana' => $sarana,
            'spesialis' => $spesialis,
            'subspesialis' => $subspesialis,
        ]);
    }

    public function getSubSpesialis($kode)
    {
        // Filter berdasarkan awalan kode spesialis (contoh: ANA -> ANAK, dst.)
        $subSpesialis = Subspesialis::where('kode_rujukan', 'like', $kode . '%')->get();
        return response()->json($subSpesialis);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nomor_rm' => 'required|string',
            'no_rawat' => 'required|string',
            'penjamin' => 'required|string',
            'tujuan_rujukan' => 'required|string',
            'opsi_rujukan' => 'required|string',
        ]);

        $pelayanan = Pelayanan::with('poli', 'pelayanan_so', 'pelayanan_soap', 'dokter.namauser', 'pasien', 'pendaftaran.status')
            ->where('nomor_rm', $validated['nomor_rm'])
            ->where('nomor_register', $validated['no_rawat'])
            ->first();

        if (!$pelayanan) {
            return response()->json(['success' => false, 'message' => 'Data pelayanan tidak ditemukan'], 404);
        }

        if ($validated['penjamin'] === 'UMUM') {
            Pelayanan_Rujukan::create([
                'nomor_rm' => $validated['nomor_rm'],
                'no_rawat' => $validated['no_rawat'],
                'penjamin' => $validated['penjamin'],
                'tujuan_rujukan' => $validated['tujuan_rujukan'],
                'opsi_rujukan' => $validated['opsi_rujukan'],
                'tanggal_rujukan' => now()->format('Y-m-d'),
            ]);

            return response()->json([
                'message' => 'Data rujukan berhasil disimpan (UMUM)',
                'data' => $pelayanan
            ]);
        }

        if ($validated['penjamin'] !== 'BPJS') {
            return response()->json(['success' => false, 'message' => 'Penjamin tidak valid'], 400);
        }

        $soap = Pelayanan_Soap_Dokter::where('no_rawat', $pelayanan->nomor_register)->first();
        if (!$soap) {
            return response()->json(['success' => false, 'message' => 'Data SOAP tidak ditemukan'], 404);
        }

        $output = 'Keluhan tidak tersedia';
        if (!empty($soap->tableData)) {
            $array = json_decode($soap->tableData, true);
            if (is_array($array)) {
                $hasil = array_map(fn($item) => "{$item['penyakit']} {$item['durasi']} " . strtolower($item['waktu']), $array);
                $output = implode(', ', $hasil);
            }
        }

        $totalSkor = (int) $soap->eye + (int) $soap->verbal + (int) $soap->motorik;
        $kdSadar = Gcs_Kesadaran::where('skor', $totalSkor)->value('kode') ?? '01';

        $icds = Pelayanan_Soap_Dokter_Icd::where('no_rawat', $soap->no_rawat)
            ->where('nomor_rm', $soap->nomor_rm)
            ->pluck('kode_icd10')
            ->toArray();

        $diagnosa = array_slice($icds, 0, 3);
        $dataDiag = [];
        for ($i = 0; $i < 3; $i++) {
            $dataDiag["kdDiag" . ($i + 1)] = isset($diagnosa[$i]) ? $diagnosa[$i] : null;
        }
        if (empty($dataDiag['kdDiag1'])) {
            $dataDiag['kdDiag1'] = 'Z00.0';
        }

        $suhu = isset($soap->suhu) ? str_replace(',', '.', $soap->suhu) : null;

        $kunjunganPayload = array_merge([
            "noKunjungan" => null,
            "noKartu" => $pelayanan->pasien->no_bpjs ?? null,
            "tglDaftar" => now()->format('d-m-Y'),
            "kdPoli" => optional($pelayanan->poli)->kode ?? null,
            "keluhan" => $output,
            "kdSadar" => $kdSadar,
            "sistole" => (int)($soap->sistol ?? 0),
            "diastole" => (int)($soap->distol ?? 0),
            "beratBadan" => (int)($soap->berat ?? 0),
            "tinggiBadan" => (int)($soap->tinggi ?? 0),
            "respRate" => (int)($soap->rr ?? 0),
            "heartRate" => (int)($soap->nadi ?? 0),
            "lingkarPerut" => (int)($soap->lingkar_perut ?? 0),
            "kdStatusPulang" => "4",
            "tglPulang" => now()->format('d-m-Y'),
            "kdDokter" => optional($pelayanan->dokter)->kode ?? null,
        ] + $dataDiag + [
            "kdPoliRujukInternal" => null,
            "rujukLanjut" => [],
            "kdTacc" => (int) $request->input('kategori_rujukan', -1),
            "alasanTacc" => $request->input('alasanTacc', null),
            "anamnesa" => $output,
            "alergiMakan" => $pelayanan->alergi_makanan ?? "00",
            "alergiUdara" => $pelayanan->alergi_udara ?? "00",
            "alergiObat" => $pelayanan->alergi_obat ?? "00",
            "kdPrognosa" => '01',
            "terapiObat" => $pelayanan->terapi_obat ?? "tidak ada",
            "terapiNonObat" => $pelayanan->terapi_nonobat ?? "tidak ada",
            "bmhp" => $request->input('bmhp') ?? null,
            "suhu" => $suhu !== null ? (float)$suhu : null,
        ]);

        if ($validated['opsi_rujukan'] === 'rujukan_khusus') {
            $kunjunganPayload['rujukLanjut'] = [
                "kdppk" => $request->input('tujuan_rujukan_khusus'),
                "tglEstRujuk" => Carbon::parse($request->input('tanggal_rujukan_khusus'))->format('d-m-Y'),
                "subSpesialis" => null,
                "khusus" => [
                    "kdKhusus" => $request->input('igd_rujukan_khusus'),
                    "kdSubSpesialis" => $request->input('subspesialis_khusus') !== "0" ? $request->input('subspesialis_khusus') : null,
                    "catatan" => null
                ]
            ];
        } elseif ($validated['opsi_rujukan'] === 'spesialis') {
            $kunjunganPayload['rujukLanjut'] = [
                "kdppk" => $request->input('tujuan_rujukan_spesialis'),
                "tglEstRujuk" => Carbon::parse($request->input('tanggal_rujukan'))->format('d-m-Y'),
                "subSpesialis" => [
                    "kdSubSpesialis1" => $request->input('sub_spesialis'),
                    "kdSarana" => $request->input('sarana') !== "0" ? $request->input('sarana') : null,
                ],
                "khusus" => null
            ];
        } else {
            return response()->json(['success' => false, 'message' => 'Opsi rujukan tidak valid'], 400);
        }

        try {
            $pcareController = app()->make('App\\Http\\Controllers\\PcareController');
            $response = $pcareController->post_kunjungan_bpjs($kunjunganPayload);

            $content = $response->getContent();
            $data = json_decode($content, true);

            if (isset($data['data']) && is_array($data['data']) && count($data['data']) > 0) {
                $noKunjungan = $data['data'][0]['message'] ?? null;
            } else {
                $noKunjungan = null;
            }

            Pelayanan_Rujukan::create([
                'nomor_rm' => $validated['nomor_rm'],
                'no_rawat' => $validated['no_rawat'],
                'penjamin' => $validated['penjamin'],
                'tujuan_rujukan' => $validated['tujuan_rujukan'],
                'opsi_rujukan' => $validated['opsi_rujukan'],
                'tanggal_rujukan' => $request->input('tanggal_rujukan') ?? $request->input('tanggal_rujukan_khusus'),
                'sarana' => $request->input('sarana'),
                'rujukan_lanjut' => json_encode($kunjunganPayload['rujukLanjut']),
                'sub_spesialis' => $request->input('sub_spesialis') ?? $request->input('subspesialis_khusus'),
            ]);

            if ($pelayanan->pendaftaran && $pelayanan->pendaftaran->status) {
                $pelayanan->pendaftaran->status->status_panggil = 3;
                $pelayanan->pendaftaran->status->save();

                $pelayanan->kunjungan = $noKunjungan;
                $pelayanan->save();

                return response()->json([
                    'success' => true,
                    'message' => 'Data rujukan berhasil disimpan & dikirim ke BPJS.',
                    'data' => $noKunjungan
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Data status tidak ditemukan.'
                ], 404);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal kirim kunjungan ke BPJS.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function cetakSuratRujukan($no_rawat)
    {
        $pelayanan = Pelayanan::with(['poli', 'dokter.namauser', 'pasien', 'pendaftaran.penjamin'])
            ->where('nomor_register', $no_rawat)
            ->first();
        $websetting = Web_Setting::find(1);
        $rujukan = Pelayanan_Rujukan::where('no_rawat', $no_rawat)->first();
        $data_rujukan = $rujukan ? json_decode($rujukan->rujukan_lanjut, true) : [];

        $kdSubSpesialis = data_get($data_rujukan, 'subSpesialis.kdSubSpesialis1');

        $kepada = $kdSubSpesialis ? Subspesialis::where('kode', $kdSubSpesialis)->first() : null;

        if (!$pelayanan) {
            abort(404, 'Data tidak ditemukan');
        }
        $diagnosa = Pelayanan_Soap_Dokter_Icd::where('no_rawat', $no_rawat)->first();
        $data = [
            'nomor_registrasi' => $pelayanan->nomor_register ?? '-',
            'fktp'             => $websetting->nama ?? '-',
            'nama_pasien'      => optional($pelayanan->pasien)->nama ?? '-',
            'nomor_rm'         => $pelayanan->nomor_rm ?? '-',
            'tanggal_lahir'    => optional($pelayanan->pasien)->tanggal_lahir ?? '-',
            'jenis_kelamin'    => optional($pelayanan->pasien)->seks ?? '-',
            'penjamin'         => optional(optional($pelayanan->pendaftaran)->penjamin)->nama ?? '-',
            'dokter_pengirim'  => optional(optional($pelayanan->dokter)->namauser)->name ?? '-',
            'diagnosa'         => $diagnosa ?? '-',
            'tanggal_rujukan'  => $data_rujukan['tglEstRujuk'] ?? '-',
            'keterangan'       => 'Rujukan untuk pemeriksaan lebih lanjut',
            'no_rujukan'       => $pelayanan->kunjungan ?? '-',
            'no_bpjs'          => optional($pelayanan->pasien)->no_bpjs ?? '-',
            'subspesialis'     => $kepada->nama ?? '-',
            'lokasi'           => $data_rujukan['kdppk'] ?? null,
        ];
        $pdf = app('dompdf.wrapper')->loadView('pdf.rujukan', $data)->setPaper('a4', 'landscape');
        return $pdf->stream('rujukan-' . ($pelayanan->nomor_rm ?? 'pasien') . '.pdf');
    }
}
