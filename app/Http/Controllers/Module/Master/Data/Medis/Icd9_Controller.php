<?php

namespace App\Http\Controllers\Module\Master\Data\Medis;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Module\Master\Data\Medis\Icd9;
use Inertia\Inertia;

class Icd9_Controller extends Controller
{
    public function index()
    {
        $icd9s = Icd9::all();
        return Inertia::render('module/master/medis/icd9/index', [
            'icd9s' => $icd9s,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'kode' => 'required|string|max:255',
            'nama' => 'required|string|max:255',
        ]);

        Icd9::create([
            'kode' => strtoupper($request->kode),
            'nama' => ucfirst(strtolower($request->nama)),
        ]);

        return redirect()->back()->with('success', 'ICD-9 berhasil ditambahkan');
    }

    public function update(Request $request, Icd9 $icd9)
    {
        $request->validate([
            'kode' => 'required|string|max:255',
            'nama' => 'required|string|max:255',
        ]);

        $icd9->update([
            'kode' => strtoupper($request->kode),
            'nama' => ucfirst(strtolower($request->nama)),
        ]);

        return redirect()->back()->with('success', 'ICD-9 berhasil diubah');
    }

    public function destroy(Icd9 $icd9)
    {
        $icd9->delete();
        return redirect()->back()->with('success', 'ICD-9 berhasil dihapus');
    }
    
    public function sync()
    {
        // Implementasi sinkronisasi data ICD-9
        // Contoh sederhana - bisa disesuaikan dengan kebutuhan
        try {
            // Logika sinkronisasi di sini
            // Misalnya mengambil data dari API eksternal atau database lain
            
            return redirect()->back()->with('success', 'Sinkronisasi ICD-9 berhasil');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Sinkronisasi ICD-9 gagal: ' . $e->getMessage());
        }
    }
}
