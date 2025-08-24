<?php

namespace App\Http\Controllers\Module\Master\Data\Gudang;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Module\Master\Data\Gudang\Supplier;
use Inertia\Inertia;

class Supplier_Controller extends Controller
{
    public function index()
    {
        $suppliers = Supplier::latest()->get();
        return Inertia::render('module/master/gudang/supplier/index', [
            'suppliers' => $suppliers
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'kode' => 'required|string|max:50',
            'nama' => 'required|string|max:255',
            'nama_pic' => 'nullable|string|max:255',
            'telepon_pic' => 'nullable|string|max:50',
        ]);

        Supplier::create($request->all());

        return redirect()->back()->with('success', 'Data Supplier berhasil ditambahkan');
    }

    public function update(Request $request, Supplier $supplier)
    {
        $request->validate([
            'kode' => 'required|string|max:50',
            'nama' => 'required|string|max:255',
            'nama_pic' => 'nullable|string|max:255',
            'telepon_pic' => 'nullable|string|max:50',
        ]);

        $supplier->update($request->all());

        return redirect()->back()->with('success', 'Data Supplier berhasil diupdate');
    }

    public function destroy(Supplier $supplier)
    {
        $supplier->delete();

        return redirect()->back()->with('success', 'Data Supplier berhasil dihapus');
    }
}
