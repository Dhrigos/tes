<?php

namespace App\Http\Controllers\Module\Master\Data\Medis;

use App\Http\Controllers\Controller;
use App\Models\Module\Master\Data\Medis\Kategori_Tindakan;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class Kategori_Tindakan_Controller extends Controller
{
    // protected $PcareController;

    // // Gunakan dependency injection
    // public function __construct(PcareController $PcareController)
    // {
    //     $this->PcareController = $PcareController;
    // }

    public function index()
    {
        $title = "Master Kategori Tindakan";
        $kategori_tindakan = Kategori_Tindakan::all();
        return Inertia::render('module/master/medis/kategori-tindakan/index', [
            'title' => $title,
            'kategori_tindakan' => $kategori_tindakan
        ]);
    }

    public function store(Request $request)
    {
        try {
            $request->validate([
                "nama" => 'required|string|unique:kategori_tindakans,nama',
            ]);

            $kategori_tindakan = Kategori_Tindakan::create([
                'nama' => $request->nama,
            ]);

            return redirect()->back()->with([
                'success' => true,
                'message' => 'Kategori tindakan berhasil ditambahkan!'
            ]);
        } catch (ValidationException $e) {
            return redirect()->back()->withErrors([
                'nama' => 'Nama kategori tindakan sudah ada!'
            ])->withInput();
        } catch (\Exception $e) {
            return redirect()->back()->withErrors([
                'nama' => 'Terjadi kesalahan saat menyimpan kategori tindakan!'
            ])->withInput();
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $request->validate([
                'nama' => 'required|string|unique:kategori_tindakans,nama,' . $id,
            ]);

            $kategori_tindakan = Kategori_Tindakan::find($id);

            if (!$kategori_tindakan) {
                return redirect()->back()->withErrors([
                    'nama' => 'Kategori tindakan tidak ditemukan!'
                ]);
            }

            $kategori_tindakan->nama = $request->nama;
            $kategori_tindakan->save();

            return redirect()->back()->with([
                'success' => true,
                'message' => 'Kategori tindakan berhasil diperbarui!'
            ]);
        } catch (ValidationException $e) {
            return redirect()->back()->withErrors([
                'nama' => 'Nama kategori tindakan sudah ada!'
            ])->withInput();
        } catch (\Exception $e) {
            return redirect()->back()->withErrors([
                'nama' => 'Terjadi kesalahan saat memperbarui kategori tindakan!'
            ])->withInput();
        }
    }

    public function destroy($id)
    {
        try {
            $kategori_tindakan = Kategori_Tindakan::find($id);
            if (!$kategori_tindakan) {
                return redirect()->back()->withErrors([
                    'nama' => 'Kategori tindakan tidak ditemukan!'
                ]);
            }
            $kategori_tindakan->delete();

            return redirect()->back()->with([
                'success' => true,
                'message' => 'Kategori tindakan berhasil dihapus!'
            ]);
        } catch (\Exception $e) {
            return redirect()->back()->withErrors([
                'nama' => 'Terjadi kesalahan saat menghapus kategori tindakan!'
            ]);
        }
    }
}
