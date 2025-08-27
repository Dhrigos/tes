<?php

namespace App\Http\Controllers\Module\Master\Data\Gudang;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Redirect;
use App\Models\Module\Master\Data\Gudang\Daftar_Inventaris;
use App\Models\Module\Master\Data\Gudang\Satuan_Inventaris;
use App\Models\Module\Master\Data\Gudang\Kategori_Inventaris;

class Daftar_Inventaris_Controller extends Controller
{
    public function index()
    {
        $daftarInventaris = Daftar_Inventaris::latest()->get();
        $satuanInventaris = Satuan_Inventaris::orderBy('nama')->get(['id', 'nama']);
        $kategoriInventaris = Kategori_Inventaris::orderBy('nama')->get(['id', 'nama']);
        return Inertia::render('module/master/gudang/daftar-inventaris/index', [
            'daftarInventaris' => $daftarInventaris,
            'satuanInventaris' => $satuanInventaris,
            'kategoriInventaris' => $kategoriInventaris,
        ]);
    }

    // JSON list for frontend selects
    public function list()
    {
        $items = Daftar_Inventaris::orderBy('nama_barang')
            ->get(['id', 'kode_barang', 'nama_barang']);
        return response()->json([
            'success' => true,
            'data' => $items,
        ]);
    }

    public function store(Request $request)
    {
        // Terima nama dari 'nama' atau fallback ke 'nama_barang'
        $request->merge([
            'nama' => $request->input('nama', $request->input('nama_barang')),
            'kode' => $request->input('kode', $request->input('kode_barang')),
            'kategori_barang' => $request->input('kategori_barang', $request->input('gudang_kategori')),
            'satuan_barang' => $request->input('satuan_barang', $request->input('satuan_kecil')),
            'jenis_barang' => $request->input('jenis_barang', $request->input('jenis_obat')),
            'masa_pakai_barang' => $request->input('masa_pakai_barang', $request->input('penyimpanan')),
            'masa_pakai_waktu_barang' => $request->input('masa_pakai_waktu_barang', $request->input('barcode')),
        ]);

        $validated = $request->validate([
            'nama' => 'required|string|max:255',
        ]);

        // Tulis eksplisit ke kolom tabel untuk menghindari mismatch fillable
        $inventaris = new Daftar_Inventaris();
        $inventaris->kode_barang = $request->input('kode_barang', $request->input('kode'));
        $inventaris->nama_barang = $request->input('nama_barang', $request->input('nama'));
        $inventaris->kategori_barang = $request->input('kategori_barang');
        $inventaris->satuan_barang = $request->input('satuan_barang');
        $inventaris->jenis_barang = $request->input('jenis_barang');
        $inventaris->masa_pakai_barang = $request->input('masa_pakai_barang');
        $inventaris->masa_pakai_waktu_barang = $request->input('masa_pakai_waktu_barang');
        $inventaris->deskripsi_barang = $request->input('deskripsi_barang');
        $inventaris->save();

        return Redirect::back()->with('success', 'Inventaris berhasil ditambahkan');
    }

    public function update(Request $request, $id)
    {
        // Normalisasi input agar kompatibel dengan model saat ini
        $request->merge([
            'nama' => $request->input('nama', $request->input('nama_barang')),
            'kode' => $request->input('kode', $request->input('kode_barang')),
            'kategori_barang' => $request->input('kategori_barang', $request->input('gudang_kategori')),
            'satuan_barang' => $request->input('satuan_barang', $request->input('satuan_kecil')),
            'jenis_barang' => $request->input('jenis_barang', $request->input('jenis_obat')),
            'masa_pakai_barang' => $request->input('masa_pakai_barang', $request->input('penyimpanan')),
            'masa_pakai_waktu_barang' => $request->input('masa_pakai_waktu_barang', $request->input('barcode')),
        ]);

        $validated = $request->validate([
            'nama' => 'required|string|max:255',
        ]);

        $inventaris = Daftar_Inventaris::findOrFail($id);

        // Update eksplisit kolom tabel
        $inventaris->kode_barang = $request->input('kode_barang', $request->input('kode', $inventaris->kode_barang));
        $inventaris->nama_barang = $request->input('nama_barang', $request->input('nama', $inventaris->nama_barang));
        $inventaris->kategori_barang = $request->input('kategori_barang', $inventaris->kategori_barang);
        $inventaris->satuan_barang = $request->input('satuan_barang', $inventaris->satuan_barang);
        $inventaris->jenis_barang = $request->input('jenis_barang', $inventaris->jenis_barang);
        $inventaris->masa_pakai_barang = $request->input('masa_pakai_barang', $inventaris->masa_pakai_barang);
        $inventaris->masa_pakai_waktu_barang = $request->input('masa_pakai_waktu_barang', $inventaris->masa_pakai_waktu_barang);
        $inventaris->deskripsi_barang = $request->input('deskripsi_barang', $inventaris->deskripsi_barang);
        $inventaris->save();

        return Redirect::back()->with('success', 'Inventaris berhasil diperbarui');
    }

    public function destroy($id)
    {
        $inventaris = Daftar_Inventaris::findOrFail($id);

        $inventaris->delete();
        return Redirect::back()->with('success', 'Inventaris berhasil dihapus');
    }

    //Generate Kode Barang Otomatis
    public function generateKodeInventaris()
    {
        // Mengecek status gudang utama dari tabel websetting
        // $isGudangUtama = WebSetting::first()?->is_gudangutama_active;

        // Mengambil data barang terakhir dari tabel yang sesuai
        // if ($isGudangUtama) {
        //     $last = inventaris_data_barang_utama::orderBy('id', 'desc')->first();
        // } else {
        $last = Daftar_Inventaris::orderBy('id', 'desc')->first();
        // }

        // Jika tidak ada data barang sebelumnya atau kode barang tidak sesuai format 'KBI-xxxx'
        if (!$last || !preg_match('/^KBI-(\d{4})$/', $last->kode_barang, $match)) {
            $nextNumber = 1;  // Mulai dengan nomor 1 jika tidak ada data atau format kode salah
        } else {
            // Jika ada data sebelumnya, ambil angka terakhir dan tambah 1
            $nextNumber = (int)$match[1] + 1;
        }

        // Membuat kode barang baru dengan format 'KBI-xxxx' (dengan padding 0 di depan)
        $kode = 'KBI-' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);

        // Mengembalikan response dalam format JSON
        return response()->json([
            'success' => true,
            'kode' => $kode
        ]);
    }
}
