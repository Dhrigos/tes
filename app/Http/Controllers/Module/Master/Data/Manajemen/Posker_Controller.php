<?php

namespace App\Http\Controllers\Module\Master\Data\Manajemen;

use App\Http\Controllers\Controller;
use App\Models\Module\Master\Data\Manajemen\Posker;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;


class Posker_Controller extends Controller
{
    public function index()
    {
        $poskers = Posker::with('roles:id,name')->latest()->get();
        $roles = Role::select('id', 'name')->orderBy('name')->get();
        return Inertia::render('module/master/manajemen/posker/index', [
            'poskers' => $poskers,
            'roles' => $roles,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
            'role_ids' => 'array',
            'role_ids.*' => 'integer|exists:roles,id',
        ]);

        $exists = Posker::whereRaw('LOWER(nama) = ?', [strtolower($request->nama)])->exists();

        if ($exists) {
            return redirect()->back()->withErrors(['nama' => 'Posisi kerja sudah ada.']);
        }

        $posker = Posker::create([
            'nama' => ucfirst(strtolower($request->nama)), // seragamkan kapitalisasi
        ]);

        if ($request->filled('role_ids')) {
            $posker->roles()->sync($request->role_ids);
        }

        return redirect()->back()->with('success', 'Posisi kerja berhasil ditambahkan');
    }

    public function update(Request $request, Posker $posker)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
            'role_ids' => 'array',
            'role_ids.*' => 'integer|exists:roles,id',
        ]);

        $posker->update([
            'nama' => ucfirst(strtolower($request->nama)), // seragamkan kapitalisasi
        ]);

        $posker->roles()->sync($request->input('role_ids', []));

        return redirect()->back()->with('success', 'Posisi kerja berhasil diupdate');
    }

    public function destroy(Posker $posker)
    {
        $posker->delete();

        return redirect()->back()->with('success', 'Posisi kerja berhasil dihapus');
    }
}
