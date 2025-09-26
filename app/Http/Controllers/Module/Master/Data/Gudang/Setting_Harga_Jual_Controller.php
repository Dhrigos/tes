<?php

namespace App\Http\Controllers\Module\Master\Data\Gudang;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Module\Master\Data\Gudang\Setting_Harga_Jual;
use App\Models\Module\Master\Data\Gudang\Setting_Harga_Jual_Utama;
use Illuminate\Support\Facades\DB;

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

    // Method untuk sinkronisasi manual - hanya sync harga jual, tidak embalase
    // Method untuk sinkronisasi manual - hanya sync harga jual, tidak embalase
    public function syncFromUtama()
    {
        try {
            $settingUtama = Setting_Harga_Jual_Utama::first();

            if (!$settingUtama) {
                return response()->json([
                    'success' => false,
                    'message' => 'Setting Harga Jual Utama belum ada. Silakan atur terlebih dahulu di Gudang Utama.'
                ], 404);
            }

            // Ambil embalase_poin yang sudah ada, jangan overwrite
            $currentKlinik = Setting_Harga_Jual::first();
            $currentEmbalase = $currentKlinik ? $currentKlinik->embalase_poin : '0';

            // Hanya update record yang ada - pastikan hanya ada 1 record setting
            if ($currentKlinik) {
                $currentKlinik->update([
                    'harga_jual_1' => $settingUtama->harga_jual_1,
                    'harga_jual_2' => $settingUtama->harga_jual_2,
                    'harga_jual_3' => $settingUtama->harga_jual_3,
                    'embalase_poin' => $currentEmbalase, // Tetap gunakan embalase yang sudah ada
                    'setting_waktu' => $settingUtama->setting_waktu,
                    'satuan_waktu'  => $settingUtama->satuan_waktu,
                ]);
                $result = $currentKlinik;
            } else {
                // Jika belum ada record, buat baru (hanya untuk kasus pertama kali)
                $result = Setting_Harga_Jual::create([
                    'harga_jual_1' => $settingUtama->harga_jual_1,
                    'harga_jual_2' => $settingUtama->harga_jual_2,
                    'harga_jual_3' => $settingUtama->harga_jual_3,
                    'embalase_poin' => $currentEmbalase, // Tetap gunakan embalase yang sudah ada
                    'setting_waktu' => $settingUtama->setting_waktu,
                    'satuan_waktu'  => $settingUtama->satuan_waktu,
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Data harga jual berhasil disinkronkan dari Gudang Utama',
                'settingHargaJual' => $result,
                'settingHargaJualUtama' => $settingUtama,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal melakukan sinkronisasi: ' . $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $request->validate([
                'harga_jual_1'  => 'required|string',
                'harga_jual_2'  => 'required|string',
                'harga_jual_3'  => 'required|string',
                'embalase_poin' => 'required|string',
                'setting_waktu' => 'nullable|string',
                'satuan_waktu'  => 'nullable|string',
            ], [
                'harga_jual_1'  => 'Harga Jual 1',
                'harga_jual_2'  => 'Harga Jual 2',
                'harga_jual_3'  => 'Harga Jual 3',
                'embalase_poin' => 'Embalase Poin',
                'setting_waktu' => 'Setting Waktu',
                'satuan_waktu'  => 'Satuan Waktu',
            ]);

            // Bersihkan prefix atau simbol dari input agar hanya angka saja
            $harga_jual_1  = preg_replace('/[^\d]/', '', $request->input('harga_jual_1'));
            $harga_jual_2  = preg_replace('/[^\d]/', '', $request->input('harga_jual_2'));
            $harga_jual_3  = preg_replace('/[^\d]/', '', $request->input('harga_jual_3'));
            $embalase_poin = preg_replace('/[^\d]/', '', $request->input('embalase_poin'));
            $setting_waktu = $request->input('setting_waktu');
            $satuan_waktu  = $request->input('satuan_waktu');

            // Hanya update record yang ada - pastikan hanya ada 1 record setting per klinik
            $setting = Setting_Harga_Jual::first();

            if ($setting) {
                $setting->update([
                    'harga_jual_1' => $harga_jual_1,
                    'harga_jual_2' => $harga_jual_2,
                    'harga_jual_3' => $harga_jual_3,
                    'embalase_poin' => $embalase_poin,
                    'setting_waktu' => $setting_waktu,
                    'satuan_waktu'  => $satuan_waktu,
                ]);
            } else {
                // Jika belum ada record, buat baru (hanya untuk kasus pertama kali)
                Setting_Harga_Jual::create([
                    'harga_jual_1' => $harga_jual_1,
                    'harga_jual_2' => $harga_jual_2,
                    'harga_jual_3' => $harga_jual_3,
                    'embalase_poin' => $embalase_poin,
                    'setting_waktu' => $setting_waktu,
                    'satuan_waktu'  => $satuan_waktu,
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Setting harga jual berhasil ditambahkan!',
                'data' => $setting ?? Setting_Harga_Jual::first()
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Setting harga jual sudah ada!',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat menyimpan setting harga jual!',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function storeUtama(Request $request)
    {
        try {
            $request->validate([
                'harga_jual_1'  => 'required|string',
                'harga_jual_2'  => 'required|string',
                'harga_jual_3'  => 'required|string',
                'setting_waktu' => 'nullable|string',
                'satuan_waktu'  => 'nullable|string',
            ], [
                'harga_jual_1'  => 'Harga Jual 1',
                'harga_jual_2'  => 'Harga Jual 2',
                'harga_jual_3'  => 'Harga Jual 3',
                'setting_waktu' => 'Setting Waktu',
                'satuan_waktu'  => 'Satuan Waktu',
            ]);

            // Bersihkan prefix atau simbol dari input agar hanya angka saja
            $harga_jual_1  = preg_replace('/[^\d]/', '', $request->input('harga_jual_1'));
            $harga_jual_2  = preg_replace('/[^\d]/', '', $request->input('harga_jual_2'));
            $harga_jual_3  = preg_replace('/[^\d]/', '', $request->input('harga_jual_3'));
            $setting_waktu = $request->input('setting_waktu');
            $satuan_waktu  = $request->input('satuan_waktu');

            // Hanya update record yang ada - pastikan hanya ada 1 record setting
            $settingUtama = Setting_Harga_Jual_Utama::first();

            if ($settingUtama) {
                $settingUtama->update([
                    'harga_jual_1' => $harga_jual_1,
                    'harga_jual_2' => $harga_jual_2,
                    'harga_jual_3' => $harga_jual_3,
                    'setting_waktu' => $setting_waktu,
                    'satuan_waktu'  => $satuan_waktu,
                ]);
            } else {
                // Jika belum ada record, buat baru (hanya untuk kasus pertama kali)
                Setting_Harga_Jual_Utama::create([
                    'harga_jual_1' => $harga_jual_1,
                    'harga_jual_2' => $harga_jual_2,
                    'harga_jual_3' => $harga_jual_3,
                    'setting_waktu' => $setting_waktu,
                    'satuan_waktu'  => $satuan_waktu,
                ]);
            }

            $resultUtama = Setting_Harga_Jual_Utama::first();

            return response()->json([
                'success' => true,
                'message' => 'Setting Harga Jual Utama berhasil disimpan',
                'data' => $resultUtama
            ], 201);
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
