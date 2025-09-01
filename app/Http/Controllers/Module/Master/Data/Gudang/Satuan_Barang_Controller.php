<?php

namespace App\Http\Controllers\Module\Master\Data\Gudang;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Module\Master\Data\Gudang\Satuan_Barang;
use Inertia\Inertia;

class Satuan_Barang_Controller extends Controller
{
    public function index()
    {
        $satuanBarangs = Satuan_Barang::latest()->get();
        return Inertia::render('module/master/gudang/satuan-barang/index', [
            'satuanBarangs' => $satuanBarangs
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
        ]);

        $exists = Satuan_Barang::whereRaw('LOWER(nama) = ?', [strtolower($request->nama)])->exists();

        if ($exists) {
            return redirect()->back()->withErrors(['nama' => 'Data Satuan Barang sudah ada.']);
        }

        Satuan_Barang::create([
            'nama' => ucfirst(strtolower($request->nama)), // seragamkan kapitalisasi
        ]);

        return redirect()->back()->with('success', 'Data Satuan Barang berhasil ditambahkan');
    }

    public function update(Request $request, Satuan_Barang $satuanbarang)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
        ]);

        $satuanbarang->update($request->all());

        return redirect()->back()->with('success', 'Data Satuan Barang berhasil diupdate');
    }

    public function destroy(Satuan_Barang $satuanbarang)
    {
        $satuanbarang->delete();

        return redirect()->back()->with('success', 'Data Satuan Barang berhasil dihapus');
    }
}
