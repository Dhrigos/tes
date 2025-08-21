<?php

namespace App\Http\Controllers\Module\Master\Data\Medis;

use App\Http\Controllers\Controller;
use App\Models\Module\Master\Data\Medis\Laboratorium_Bidang;
use Illuminate\Http\Request;
use Inertia\Inertia;

class Laboratorium_Bidang_Controller extends Controller
{
    public function index()
    {
        $laboratorium_bidangs = Laboratorium_Bidang::with('laboratorium_sub_bidangs')->get();
        return Inertia::render('module/master/medis/laboratorium-bidang/index', [
            'laboratorium_bidangs' => $laboratorium_bidangs,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
        ]);
        Laboratorium_Bidang::create($request->all());
        return redirect()->back()->with('success', 'Data Laboratorium Bidang berhasil ditambahkan');
    }

    public function update(Request $request, Laboratorium_Bidang $laboratoriumBidang)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
        ]);
        $laboratoriumBidang->update($request->all());
        return redirect()->back()->with('success', 'Data Laboratorium Bidang berhasil diubah');
    }

    public function destroy(Laboratorium_Bidang $laboratoriumBidang)
    {
        $laboratoriumBidang->delete();
        return redirect()->back()->with('success', 'Data Laboratorium Bidang berhasil dihapus');
    }

    public function getSubBidang($bidangId)
    {
        $bidang = Laboratorium_Bidang::with('laboratorium_sub_bidangs')->findOrFail($bidangId);
        return response()->json($bidang->laboratorium_sub_bidangs);
    }
}
