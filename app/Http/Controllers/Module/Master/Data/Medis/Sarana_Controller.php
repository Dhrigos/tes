<?php

namespace App\Http\Controllers\Module\Master\Data\Medis;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Module\Integrasi\BPJS\Pcare_Controller;
use App\Models\Module\Master\Data\Medis\Sarana;
use Illuminate\Http\Request;
use Inertia\Inertia;

class Sarana_Controller extends Controller
{
    public function index()
    {
        $sarana = Sarana::all();
        return Inertia::render('module/master/medis/sarana/index', [
            'sarana' => $sarana,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
            'kode' => 'required|string|max:255',
        ]);
        Sarana::create($request->all());
        return redirect()->back()->with('success', 'Sarana berhasil ditambahkan');
    }

    public function update(Request $request, Sarana $sarana)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
            'kode' => 'required|string|max:255',
        ]);
        $sarana->update($request->all());
        return redirect()->back()->with('success', 'Sarana berhasil diubah');
    }

    public function destroy(Sarana $sarana)
    {
        $sarana->delete();
        return redirect()->back()->with('success', 'Sarana berhasil dihapus');
    }

    public function sync()
    {
        try {
            // Call ke controller PCare untuk ambil data poli
            $pcareController = new Pcare_Controller();
            $response = $pcareController->get_sarana(); // harus return JSON response

            $data = json_decode($response->getContent(), true);

            if (empty($data)) {
                return redirect()->back()->withErrors(['msg' => 'Data sarana kosong dari PCare']);
            }

            foreach ($data['data']  as $item) {
                Sarana::updateOrCreate(
                    ['kode' => $item['kode']?? null],
                    ['nama' => $item['nama']?? null]
                );
            }

            return redirect()->back()->with('success', 'Sinkronisasi data sarana berhasil');

        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['msg' => 'Gagal sinkronisasi: ' . $e->getMessage()]);
        }
    }
}
