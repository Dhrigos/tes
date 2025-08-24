<?php

namespace App\Http\Controllers\Module\Master\Data\Medis;

use App\Http\Controllers\Controller;
use App\Models\Module\Master\Data\Medis\Jenis_Diet;
use Illuminate\Http\Request;
use Inertia\Inertia;

class Jenis_Diet_Controller extends Controller
{
    public function index()
    {
        $jenis_diets = Jenis_Diet::all();
        return Inertia::render('module/master/medis/jenis-diet/index', [
            'jenis_diets' => $jenis_diets,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
        ]);
        Jenis_Diet::create($request->all());
        return redirect()->back()->with('success', 'Data Jenis Diet berhasil ditambahkan');
    }

    public function update(Request $request, Jenis_Diet $jenisDiet)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
        ]);
        $jenisDiet->update($request->all());
        return redirect()->back()->with('success', 'Data Jenis Diet berhasil diubah');
    }

    public function destroy(Jenis_Diet $jenisDiet)
    {
        $jenisDiet->delete();
        return redirect()->back()->with('success', 'Data Jenis Diet berhasil dihapus');
    }
}
