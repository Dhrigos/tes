<?php

namespace App\Http\Controllers\Module\Master\Data\Umum;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Module\Master\Data\Umum\Pekerjaan;

class Pekerjaan_Controller extends Controller
{
    public function index()
    {
        $pekerjaans = Pekerjaan::all();
        return Inertia::render('module/master/umum/pekerjaan/index', [
            'pekerjaans' => $pekerjaans
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);
        if (Pekerjaan::where('name', ucfirst(strtolower($request->name)))->exists()) {
            return redirect()->back()->with('error', 'Data Pekerjaan sudah ada');
        }
        Pekerjaan::create([
            'name' => ucfirst(strtolower($request->name)),
        ]);

        return redirect()->back()->with('success', 'Data Pekerjaan berhasil ditambahkan');
    }

    public function update(Request $request, Pekerjaan $pekerjaan)
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        if (Pekerjaan::where('name', ucfirst(strtolower($request->name)))->exists()) {
            return redirect()->back()->with('error', 'Data Pekerjaan sudah ada');
        }
        $pekerjaan->update([
            'name' => ucfirst(strtolower($request->name)),
        ]);

        return redirect()->back()->with('success', 'Data Pekerjaan berhasil diubah');
    }

    public function destroy(Pekerjaan $pekerjaan)
    {
        $pekerjaan->delete();
        return redirect()->back()->with('success', 'Data Pekerjaan berhasil dihapus');
    }   
}
