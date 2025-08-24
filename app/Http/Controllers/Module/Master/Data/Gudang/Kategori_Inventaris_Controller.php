<?php

namespace App\Http\Controllers\Module\Master\Data\Gudang;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Module\Master\Data\Gudang\Kategori_Inventaris;
use Inertia\Inertia;

class Kategori_Inventaris_Controller extends Controller
{
    public function index()
    {
        $kategoriInventaris = Kategori_Inventaris::all();
        return Inertia::render('module/master/gudang/kategori-inventaris/index', [
            'kategoriInventaris' => $kategoriInventaris,
        ]);
    }

    public function create()
    {
        return Inertia::render('Module/Master/Data/Gudang/KategoriInventaris/Create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
        ]);

        Kategori_Inventaris::create($request->all());

        return redirect()->back()->with('success', 'Data Kategori Inventaris berhasil diupdate');
    }

    public function edit(Kategori_Inventaris $kategoriInventaris)
    {
        return Inertia::render('Module/Master/Data/Gudang/KategoriInventaris/Edit', [
            'kategoriInventaris' => $kategoriInventaris,
        ]);
    }

    public function update(Request $request, Kategori_Inventaris $kategoriInventaris)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
        ]);

        $kategoriInventaris->update($request->all());

        return redirect()->back()->with('success', 'Data Kategori Inventaris berhasil diupdate');
    }

    public function destroy(Kategori_Inventaris $kategoriInventaris)
    {
        $kategoriInventaris->delete();

        return redirect()->back()->with('success', 'Data Kategori Inventaris berhasil dihapus');
    }
}
