<?php

namespace App\Http\Controllers\Module\Master\Data\Gudang;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Module\Master\Data\Gudang\Setting_Harga_Jual_Utama;
use Inertia\Inertia;

class Setting_Harga_Jual_Utama_Controller extends Controller
{
    public function index()
    {
        $settingHargaJualUtama = Setting_Harga_Jual_Utama::first();
        $lastUpdated = Setting_Harga_Jual_Utama::latest('updated_at')->first()?->updated_at;

        return Inertia::render('module/master/gudang/setting-harga-jual-utama/index', [
            'settingHargaJualUtama' => $settingHargaJualUtama,
            'lastUpdated' => $lastUpdated ? $lastUpdated->format('d/m/Y H:i:s') : null
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'harga_jual_1' => 'required|string',
            'harga_jual_2' => 'required|string',
            'harga_jual_3' => 'required|string',
            'setting_waktu' => 'nullable|string',
            'satuan_waktu' => 'nullable|string',
        ]);

        // Update atau create - hanya boleh ada 1 record setting utama
        Setting_Harga_Jual_Utama::updateOrCreate(
            ['id' => 1],
            [
                'harga_jual_1' => $request->harga_jual_1,
                'harga_jual_2' => $request->harga_jual_2,
                'harga_jual_3' => $request->harga_jual_3,
                'setting_waktu' => $request->setting_waktu,
                'satuan_waktu' => $request->satuan_waktu,
            ]
        );

        return redirect()->back()->with('success', 'Setting Harga Jual Utama berhasil disimpan');
    }

    public function update(Request $request, Setting_Harga_Jual_Utama $settingHargaJualUtama)
    {
        $request->validate([
            'harga_jual_1' => 'required|string',
            'harga_jual_2' => 'required|string',
            'harga_jual_3' => 'required|string',
            'setting_waktu' => 'nullable|string',
            'satuan_waktu' => 'nullable|string',
        ]);

        $settingHargaJualUtama->update([
            'harga_jual_1' => $request->harga_jual_1,
            'harga_jual_2' => $request->harga_jual_2,
            'harga_jual_3' => $request->harga_jual_3,
            'setting_waktu' => $request->setting_waktu,
            'satuan_waktu' => $request->satuan_waktu,
        ]);

        return redirect()->back()->with('success', 'Setting Harga Jual Utama berhasil diupdate');
    }

    public function destroy(Setting_Harga_Jual_Utama $settingHargaJualUtama)
    {
        $settingHargaJualUtama->delete();

        return redirect()->back()->with('success', 'Setting Harga Jual Utama berhasil dihapus');
    }
}
