<?php

namespace App\Http\Controllers\Module\Master\Data\Gudang;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Module\Master\Data\Gudang\Satuan_Inventaris;
use Inertia\Inertia;

class Satuan_Inventaris_Controller extends Controller
{
    public function index()
    {
        $satuanInventaris = Satuan_Inventaris::all();
        return Inertia::render('module/master/gudang/satuan-inventaris/index', [
            'satuanInventaris' => $satuanInventaris,
        ]);
    }

    public function create()
    {
        return Inertia::render('Module/Master/Data/Gudang/SatuanInventaris/Create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
        ]);

        $exists = Satuan_Inventaris::whereRaw('LOWER(nama) = ?', [strtolower($request->nama)])->exists();

        if ($exists) {
            return redirect()->back()->withErrors(['nama' => 'Data Satuan Inventaris sudah ada.']);
        }

        Satuan_Inventaris::create([
            'nama' => ucfirst(strtolower($request->nama)), // seragamkan kapitalisasi
        ]);

        return redirect()->back()->with('success', 'Data Satuan Inventaris berhasil ditambahkan');
    }

    public function edit(Satuan_Inventaris $satuanInventaris)
    {
        return Inertia::render('Module/Master/Data/Gudang/SatuanInventaris/Edit', [
            'satuanInventaris' => $satuanInventaris,
        ]);
    }

    public function update(Request $request, Satuan_Inventaris $satuanInventaris)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
        ]);

        $satuanInventaris->update($request->all());

        return redirect()->back()->with('success', 'Data Satuan Inventaris berhasil diupdate');
    }

    public function destroy(Satuan_Inventaris $satuanInventaris)
    {
        $satuanInventaris->delete();

        return redirect()->back()->with('success', 'Data Satuan Inventaris berhasil dihapus');
    }
}
