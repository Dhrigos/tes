<?php

namespace App\Http\Controllers\Module\Gudang;

use App\Http\Controllers\Controller;
use App\Models\Module\Gudang\Stok_Obat_Klinik;
use App\Models\Module\Gudang\Stok_Penyesuaian;
use App\Models\Module\Master\Data\Medis\Instruksi_Obat;
use App\Models\Module\Master\Data\Gudang\Satuan_Barang;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class Stok_Obat_Klinik_Controller extends Controller
{
    public function index()
    {
        $stok_obat = Stok_Obat_Klinik::select(
            'kode_obat_alkes',
            'nama_obat_alkes',
            DB::raw('SUM(qty) as total_stok')
        )
            ->groupBy('kode_obat_alkes', 'nama_obat_alkes')
            ->get();

        $all_stok_obat_klinik = Stok_Obat_Klinik::all();

        return Inertia::render('module/gudang/stok-obat-klinik/index', [
            'stok_obat' => $stok_obat,
            'all_stok_obat_klinik' => $all_stok_obat_klinik,
        ]);
    }

    public function penyesuaian(Request $request)
    {
        $request->validate([
            'kode_obat' => 'required',
            'aktifitas_penyesuaian' => 'required|in:stok_opname,koreksi_manual',
            'obat_penyesuaian' => 'required',
            'keterangan_qty_penyesuaian' => 'nullable|in:tambahkan,kurangi',
            'qty_penyesuaian' => 'required|integer|min:0',
            'alasan_penyesuaian' => 'required',
        ]);

        $stokSebelumnyaQty = Stok_Obat_Klinik::where('kode_obat_alkes', $request->kode_obat)->sum('qty');

        if ($request->aktifitas_penyesuaian === 'stok_opname') {
            $selisih = $request->qty_penyesuaian - $stokSebelumnyaQty;

            if ($selisih > 0) {
                // Ambil tanggal expired terdekat untuk kode obat tsb
                $expiredTerdekat = Stok_Obat_Klinik::where('kode_obat_alkes', $request->kode_obat)
                    ->whereNotNull('expired')
                    ->orderBy('expired', 'asc')
                    ->value('expired');

                Stok_Obat_Klinik::create([
                    'kode_obat_alkes' => $request->kode_obat,
                    'nama_obat_alkes' => $request->obat_penyesuaian,
                    'qty' => $selisih,
                    'expired' => $expiredTerdekat,
                    'tanggal_terima_obat' => now()->toDateString()
                ]);

                Stok_Penyesuaian::create([
                    'kode_obat' => $request->kode_obat,
                    'nama_obat' => $request->obat_penyesuaian,
                    'qty_sebelum' => $stokSebelumnyaQty,
                    'qty_mutasi' => $selisih,
                    'qty_sesudah' => $request->qty_penyesuaian,
                    'jenis_penyesuaian' => 'STOK OPNAME',
                    'alasan' => $request->alasan_penyesuaian,
                    'jenis_gudang' => 'klinik',
                    'user_input_name' => (Auth::user()->name ?? null),
                ]);
            } elseif ($selisih < 0) {
                $selisihPengurangan = abs($selisih);
                $qtyRiwayat = $selisihPengurangan;

                $stokList = Stok_Obat_Klinik::where('kode_obat_alkes', $request->kode_obat)
                    ->orderBy('tanggal_terima_obat', 'asc')
                    ->get();

                foreach ($stokList as $stok) {
                    if ($selisihPengurangan <= 0) break;

                    if ($stok->qty <= $selisihPengurangan) {
                        $selisihPengurangan -= $stok->qty;
                        $stok->qty = 0;
                    } else {
                        $stok->qty -= $selisihPengurangan;
                        $selisihPengurangan = 0;
                    }
                    $stok->save();
                }

                Stok_Penyesuaian::create([
                    'kode_obat' => $request->kode_obat,
                    'nama_obat' => $request->obat_penyesuaian,
                    'qty_sebelum' => $stokSebelumnyaQty,
                    'qty_mutasi' => $qtyRiwayat,
                    'qty_sesudah' => $request->qty_penyesuaian,
                    'jenis_penyesuaian' => 'STOK OPNAME',
                    'alasan' => $request->alasan_penyesuaian,
                    'jenis_gudang' => 'klinik',
                    'user_input_name' => (Auth::user()->name ?? null),
                ]);
            }
        } elseif ($request->aktifitas_penyesuaian === 'koreksi_manual') {
            if ($request->keterangan_qty_penyesuaian === 'tambahkan') {
                // Ambil tanggal expired terdekat untuk kode obat tsb
                $expiredTerdekatTambah = Stok_Obat_Klinik::where('kode_obat_alkes', $request->kode_obat)
                    ->whereNotNull('expired')
                    ->orderBy('expired', 'asc')
                    ->value('expired');

                Stok_Obat_Klinik::create([
                    'kode_obat_alkes' => $request->kode_obat,
                    'nama_obat_alkes' => $request->obat_penyesuaian,
                    'qty' => $request->qty_penyesuaian,
                    'expired' => $expiredTerdekatTambah,
                    'tanggal_terima_obat' => now()->toDateString()
                ]);

                $qty_sesudah_koreksi = $stokSebelumnyaQty + $request->qty_penyesuaian;

                Stok_Penyesuaian::create([
                    'kode_obat' => $request->kode_obat,
                    'nama_obat' => $request->obat_penyesuaian,
                    'qty_sebelum' => $stokSebelumnyaQty,
                    'qty_mutasi' => $request->qty_penyesuaian,
                    'qty_sesudah' => $qty_sesudah_koreksi,
                    'jenis_penyesuaian' => 'PENYESUAIAN MASUK',
                    'alasan' => $request->alasan_penyesuaian,
                    'jenis_gudang' => 'klinik',
                    'user_input_name' => (Auth::user()->name ?? null),
                ]);
            } elseif ($request->keterangan_qty_penyesuaian === 'kurangi') {
                $stok_pengurangan = $request->qty_penyesuaian;

                $stokList_2 = Stok_Obat_Klinik::where('kode_obat_alkes', $request->kode_obat)
                    ->orderBy('tanggal_terima_obat', 'asc')
                    ->get();

                foreach ($stokList_2 as $stok) {
                    if ($stok_pengurangan <= 0) break;

                    if ($stok->qty <= $stok_pengurangan) {
                        $stok_pengurangan -= $stok->qty;
                        $stok->qty = 0;
                    } else {
                        $stok->qty -= $stok_pengurangan;
                        $stok_pengurangan = 0;
                    }
                    $stok->save();
                }

                $qty_sesudah_koreksi = $stokSebelumnyaQty - $request->qty_penyesuaian;

                Stok_Penyesuaian::create([
                    'kode_obat' => $request->kode_obat,
                    'nama_obat' => $request->obat_penyesuaian,
                    'qty_sebelum' => $stokSebelumnyaQty,
                    'qty_mutasi' => $request->qty_penyesuaian,
                    'qty_sesudah' => $qty_sesudah_koreksi,
                    'jenis_penyesuaian' => 'PENYESUAIAN KELUAR',
                    'alasan' => $request->alasan_penyesuaian,
                    'jenis_gudang' => 'klinik',
                    'user_input_name' => (Auth::user()->name ?? null),
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Penyesuaian Obat Klinik Berhasil Dilakukan!',
        ], 201);
    }

    public function getObatTersedia()
    {
        $medicines = Stok_Obat_Klinik::select(
            'kode_obat_alkes',
            'nama_obat_alkes',
            DB::raw('SUM(qty) as total_stok')
        )
            ->groupBy('kode_obat_alkes', 'nama_obat_alkes')
            ->having('total_stok', '>', 0)
            ->orderBy('nama_obat_alkes')
            ->get();

        return response()->json($medicines);
    }

    public function getInstruksiObat()
    {
        $instruksi = Instruksi_Obat::orderBy('nama')->get();
        return response()->json($instruksi);
    }

    public function getSatuanBarang()
    {
        $satuan = Satuan_Barang::orderBy('nama')->get();
        return response()->json($satuan);
    }
}
