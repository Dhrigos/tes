<?php

namespace App\Http\Controllers\Module\Master\Data\Umum;

use App\Http\Controllers\Controller;
use App\Models\Module\Master\Data\Umum\Asuransi;
use App\Models\Module\Master\Data\Umum\Bank;
use Illuminate\Http\Request;
use Inertia\Inertia;

class Asuransi_Controller extends Controller
{
    public function index()
    {
        $asuransis = Asuransi::with('bank')->latest()->get();
        $banks = Bank::orderBy('nama')->get(['id', 'nama']);
        return Inertia::render('module/master/umum/asuransi/index', [
            'asuransis' => $asuransis,
            'banks' => $banks,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:255|unique:asuransis,nama',
            'jenis_asuransi' => 'required|string',
            'verif_pasien' => 'required|string',
            'filter_obat' => 'required|string',
            'tanggal_mulai' => 'required|string',
            'tanggal_akhir' => 'required|string',
            'bank_id' => 'nullable|exists:banks,id',
            'no_rekening' => 'nullable|string',
        ]);

        $exists = Asuransi::whereRaw('LOWER(nama) = ?', [strtolower($request->nama)])->exists();

        if ($exists) {
            return redirect()->back()->withErrors(['nama' => 'Data Asuransi sudah ada.']);
        }

        Asuransi::create([
            'nama' => ucfirst(strtolower($request->nama)),
            'kode' => $request->input('kode'),
            'jenis_asuransi' => $request->input('jenis_asuransi'),
            'verif_pasien' => $request->input('verif_pasien'),
            'filter_obat' => $request->input('filter_obat'),
            'tanggal_mulai' => $request->input('tanggal_mulai'),
            'tanggal_akhir' => $request->input('tanggal_akhir'),
            'alamat_asuransi' => $request->input('alamat_asuransi'),
            'no_telp_asuransi' => $request->input('no_telp_asuransi'),
            'faksimil' => $request->input('faksimil'),
            'pic' => $request->input('pic'),
            'no_telp_pic' => $request->input('no_telp_pic'),
            'jabatan_pic' => $request->input('jabatan_pic'),
            'bank_id' => $request->input('bank_id'),
            'no_rekening' => $request->input('no_rekening'),
        ]);

        return redirect()->back()->with('success', 'Data Asuransi berhasil ditambahkan');
    }

    public function update(Request $request, Asuransi $asuransi)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
        ]);

        $asuransi->update($request->only(['nama','kode','jenis_asuransi','verif_pasien','filter_obat','tanggal_mulai','tanggal_akhir','alamat_asuransi','no_telp_asuransi','faksimil','pic','no_telp_pic','jabatan_pic','bank_id','no_rekening']));
        $asuransi->nama = ucfirst(strtolower($asuransi->nama));
        $asuransi->save();

        return redirect()->back()->with('success', 'Data Asuransi berhasil diupdate');
    }

    public function destroy(Asuransi $asuransi)
    {
        $asuransi->delete();

        return redirect()->back()->with('success', 'Data Asuransi berhasil dihapus');
    }
}
