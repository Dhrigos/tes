<?php

namespace App\Http\Controllers\Module\Master\Data\Gudang;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Module\Master\Data\Gudang\Kategori_Obat;
use Inertia\Inertia;

class Kategori_Obat_Controller extends Controller
{
    public function index()
    {
        $kategoriObats = Kategori_Obat::latest()->get();
        return Inertia::render('module/master/gudang/kategori-obat/index', [
            'kategoriObats' => $kategoriObats
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
        ]);

        $exists = Kategori_Obat::whereRaw('LOWER(nama) = ?', [strtolower($request->nama)])->exists();

        if ($exists) {
            return redirect()->back()->withErrors(['nama' => 'Data Kategori Obat sudah ada.']);
        }

        Kategori_Obat::create([
            'nama' => ucfirst(strtolower($request->nama)), // seragamkan kapitalisasi
        ]);

        return redirect()->back()->with('success', 'Data Kategori Obat berhasil ditambahkan');
    }

    public function update(Request $request, Kategori_Obat $kategoriobat)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
        ]);

        $kategoriobat->update($request->all());

        return redirect()->back()->with('success', 'Data Kategori Obat berhasil diupdate');
    }

    public function destroy(Kategori_Obat $kategoriobat)
    {
        $kategoriobat->delete();

        return redirect()->back()->with('success', 'Data Kategori Obat berhasil dihapus');
    }
}
