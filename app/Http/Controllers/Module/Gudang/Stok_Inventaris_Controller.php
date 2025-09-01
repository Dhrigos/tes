<?php

namespace App\Http\Controllers\Module\Gudang;

use App\Http\Controllers\Controller;
use App\Models\Module\Gudang\Stok_Inventaris;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

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
}
