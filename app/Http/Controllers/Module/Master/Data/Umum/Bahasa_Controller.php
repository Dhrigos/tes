<?php

namespace App\Http\Controllers\Module\Master\Data\Umum;

use App\Http\Controllers\Controller;
use App\Models\Module\Master\Data\Umum\Bahasa;
use Illuminate\Http\Request;
use Inertia\Inertia;
class Bahasa_Controller extends Controller
{
    public function index()
    {
        $bahasas = Bahasa::all();

        return Inertia::render('module/master/umum/bahasa/index', [
            'bahasas' => $bahasas,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:255|unique:bahasas,nama',
        ]);

        $exists = Bahasa::whereRaw('LOWER(nama) = ?', [strtolower($request->nama)])->exists();

        if ($exists) {
            return redirect()->back()->withErrors(['nama' => 'Data Bahasa sudah ada.']);
        }

        Bahasa::create([
            'nama' => ucfirst(strtolower($request->nama)),
        ]);

        return redirect()->back()->with('success', 'Data Bahasa berhasil ditambahkan');
    }

    public function update(Request $request, Bahasa $bahasa)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
        ]);

        $exists = Bahasa::whereRaw('LOWER(nama) = ?', [strtolower($request->nama)])->exists();

        if ($exists) {
            return redirect()->back()->withErrors(['nama' => 'Data Bahasa sudah ada.']);
        }

        $bahasa->update([
            'nama' => ucfirst(strtolower($request->nama)),
        ]);

        return redirect()->back()->with('success', 'Data Bahasa berhasil diubah');
    }

    public function destroy(Bahasa $bahasa)
    {
        $bahasa->delete();
        return redirect()->back()->with('success', 'Data Bahasa berhasil dihapus');
    }
}
