<?php

namespace App\Http\Controllers\Module\Master\Data\Medis;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Module\Integrasi\BPJS\Pcare_Controller;
use App\Models\Module\Master\Data\Medis\Subspesialis;
use App\Models\Module\Master\Data\Medis\Spesialis;
use Illuminate\Http\Request;
use Inertia\Inertia;

class Subspesialis_Controller extends Controller
{
    public function index()
    {
        $subspesialis = Subspesialis::with('spesialis')->get();
        $spesialis = Spesialis::all();

        return Inertia::render('module/master/medis/subspesialis/index', [
            'subspesialis' => $subspesialis,
            'spesialis' => $spesialis,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
            'kode' => 'required|string|max:255',
            'kode_rujukan' => 'required|string|max:255',
            'id_spesialis' => 'required|exists:spesialis,id',
        ]);

        Subspesialis::create($request->all());
        return redirect()->back()->with('success', 'Data Subspesialis berhasil ditambahkan');
    }

    public function update(Request $request, Subspesialis $subspesialis)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
            'kode' => 'required|string|max:255',
            'kode_rujukan' => 'required|string|max:255',
            'id_spesialis' => 'required|exists:spesialis,id',
        ]);

        $subspesialis->update($request->all());
        return redirect()->back()->with('success', 'Data Subspesialis berhasil diubah');
    }

    public function destroy(Subspesialis $subspesialis)
    {
        $subspesialis->delete();
        return redirect()->back()->with('success', 'Data Subspesialis berhasil dihapus');
    }

    public function getBySpesialis($spesialisId)
    {
        $subspesialis = Subspesialis::where('id_spesialis', $spesialisId)->get();
        return response()->json($subspesialis);
    }

    public function sync($kode)
    {
        try {
            $pcareController = new Pcare_Controller();

            $response = $pcareController->get_sub_spesialis($kode);
            $data = json_decode($response->getContent(), true);

            if (!empty($data) && isset($data['data']) && is_array($data['data'])) {
                foreach ($data['data'] as $item) {
                    Subspesialis::updateOrCreate(
                        ['kode' => $item['kode'] ?? null],
                        [
                            'nama' => $item['nama'] ?? null,
                            'kode_rujukan' => $item['poli_rujuk'] ?? null,
                            'id_spesialis' => $kode
                        ]
                    );
                }
            }
            return redirect()->back()->with('success', "Sinkronisasi Sub spesialis berhasil. data berhasil disinkronkan.");

        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['msg' => 'Gagal sinkronisasi: ' . $e->getMessage()]);
        }
    }
}
