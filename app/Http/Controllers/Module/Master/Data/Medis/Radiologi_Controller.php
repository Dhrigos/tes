<?php

namespace App\Http\Controllers\Module\Master\Data\Medis;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Module\Master\Data\Medis\Radiologi_Jenis;
use App\Models\Module\Master\Data\Medis\Radiologi_Pemeriksaan;

class Radiologi_Controller extends Controller
{
    public function index()
    {
        // Ambil semua jenis radiologi dengan pemeriksaannya
        $jenises = Radiologi_Jenis::with('pemeriksaans')->get();
        
        return Inertia::render('module/master/medis/radiologi/index', [
            'jenises' => $jenises
        ]);
    }

    // Method untuk menambah jenis radiologi
    public function storeJenis(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
        ]);

        Radiologi_Jenis::create([
            'nama' => $request->nama
        ]);
        
        return redirect()->back()->with('success', 'Jenis radiologi berhasil ditambahkan');
    }

    // Method untuk update jenis radiologi
    public function updateJenis(Request $request, Radiologi_Jenis $radiologiJenis)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
        ]);

        $radiologiJenis->update([
            'nama' => $request->nama
        ]);
        
        return redirect()->back()->with('success', 'Jenis radiologi berhasil diubah');
    }

    // Method untuk hapus jenis radiologi
    public function destroyJenis(Radiologi_Jenis $radiologiJenis)
    {
        // Hapus semua pemeriksaan terkait terlebih dahulu
        $radiologiJenis->pemeriksaans()->delete();
        
        // Kemudian hapus jenis
        $radiologiJenis->delete();
        
        return redirect()->back()->with('success', 'Jenis radiologi berhasil dihapus');
    }

    // Method untuk menambah pemeriksaan radiologi
    public function storePemeriksaan(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
            'id_jenis' => 'required|exists:radiologi_jenis,id',
        ]);

        Radiologi_Pemeriksaan::create([
            'nama' => $request->nama,
            'id_jenis' => $request->id_jenis
        ]);
        
        return redirect()->back()->with('success', 'Pemeriksaan radiologi berhasil ditambahkan');
    }

    // Method untuk update pemeriksaan radiologi
    public function updatePemeriksaan(Request $request, Radiologi_Pemeriksaan $radiologiPemeriksaan)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
            'id_jenis' => 'required|exists:radiologi_jenis,id',
        ]);

        $radiologiPemeriksaan->update([
            'nama' => $request->nama,
            'id_jenis' => $request->id_jenis
        ]);
        
        return redirect()->back()->with('success', 'Pemeriksaan radiologi berhasil diubah');
    }

    // Method untuk hapus pemeriksaan radiologi
    public function destroyPemeriksaan(Radiologi_Pemeriksaan $radiologiPemeriksaan)
    {
        $radiologiPemeriksaan->delete();
        return redirect()->back()->with('success', 'Pemeriksaan radiologi berhasil dihapus');
    }
}


// Radiologi itu sama seperti Pemeriksaan
