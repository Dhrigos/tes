<?php

namespace App\Http\Controllers\Module\Gudang;

use App\Http\Controllers\Controller;
use App\Models\Module\Gudang\Stok_Obat_Klinik;
use App\Models\Module\Master\Data\Medis\Instruksi_Obat;
use App\Models\Module\Master\Data\Gudang\Satuan_Barang;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

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
