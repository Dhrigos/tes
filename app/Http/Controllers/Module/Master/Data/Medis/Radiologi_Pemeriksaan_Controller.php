<?php

namespace App\Http\Controllers\Module\Master\Data\Medis;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Module\Master\Data\Medis\Radiologi;

class Radiologi_Pemeriksaan_Controller extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
            'id_jenis' => 'required|exists:radiologis,id',
        ]);

        // Buat pemeriksaan radiologi (dengan parent_id)
        Radiologi::create([
            'nama' => $request->nama,
            'parent_id' => $request->id_jenis
        ]);
        
        return redirect()->back()->with('success', 'Pemeriksaan radiologi berhasil ditambahkan');
    }

    public function update(Request $request, Radiologi $radiologiPemeriksaan)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
            'id_jenis' => 'required|exists:radiologis,id',
        ]);

        $radiologiPemeriksaan->update([
            'nama' => $request->nama,
            'parent_id' => $request->id_jenis
        ]);
        
        return redirect()->back()->with('success', 'Pemeriksaan radiologi berhasil diubah');
    }

    public function destroy(Radiologi $radiologiPemeriksaan)
    {
        $radiologiPemeriksaan->delete();
        return redirect()->back()->with('success', 'Pemeriksaan radiologi berhasil dihapus');
    }
}
