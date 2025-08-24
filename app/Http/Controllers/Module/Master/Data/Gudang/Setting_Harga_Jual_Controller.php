<?php

namespace App\Http\Controllers\Module\Master\Data\Gudang;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Module\Master\Data\Gudang\Setting_Harga_Jual;
use Inertia\Inertia;

class Setting_Harga_Jual_Controller extends Controller
{
    public function index()
    {
        $settingHargaJual = Setting_Harga_Jual::all();
        return Inertia::render('Module/Master/Data/Gudang/SettingHargaJual/Index', [
            'settingHargaJual' => $settingHargaJual
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'harga_jual_1' => 'required|numeric',
            'harga_jual_2' => 'required|numeric',
            'harga_jual_3' => 'required|numeric',
            'embalase_poin' => 'required|numeric',
            'user_input_id' => 'required|integer',
            'user_input_name' => 'required|string|max:255'
        ]);

        Setting_Harga_Jual::create($request->all());

        return redirect()->back()->with('success', 'Data Harga Jual berhasil ditambahkan');
    }

    public function update(Request $request, Setting_Harga_Jual $settingHargaJual)
    {
        $request->validate([
            'harga_jual_1' => 'required|numeric',
            'harga_jual_2' => 'required|numeric',
            'harga_jual_3' => 'required|numeric',
            'embalase_poin' => 'required|numeric',
            'user_input_id' => 'required|integer',
            'user_input_name' => 'required|string|max:255'
        ]);

        $settingHargaJual->update($request->all());

        return redirect()->back()->with('success', 'Data Harga Jual berhasil diupdate');
    }

    public function destroy(Setting_Harga_Jual $settingHargaJual)
    {
        $settingHargaJual->delete();

        return redirect()->back()->with('success', 'Data Harga Jual berhasil dihapus');
    }
}
