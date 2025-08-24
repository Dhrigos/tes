<?php

namespace App\Http\Controllers\Module\Master\Data\Medis;

use App\Http\Controllers\Controller;
use App\Models\Module\Master\Data\Medis\Htt_Subpemeriksaan;
use App\Models\Module\Master\Data\Medis\Htt_Pemeriksaan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class Htt_Subpemeriksaan_Controller extends Controller
{
    public function index()
    {
        $htt_subpemeriksaans = Htt_Subpemeriksaan::with('htt_pemeriksaan')->get();
        $htt_pemeriksaans = Htt_Pemeriksaan::all();
        
        return Inertia::render('module/master/medis/htt-subpemeriksaan/index', [
            'htt_subpemeriksaans' => $htt_subpemeriksaans,
            'htt_pemeriksaans' => $htt_pemeriksaans,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
            'id_htt_pemeriksaan' => 'required|exists:htt_pemeriksaans,id',
        ]);
        
        Htt_Subpemeriksaan::create($request->all());
        return redirect()->back()->with('success', 'Data Sub Pemeriksaan berhasil ditambahkan');
    }

    public function update(Request $request, Htt_Subpemeriksaan $httSubpemeriksaan)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
            'id_htt_pemeriksaan' => 'required|exists:htt_pemeriksaans,id',
        ]);
        
        $httSubpemeriksaan->update($request->all());
        return redirect()->back()->with('success', 'Data Sub Pemeriksaan berhasil diubah');
    }

    public function destroy(Htt_Subpemeriksaan $httSubpemeriksaan)
    {
        $httSubpemeriksaan->delete();
        return redirect()->back()->with('success', 'Data Sub Pemeriksaan berhasil dihapus');
    }

    public function getByPemeriksaan($pemeriksaanId)
    {
        $subpemeriksaans = Htt_Subpemeriksaan::where('id_htt_pemeriksaan', $pemeriksaanId)->get();
        return response()->json($subpemeriksaans);
    }
}
