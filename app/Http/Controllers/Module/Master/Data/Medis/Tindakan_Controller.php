<?php

namespace App\Http\Controllers\Module\Master\Data\Medis;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Module\Master\Data\Medis\Tindakan;
use App\Models\Module\Master\Data\Medis\Kategori_Tindakan;

class Tindakan_Controller extends Controller
{
    public function index()
    {
        $tindakans = Tindakan::all();
        $kategori_tindakan = Kategori_Tindakan::all();
        return Inertia::render('module/master/medis/tindakan/index', [
            'tindakans' => $tindakans,
            'kategori_tindakan' => $kategori_tindakan
        ]);
    }

    public function store(Request $request)
    {
        try {
            $request->validate([
                'kode' => 'required|string|max:255|unique:tindakans,kode',
                'nama' => 'required|string|max:255',
                'kategori' => 'required|string|max:255',
                'tarif_dokter' => 'required|numeric|min:0',
                'tarif_perawat' => 'required|numeric|min:0',
                'tarif_total' => 'required|numeric|min:0',
            ]);

            // Cari ID kategori berdasarkan nama
            $kategoriTindakan = Kategori_Tindakan::where('nama', $request->kategori)->first();
            if (!$kategoriTindakan) {
                return redirect()->back()->with([
                    'error' => 'Kategori tindakan tidak ditemukan!'
                ])->withInput();
            }

            Tindakan::create([
                'kode' => $request->kode,
                'nama' => $request->nama,
                'kategori' => $kategoriTindakan->id, // Simpan ID kategori
                'kategori_id' => $kategoriTindakan->id, // Simpan ID untuk relasi
                'tarif_dokter' => $request->tarif_dokter,
                'tarif_perawat' => $request->tarif_perawat,
                'tarif_total' => $request->tarif_total,
            ]);

            return redirect()->back()->with([
                'success' => 'Data tindakan berhasil ditambahkan!'
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return redirect()->back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            return redirect()->back()->with([
                'error' => 'Terjadi kesalahan saat menyimpan data tindakan!'
            ])->withInput();
        }
    }

    public function update(Request $request, Tindakan $tindakan)
    {
        try {
            $request->validate([
                'kode' => 'required|string|max:255|unique:tindakans,kode,' . $tindakan->id,
                'nama' => 'required|string|max:255',
                'kategori' => 'required|string|max:255',
                'tarif_dokter' => 'required|numeric|min:0',
                'tarif_perawat' => 'required|numeric|min:0',
                'tarif_total' => 'required|numeric|min:0',
            ]);

            // Cari ID kategori berdasarkan nama
            $kategoriTindakan = Kategori_Tindakan::where('nama', $request->kategori)->first();
            if (!$kategoriTindakan) {
                return redirect()->back()->with([
                    'error' => 'Kategori tindakan tidak ditemukan!'
                ])->withInput();
            }

            $tindakan->update([
                'kode' => $request->kode,
                'nama' => $request->nama,
                'kategori' => $kategoriTindakan->id, // Simpan ID kategori
                'kategori_id' => $kategoriTindakan->id, // Simpan ID untuk relasi
                'tarif_dokter' => $request->tarif_dokter,
                'tarif_perawat' => $request->tarif_perawat,
                'tarif_total' => $request->tarif_total,
            ]);

            return redirect()->back()->with([
                'success' => 'Data tindakan berhasil diperbarui!'
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return redirect()->back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            return redirect()->back()->with([
                'error' => 'Terjadi kesalahan saat memperbarui data tindakan!'
            ])->withInput();
        }
    }

    public function destroy(Tindakan $tindakan)
    {
        try {
            $tindakan->delete();
            return redirect()->back()->with([
                'success' => 'Data tindakan berhasil dihapus!'
            ]);
        } catch (\Exception $e) {
            return redirect()->back()->with([
                'error' => 'Terjadi kesalahan saat menghapus data tindakan!'
            ]);
        }
    }
}
