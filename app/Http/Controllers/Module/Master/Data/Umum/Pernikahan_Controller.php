<?php

namespace App\Http\Controllers\Module\Master\Data\Umum;

use App\Http\Controllers\Controller;
use App\Models\Module\Master\Data\Umum\Pernikahan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class Pernikahan_Controller extends Controller
{
    public function index()
    {
        $pernikahans = Pernikahan::all();
        return Inertia::render('module/master/umum/penjamin/index', [
            'pernikahan' => $pernikahans
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:255|unique:pernikahans,nama',
        ]);

        Pernikahan::create([
            'nama' => ucfirst(strtolower($request->nama)),
        ]);

        return redirect()->back()->with('success', 'Data Pernikahan berhasil ditambahkan');
    }

    public function update(Request $request, Pernikahan $penjamin)
    {
        $request->validate([
            'nama' => 'required|string|max:255|unique:pernikahans,nama',
        ]);

        $exists = Pernikahan::whereRaw('LOWER(nama) = ?', [strtolower($request->nama)])->exists();

        if ($exists) {
            return redirect()->back()->withErrors(['nama' => 'Data Pernikahan sudah ada.']);
        }

        $penjamin->update([
            'nama' => ucfirst(strtolower($request->nama)),
        ]);

        return redirect()->back()->with('success', 'Data Pernikahan berhasil diubah');
    }

    public function destroy(Pernikahan $penjamin)
    {
        $penjamin->delete();
        return redirect()->back()->with('success', 'Data Pernikahan berhasil dihapus');
    }
}
