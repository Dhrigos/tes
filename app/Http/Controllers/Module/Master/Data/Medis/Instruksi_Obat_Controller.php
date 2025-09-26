<?php

namespace App\Http\Controllers\Module\Master\Data\Medis;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Module\Master\Data\Medis\Instruksi_Obat;
use Inertia\Inertia;

class Instruksi_Obat_Controller extends Controller
{
    public function index()
    {
        $instruksi_obats = Instruksi_Obat::all();
        return Inertia::render('module/master/medis/instruksi-obat/index', compact('instruksi_obats'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
        ]);

        Instruksi_Obat::create([
            'nama' => $request->nama,
        ]);
        return redirect()->back()->with('success', 'Instruksi obat berhasil ditambahkan');
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
        ]);

        $instruksi_obat = Instruksi_Obat::findOrFail($id);

        $instruksi_obat->update([
            'nama' => $request->nama,
        ]);
        return redirect()->back()->with('success', 'Instruksi obat berhasil diubah');
    }

    public function destroy($id)
    {
        $instruksi_obat = Instruksi_Obat::findOrFail($id);
        $instruksi_obat->delete();
        return redirect()->back()->with('success', 'Instruksi obat berhasil dihapus');
    }
}
