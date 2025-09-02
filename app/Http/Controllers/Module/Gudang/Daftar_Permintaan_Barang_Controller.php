<?php

namespace App\Http\Controllers\Module\Gudang;

use App\Http\Controllers\Controller;
use App\Models\Module\Gudang\Permintaan_Barang;
use App\Models\Module\Gudang\Permintaan_Barang_Detail;
use App\Models\Module\Gudang\Permintaan_Barang_Konfirmasi;
use App\Models\Module\Gudang\Data_Barang_Keluar;
use App\Models\Module\Master\Data\Gudang\Daftar_Obat;
use Illuminate\Http\Request;
use Inertia\Inertia;

class Daftar_Permintaan_Barang_Controller extends Controller
{
    public function index(Request $request) {
        $title = "Daftar Permintaan Barang";
        $permintaan = Permintaan_Barang::all();
        $dabar = Daftar_Obat::all();
        return Inertia::render('module/gudang/daftar-permintaan-barang/index', [
            'title' => $title,
            'permintaan' => $permintaan,
            'dabar' => $dabar,
        ]);
    }

    public function gudangutamakonfirmasi(Request $request)
    {
        $request->validate([
            'detail_kode_request' => 'required|string',
            'detail_tanggal' => 'required|string',
        ]);

        try {
            $found = Permintaan_Barang::where('kode_request', $request->input('detail_kode_request'))
                ->where('tanggal_input', $request->input('detail_tanggal'))
                ->first();

            if (!$found) {
                // Data tidak ditemukan, return error
                return response()->json([
                    'success' => false,
                    'message' => 'Data tidak valid atau tidak ditemukan!',
                ], 404);
            }

            // Update status
            $found->update([
                'status' => 1,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Data berhasil dikonfirmasi',
                'data' => $found,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat konfirmasi data!',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
