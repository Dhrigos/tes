<?php

namespace App\Http\Controllers\Module\Master\Data\Umum;

use App\Http\Controllers\Controller;
use App\Models\Module\Master\Data\Umum\Asuransi;
use Illuminate\Http\Request;
use Inertia\Inertia;

class Asuransi_Controller extends Controller
{
    public function index()
    {
        $asuransis = Asuransi::latest()->get();
        return Inertia::render('module/master/umum/asuransi/index', [
            'asuransis' => $asuransis
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:255|unique:asuransis,nama',
        ]);

        $exists = Asuransi::whereRaw('LOWER(nama) = ?', [strtolower($request->nama)])->exists();

        if ($exists) {
            return redirect()->back()->withErrors(['nama' => 'Data Asuransi sudah ada.']);
        }

        Asuransi::create([
            'nama' => ucfirst(strtolower($request->nama)),
        ]);

        return redirect()->back()->with('success', 'Data Asuransi berhasil ditambahkan');
    }

    public function update(Request $request, Asuransi $asuransi)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
        ]);

        $asuransi->update($request->all());
        $asuransi->nama = ucfirst(strtolower($asuransi->nama));
        $asuransi->save();

        return redirect()->back()->with('success', 'Data Asuransi berhasil diupdate');
    }

    public function destroy(Asuransi $asuransi)
    {
        $asuransi->delete();

        return redirect()->back()->with('success', 'Data Asuransi berhasil dihapus');
    }
}
