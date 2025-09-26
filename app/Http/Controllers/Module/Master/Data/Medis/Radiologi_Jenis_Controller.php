<?php

namespace App\Http\Controllers\Module\Master\Data\Medis;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Module\Master\Data\Medis\Radiologi;

class Radiologi_Jenis_Controller extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
        ]);

        // Buat jenis radiologi (parent_id = null)
        Radiologi::create([
            'nama' => $request->nama,
            'parent_id' => null
        ]);
        
        return redirect()->back()->with('success', 'Jenis radiologi berhasil ditambahkan');
    }

    public function update(Request $request, Radiologi $radiologiJenis)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
        ]);

        $radiologiJenis->update([
            'nama' => $request->nama
        ]);
        
        return redirect()->back()->with('success', 'Jenis radiologi berhasil diubah');
    }

    public function destroy(Radiologi $radiologiJenis)
    {
        // Hapus semua pemeriksaan terkait terlebih dahulu
        $radiologiJenis->pemeriksaans()->delete();
        
        // Kemudian hapus jenis
        $radiologiJenis->delete();
        
        return redirect()->back()->with('success', 'Jenis radiologi berhasil dihapus');
    }
}
