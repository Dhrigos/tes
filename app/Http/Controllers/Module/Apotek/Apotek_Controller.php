<?php

namespace App\Http\Controllers\Module\Apotek;

use App\Http\Controllers\Controller;
use App\Models\Module\Apotek\Apotek;
use App\Models\Module\Apotek\Apotek_Prebayar;
use App\Models\Module\Pelayanan\Pelayanan_Soap_Dokter;
use App\Models\Module\SDM\Dokter;
use App\Models\Module\Gudang\Stok_Obat_Klinik;
// Harga lookup via DB to avoid model coupling
use App\Models\Module\Master\Data\Medis\Poli;
use App\Models\Module\Master\Data\Umum\Penjamin;
use App\Models\Module\Master\Data\Gudang\Setting_Harga_Jual;
use App\Models\Module\Master\Data\Gudang\Daftar_Barang;
use App\Models\Module\Master\Data\Gudang\Daftar_Harga_Jual_Klinik;
use App\Models\Module\Master\Data\Gudang\Satuan_Barang;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Validation\ValidationException;
use App\Models\Module\Master\Data\Gudang\Setting_Harga_Jual_Utama;
use Illuminate\Support\Carbon;

class Apotek_Controller extends Controller
{
    private function getTanggalMulaiFromSetting(): string
    {
        $today = Carbon::today();
        $setting = Setting_Harga_Jual_Utama::first();
        $jumlah = (int)($setting->setting_waktu ?? 0);
        $satuan = strtolower(trim((string)($setting->satuan_waktu ?? '')));

        if ($jumlah > 0) {
            if ($satuan === 'minggu') {
                return $today->copy()->subWeeks($jumlah)->toDateString();
            } elseif ($satuan === 'bulan') {
                return $today->copy()->subMonths($jumlah)->toDateString();
            } elseif ($satuan === 'tahun') {
                return $today->copy()->subYears($jumlah)->toDateString();
            }
        }
        return $today->copy()->subMonths(3)->toDateString();
    }

    public function index()
    {
        $title = "Apotek";
        $data_soap = Pelayanan_Soap_Dokter::with([
            'resep',
            'pendaftaran',
            'pendaftaran.dokter',
            'pendaftaran.dokter.namauser',
            'pendaftaran.poli',
            'pasien',
        ])
            ->where('status_apotek', '=', "0")
            ->whereHas('resep', function ($query) {
                $query->whereNotNull('nama_obat');
            })
            ->get();

        // Compatibility for frontend expecting single resep object
        // Preserve all resep items in `resep_items` and set `resep` to the first item
        $data_soap->each(function ($soap) {
            if ($soap->relationLoaded('resep')) {
                $resepCollection = $soap->resep; // hasMany collection
                // Expose full list for future use
                $soap->setRelation('resep_items', $resepCollection);
                // Keep backward compatibility: a single object
                $soap->setRelation('resep', $resepCollection->first());
            }
        });
        $dokter = Dokter::with('namauser')->get();
        $poli = Poli::all();
        $penjamin = Penjamin::all();
        $embalase = Setting_Harga_Jual::value('embalase_poin');
        $stok_raw = Stok_Obat_Klinik::selectRaw('MAX(id) as id')
            ->groupBy('kode_obat_alkes')
            ->pluck('id');

        $stok = Stok_Obat_Klinik::whereIn('id', $stok_raw)->get();

        $obat = Daftar_Barang::all();
        $satuan = Satuan_Barang::all();

        return Inertia::render('module/apotek/index', compact('title', 'data_soap', 'dokter', 'poli', 'penjamin', 'embalase', 'stok', 'obat', 'satuan'));
    }

    public function getKodeFaktur()
    {
        try {
            $last = Apotek::orderByDesc('id')->first();
            $lastNumber = 1;
            if ($last && preg_match('/(\d+)$/', $last->kode_faktur, $m)) {
                $lastNumber = ((int) $m[1]) + 1;
            }
            $datePart = now()->format('Ymd');
            $numberPart = str_pad($lastNumber, 5, '0', STR_PAD_LEFT);
            return response()->json(['kode' => "RSP-$datePart-$numberPart"]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Gagal generate kode faktur', 'error' => $e->getMessage()], 500);
        }
    }

    public function getBeliBebas()
    {
        $last = Apotek::where('no_rm', 'like', 'BBS-%')->orderByDesc('id')->first();
        $lastNumber = 1;
        if ($last && preg_match('/BBS-(\d+)/', $last->no_rm, $m)) {
            $lastNumber = ((int) $m[1]) + 1;
        }
        $noRm = 'BBS-' . str_pad($lastNumber, 4, '0', STR_PAD_LEFT);
        return response()->json(['no_rm' => $noRm]);
    }

    public function getKodeFakturBeliBebas()
    {
        $datePart = now()->format('Ymd');
        $last = Apotek::where('kode_faktur', 'regexp', '-[0-9]{5}$')->orderByDesc('id')->first();
        $lastNumber = 1;
        if ($last && preg_match('/-(\d{5})$/', $last->kode_faktur, $m)) {
            $lastNumber = ((int) $m[1]) + 1;
        }
        $numberPart = str_pad($lastNumber, 5, '0', STR_PAD_LEFT);
        return response()->json(['kode_faktur' => "BBS-$datePart-$numberPart"]);
    }

    public function getKodeObat(Request $request)
    {
        $nama = $request->input('nama');
        $penjamin = strtoupper($request->input('penjamin', 'UMUM'));

        $today = Carbon::today()->toDateString();
        $mulai = $this->getTanggalMulaiFromSetting();

        $data = Daftar_Harga_Jual_Klinik::where('nama_obat_alkes', $nama)
            ->whereBetween('tanggal_obat_masuk', [$mulai, $today])
            ->first();
        $query = Daftar_Harga_Jual_Klinik::where('nama_obat_alkes', $nama)
            ->whereBetween('tanggal_obat_masuk', [$mulai, $today]);

        if ($penjamin === 'BPJS') {
            $harga = $query->max('harga_jual_1');
        } elseif ($penjamin === 'ASURANSI') {
            $harga = $query->max('harga_jual_2');
        } else {
            $harga = $query->max('harga_jual_3');
        }

        return response()->json([
            'kode' => $data->kode_obat_alkes ?? null,
            'harga' => $harga ?? null,
        ]);
    }

    public function hargaBebas(Request $request)
    {
        $kode = $request->input('kode');
        $today = Carbon::today()->toDateString();
        $mulai = $this->getTanggalMulaiFromSetting();
        $penjamin = strtoupper($request->input('penjamin', 'UMUM'));
        if ($penjamin === 'BPJS') {
            $harga = Daftar_Harga_Jual_Klinik::where('kode_obat_alkes', $kode)
                ->whereBetween('tanggal_obat_masuk', [$mulai, $today])
                ->max('harga_jual_1');
        } elseif ($penjamin === 'ASURANSI') {
            $harga = Daftar_Harga_Jual_Klinik::where('kode_obat_alkes', $kode)
                ->whereBetween('tanggal_obat_masuk', [$mulai, $today])
                ->max('harga_jual_2');
        } else {
            $harga = Daftar_Harga_Jual_Klinik::where('kode_obat_alkes', $kode)
                ->whereBetween('tanggal_obat_masuk', [$mulai, $today])
                ->max('harga_jual_3');
        }
        return response()->json(['harga' => $harga]);
    }

    public function apotekadd(Request $request)
    {
        try {
            $validated = $request->validate([
                'no_rawat' => 'nullable|string',
                'no_rm' => 'required|string',
                'nama' => 'required|string',
                'alamat' => 'nullable|string',
                'resep' => 'required|string',
                'faktur_apotek' => 'required|string|unique:apoteks,kode_faktur',
                'dokter' => 'nullable|string',
                'poli' => 'nullable|string',
                'penjamin' => 'required|string',
                'nilai_embis_input' => 'nullable|string',
                'sub_total_hidden' => 'required|string',
                'embalase_total_hidden' => 'nullable|string',
                'total_hidden' => 'required|string',
                'note_apotek' => 'nullable|string',
                'tabel_apotek_harga_hidden' => 'required|string',
            ]);

            if (Apotek::where('kode_faktur', $validated['faktur_apotek'])->exists()) {
                return response()->json(['status' => 'error', 'message' => 'Transaksi sudah pernah dilakukan.'], 409);
            }

            $header = Apotek::create([
                'kode_faktur' => $validated['faktur_apotek'],
                'no_rm' => $validated['no_rm'],
                'no_rawat' => $validated['no_rawat'] ?? null,
                'nama' => $validated['nama'],
                'alamat' => $validated['alamat'] ?? null,
                'tanggal' => now()->toDateString(),
                'jenis_resep' => $validated['resep'],
                'jenis_rawat' => 'RAWAT JALAN',
                'poli' => $validated['poli'] ?? null,
                'dokter' => $validated['dokter'] ?? null,
                'penjamin' => $validated['penjamin'],
                'embalase_poin' => $validated['nilai_embis_input'] ?? 0,
                'sub_total' => $validated['sub_total_hidden'] ?? 0,
                'embis_total' => $validated['embalase_total_hidden'] ?? 0,
                'total' => $validated['total_hidden'] ?? 0,
                'note_apotek' => $validated['note_apotek'] ?? null,
                'status_kasir' => 0,
            ]);

            $details = json_decode($validated['tabel_apotek_harga_hidden'], true) ?: [];
            foreach ($details as $detail) {
                Apotek_Prebayar::create([
                    'kode_faktur' => $validated['faktur_apotek'],
                    'no_rm' => $validated['no_rm'],
                    'nama' => $validated['nama'],
                    'tanggal' => now()->toDateString(),
                    'nama_obat_alkes' => $detail['nama'] ?? '-',
                    'kode_obat_alkes' => $detail['kode'] ?? '-',
                    'harga' => $detail['harga'] ?? 0,
                    'qty' => $detail['qty'] ?? 0,
                    'total' => $detail['total'] ?? 0,
                ]);

                $qtyToDeduct = (int) ($detail['qty'] ?? 0);
                $kode = $detail['kode'] ?? '';
                if ($qtyToDeduct > 0 && $kode) {
                    $today = now()->toDateString();
                    $stokList = Stok_Obat_Klinik::where('kode_obat_alkes', $kode)
                        ->where('qty', '>', 0)
                        ->whereDate('expired', '>=', $today)
                        ->orderBy('expired', 'asc')
                        ->get();
                    foreach ($stokList as $stok) {
                        if ($qtyToDeduct <= 0) break;
                        $available = (int) ($stok->qty ?? 0);
                        $deduct = min($available, $qtyToDeduct);
                        if ($deduct > 0) {
                            $stok->qty = $available - $deduct;
                            $stok->save();
                            $qtyToDeduct -= $deduct;
                        }
                    }
                }
            }

            if (!empty($validated['no_rawat'])) {
                Pelayanan_Soap_Dokter::where('no_rawat', $validated['no_rawat'])->update(['status_apotek' => '1']);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Data berhasil disimpan. Silakan verifikasi di kasir sebelum pengambilan obat.',
                'data' => $header,
            ]);
        } catch (ValidationException $e) {
            return response()->json(['status' => 'error', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => 'Terjadi kesalahan: ' . $e->getMessage()], 500);
        }
    }
}
