<?php

namespace App\Http\Controllers\Module\Master\Data\Umum;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Module\Master\Data\Umum\Kelamin;

class Kelamin_Controller extends Controller
{
    public function index()
    {
        $kelamins = Kelamin::all();
        return Inertia::render('module/master/umum/kelamin/index', [
            'kelamins' => $kelamins
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:255|unique:kelamins,nama',
        ]);

        $exists = Kelamin::whereRaw('LOWER(nama) = ?', [strtolower($request->nama)])->exists();

        if ($exists) {
            return redirect()->back()->withErrors(['nama' => 'Data Kelamin sudah ada.']);
        }

        Kelamin::create([
            'nama' => ucfirst(strtolower($request->nama)),
        ]);

        return redirect()->back()->with('success', 'Data Kelamin berhasil ditambahkan');
    }

    public function update(Request $request, Kelamin $kelamin)
    {
        $request->validate([
            'nama' => 'required|string|max:255|unique:kelamins,nama',
        ]);

        $exists = Kelamin::whereRaw('LOWER(nama) = ?', [strtolower($request->nama)])->exists();

        if ($exists) {
            return redirect()->back()->withErrors(['nama' => 'Data Kelamin sudah ada.']);
        }

        $kelamin->update([
            'nama' => ucfirst(strtolower($request->nama)),
        ]);

        return redirect()->back()->with('success', 'Data Kelamin berhasil diubah');
    }

    public function destroy(Kelamin $kelamin)
    {
        $kelamin->delete();
        return redirect()->back()->with('success', 'Data Kelamin berhasil dihapus');
    }
}
