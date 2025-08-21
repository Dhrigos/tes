<?php

namespace App\Http\Controllers\Module\Master\Data\Medis;

use App\Http\Controllers\Controller;
use App\Models\Module\Master\Data\Medis\Makanan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class Makanan_Controller extends Controller
{
    public function index()
    {
        $nama_makanans = Makanan::all();
        return Inertia::render('module/master/medis/nama-makanan/index', [
            'nama_makanans' => $nama_makanans,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
        ]);
        Makanan::create($request->all());
        return redirect()->back()->with('success', 'Data Makanan berhasil ditambahkan');
    }

    public function update(Request $request, Makanan $makanan)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
        ]);
        $makanan->update($request->all());
        return redirect()->back()->with('success', 'Data Makanan berhasil diubah');
    }

    public function destroy(Makanan $makanan)
    {
        $makanan->delete();
        return redirect()->back()->with('success', 'Data Makanan berhasil dihapus');
    }

}
