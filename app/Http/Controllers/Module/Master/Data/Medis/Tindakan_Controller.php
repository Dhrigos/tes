<?php

namespace App\Http\Controllers\Module\Master\Data\Medis;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Module\Master\Data\Medis\Tindakan;

class Tindakan_Controller extends Controller
{
    public function index()
    {
        $tindakans = Tindakan::all();
        return Inertia::render('module/master/medis/tindakan/index', [
            'tindakans' => $tindakans
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'kode' => 'required|string|max:255',
            'nama' => 'required|string|max:255',
            'kategori' => 'required|string|max:255',
            'tarif_dokter' => 'required|string|max:255',
            'tarif_perawat' => 'required|string|max:255',
            'tarif_total' => 'required|string|max:255',
        ]);
        Tindakan::create($request->all());
        return redirect()->back()->with('success', 'Data tindakan berhasil ditambahkan');
    }

    public function update(Request $request, Tindakan $tindakan)
    {
        $request->validate([
            'kode' => 'required|string|max:255',
            'nama' => 'required|string|max:255',
            'kategori' => 'required|string|max:255',
            'tarif_dokter' => 'required|string|max:255',
            'tarif_perawat' => 'required|string|max:255',
            'tarif_total' => 'required|string|max:255',
        ]);
        $tindakan->update($request->all());
        return redirect()->back()->with('success', 'Data tindakan berhasil diubah');
    }

    public function destroy(Tindakan $tindakan)
    {
        $tindakan->delete();
        return redirect()->back()->with('success', 'Data tindakan berhasil dihapus');
    }
}
