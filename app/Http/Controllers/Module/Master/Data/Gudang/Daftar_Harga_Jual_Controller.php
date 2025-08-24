<?php

namespace App\Http\Controllers\Module\Master\Data\Gudang;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Module\Master\Data\Gudang\Daftar_Harga_Jual;
use Inertia\Inertia;

class Daftar_Harga_Jual_Controller extends Controller
{
    public function index()
    {
        $daftarHargaJuals = Daftar_Harga_Jual::latest()->get();
        return Inertia::render('module/master/gudang/daftar-harga-jual/index', [
            'daftarHargaJuals' => $daftarHargaJuals
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'kode_obat_alkes' => 'required|string|max:255',
            'nama_obat_alkes' => 'required|string|max:255',
            'harga_dasar' => 'required|numeric',
            'harga_jual_1' => 'required|numeric',
            'harga_jual_2' => 'nullable|numeric',
            'harga_jual_3' => 'nullable|numeric',
            'diskon' => 'nullable|numeric',
            'ppn' => 'nullable|numeric',
            'tanggal_obat_masuk' => 'required|date',
        ]);

        Daftar_Harga_Jual::create($request->all());

        return redirect()->back()->with('success', 'Data Daftar Harga Jual berhasil ditambahkan');
    }

    public function update(Request $request, Daftar_Harga_Jual $daftarHargaJual)
    {
        $request->validate([
            'kode_obat_alkes' => 'required|string|max:255',
            'nama_obat_alkes' => 'required|string|max:255',
            'harga_dasar' => 'required|numeric',
            'harga_jual_1' => 'required|numeric',
            'harga_jual_2' => 'nullable|numeric',
            'harga_jual_3' => 'nullable|numeric',
            'diskon' => 'nullable|numeric',
            'ppn' => 'nullable|numeric',
            'tanggal_obat_masuk' => 'required|date',
        ]);

        $daftarHargaJual->update($request->all());

        return redirect()->back()->with('success', 'Data Daftar Harga Jual berhasil diupdate');
    }

    public function destroy(Daftar_Harga_Jual $daftarHargaJual)
    {
        $daftarHargaJual->delete();

        return redirect()->back()->with('success', 'Data Daftar Harga Jual berhasil dihapus');
    }
}
