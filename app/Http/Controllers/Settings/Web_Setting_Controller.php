<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Settings\Set_Bpjs;
use App\Models\Settings\Set_Sehat;
use App\Models\Settings\Web_Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Models\Settings\External_Database;

class Web_Setting_Controller extends Controller
{
    public function update(Request $request)
    {
        try {
            // Validasi input
            $validated = $request->validate([
                'nama' => 'required|string|max:255',
                'alamat' => 'required|string',
                'profile_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                'kode_klinik' => 'required',
            ]);

            // Ambil pengaturan pertama, atau buat baru jika belum ada
            $setting = Web_Setting::first() ?? new Web_Setting();

            if ($request->hasFile('profile_image')) {
                // Hapus gambar lama jika ada dan file-nya masih ada
                if ($setting->profile_image) {
                    $oldImagePath = public_path('setting/' . $setting->profile_image);
                    if (file_exists($oldImagePath) && is_file($oldImagePath)) {
                        unlink($oldImagePath);
                    }
                }

                // Simpan gambar baru langsung ke folder public/setting
                $file = $request->file('profile_image');
                $filename = time() . '.' . $file->getClientOriginalExtension();
                $file->move(public_path('setting'), $filename);

                // Simpan nama file ke database
                $setting->profile_image = $filename;
            }

            // Simpan nama dan alamat
            $setting->nama = $validated['nama'];
            $setting->alamat = $validated['alamat'];
            $setting->kode_klinik = $validated['kode_klinik'];
            $setting->save();

            return response()->json([
                'success' => true,
                'message' => 'Pengaturan berhasil diperbarui!',
                'data' => $setting
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage()
            ], 500);
        }
    }

    public function updateToggle(Request $request)
    {
        try {
            $validated = $request->validate([
                'toggle_type' => 'required|string|in:toggleBPJS,toggleSatusehat,toggleGudangutama,toggleTindakanAll',
                'value' => 'required|boolean'
            ]);

            $setting = Web_Setting::first() ?? new Web_Setting();

            // Map toggle type ke field database
            $fieldMap = [
                'toggleBPJS' => 'is_bpjs_active',
                'toggleSatusehat' => 'is_satusehat_active',
                'toggleGudangutama' => 'is_gudangutama_active',
            ];

            $field = $fieldMap[$validated['toggle_type']];
            $oldValue = $setting->$field;
            $setting->$field = $validated['value'];
            $setting->save();

            // Jika is_gudangutama_active diubah dari 0 ke 1, set semua active di external_database ke 0
            if ($field === 'is_gudangutama_active' && $oldValue == 0 && $validated['value'] == 1) {
                External_Database::query()->update(['active' => 0]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Pengaturan berhasil diperbarui!'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getToggleStates()
    {
        try {
            $setting = Web_Setting::first();

            return response()->json([
                'success' => true,
                'data' => [
                    'is_bpjs_active' => $setting->is_bpjs_active ?? true,
                    'is_satusehat_active' => $setting->is_satusehat_active ?? true,
                    'is_gudangutama_active' => $setting->is_gudangutama_active ?? true,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show()
    {
        try {
            $setting = Web_Setting::first();
            $set_bpjs = Set_Bpjs::first();
            $set_sehat = Set_Sehat::first();
            $external_databases = External_Database::all();

            return response()->json([
                'success' => true,
                'data' => [
                    'setting' => $setting,
                    'set_bpjs' => $set_bpjs,
                    'set_sehat' => $set_sehat,
                    'external_databases' => $external_databases
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage()
            ], 500);
        }
    }

    public function set_satusehat(Request $request)
    {
        // Validasi data yang masuk
        $validated = $request->validate([
            'org_id' => 'required|string',
            'client_id' => 'required|string',
            'client_secret' => 'required|string',
            'SECRET_KEY' => 'required|string',
            'SATUSEHAT_BASE_URL' => 'required|string',
        ]);

        try {
            // Coba mencari record pertama atau buat baru
            $record = Set_Sehat::first() ?? new Set_Sehat();
            $record->fill($validated);
            $record->save();

            return response()->json([
                'success' => true,
                'message' => 'Setting Satu Sehat berhasil diperbarui.',
                'data' => $record
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage()
            ], 500);
        }
    }

    public function set_bpjs(Request $request)
    {
        $validated = $request->validate([
            'CONSID' => 'required|string',
            'USERNAME' => 'required|string',
            'PASSWORD' => 'required|string',
            'SECRET_KEY' => 'required|string',
            'USER_KEY' => 'required|string',
            'APP_CODE' => 'required|string',
            'BASE_URL' => 'required|string',
            'SERVICE' => 'required|string',
            'SERVICE_ANTREAN' => 'required|string',
            'KPFK' => 'required|string',
        ]);

        try {
            // Coba mencari record pertama atau buat baru
            $record = Set_Bpjs::first() ?? new Set_Bpjs();
            $record->fill($validated);
            $record->save();

            return response()->json([
                'success' => true,
                'message' => 'Setting BPJS berhasil diperbarui.',
                'data' => $record
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage()
            ], 500);
        }
    }

    public function setActiveGudangUtama(Request $request)
    {
        $validated = $request->validate([
            'gudang_utama_id' => 'required|string'
        ]);

        try {
            $id = $validated['gudang_utama_id'];

            // Set semua ke 0
            External_Database::query()->update(['active' => 0]);

            // Set yang dipilih ke 1
            External_Database::where('database', $id)->update(['active' => 1]);

            return response()->json([
                'success' => true,
                'message' => 'Gudang utama berhasil dipilih.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage()
            ], 500);
        }
    }

    public function resetActiveGudangUtama()
    {
        try {
            External_Database::query()->update(['active' => 0]);

            return response()->json([
                'success' => true,
                'message' => 'Reset gudang utama berhasil.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage()
            ], 500);
        }
    }
}
