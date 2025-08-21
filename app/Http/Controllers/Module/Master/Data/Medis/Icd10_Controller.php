<?php

namespace App\Http\Controllers\Module\Master\Data\Medis;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Module\Master\Data\Medis\Icd10;
use Inertia\Inertia;

class Icd10_Controller extends Controller
{
    public function index()
    {
        $icd10s = Icd10::all();
        return Inertia::render('module/master/medis/icd10/index', [
            'icd10s' => $icd10s,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'kode' => 'required|string|max:255',
            'nama' => 'required|string|max:255',
            'perlu_rujuk' => 'required',
        ]);

        Icd10::create([
            'kode' => strtoupper($request->kode),
            'nama' => ucfirst(strtolower($request->nama)),
            'perlu_rujuk' => $request->perlu_rujuk,
        ]);

        return redirect()->back()->with('success', 'ICD-10 berhasil ditambahkan');
    }

    public function update(Request $request, Icd10 $icd10)
    {
        $request->validate([
            'kode' => 'required|string|max:255',
            'nama' => 'required|string|max:255',
            'perlu_rujuk' => 'required',
        ]);

        $icd10->update([
            'kode' => strtoupper($request->kode),
            'nama' => ucfirst(strtolower($request->nama)),
            'perlu_rujuk' => $request->perlu_rujuk,
        ]);

        return redirect()->back()->with('success', 'ICD-10 berhasil diubah');
    }

    public function destroy(Icd10 $icd10)
    {
        $icd10->delete();
        return redirect()->back()->with('success', 'ICD-10 berhasil dihapus');
    }

    public function sync($kode)
    {

        try {
            // Call ke controller PCare untuk ambil data alergi
            $pcareController = new \App\Http\Controllers\Module\Integrasi\BPJS\Pcare_Controller();
            $response = $pcareController->get_diagnosa($kode); // harus return JsonResponse

            // Ambil data JSON langsung
            $data = json_decode($response->getContent(), true); // decode ke array

            if (empty($data['data'])) {
                return redirect()->back()->withErrors(['msg' => 'Data alergi kosong dari PCare']);
            }

            // Loop melalui data PCare dan simpan ke DB
            foreach ($data['data'] as $item) {
                Icd10::updateOrCreate(
                    ['nama' => $item['nama']], // hanya item valid dan kode bukan '00'
                    [
                        'kode' => $item['kode'] ?? null,
                        'perlu_rujuk' => $item['status_rujuk'],
                    ]
                );
            }

            return redirect()->back()->with('success', 'Sinkronisasi ICD-10 berhasil');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Sinkronisasi ICD-10 gagal: ' . $e->getMessage());
        }
    }
}
