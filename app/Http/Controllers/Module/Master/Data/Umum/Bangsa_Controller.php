<?php

namespace App\Http\Controllers\Module\Master\Data\Umum;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Module\Master\Data\Umum\Bangsa;

class Bangsa_Controller extends Controller
{
    public function index()
    {
        $bangsas = Bangsa::all();
        return Inertia::render('module/master/umum/bangsa/index', [
            'bangsas' => $bangsas
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:255|unique:bangsas,nama',
        ]);

        $exists = Bangsa::whereRaw('LOWER(nama) = ?', [strtolower($request->nama)])->exists();

        if ($exists) {
            return redirect()->back()->withErrors(['nama' => 'Data Bangsa sudah ada.']);
        }

        Bangsa::create([
            'nama' => ucfirst(strtolower($request->nama)),
        ]);

        return redirect()->back()->with('success', 'Data Bangsa berhasil ditambahkan');
    }

    public function update(Request $request, Bangsa $bangsa)
    {
        $request->validate([
            'nama' => 'required|string|max:255|unique:bangsas,nama',
        ]);

        $exists = Bangsa::whereRaw('LOWER(nama) = ?', [strtolower($request->nama)])->exists();

        if ($exists) {
            return redirect()->back()->withErrors(['nama' => 'Data Bangsa sudah ada.']);
        }

        $bangsa->update([
            'nama' => ucfirst(strtolower($request->nama)),
        ]);

        return redirect()->back()->with('success', 'Data Bangsa berhasil diubah');
    }

    public function destroy(Bangsa $bangsa)
    {
        $bangsa->delete();
        return redirect()->back()->with('success', 'Data Bangsa berhasil dihapus');
    }
}
