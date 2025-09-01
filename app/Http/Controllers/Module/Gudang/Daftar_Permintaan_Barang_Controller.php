<?php

namespace App\Http\Controllers\Module\Gudang;

use App\Http\Controllers\Controller;
use App\Models\Module\Gudang\Permintaan_Barang;
use App\Models\Module\Gudang\Permintaan_Barang_Detail;
use Illuminate\Http\Request;
use Inertia\Inertia;

class Daftar_Permintaan_Barang_Controller extends Controller
{
    public function index(Request $request) {
        $title = "Daftar Permintaan Barang";
        $permintaan = Permintaan_Barang::all();
        return Inertia::render('module/gudang/daftar-permintaan-barang/index', [
            'title' => $title,
            'permintaan' => $permintaan,
        ]);
    }
}
