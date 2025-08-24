<?php

namespace App\Http\Controllers\Module\Master\Data\Manajemen;

use App\Http\Controllers\Controller;
use App\Models\Module\Master\Data\Manajemen\Posker;
use Illuminate\Http\Request;
use Inertia\Inertia;


class Posker_Controller extends Controller
{
    public function index()
    {
        $poskers = Posker::latest()->get();
        return Inertia::render('module/master/manajemen/posker/index', [
            'poskers' => $poskers
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
        ]);

        $exists = Posker::whereRaw('LOWER(nama) = ?', [strtolower($request->nama)])->exists();

        if ($exists) {
            return redirect()->back()->withErrors(['nama' => 'Posisi kerja sudah ada.']);
        }

        Posker::create([
            'nama' => ucfirst(strtolower($request->nama)), // seragamkan kapitalisasi
        ]);

        return redirect()->back()->with('success', 'Posisi kerja berhasil ditambahkan');

    }

    public function update(Request $request, Posker $posker)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
        ]);

        $posker->update([
            'nama' => ucfirst(strtolower($request->nama)), // seragamkan kapitalisasi
        ]);

        return redirect()->back()->with('success', 'Posisi kerja berhasil diupdate');
    }

    public function destroy(Posker $posker)
    {
        $posker->delete();

        return redirect()->back()->with('success', 'Posisi kerja berhasil dihapus');
    }
}
