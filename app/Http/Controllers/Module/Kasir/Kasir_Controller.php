<?php

namespace App\Http\Controllers\Module\Kasir;

use App\Http\Controllers\Controller;
use App\Models\Module\Master\Data\Umum\Asuransi;
use App\Models\Module\Master\Data\Umum\Bank;
use App\Models\Module\Master\Data\Umum\Penjamin;
use App\Models\Module\Apotek\Apotek;
use App\Models\Module\Apotek\Apotek_Prebayar;
use App\Models\Module\Kasir\Kasir;
use App\Models\Module\Kasir\Kasir_Detail;
use App\Models\Module\Pemdaftaran\Pendaftaran;
use App\Models\Module\Pelayanan\Pelayanan;
use App\Models\Module\Master\Data\Medis\Tindakan;
use App\Models\Module\Master\Data\Medis\Kategori_Tindakan;
use App\Models\Module\Pelayanan\Pelayanan_Soap_Dokter_Tindakan;
use App\Models\Module\Setting\Web_Setting;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class Kasir_Controller extends Controller
{
    public function index()
    {
        $title = "Kasir";

        $apotek = Apotek::with(['detail_obat', 'detail_tindakan'])
            ->where('status_kasir', 0)
            ->get();

        $tanggal = Carbon::now()->format('Ymd');

        $tindakan = Pelayanan_Soap_Dokter_Tindakan::where('status_kasir', 0)
            ->whereDoesntHave('cek_resep')
            ->with('data_soap')
            ->get();

        $latestFaktur = Kasir::where('kode_faktur', 'LIKE', "TND-{$tanggal}-%")
            ->orderBy('kode_faktur', 'desc')
            ->first();

        $lastNumber = 0;
        if ($latestFaktur) {
            $lastNumber = (int) substr($latestFaktur->kode_faktur, -4);
        }

        $kodeFakturMap = [];

        foreach ($tindakan as $item) {
            if (isset($kodeFakturMap[$item->no_rawat])) {
                $item->kode_faktur = $kodeFakturMap[$item->no_rawat];
            } else {
                $existing = Kasir::where('no_rawat', $item->no_rawat)->first();
                if ($existing) {
                    $kodeFakturMap[$item->no_rawat] = $existing->kode_faktur;
                    $item->kode_faktur = $existing->kode_faktur;
                } else {
                    $lastNumber++;
                    $newNumber = str_pad($lastNumber, 4, '0', STR_PAD_LEFT);
                    $newKodeFaktur = "TND-{$tanggal}-{$newNumber}";
                    $kodeFakturMap[$item->no_rawat] = $newKodeFaktur;
                    $item->kode_faktur = $newKodeFaktur;
                }
            }
        }

        $tindakan = $tindakan->unique('no_rawat')->values();

        return Inertia::render('module/kasir/index', [
            'title' => $title,
            'apotek' => $apotek,
            'tindakan' => $tindakan,
        ]);
    }

    public function kasirPembayaran(Request $request, $kode_faktur)
    {
        $title = "Detail Pembayaran Kasir";
        $no_rawat = $request->query('no_rawat');
        $apotek = apotek::with('data_soap', 'detail_obat')->where('kode_faktur', $kode_faktur)->first();
        $tindakan = pelayanan_soap_dokter_tindakan::with('data_soap')->where('no_rawat', $no_rawat)->first();

        $apotekTabel = apotek_prebayar::where('kode_faktur', $kode_faktur)->get();
        $tindakanTabel = pelayanan_soap_dokter_tindakan::with('data_soap')->where('no_rawat', $no_rawat)->whereNotNull('jenis_pelaksana')->get();

        $penjamin = penjamin::all();
        // Kirim struktur yang sesuai dengan kebutuhan frontend (perawatan_kategori & perawatan_tindakan)
        $kategori = Kategori_Tindakan::select('id', 'nama')->get();
        $tindakanList = Tindakan::select('id', 'nama', 'kategori as perawatan_kategori_id', 'tarif_perawat', 'tarif_dokter')->get();
        $tindakanTambahan = [
            'perawatan_kategori' => $kategori,
            'perawatan_tindakan' => $tindakanList,
        ];

        $bank = bank::all();
        $asuransi = asuransi::all();

        // dd($tindakanTabel);
        return Inertia::render('module/kasir/pembayaran/index', compact('title', 'no_rawat', 'kode_faktur', 'apotek', 'apotekTabel', 'tindakan', 'tindakanTabel', 'penjamin', 'tindakanTambahan', 'bank', 'asuransi'));
    }

    public function kasiradd(Request $request)
    {
        try {
            $validated = $request->validate([
                'data_hidden' => 'nullable|string',
                'kode_faktur_hidden' => 'required|string',
                'no_rawat_hidden' => 'nullable|string',
                'no_rm' => 'required|string',
                'nama' => 'required|string',
                'sex' => 'nullable|string',
                'usia' => 'nullable|string',
                'alamat' => 'nullable|string',
                'poli' => 'required|string',
                'dokter' => 'nullable|string',
                'jenis_perawatan' => 'required|string',
                'penjamin' => 'required|string',
                'sub_total' => 'required|string',
                'potongan_harga' => 'nullable|string',
                'administrasi' => 'nullable|string',
                'materai' => 'nullable|string',
                'total' => 'required|string',
                'tagihan' => 'required|string',
                'kurang_dibayar' => 'required|string',
                'payment_method_1' => 'required|string',
                'payment_nominal_1' => 'required|string',
                'payment_type_1' => 'nullable|string',
                'payment_ref_1' => 'nullable|string',
                'payment_method_2' => 'nullable|string',
                'payment_nominal_2' => 'nullable|string',
                'payment_type_2' => 'nullable|string',
                'payment_ref_2' => 'nullable|string',
                'payment_method_3' => 'nullable|string',
                'payment_nominal_3' => 'nullable|string',
                'payment_type_3' => 'nullable|string',
                'payment_ref_3' => 'nullable|string',
            ], [
                'kode_faktur_hidden'  => 'Kode Faktur',
                'no_faktur_hidden'    => 'No Rawat',
                'no_rm'               => 'No RM',
                'nama'                => 'Nama Pasien',
                'sex'                 => 'Jenis Kelamin',
                'usia'                => 'Usia',
                'alamat'              => 'Alamat',
                'poli'                => 'Poli',
                'dokter'              => 'Dokter',
                'jenis_perawatan'     => 'Jenis Perawatan',
                'penjamin'            => 'Penjamin',
                'sub_total'           => 'Subtotal',
                'potongan_harga'      => 'Potongan Harga',
                'administrasi'        => 'Administrasi',
                'materai'             => 'Materai',
                'total'               => 'Total',
                'tagihan'             => 'Tagihan',
                'kurang_dibayar'      => 'Kurang Dibayar',
                'payment_method_1'    => 'Metode Pembayaran 1',
                'payment_nominal_1'   => 'Nominal Pembayaran 1',
                'payment_type_1'      => 'Tipe Pembayaran 1',
                'payment_ref_1'       => 'Referensi Pembayaran 1',
                'payment_method_2'    => 'Metode Pembayaran 2',
                'payment_nominal_2'   => 'Nominal Pembayaran 2',
                'payment_type_2'      => 'Tipe Pembayaran 2',
                'payment_ref_2'       => 'Referensi Pembayaran 2',
                'payment_method_3'    => 'Metode Pembayaran 3',
                'payment_nominal_3'   => 'Nominal Pembayaran 3',
                'payment_type_3'      => 'Tipe Pembayaran 3',
                'payment_ref_3'       => 'Referensi Pembayaran 3',
            ]);

            $kasir = kasir::create([
                'kode_faktur'       => $validated['kode_faktur_hidden'],
                'no_rawat'          => $validated['no_rawat_hidden'] ?? null,
                'no_rm'             => $validated['no_rm'],
                'nama'              => $validated['nama'],
                'sex'               => $validated['sex'] ?? null,
                'usia'              => $validated['usia'] ?? null,
                'alamat'            => $validated['alamat'] ?? null,
                'poli'              => $validated['poli'],
                'dokter'            => $validated['dokter'] ?? null,
                'jenis_perawatan'   => $validated['jenis_perawatan'],
                'penjamin'          => $validated['penjamin'],
                'tanggal'           => now()->format('Y-m-d'),
                'sub_total'         => $validated['sub_total'],
                'potongan_harga'    => $validated['potongan_harga'] ?? '0',
                'administrasi'      => $validated['administrasi'] ?? '0',
                'materai'           => $validated['materai'] ?? '0',
                'total'             => $validated['total'],
                'tagihan'           => $validated['tagihan'],
                'kembalian'         => $validated['kurang_dibayar'], // atau hitung: bayar - tagihan?

                'payment_method_1'  => $validated['payment_method_1'],
                'payment_nominal_1' => $validated['payment_nominal_1'],
                'payment_type_1'    => $validated['payment_type_1'] ?? null,
                'payment_ref_1'     => $validated['payment_ref_1'] ?? null,

                'payment_method_2'  => $validated['payment_method_2'] ?? null,
                'payment_nominal_2' => $validated['payment_nominal_2'] ?? null,
                'payment_type_2'    => $validated['payment_type_2'] ?? null,
                'payment_ref_2'     => $validated['payment_ref_2'] ?? null,

                'payment_method_3'  => $validated['payment_method_3'] ?? null,
                'payment_nominal_3' => $validated['payment_nominal_3'] ?? null,
                'payment_type_3'    => $validated['payment_type_3'] ?? null,
                'payment_ref_3'     => $validated['payment_ref_3'] ?? null,
            ]);

            // Simpan detail pembelian
            $dataDetail = json_decode($request->data_hidden, true);

            if (!empty($dataDetail['tindakan'])) {
                foreach ($dataDetail['tindakan'] as $t) {
                    Kasir_Detail::create([
                        'kode_faktur'          => $request->kode_faktur_hidden,
                        'no_rawat'             => $request->no_rawat_hidden ?? null,
                        'no_rm'                => $request->no_rm,
                        'nama_obat_tindakan'   => $t['jenis_tindakan'],
                        'harga_obat_tindakan'  => $t['harga'],
                        'pelaksana'            => $t['jenis_pelaksana'],
                        'qty'                  => 1,
                        'subtotal'             => $t['harga'],
                        'total'                => $t['total'],
                        'tanggal'              => $t['tanggal']
                    ]);
                }
            }

            if (!empty($dataDetail['apotek'])) {
                foreach ($dataDetail['apotek'] as $a) {
                    Kasir_Detail::create([
                        'kode_faktur'          => $request->kode_faktur_hidden,
                        'no_rawat'             => $request->no_rawat_hidden ?? null,
                        'no_rm'                => $request->no_rm,
                        'nama_obat_tindakan'   => $a['nama_obat_alkes'],
                        'harga_obat_tindakan'  => $a['harga'],
                        'qty'                  => $a['qty'],
                        'subtotal'             => $a['harga'] * $a['qty'],
                        'total'                => $a['total'],
                        'tanggal'              => $a['tanggal']
                    ]);
                }
            }

            if (!empty($dataDetail['diskon'])) {
                foreach ($dataDetail['diskon'] as $d) {
                    Kasir_Detail::create([
                        'kode_faktur'          => $request->kode_faktur_hidden,
                        'no_rawat'             => $request->no_rawat_hidden ?? null,
                        'no_rm'                => $request->no_rm,
                        'nama_diskon'          => $d['nama'],
                        'harga_diskon'         => abs($d['harga']),
                        'qty'                  => 1,
                        'subtotal'             => abs($d['harga']),
                        'total'                => abs($d['nilai']),
                        'tanggal'              => $d['tanggal']
                    ]);
                }
            }

            $updateApotek = apotek::where('kode_faktur', $request->kode_faktur_hidden)->first();

            if ($updateApotek) {
                $updateApotek->status_kasir = 1;
                $updateApotek->save();
            }

            $updateTindakan = pelayanan_soap_dokter_tindakan::where('no_rawat', $request->no_rawat_hidden)->get();

            if ($updateTindakan->isNotEmpty()) {
                foreach ($updateTindakan as $item) {
                    $item->status_kasir = 1;
                    $item->save();
                }
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Pembayaran kasir berhasil dilakukan.',
                'data' => $kasir,
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan: ' . $e->getMessage(),
            ], 500);
        }
    }
}
