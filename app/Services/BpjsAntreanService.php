<?php

namespace App\Services;

use App\Http\Controllers\Module\Integrasi\BPJS\Pcare_Controller;
use App\Models\Module\Pelayanan\Pelayanan;
use App\Models\Module\Pelayanan\Pelayanan_Soap_Dokter;
use App\Models\Module\Pelayanan\Pelayanan_Soap_Dokter_Icd;
use App\Models\Module\Pelayanan\Pelayanan_Soap_Dokter_Obat;
use App\Models\Module\Pelayanan\Gcs\Gcs_Kesadaran;
use Illuminate\Support\Facades\Log;

class BpjsAntreanService
{
    /**
     * Kirim status antrean ke BPJS Antrean (WS) bila penjamin BPJS
     * statusAntrean mapping mengikuti controller dokter:
     * - 2: sedang dilayani dokter / proses lanjutan (half-complete)
     * - 3: selesai oleh dokter
     */
    public function kirimStatusBpjsAntrean(Pelayanan $pelayanan, int $statusAntrean): void
    {
        try {
            if (!$pelayanan) {
                return;
            }

            $penjaminNama = optional(optional($pelayanan->pendaftaran)->penjamin)->nama;
            if (!($penjaminNama && str_contains(strtoupper($penjaminNama), 'BPJS'))) {
                return;
            }

            // Ambil SOAP dokter terbaru untuk no_rawat ini
            $soap = Pelayanan_Soap_Dokter::where('no_rawat', $pelayanan->nomor_register)
                ->latest('updated_at')
                ->first();
            if (!$soap) {
                // Jika tidak ada SOAP, tetap kirim minimal payload dengan defaults
                $soap = new Pelayanan_Soap_Dokter();
            }

            // 1) Keluhan dari tableData
            $keluhanText = 'Keluhan tidak tersedia';
            $table = $soap->tableData;

            // robust: bisa array (sudah cast) atau string JSON
            if (is_string($table)) {
                $decoded = json_decode($table, true);
                if (json_last_error() === JSON_ERROR_NONE) $table = $decoded;
            }
            $keluhanList = is_array($table) ? ($table['keluhanList'] ?? []) : [];

            if (is_array($keluhanList) && !empty($keluhanList)) {
                $parts = [];
                foreach ($keluhanList as $row) {
                    $k = trim((string)($row['keluhan'] ?? ''));
                    $d = trim((string)($row['durasi'] ?? ''));
                    if ($k !== '' || $d !== '') $parts[] = strtolower(trim("$k $d"));
                }
                if (!empty($parts)) $keluhanText = implode(', ', $parts);
            }

            // 2) Hilangkan <p> ... </p> jadi string polos
            $anamnesaPlain      = trim(preg_replace('/\s+/', ' ', strip_tags((string)($soap->anamnesa ?? ''))));
            $terapiNonObatPlain = trim(preg_replace('/\s+/', ' ', strip_tags((string)($soap->plan ?? $soap->terapi_nonobat ?? ''))));

            // Diagnosa (ICD)
            $icds = Pelayanan_Soap_Dokter_Icd::where('no_rawat', $pelayanan->nomor_register)
                ->pluck('kode_icd10')
                ->toArray();

            // Gabungkan semua kode ICD menjadi satu string, lalu pisahkan per koma (maks 3)
            $allCodes = implode(',', $icds);
            $diagnosa = array_slice(array_map('trim', explode(',', $allCodes)), 0, 3);

            $dataDiag = [];
            foreach ($diagnosa as $i => $kode) {
                $dataDiag['kdDiag' . ($i + 1)] = $kode;
            }
            if (empty($dataDiag)) {
                $dataDiag['kdDiag1'] = 'Z00.0'; // Diagnosa default
            }

            $eye     = (int) ($soap->eye ?? 0);
            $verbal  = (int) ($soap->verbal ?? 0);
            $motorik = (int) ($soap->motorik ?? 0);
            $totalSkor = $eye + $verbal + $motorik;

            $kdSadar = Gcs_Kesadaran::where('skor', $totalSkor)->value('kode') ?? '01';

            $obats = Pelayanan_Soap_Dokter_Obat::where('no_rawat', $pelayanan->nomor_register)->get();

            $terapiObat = 'tidak ada';
            if ($obats->isNotEmpty()) {
                $items = $obats->map(function ($o) {
                    $nama      = trim((string) $o->nama_obat);
                    $instruksi = trim((string) $o->instruksi);
                    $signa     = trim((string) $o->signa);
                    if ($signa !== '') {
                        $signa = preg_replace('/\s*/', '', $signa);
                        $signa = preg_replace('/x/i', ' x ', $signa, 1);
                    }
                    $qty   = ($o->jumlah_diberikan === null || $o->jumlah_diberikan === '') ? '1' : trim((string) $o->jumlah_diberikan);
                    $unit  = trim((string) ($o->satuan_signa ?: $o->satuan_gudang ?: 'pcs'));

                    $lines = [];
                    $lines[] = 'R/ ' . $nama;
                    if ($instruksi !== '') {
                        $lines[] = $instruksi;
                    }
                    $lines[] = 'S. ' . ($signa !== '' ? ($signa . ' x ') : '') . $qty . ' ' . strtolower($unit);

                    return implode("\n", $lines);
                });

                // Pisahkan resep antar item dengan satu baris kosong
                $terapiObat = $items->implode("\n\n");
            }

            $payload = array_merge([
                'noKunjungan' => null,
                'noKartu' => $pelayanan->pasien->no_bpjs ?? '',
                'tglDaftar' => now()->format('d-m-Y'),
                'kdPoli' => $pelayanan->poli->kode ?? '',
                'keluhan' => $keluhanText,
                'kdSadar' => $kdSadar,
                'sistole' => $soap->sistol ?? null,
                'diastole' => $soap->distol ?? null,
                'beratBadan' => $soap->berat ?? null,
                'tinggiBadan' => $soap->tinggi ?? null,
                'respRate' => $soap->rr ?? null,
                'heartRate' => $soap->nadi ?? null,
                'lingkarPerut' => $soap->lingkar_perut ?? null,
                'kdStatusPulang' => '3',
                'tglPulang' => now()->format('d-m-Y'),
                'kdDokter' => $pelayanan->dokter->kode ?? '',
                'kdPoliRujukInternal' => null,
                'rujukLanjut' => null,
                'kdTacc' => 0,
                'alasanTacc' => null,
                'anamnesa' => $anamnesaPlain,
                'alergiMakan' => $soap->alergi_makanan ?? '00',
                'alergiUdara' => $soap->alergi_udara ?? '00',
                'alergiObat' => $soap->alergi_obat ?? '00',
                'kdPrognosa' => '01',
                'terapiNonObat' => $terapiNonObatPlain,
                'terapiObat' => $terapiObat ?? 'tidak ada',
                'bmhp' => $soap->bmhp ?? '',
                'suhu' => $soap->suhu ?? '0',
            ], $dataDiag);

            // Fire and forget; log jika error
            try {
                Log::info('BPJS WS (dokter) update_antrian dipanggil dari service', [
                    'nomor_register' => $pelayanan->nomor_register ?? null,
                    'payload' => $payload,
                    'statusAntrean' => $statusAntrean,
                ]);
                (new Pcare_Controller())->add_rujukan($payload);
            } catch (\Throwable $bpjsEx) {
                Log::warning('Gagal update antrean BPJS (dokter) - service', [
                    'no_register' => $pelayanan->nomor_register ?? null,
                    'payload' => $payload,
                    'error' => $bpjsEx->getMessage(),
                ]);
            }
        } catch (\Throwable $e) {
            Log::warning('BpjsAntreanService.kirimStatusBpjsAntrean error', ['message' => $e->getMessage()]);
        }
    }
}
