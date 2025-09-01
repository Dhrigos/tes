<?php

namespace App\Http\Controllers\Module\Gudang;

use App\Http\Controllers\Controller;
use App\Models\Module\Gudang\Stok_Barang;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

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
}
