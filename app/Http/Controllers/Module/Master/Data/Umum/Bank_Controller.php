<?php

namespace App\Http\Controllers\Module\Master\Data\Umum;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Module\Master\Data\Umum\Bank;

class Bank_Controller extends Controller
{
    public function index()
    {
        $banks = Bank::all();
        return Inertia::render('module/master/umum/bank/index', [
            'banks' => $banks
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:255|unique:banks,nama',
        ]);

        $exists = Bank::whereRaw('LOWER(nama) = ?', [strtolower($request->nama)])->exists();

        if ($exists) {
            return redirect()->back()->withErrors(['nama' => 'Data Bank sudah ada.']);
        }

        Bank::create([
            'nama' => ucfirst(strtolower($request->nama)),
        ]);

        return redirect()->back()->with('success', 'Data Bank berhasil ditambahkan');
    }

    public function update(Request $request, Bank $bank)
    {
        $request->validate([
            'nama' => 'required|string|max:255|unique:banks,nama',
        ]);

        $exists = Bank::whereRaw('LOWER(nama) = ?', [strtolower($request->nama)])->exists();

        if ($exists) {
            return redirect()->back()->withErrors(['nama' => 'Data Bank sudah ada.']);
        }

        $bank->update([
            'nama' => ucfirst(strtolower($request->nama)),
        ]);

        return redirect()->back()->with('success', 'Data Bank berhasil diubah');
    }

    public function destroy(Bank $bank)
    {
        $bank->delete();
        return redirect()->back()->with('success', 'Data Bank berhasil dihapus');
    }
}
