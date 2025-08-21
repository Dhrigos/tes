<?php

namespace App\Http\Controllers\Module\Master\Data\Gudang;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Module\Master\Data\Gudang\Satuan_Obat;
use Inertia\Inertia;

class Satuan_Obat_Controller extends Controller
{
    public function index()
    {
        $satuanObats = Satuan_Obat::latest()->get();
        return Inertia::render('module/master/gudang/satuan-obat/index', [
            'satuanObats' => $satuanObats
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
        ]);

        $exists = Satuan_Obat::whereRaw('LOWER(nama) = ?', [strtolower($request->nama)])->exists();

        if ($exists) {
            return redirect()->back()->withErrors(['nama' => 'Data Satuan Obat sudah ada.']);
        }

        Satuan_Obat::create([
            'nama' => ucfirst(strtolower($request->nama)), // seragamkan kapitalisasi
        ]);

        return redirect()->back()->with('success', 'Data Satuan Obat berhasil ditambahkan');
    }

    public function update(Request $request, Satuan_Obat $satuanobat)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
        ]);

        $satuanobat->update($request->all());

        return redirect()->back()->with('success', 'Data Satuan Obat berhasil diupdate');
    }

    public function destroy(Satuan_Obat $satuanobat)
    {
        $satuanobat->delete();

        return redirect()->back()->with('success', 'Data Satuan Obat berhasil dihapus');
    }
}
