<?php

namespace App\Http\Controllers\Module\Gudang;

use App\Http\Controllers\Controller;
use App\Models\Module\Gudang\Stok_Inventaris;
use App\Models\Module\Gudang\Stok_Penyesuaian;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class Stok_Inventaris_Controller extends Controller
{
    public function index()
    {
        // Mengelompokkan data berdasarkan kode_barang dan menghitung total stok
        $stok_inventaris = Stok_Inventaris::select(
            'kode_barang as kode',
            'nama_barang as nama',
            DB::raw('SUM(qty_barang) as total_stok')
        )
            ->groupBy('kode_barang', 'nama_barang')
            ->get();

        // Mengambil semua data stok inventaris untuk detail batch
        $all_stok_inventaris = Stok_Inventaris::all();

        // Logging untuk debugging
        Log::info('Stok Inventaris Data', [
            'stok_inventaris_count' => $stok_inventaris->count(),
            'all_stok_inventaris_count' => $all_stok_inventaris->count(),
            'stok_inventaris_sample' => $stok_inventaris->take(5),
            'all_stok_inventaris_sample' => $all_stok_inventaris->take(5)
        ]);

        return Inertia::render('module/gudang/stok-inventaris/index', [
            'stok_inventaris' => $stok_inventaris,
            'all_stok_inventaris' => $all_stok_inventaris
        ]);
    }

    public function penyesuaian(Request $request)
    {
        $request->validate([
            'kode_barang' => 'required',
            'aktifitas_penyesuaian' => 'required|in:stok_opname,koreksi_manual',
            'nama_barang' => 'required',
            'keterangan_qty_penyesuaian' => 'nullable|in:tambahkan,kurangi',
            'qty_penyesuaian' => 'required|integer|min:0',
            'alasan_penyesuaian' => 'required',
        ]);

        $stokSebelumnyaQty = Stok_Inventaris::where('kode_barang', $request->kode_barang)->sum('qty_barang');

        if ($request->aktifitas_penyesuaian === 'stok_opname') {
            $selisih = $request->qty_penyesuaian - $stokSebelumnyaQty;

            if ($selisih > 0) {
                // Ambil masa akhir penggunaan terdekat untuk kode barang tsb
                $masaAkhirTerdekat = Stok_Inventaris::where('kode_barang', $request->kode_barang)
                    ->whereNotNull('masa_akhir_penggunaan')
                    ->orderBy('masa_akhir_penggunaan', 'asc')
                    ->value('masa_akhir_penggunaan');

                Stok_Inventaris::create([
                    'kode_pembelian' => 'OPN-' . now()->format('YmdHis'),
                    'kode_barang' => $request->kode_barang,
                    'nama_barang' => $request->nama_barang,
                    'kategori_barang' => 'inventaris',
                    'jenis_barang' => 'inventaris',
                    'harga_barang' => '0',
                    'qty_barang' => $selisih,
                    'masa_akhir_penggunaan' => $masaAkhirTerdekat,
                    'detail_barang' => 'Penyesuaian Stok',
                    'tanggal_pembelian' => now()->toDateString(),
                ]);

                Stok_Penyesuaian::create([
                    'kode_obat' => $request->kode_barang,
                    'nama_obat' => $request->nama_barang,
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

                $stokList = Stok_Inventaris::where('kode_barang', $request->kode_barang)
                    ->orderBy('masa_akhir_penggunaan', 'asc')
                    ->orderBy('tanggal_pembelian', 'asc')
                    ->get();

                foreach ($stokList as $stok) {
                    if ($selisihPengurangan <= 0) break;

                    if ($stok->qty_barang <= $selisihPengurangan) {
                        $selisihPengurangan -= $stok->qty_barang;
                        $stok->qty_barang = 0;
                    } else {
                        $stok->qty_barang -= $selisihPengurangan;
                        $selisihPengurangan = 0;
                    }
                    $stok->save();
                }

                Stok_Penyesuaian::create([
                    'kode_obat' => $request->kode_barang,
                    'nama_obat' => $request->nama_barang,
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
                // Ambil masa akhir penggunaan terdekat untuk kode barang tsb
                $masaAkhirTerdekatTambah = Stok_Inventaris::where('kode_barang', $request->kode_barang)
                    ->whereNotNull('masa_akhir_penggunaan')
                    ->orderBy('masa_akhir_penggunaan', 'asc')
                    ->value('masa_akhir_penggunaan');

                Stok_Inventaris::create([
                    'kode_pembelian' => 'OPN-' . now()->format('YmdHis'),
                    'kode_barang' => $request->kode_barang,
                    'nama_barang' => $request->nama_barang,
                    'kategori_barang' => 'inventaris',
                    'jenis_barang' => 'inventaris',
                    'harga_barang' => '0',
                    'qty_barang' => $request->qty_penyesuaian,
                    'masa_akhir_penggunaan' => $masaAkhirTerdekatTambah,
                    'detail_barang' => 'Penyesuaian Stok',
                    'tanggal_pembelian' => now()->toDateString(),
                ]);

                $qty_sesudah_koreksi = $stokSebelumnyaQty + $request->qty_penyesuaian;

                Stok_Penyesuaian::create([
                    'kode_obat' => $request->kode_barang,
                    'nama_obat' => $request->nama_barang,
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

                $stokList_2 = Stok_Inventaris::where('kode_barang', $request->kode_barang)
                    ->orderBy('masa_akhir_penggunaan', 'asc')
                    ->orderBy('tanggal_pembelian', 'asc')
                    ->get();

                foreach ($stokList_2 as $stok) {
                    if ($stok_pengurangan <= 0) break;

                    if ($stok->qty_barang <= $stok_pengurangan) {
                        $stok_pengurangan -= $stok->qty_barang;
                        $stok->qty_barang = 0;
                    } else {
                        $stok->qty_barang -= $stok_pengurangan;
                        $stok_pengurangan = 0;
                    }
                    $stok->save();
                }

                $qty_sesudah_koreksi = $stokSebelumnyaQty - $request->qty_penyesuaian;

                Stok_Penyesuaian::create([
                    'kode_obat' => $request->kode_barang,
                    'nama_obat' => $request->nama_barang,
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
            'message' => 'Penyesuaian Inventaris Utama Berhasil Dilakukan!',
        ], 201);
    }
}
