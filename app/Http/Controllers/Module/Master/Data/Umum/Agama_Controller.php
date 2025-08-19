<?php

namespace App\Http\Controllers\Module\Master\Data\Umum;

use App\Http\Controllers\Controller;
use App\Models\Module\Master\Data\Umum\Agama;
use Illuminate\Http\Request;
use Inertia\Inertia;


class Agama_Controller extends Controller
{
    public function index()
    {
        $agamas = Agama::latest()->get();
        return Inertia::render('module/master/umum/agama/index', [
            'agamas' => $agamas
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
        ]);

        $exists = Agama::whereRaw('LOWER(nama) = ?', [strtolower($request->nama)])->exists();

        if ($exists) {
            return redirect()->back()->withErrors(['nama' => 'Data Agama sudah ada.']);
        }

        Agama::create([
            'nama' => ucfirst(strtolower($request->nama)), // seragamkan kapitalisasi
        ]);

        return redirect()->back()->with('success', 'Data Agama berhasil ditambahkan');

    }

    public function update(Request $request, Agama $agama)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
        ]);

        $agama->update($request->all());

        return redirect()->back()->with('success', 'Data Agama berhasil diupdate');
    }

    public function destroy(Agama $agama)
    {
        $agama->delete();

        return redirect()->back()->with('success', 'Data Agama berhasil dihapus');
    }
}
