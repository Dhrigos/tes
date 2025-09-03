<?php

namespace App\Http\Controllers\Module\Master\Data\Gudang;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Module\Master\Data\Gudang\Daftar_Harga_Jual_Klinik;
use Inertia\Inertia;

class Daftar_Harga_Jual_Klinik_Controller extends Controller
{
    public function index()
    {
        $daftarHargaJualKliniks = Daftar_Harga_Jual_Klinik::latest()->get();
        return Inertia::render('module/master/gudang/daftar-harga-jual-klinik/index', [
            'daftarHargaJualKliniks' => $daftarHargaJualKliniks
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama_obat_alkes' => 'required|string|max:255',
            'harga_dasar' => 'required|numeric',
            'harga_jual_1' => 'required|numeric',
            'harga_jual_2' => 'required|numeric',
            'harga_jual_3' => 'required|numeric',
            'diskon' => 'required|numeric',
            'ppn' => 'required|numeric',
        ]);

        Daftar_Harga_Jual_Klinik::create($request->all());

        return redirect()->back()->with('success', 'Data Daftar Harga Jual Klinik berhasil ditambahkan');
    }

    public function update(Request $request, Daftar_Harga_Jual_Klinik $daftarHargaJualKlinik)
    {
        $request->validate([
            'nama_obat_alkes' => 'required|string|max:255',
            'harga_dasar' => 'required|numeric',
            'harga_jual_1' => 'required|numeric',
            'harga_jual_2' => 'required|numeric',
            'harga_jual_3' => 'required|numeric',
            'diskon' => 'required|numeric',
            'ppn' => 'required|numeric',
        ]);

        $daftarHargaJualKlinik->update($request->all());

        return redirect()->back()->with('success', 'Data Daftar Harga Jual Klinik berhasil diupdate');
    }

    public function destroy(Daftar_Harga_Jual_Klinik $daftarHargaJualKlinik)
    {
        $daftarHargaJualKlinik->delete();

        return redirect()->back()->with('success', 'Data Daftar Harga Jual Klinik berhasil dihapus');
    }
}
