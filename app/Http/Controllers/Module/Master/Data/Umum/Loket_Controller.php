<?php

namespace App\Http\Controllers\Module\Master\Data\Umum;

use App\Http\Controllers\Controller;
use App\Models\Module\Master\Data\Umum\Loket;
use App\Models\Module\Master\Data\Medis\Poli;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class Loket_Controller extends Controller
{
    public function index()
    {
        $title = "Master Loket Antrian";
        $loket = Loket::with('poli')->get();
        $poli = Poli::all();

        return Inertia::render('module/master/umum/loket/index', [
            'title' => $title,
            'loket' => $loket,
            'poli' => $poli
        ]);
    }

    public function store(Request $request)
    {
        try {
            $request->validate([
                "nama" => 'required|string|unique:lokets,nama',
                "poli_id" => 'required',
            ]);

            $loket = Loket::create([
                'nama' => $request->nama,
                'poli_id' => $request->poli_id,
            ]);

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Loket berhasil ditambahkan!',
                    'data' => $loket
                ]);
            }

            return redirect()->back()->with('success', 'Loket berhasil ditambahkan!');
        } catch (ValidationException $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Loket Sudah ada!',
                    'errors' => $e->errors()
                ], 422);
            }
            return redirect()->back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Terjadi kesalahan saat menyimpan Loket!',
                    'error' => $e->getMessage()
                ], 500);
            }
            return redirect()->back()->with('error', 'Terjadi kesalahan saat menyimpan Loket!');
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $request->validate([
                'nama_edit' => 'required|string',
                'poli_edit' => 'required|string',
            ]);

            $loket = Loket::find($id);

            if (!$loket) {
                if ($request->wantsJson()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Loket tidak ditemukan!'
                    ], 404);
                }
                return redirect()->back()->with('error', 'Loket tidak ditemukan!');
            }

            $loket->nama = $request->nama_edit;
            $loket->poli_id = $request->poli_edit;
            $loket->save();

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Loket berhasil diperbarui!',
                    'data' => $loket
                ]);
            }

            return redirect()->back()->with('success', 'Loket berhasil diperbarui!');
        } catch (ValidationException $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data tidak valid!',
                    'errors' => $e->errors()
                ], 422);
            }
            return redirect()->back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Terjadi kesalahan saat memperbarui loket!',
                    'error' => $e->getMessage()
                ], 500);
            }
            return redirect()->back()->with('error', 'Terjadi kesalahan saat memperbarui loket!');
        }
    }

    public function destroy(Request $request, $id)
    {
        try {
            $loket = Loket::find($id);
            if (!$loket) {
                if ($request->wantsJson()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Loket tidak ditemukan!'
                    ], 404);
                }
                return redirect()->back()->with('error', 'Loket tidak ditemukan!');
            }

            $loket->delete();

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Loket berhasil dihapus!'
                ]);
            }

            return redirect()->back()->with('success', 'Loket berhasil dihapus!');
        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Terjadi kesalahan saat menghapus loket!',
                    'error' => $e->getMessage()
                ], 500);
            }
            return redirect()->back()->with('error', 'Terjadi kesalahan saat menghapus loket!');
        }
    }
}
