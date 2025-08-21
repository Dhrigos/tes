<?php

namespace App\Http\Controllers\Module\Master\Data\Medis;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Module\Integrasi\BPJS\Pcare_Controller;
use App\Models\Module\Master\Data\Medis\Alergi;
use Illuminate\Http\Request;
use Inertia\Inertia;

class Alergi_Controller extends Controller
{
    public function index()
    {
        $alergis = Alergi::all();
        return Inertia::render('module/master/medis/alergi/index', [
            'alergis' => $alergis,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'kode' => 'required|string|max:10',
            'nama' => 'required|string|max:255',
            'jenis_alergi' => 'required|string|max:10',
        ]);

        Alergi::create($request->only(['kode', 'jenis_alergi', 'nama']));
        return redirect()->back()->with('success', 'Alergi berhasil ditambahkan');
    }

    public function update(Request $request, Alergi $alergi)
    {
        $request->validate([
            'kode' => 'required|string|max:10,' . $alergi->id,
            'nama' => 'required|string|max:255',
            'jenis_alergi' => 'required|string|max:10',
        ]);

        $alergi->update($request->only(['kode', 'jenis_alergi', 'nama']));

        return redirect()->back()->with('success', 'Alergi berhasil diperbarui');
    }

    public function destroy(Alergi $alergi)
    {
        $alergi->delete();
        return redirect()->back()->with('success', 'Alergi berhasil dihapus');
    }

   public function sync($kode)
{
    try {
        // Call ke controller PCare untuk ambil data alergi
        $pcareController = new Pcare_Controller();
        $response = $pcareController->get_alergi($kode); // harus return JsonResponse

        // Ambil data JSON langsung
        $data = json_decode($response->getContent(), true); // decode ke array

        if (empty($data['data'])) {
            return redirect()->back()->withErrors(['msg' => 'Data alergi kosong dari PCare']);
        }

        // Loop melalui data PCare dan simpan ke DB
        foreach ($data['data'] as $item) {

            // Skip item jika kode '00'
            if (($item['kode'] ?? '') === '00') {
                continue;
            }

            // Tentukan jenis_alergi default jika jenis tidak ada
            $jenis = $item['jenis'] ?? 'LAINNYA';

            Alergi::updateOrCreate(
                ['nama' => $item['nama']], // hanya item valid dan kode bukan '00'
                [
                    'kode' => $item['kode'] ?? null,
                    'jenis_alergi' => $jenis,
                ]
            );
        }


        return redirect()->back()->with('success', 'Sinkronisasi data alergi berhasil');

    } catch (\Exception $e) {
        return redirect()->back()->withErrors(['msg' => 'Gagal sinkronisasi: ' . $e->getMessage()]);
    }
}

}
