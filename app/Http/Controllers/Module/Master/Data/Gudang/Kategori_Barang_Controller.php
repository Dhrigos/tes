<?php

namespace App\Http\Controllers\Module\Master\Data\Gudang;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Module\Master\Data\Gudang\Kategori_Barang;
use Inertia\Inertia;

class Kategori_Barang_Controller extends Controller
{
    public function index()
    {
        $kategoriBarangs = Kategori_Barang::latest()->get();
        return Inertia::render('module/master/gudang/kategori-barang/index', [
            'kategoriBarangs' => $kategoriBarangs
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
        ]);

        $exists = Kategori_Barang::whereRaw('LOWER(nama) = ?', [strtolower($request->nama)])->exists();

        if ($exists) {
            return redirect()->back()->withErrors(['nama' => 'Data Kategori Barang sudah ada.']);
        }

        Kategori_Barang::create([
            'nama' => ucfirst(strtolower($request->nama)), // seragamkan kapitalisasi
        ]);

        return redirect()->back()->with('success', 'Data Kategori Barang berhasil ditambahkan');
    }

    public function update(Request $request, Kategori_Barang $kategoribarang)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
        ]);

        $kategoribarang->update($request->all());

        return redirect()->back()->with('success', 'Data Kategori Barang berhasil diupdate');
    }

    public function destroy(Kategori_Barang $kategoribarang)
    {
        $kategoribarang->delete();

        return redirect()->back()->with('success', 'Data Kategori Barang berhasil dihapus');
    }
}
