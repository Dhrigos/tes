<?php

namespace App\Http\Controllers\Module\Master\Data\Umum;

use App\Http\Controllers\Controller;
use App\Models\Module\Master\Data\Umum\Pernikahan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class Pernikahan_Controller extends Controller
{
    public function index()
    {
        $pernikahans = Pernikahan::all();
        return Inertia::render('module/master/umum/pernikahan/index', [
            'pernikahans' => $pernikahans
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:255|unique:pernikahans,nama',
        ]);

        Pernikahan::create([
            'nama' => ucfirst(strtolower($request->nama)),
        ]);

        return redirect()->back()->with('success', 'Data Pernikahan berhasil ditambahkan');
    }

    public function update(Request $request, Pernikahan $pernikahan)
    {
        $request->validate([
            'nama' => 'required|string|max:255|unique:pernikahans,nama,' . $pernikahan->id,
        ]);

        $pernikahan->update([
            'nama' => ucfirst(strtolower($request->nama)),
        ]);

        return redirect()->back()->with('success', 'Data Pernikahan berhasil diubah');
    }

    public function destroy(Pernikahan $pernikahan)
    {
        $pernikahan->delete();
        return redirect()->back()->with('success', 'Data Pernikahan berhasil dihapus');
    }
}
