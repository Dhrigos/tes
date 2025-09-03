<?php

namespace App\Http\Controllers\Module\Gudang;

use App\Http\Controllers\Controller;
use App\Models\Module\Gudang\Stok_Inventaris_Klinik;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class Stok_Inventaris_Klinik_Controller extends Controller
{
    public function index()
    {
        $stok_inventaris = Stok_Inventaris_Klinik::select(
            'kode_barang as kode',
            'nama_barang as nama',
            DB::raw('SUM(qty_barang) as total_stok')
        )
        ->groupBy('kode_barang', 'nama_barang')
        ->get();

        $all_stok_inventaris_klinik = Stok_Inventaris_Klinik::all();

        return Inertia::render('module/gudang/stok-inventaris-klinik/index', [
            'stok_inventaris' => $stok_inventaris,
            'all_stok_inventaris_klinik' => $all_stok_inventaris_klinik,
        ]);
    }
}
