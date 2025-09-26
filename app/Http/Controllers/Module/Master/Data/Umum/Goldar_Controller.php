<?php

namespace App\Http\Controllers\Module\Master\Data\Umum;

use App\Http\Controllers\Controller;
use App\Models\Module\Master\Data\Umum\Goldar;
use Illuminate\Http\Request;
use Inertia\Inertia;

class Goldar_Controller extends Controller
{
    public function index()
    {
        $goldars = Goldar::all();
        return Inertia::render('module/master/umum/golongan-darah/index', [
            'goldars' => $goldars
        ]);
    }
    public function store(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
            'rhesus' => 'required|string|max:255',
        ]);

        $exists = Goldar::whereRaw('LOWER(nama) = ? AND LOWER(rhesus) = ?', [
            strtolower($request->nama),
            strtolower($request->rhesus)
        ])->exists();

        if ($exists) {
            return redirect()->back()->withErrors(['nama' => 'Kombinasi Golongan Darah dan Rhesus sudah ada.']);
        }

        Goldar::create([
            'nama' => ucfirst(strtolower($request->nama)),
            'rhesus' => $request->rhesus,
        ]);

        return redirect()->back()->with('success', 'Golongan Darah berhasil ditambahkan');
    }

    public function update(Request $request, Goldar $goldar)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
            'rhesus' => 'required|string|max:255',
        ]);

        // Cek apakah kombinasi nama + rhesus sudah ada (kecuali untuk data yang sedang diedit)
        $exists = Goldar::whereRaw('LOWER(nama) = ? AND LOWER(rhesus) = ?', [
            strtolower($request->nama),
            strtolower($request->rhesus)
        ])->where('id', '!=', $goldar->id)->exists();

        if ($exists) {
            return redirect()->back()->withErrors(['nama' => 'Kombinasi Golongan Darah dan Rhesus sudah ada.']);
        }

        $goldar->update([
            'nama' => ucfirst(strtolower($request->nama)),
            'rhesus' => $request->rhesus,
        ]);

        return redirect()->back()->with('success', 'Golongan Darah berhasil diupdate');
    }

    public function destroy(Goldar $goldar)
    {
        $goldar->delete();

        return redirect()->back()->with('success', 'Golongan Darah berhasil dihapus');
    }
}
