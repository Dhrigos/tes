<?php

namespace App\Http\Controllers\Module\Master\Data\Medis;

use App\Http\Controllers\Controller;
use App\Models\Module\Master\Data\Medis\Laboratorium_Sub_Bidang;
use App\Models\Module\Master\Data\Medis\Laboratorium_Bidang;
use Illuminate\Http\Request;
use Inertia\Inertia;

class Laboratorium_Sub_Bidang_Controller extends Controller
{
    public function index()
    {
        $laboratorium_sub_bidangs = Laboratorium_Sub_Bidang::with('laboratorium_bidang')->get();
        $laboratorium_bidangs = Laboratorium_Bidang::all();
        
        return Inertia::render('module/master/medis/laboratorium-sub-bidang/index', [
            'laboratorium_sub_bidangs' => $laboratorium_sub_bidangs,
            'laboratorium_bidangs' => $laboratorium_bidangs,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
            'id_laboratorium_bidang' => 'required|exists:laboratorium_bidangs,id',
        ]);
        
        Laboratorium_Sub_Bidang::create($request->all());
        return redirect()->back()->with('success', 'Data Sub Bidang Laboratorium berhasil ditambahkan');
    }

    public function update(Request $request, Laboratorium_Sub_Bidang $laboratoriumSubBidang)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
            'id_laboratorium_bidang' => 'required|exists:laboratorium_bidangs,id',
        ]);
        
        $laboratoriumSubBidang->update($request->all());
        return redirect()->back()->with('success', 'Data Sub Bidang Laboratorium berhasil diubah');
    }

    public function destroy(Laboratorium_Sub_Bidang $laboratoriumSubBidang)
    {
        $laboratoriumSubBidang->delete();
        return redirect()->back()->with('success', 'Data Sub Bidang Laboratorium berhasil dihapus');
    }

    public function getByBidang($bidangId)
    {
        $subbidangs = Laboratorium_Sub_Bidang::where('id_laboratorium_bidang', $bidangId)->get();
        return response()->json($subbidangs);
    }
}
