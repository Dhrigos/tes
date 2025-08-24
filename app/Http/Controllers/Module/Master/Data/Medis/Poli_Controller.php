<?php

namespace App\Http\Controllers\Module\Master\Data\Medis;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Http\Controllers\Module\Integrasi\BPJS\Pcare_Controller;
use App\Models\Module\Master\Data\Medis\Poli;
use Inertia\Inertia;

class Poli_Controller extends Controller
{
    public function index()
    {
        $polis = Poli::all();
        return Inertia::render('module/master/medis/poli/index', compact('polis'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
            'kode' => 'required|string|max:50|unique:polis,kode',
            'jenis' => 'required|string|max:100',
        ]);

        Poli::create([
            'nama' => $request->nama,
            'kode' => $request->kode,
            'jenis' => $request->jenis,
        ]);
        return redirect()->back()->with('success', 'Poli berhasil ditambahkan');
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'nama' => 'required|string|max:255',
            'kode' => 'required|string|max:50|unique:polis,kode,' . $id,
            'jenis' => 'required|string|max:100',
        ]);

        $poli = Poli::findOrFail($id);
        $poli->update([
            'nama' => $request->nama,
            'kode' => $request->kode,
            'jenis' => $request->jenis,
        ]);
        return redirect()->back()->with('success', 'Poli berhasil diubah');
    }

    public function destroy($id)
    {
        $poli = Poli::findOrFail($id);
        $poli->delete();
        return redirect()->back()->with('success', 'Poli berhasil dihapus');
    }

    public function sync()
    {
        try {
            // Call ke controller PCare untuk ambil data poli
            $pcareController = new Pcare_Controller();
            $response = $pcareController->get_poli();

            // Decode response JSON
            $responseData = json_decode($response->getContent(), true);

            // Cek apakah response berhasil
            if (!isset($responseData['status']) || $responseData['status'] !== 'success') {
                $errorMessage = $responseData['message'] ?? 'Gagal mengambil data dari BPJS';
                return redirect()->back()->withErrors(['msg' => $errorMessage]);
            }

            // Ambil data poli dari response
            $poliData = $responseData['data'] ?? [];

            if (empty($poliData)) {
                return redirect()->back()->withErrors(['msg' => 'Data poli kosong dari BPJS']);
            }

            $successCount = 0;
            foreach ($poliData as $item) {
                // Pastikan data yang diperlukan ada
                if (isset($item['kode']) && isset($item['nama'])) {
                    Poli::updateOrCreate(
                        ['kode' => $item['kode']], // kondisi pencarian
                        [
                            'nama' => $item['nama'],
                            'jenis' => $item['jenis'] ?? 'Umum' // default value jika jenis tidak ada
                        ]
                    );
                    $successCount++;
                }
            }

            return redirect()->back()->with('success', "Sinkronisasi data poli berhasil. {$successCount} data diproses.");

        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['msg' => 'Gagal sinkronisasi: ' . $e->getMessage()]);
        }
    }
}
