<?php

namespace App\Http\Controllers\Module\Gudang;

use App\Http\Controllers\Controller;
use App\Models\Module\Gudang\Stok_Barang;
use App\Models\Module\Gudang\Stok_Penyesuaian;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class Stok_Barang_Controller extends Controller
{
    public function index()
    {
        // Mengelompokkan data berdasarkan kode_obat_alkes dan menghitung total stok
        $stok_obat = Stok_Barang::select(
            'kode_obat_alkes',
            'nama_obat_alkes',
            DB::raw('SUM(qty) as total_stok')
        )
            ->groupBy('kode_obat_alkes', 'nama_obat_alkes')
            ->get();

        // Mengambil semua data stok barang untuk detail batch
        $all_stok_barang = Stok_Barang::all();

        return Inertia::render('module/gudang/stok-barang/index', [
            'stok_obat' => $stok_obat,
            'all_stok_barang' => $all_stok_barang
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

        $stokSebelumnyaQty = Stok_Barang::where('kode_obat_alkes', $request->kode_obat)->sum('qty');

        if ($request->aktifitas_penyesuaian === 'stok_opname') {
            $selisih = $request->qty_penyesuaian - $stokSebelumnyaQty;

            if ($selisih > 0) {
                // Ambil tanggal expired terdekat untuk kode obat tsb
                $expiredTerdekat = Stok_Barang::where('kode_obat_alkes', $request->kode_obat)
                    ->whereNotNull('expired')
                    ->orderBy('expired', 'asc')
                    ->value('expired');

                Stok_Barang::create([
                    'kode_obat_alkes' => $request->kode_obat,
                    'nama_obat_alkes' => $request->obat_penyesuaian,
                    'qty' => $selisih,
                    'expired' => $expiredTerdekat,
                    'tanggal_terima_obat' => now()->toDateString(),
                ]);

                Stok_Penyesuaian::create([
                    'kode_obat' => $request->kode_obat,
                    'nama_obat' => $request->obat_penyesuaian,
                    'qty_sebelum' => $stokSebelumnyaQty,
                    'qty_mutasi' => $selisih,
                    'qty_sesudah' => $request->qty_penyesuaian,
                    'jenis_penyesuaian' => 'STOK OPNAME',
                    'alasan' => $request->alasan_penyesuaian,
                    'jenis_gudang' => 'utama',
                    'user_input_name' => (Auth::user()->name ?? null),
                ]);
            } elseif ($selisih < 0) {
                $selisihPengurangan = abs($selisih);
                $qtyRiwayat = $selisihPengurangan;

                $stokList = Stok_Barang::where('kode_obat_alkes', $request->kode_obat)
                    ->orderBy('expired', 'asc')
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
                    'jenis_gudang' => 'utama',
                    'user_input_name' => (Auth::user()->name ?? null),
                ]);
            }
        } elseif ($request->aktifitas_penyesuaian === 'koreksi_manual') {
            if ($request->keterangan_qty_penyesuaian === 'tambahkan') {
                // Ambil tanggal expired terdekat untuk kode obat tsb
                $expiredTerdekatTambah = Stok_Barang::where('kode_obat_alkes', $request->kode_obat)
                    ->whereNotNull('expired')
                    ->orderBy('expired', 'asc')
                    ->value('expired');

                Stok_Barang::create([
                    'kode_obat_alkes' => $request->kode_obat,
                    'nama_obat_alkes' => $request->obat_penyesuaian,
                    'qty' => $request->qty_penyesuaian,
                    'expired' => $expiredTerdekatTambah,
                    'tanggal_terima_obat' => now()->toDateString(),
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
                    'jenis_gudang' => 'utama',
                    'user_input_name' => (Auth::user()->name ?? null),
                ]);
            } elseif ($request->keterangan_qty_penyesuaian === 'kurangi') {
                $stok_pengurangan = $request->qty_penyesuaian;

                $stokList_2 = Stok_Barang::where('kode_obat_alkes', $request->kode_obat)
                    ->orderBy('expired', 'asc')
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
                    'jenis_gudang' => 'utama',
                    'user_input_name' => (Auth::user()->name ?? null),
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Penyesuaian Stok Utama Berhasil Dilakukan!',
        ], 201);
    }
}
