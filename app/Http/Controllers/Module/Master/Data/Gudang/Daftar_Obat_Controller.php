<?php

namespace App\Http\Controllers\Module\Master\Data\Gudang;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Log;
use App\Models\Module\Master\Data\Gudang\Daftar_Obat;
use App\Models\Module\Master\Data\Gudang\Satuan_Barang;
use App\Models\Module\Master\Data\Gudang\Kategori_Barang;

class Daftar_Obat_Controller extends Controller
{
    public function index()
    {
        $daftarObat = Daftar_Obat::latest()->get();
        $satuanObats = Satuan_Barang::orderBy('nama')->get(['id', 'nama']);
        $kategoriBarangs = Kategori_Barang::orderBy('nama')->get(['id', 'nama']);
        return Inertia::render('module/master/gudang/daftar-obat/index', [
            'daftarObat' => $daftarObat,
            'satuanObats' => $satuanObats,
            'kategoriBarangs' => $kategoriBarangs,
        ]);
    }

    // JSON list for frontend selects
    public function list()
    {
        $items = Daftar_Obat::orderBy('nama')->get([
            'id',
            'kode',
            'nama',
            'nama_dagang',
            'satuan_kecil',
            'nilai_satuan_kecil',
            'satuan_besar',
            'nilai_satuan_besar',
        ]);
        return response()->json([
            'success' => true,
            'data' => $items,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
        ]);

        $data = $validated + $request->only([
            'kode',
            'jenis_formularium',
            'kfa_kode',
            'nama_industri',
            'nama_dagang',
            'merek',
            'satuan_kecil',
            'nilai_satuan_kecil',
            'satuan_sedang',
            'nilai_satuan_sedang',
            'satuan_besar',
            'nilai_satuan_besar',
            'penyimpanan',
            'barcode',
            'gudang_kategori',
            'jenis_obat',
            'jenis_generik',
            'bentuk_obat',
        ]);

        if (($data['jenis_generik'] ?? '') === 'Non-Generic') {
            $data['merek'] = '-';
        }

        $obat = Daftar_Obat::create($data);

        return Redirect::back()->with('success', 'Obat berhasil ditambahkan');
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
        ]);

        $obat = Daftar_Obat::findOrFail($id);

        $updateData = $validated + $request->only([
            'kode',
            'jenis_formularium',
            'kfa_kode',
            'nama_industri',
            'nama_dagang',
            'merek',
            'satuan_kecil',
            'nilai_satuan_kecil',
            'satuan_sedang',
            'nilai_satuan_sedang',
            'satuan_besar',
            'nilai_satuan_besar',
            'penyimpanan',
            'barcode',
            'gudang_kategori',
            'jenis_obat',
            'jenis_generik',
            'bentuk_obat',
        ]);

        if (($updateData['jenis_generik'] ?? '') === 'Non-Generic') {
            $updateData['merek'] = '-';
        }

        $obat->update($updateData);

        return Redirect::back()->with('success', 'Obat berhasil diperbarui');
    }

    public function destroy($id)
    {
        $obat = Daftar_Obat::findOrFail($id);
        $obat->delete();
        return Redirect::back()->with('success', 'Obat berhasil dihapus');
    }
}
