<?php

namespace App\Http\Controllers\Module\Master\Data\Umum;

use App\Http\Controllers\Controller;
use App\Models\Module\Master\Data\Umum\Suku;
use Illuminate\Http\Request;
use Inertia\Inertia;

class Suku_Controller extends Controller
{
    public function index()
    {
        $sukus = Suku::all();
        return Inertia::render('module/master/umum/suku/index', [
            'sukus' => $sukus
        ]);
    }
    public function store(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
        ]);

        $exists = Suku::whereRaw('LOWER(nama) = ?', [strtolower($request->nama)])->exists();

        if ($exists) {
            return redirect()->back()->withErrors(['nama' => 'Data Suku sudah ada.']);
        }

        Suku::create([
            'nama' => ucfirst(strtolower($request->nama)),
        ]);

        return redirect()->back()->with('success', 'Suku berhasil ditambahkan');
    }

    public function update(Request $request, Suku $suku)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
        ]);

        $suku->update([
            'nama' => ucfirst(strtolower($request->nama)),
        ]);

        return redirect()->back()->with('success', 'Suku berhasil diupdate');
    }

    public function destroy(Suku $suku)
    {
        $suku->delete();

        return redirect()->back()->with('success', 'Suku berhasil dihapus');
    }
}
