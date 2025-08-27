<?php

namespace App\Http\Controllers\Module\Master\Data\Gudang;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Module\Master\Data\Gudang\Harga_Jual_Utama;
use App\Models\Module\Master\Data\Gudang\Setting_Harga_Jual;
use Inertia\Inertia;

class Harga_Jual_Utama_Controller extends Controller
{
    public function index()
    {
        $hargaJualUtamas = Harga_Jual_Utama::latest()->get();
        return Inertia::render('module/master/gudang/harga-jual-utama/index', [
            'hargaJualUtamas' => $hargaJualUtamas
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama_template' => 'required|string|max:255',
            'harga_jual_1' => 'required|string',
            'harga_jual_2' => 'required|string',
            'harga_jual_3' => 'required|string',
            'embalase_poin' => 'required|string',
            'deskripsi' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $hargaJualUtama = Harga_Jual_Utama::create($request->all());

        // Auto sync ke Setting Harga Jual jika ini adalah template aktif
        if ($request->is_active) {
            $this->syncToSettingHargaJual($hargaJualUtama);

            // Set semua template lain menjadi tidak aktif
            Harga_Jual_Utama::where('id', '!=', $hargaJualUtama->id)
                ->update(['is_active' => false]);
        }

        return redirect()->back()->with('success', 'Harga Jual Utama berhasil ditambahkan');
    }

    public function update(Request $request, Harga_Jual_Utama $hargaJualUtama)
    {
        $request->validate([
            'nama_template' => 'required|string|max:255',
            'harga_jual_1' => 'required|string',
            'harga_jual_2' => 'required|string',
            'harga_jual_3' => 'required|string',
            'embalase_poin' => 'required|string',
            'deskripsi' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $hargaJualUtama->update($request->all());

        // Auto sync ke Setting Harga Jual jika ini adalah template aktif
        if ($request->is_active) {
            $this->syncToSettingHargaJual($hargaJualUtama);

            // Set semua template lain menjadi tidak aktif
            Harga_Jual_Utama::where('id', '!=', $hargaJualUtama->id)
                ->update(['is_active' => false]);
        }

        return redirect()->back()->with('success', 'Harga Jual Utama berhasil diupdate');
    }

    public function destroy(Harga_Jual_Utama $hargaJualUtama)
    {
        $hargaJualUtama->delete();

        return redirect()->back()->with('success', 'Harga Jual Utama berhasil dihapus');
    }

    public function activate(Harga_Jual_Utama $hargaJualUtama)
    {
        // Set semua template menjadi tidak aktif
        Harga_Jual_Utama::query()->update(['is_active' => false]);

        // Set template ini menjadi aktif
        $hargaJualUtama->update(['is_active' => true]);

        // Sync ke Setting Harga Jual
        $this->syncToSettingHargaJual($hargaJualUtama);

        return redirect()->back()->with('success', 'Template berhasil diaktifkan dan disinkronisasi');
    }

    private function syncToSettingHargaJual(Harga_Jual_Utama $hargaJualUtama)
    {
        // Cari atau buat Setting Harga Jual
        $settingHargaJual = Setting_Harga_Jual::first();

        if ($settingHargaJual) {
            $settingHargaJual->update([
                'harga_jual_1' => $hargaJualUtama->harga_jual_1,
                'harga_jual_2' => $hargaJualUtama->harga_jual_2,
                'harga_jual_3' => $hargaJualUtama->harga_jual_3,
                'embalase_poin' => $hargaJualUtama->embalase_poin,
            ]);
        } else {
            Setting_Harga_Jual::create([
                'harga_jual_1' => $hargaJualUtama->harga_jual_1,
                'harga_jual_2' => $hargaJualUtama->harga_jual_2,
                'harga_jual_3' => $hargaJualUtama->harga_jual_3,
                'embalase_poin' => $hargaJualUtama->embalase_poin,
            ]);
        }
    }
}
