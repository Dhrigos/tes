<?php

namespace App\Http\Controllers\Module\Master\Data\Medis;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Module\Integrasi\BPJS\Pcare_Controller;
use App\Models\Module\Master\Data\Medis\Spesialis;
use Illuminate\Http\Request;
use Inertia\Inertia;

class Spesialis_Controller extends Controller
{
    public function index()
    {
        $spesialis = Spesialis::with('subspesialis')->get();
        return Inertia::render('module/master/medis/spesialis/index', [
            'spesialis' => $spesialis,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
            'kode' => 'required|string|max:255',
        ]);
        Spesialis::create($request->all());
        return redirect()->back()->with('success', 'Data Spesialis berhasil ditambahkan');
    }

    public function update(Request $request, Spesialis $spesialis)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
            'kode' => 'required|string|max:255',
        ]);
        $spesialis->update($request->all());
        return redirect()->back()->with('success', 'Data Spesialis berhasil diubah');
    }

    public function destroy(Spesialis $spesialis)
    {
        $spesialis->delete();
        return redirect()->back()->with('success', 'Data Spesialis berhasil dihapus');
    }

    public function getSubspesialis($spesialisId)
    {
        $spesialis = Spesialis::with('subspesialis')->findOrFail($spesialisId);
        return response()->json($spesialis->subspesialis);
    }

    public function sync()
    {
        try {
            // Call ke controller PCare untuk ambil data spesialis
            $pcareController = new Pcare_Controller();
            $response = $pcareController->get_spesialis();

            $data = json_decode($response->getContent(), true);

            if (empty($data) || !isset($data['data']) || !is_array($data['data'])) {
                return redirect()->back()->withErrors(['msg' => 'Data spesialis kosong atau tidak valid dari BPJS']);
            }

            $totalSynced = 0;
            foreach ($data['data'] as $item) {
                if (!empty($item['kode']) && !empty($item['nama'])) {
                    Spesialis::updateOrCreate(
                        ['kode' => $item['kode']],
                        ['nama' => $item['nama']]
                    );
                    $totalSynced++;
                }
            }

            if ($totalSynced > 0) {
                return redirect()->back()->with('success', "Sinkronisasi spesialis berhasil. {$totalSynced} data berhasil disinkronkan.");
            } else {
                return redirect()->back()->withErrors(['msg' => 'Tidak ada data spesialis yang valid untuk disinkronkan']);
            }

        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['msg' => 'Gagal sinkronisasi: ' . $e->getMessage()]);
        }
    }
}
