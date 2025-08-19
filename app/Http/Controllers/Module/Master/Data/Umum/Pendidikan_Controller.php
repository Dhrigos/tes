<?php

namespace App\Http\Controllers\Module\Master\Data\Umum;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Module\Master\Data\Umum\Pendidikan;

class Pendidikan_Controller extends Controller
{
    public function index()
    {
        $pendidikans = Pendidikan::all();
        return Inertia::render('module/master/umum/pendidikan/index', [
            'pendidikans' => $pendidikans
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:255|unique:pendidikans,nama',
        ]);

        $exists = Pendidikan::whereRaw('LOWER(nama) = ?', [strtolower($request->nama)])->exists();

        if ($exists) {
            return redirect()->back()->withErrors(['nama' => 'Data Pendidikan sudah ada.']);
        }

        Pendidikan::create([
            'nama' => ucfirst(strtolower($request->nama)),
        ]);

        return redirect()->back()->with('success', 'Data Pendidikan berhasil ditambahkan');
    }

    public function update(Request $request, Pendidikan $pendidikan)
    {
        $request->validate([
            'nama' => 'required|string|max:255|unique:pendidikans,nama',
        ]);

        $exists = Pendidikan::whereRaw('LOWER(nama) = ?', [strtolower($request->nama)])->exists();

        if ($exists) {
            return redirect()->back()->withErrors(['nama' => 'Data Pendidikan sudah ada.']);
        }

        $pendidikan->update([
            'nama' => ucfirst(strtolower($request->nama)),
        ]);

        return redirect()->back()->with('success', 'Data Pendidikan berhasil diubah');
    }

    public function destroy(Pendidikan $pendidikan)
    {
        $pendidikan->delete();
        return redirect()->back()->with('success', 'Data Pendidikan berhasil dihapus');
    }
}
