<?php

namespace App\Http\Controllers\Module\Master\Data\Umum;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Module\Master\Data\Umum\Penjamin;

class Penjamin_Controller extends Controller
{
    public function index()
    {
        $penjamins = Penjamin::all();
        return Inertia::render('module/master/umum/penjamin/index', [
            'penjamins' => $penjamins
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:255|unique:penjamins,nama',
        ]);

        Penjamin::create([
            'nama' => ucfirst(strtolower($request->nama)),
        ]);

        return redirect()->back()->with('success', 'Data Penjamin berhasil ditambahkan');
    }

    public function update(Request $request, Penjamin $penjamin)
    {
        $request->validate([
            'nama' => 'required|string|max:255|unique:penjamins,nama',
        ]);

        $exists = Penjamin::whereRaw('LOWER(nama) = ?', [strtolower($request->nama)])->exists();

        if ($exists) {
            return redirect()->back()->withErrors(['nama' => 'Data Penjamin sudah ada.']);
        }

        $penjamin->update([
            'nama' => ucfirst(strtolower($request->nama)),
        ]);

        return redirect()->back()->with('success', 'Data Penjamin berhasil diubah');
    }

    public function destroy(Penjamin $penjamin)
    {
        $penjamin->delete();
        return redirect()->back()->with('success', 'Data Penjamin berhasil dihapus');
    }
}
