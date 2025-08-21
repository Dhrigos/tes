<?php

namespace App\Http\Controllers\Module\Master\Data\Umum;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Module\Master\Data\Umum\Pendidikan;

class Pendidikan_Controller extends Controller
{
    public function index()
    {
        $pendidikans = Pendidikan::all();
        return Inertia::render('module/master/umum/pendidikan/index', [
            'pendidikans' => $pendidikans
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
            'singkatan' => 'nullable|string|max:50',
            'level' => 'nullable|string|max:100',
        ]);

        Pendidikan::create($request->only(['nama', 'singkatan', 'level']));

        return redirect()->back()->with('success', 'Pendidikan berhasil ditambahkan.');
    }

    public function update(Request $request, Pendidikan $pendidikan)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
            'singkatan' => 'nullable|string|max:50',
            'level' => 'nullable|string|max:100',
        ]);

        $pendidikan->update($request->only(['nama', 'singkatan', 'level']));

        return redirect()->back()->with('success', 'Pendidikan berhasil diperbarui.');
    }

    public function destroy(Pendidikan $pendidikan)
    {
        $pendidikan->delete();

        return redirect()->back()->with('success', 'Pendidikan berhasil dihapus.');
    }
}
