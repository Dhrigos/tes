<?php

namespace App\Http\Controllers\Module\Master\Data\Medis;

use App\Http\Controllers\Controller;
use App\Models\Module\Master\Data\Medis\Htt_Pemeriksaan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class Htt_Pemeriksaan_Controller extends Controller
{
    public function index()
    {
        $htt_pemeriksaans = Htt_Pemeriksaan::with('htt_subpemeriksaans')->get();
        return Inertia::render('module/master/medis/htt-pemeriksaan/index', [
            'htt_pemeriksaans' => $htt_pemeriksaans,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama_pemeriksaan' => 'required|string|max:255',
        ]);
        Htt_Pemeriksaan::create($request->all());
        return redirect()->back()->with('success', 'Data Head To Toe Pemeriksaan berhasil ditambahkan');
    }

    public function update(Request $request, Htt_Pemeriksaan $httPemeriksaan)
    {
        $request->validate([
            'nama_pemeriksaan' => 'required|string|max:255',
        ]);
        $httPemeriksaan->update($request->all());
        return redirect()->back()->with('success', 'Data Head To Toe Pemeriksaan berhasil diubah');
    }

    public function destroy(Htt_Pemeriksaan $httPemeriksaan)
    {
        $httPemeriksaan->delete();
        return redirect()->back()->with('success', 'Data Head To Toe Pemeriksaan berhasil dihapus');
    }

    public function getSubpemeriksaan($pemeriksaanId)
    {
        $pemeriksaan = Htt_Pemeriksaan::with('htt_subpemeriksaans')->findOrFail($pemeriksaanId);
        return response()->json($pemeriksaan->htt_subpemeriksaans);
    }
}
