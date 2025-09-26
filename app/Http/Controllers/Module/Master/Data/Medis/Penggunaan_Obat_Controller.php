<?php

namespace App\Http\Controllers\Module\Master\Data\Medis;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Module\Master\Data\Medis\Penggunaan_Obat;
use Inertia\Inertia;

class Penggunaan_Obat_Controller extends Controller
{
    public function index()
    {
        $penggunaan_obats = Penggunaan_Obat::all();
        return Inertia::render('module/master/medis/penggunaan-obat/index', compact('penggunaan_obats'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
        ]);

        Penggunaan_Obat::create([
            'nama' => $request->nama,
        ]);
        return redirect()->back()->with('success', 'Cara penggunaan obat berhasil ditambahkan');
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
        ]);

        $penggunaanObat = Penggunaan_Obat::findOrFail($id);
        $penggunaanObat->update([
            'nama' => $request->nama,
        ]);
        return redirect()->back()->with('success', 'Cara penggunaan obat berhasil diubah');
    }

    public function destroy($id)
    {
        $penggunaanObat = Penggunaan_Obat::findOrFail($id);
        $penggunaanObat->delete();
        return redirect()->back()->with('success', 'Cara penggunaan obat berhasil dihapus');
    }
}
