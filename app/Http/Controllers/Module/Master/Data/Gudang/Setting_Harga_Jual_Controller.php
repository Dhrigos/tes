<?php

namespace App\Http\Controllers\Module\Master\Data\Gudang;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Module\Master\Data\Gudang\Setting_Harga_Jual;
use App\Models\Module\Master\Data\Gudang\Setting_Harga_Jual_Utama;

class Setting_Harga_Jual_Controller extends Controller
{
    // Method untuk API dialog - mengembalikan data untuk dialog
    public function getSettings()
    {
        try {


            $settingHargaJual = Setting_Harga_Jual::first();
            $settingHargaJualUtama = Setting_Harga_Jual_Utama::first();


            return response()->json([
                'success' => true,
                'settingHargaJual' => $settingHargaJual,
                'settingHargaJualUtama' => $settingHargaJualUtama,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get settings',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $request->validate([
                'harga_jual_1' => 'required|string',
                'harga_jual_2' => 'required|string',
                'harga_jual_3' => 'required|string',
                'embalase_poin' => 'required|string',
            ]);

            // Update atau create - hanya boleh ada 1 record setting per klinik
            Setting_Harga_Jual::updateOrCreate(
                ['id' => 1], // Selalu gunakan ID 1 untuk setting klinik
                [
                    'harga_jual_1' => $request->harga_jual_1,
                    'harga_jual_2' => $request->harga_jual_2,
                    'harga_jual_3' => $request->harga_jual_3,
                    'embalase_poin' => $request->embalase_poin,
                ]
            );

            return response()->json(['message' => 'Setting Harga Jual berhasil disimpan']);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to save settings',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function storeUtama(Request $request)
    {
        try {
            // Debug request data


            $validated = $request->validate([
                'harga_jual_1' => 'required|string',
                'harga_jual_2' => 'required|string',
                'harga_jual_3' => 'required|string',
            ]);



            // Update atau create - hanya boleh ada 1 record setting utama
            $resultUtama = Setting_Harga_Jual_Utama::updateOrCreate(
                ['id' => 1], // Selalu gunakan ID 1 untuk setting utama
                [
                    'nama_template' => 'Setting Utama',
                    'harga_jual_1' => $request->harga_jual_1,
                    'harga_jual_2' => $request->harga_jual_2,
                    'harga_jual_3' => $request->harga_jual_3,
                    'embalase_poin' => '0',
                    'deskripsi' => 'Setting harga jual dari gudang utama',
                    'is_active' => true,
                ]
            );



            // SYNC: Update Setting Harga Jual (per klinik) dengan harga dari utama
            // Ambil embalase_poin yang sudah ada, jangan overwrite
            $currentKlinik = Setting_Harga_Jual::first();
            $currentEmbalase = $currentKlinik ? $currentKlinik->embalase_poin : '0';

            $resultKlinik = Setting_Harga_Jual::updateOrCreate(
                ['id' => 1], // Selalu gunakan ID 1 untuk setting klinik
                [
                    'harga_jual_1' => $request->harga_jual_1, // Sync dari utama
                    'harga_jual_2' => $request->harga_jual_2, // Sync dari utama
                    'harga_jual_3' => $request->harga_jual_3, // Sync dari utama
                    'embalase_poin' => $currentEmbalase, // Tetap gunakan nilai yang sudah ada
                ]
            );



            return response()->json([
                'success' => true,
                'message' => 'Setting Harga Jual Utama berhasil disimpan dan disinkronkan',
                'data' => [
                    'utama' => $resultUtama,
                    'klinik' => $resultKlinik
                ]
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {

            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'message' => $e->getMessage(),
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {

            return response()->json([
                'success' => false,
                'error' => 'Failed to save settings utama',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, Setting_Harga_Jual $settingHargaJual)
    {
        $request->validate([
            'harga_jual_1' => 'required|numeric',
            'harga_jual_2' => 'required|numeric',
            'harga_jual_3' => 'required|numeric',
            'embalase_poin' => 'required|numeric',
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
