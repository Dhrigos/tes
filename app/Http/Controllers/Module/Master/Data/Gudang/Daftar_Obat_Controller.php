<?php

namespace App\Http\Controllers\Module\Master\Data\Gudang;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Log;
use App\Models\Module\Master\Data\Gudang\Daftar_Obat;
use App\Models\Module\Master\Data\Gudang\Satuan_Barang;
use App\Models\Module\Master\Data\Gudang\Kategori_Barang;
use App\Services\DaftarObatSyncService;

class Daftar_Obat_Controller extends Controller
{
    protected $syncService;

    public function __construct(DaftarObatSyncService $syncService)
    {
        $this->syncService = $syncService;
    }

    public function index()
    {
        $daftarObat = Daftar_Obat::latest()->get();
        $satuanObats = Satuan_Barang::orderBy('nama')->get(['id', 'nama']);
        $kategoriBarangs = Kategori_Barang::orderBy('nama')->get(['id', 'nama']);

        // Transform data untuk menampilkan nama yang sesuai berdasarkan jenis
        $daftarObat = $daftarObat->map(function ($item) {
            // Untuk inventaris, gunakan deskripsi sebagai nama dagang
            if ($item->jenis_barang === 'inventaris') {
                $item->nama_dagang = $item->deskripsi;
            } else {
                // Untuk obat/alkes, gunakan nama_dagang atau merek
                $item->nama_dagang = $item->nama_dagang ?? $item->merek ?? '-';
            }
            return $item;
        });

        return Inertia::render('module/master/gudang/daftar-obat/index', [
            'daftarObat' => $daftarObat,
            'satuanObats' => $satuanObats,
            'kategoriObats' => $kategoriBarangs,
        ]);
    }

    // JSON list for frontend selects
    public function list()
    {
        $items = Daftar_Obat::orderBy('nama')->get([
            'id',
            'kode',
            'nama',
            'nama_dagang',
            'satuan_kecil',
            'nilai_satuan_kecil',
            'satuan_besar',
            'nilai_satuan_besar',
        ]);
        return response()->json([
            'success' => true,
            'data' => $items,
        ]);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'nama' => 'required|string|max:255',
                'jenis_barang' => 'required|string|in:farmasi,alkes,inventaris',
                'jenis_inventaris' => 'nullable|string|in:Elektronik,Non-Elektronik',
                'jenis_obat' => 'nullable|string|in:Reguler,Khusus,Darurat',
                'jenis_generik' => 'nullable|string|in:Non-Generic,Generic Polos,Branded Generic',
                'jenis_formularium' => 'nullable|string|in:Formularium,Non-Formularium',
                'bentuk_obat' => 'nullable|string|in:padat,cair,gas',
            ]);

            $data = $validated;
            
            if ($request->jenis_barang === 'inventaris') {
                $data += $request->only([
                    'deskripsi',
                    'jenis_inventaris',
                    'satuan',
                    'penyimpanan',
                    'gudang_kategori',
                ]);
            } else {
                // For farmasi and alkes
                $data += $request->only([
                    'kode',
                    'jenis_formularium',
                    'kfa_kode',
                    'nama_industri',
                    'nama_dagang',
                    'merek',
                    'satuan_kecil',
                    'nilai_satuan_kecil',
                    'satuan_sedang',
                    'nilai_satuan_sedang',
                    'satuan_besar',
                    'nilai_satuan_besar',
                    'penyimpanan',
                    'barcode',
                    'gudang_kategori',
                    'jenis_obat',
                    'jenis_generik',
                    'bentuk_obat',
                ]);

                // Set default values for required fields
                if (empty($data['nilai_satuan_kecil'])) {
                    $data['nilai_satuan_kecil'] = 1;
                }

                // Handle merek based on jenis_generik
                if (($data['jenis_generik'] ?? '') === 'Non-Generic') {
                    $data['merek'] = '-';
                }
            }

            $obat = Daftar_Obat::create($data);

            // Note: Sync to Redis is now manual trigger only via Sinkron button

            return Redirect::back()->with('success', 'Data berhasil ditambahkan');
        } catch (\Illuminate\Validation\ValidationException $e) {
            return Redirect::back()
                ->withErrors($e->errors())
                ->withInput();
        } catch (\Exception $e) {
            Log::error('Error creating daftar obat: ' . $e->getMessage());
            return Redirect::back()
                ->with('error', 'Terjadi kesalahan saat menyimpan data: ' . $e->getMessage())
                ->withInput();
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'nama' => 'required|string|max:255',
                'jenis_barang' => 'required|string|in:farmasi,alkes,inventaris',
                'jenis_inventaris' => 'nullable|string|in:Elektronik,Non-Elektronik',
                'jenis_obat' => 'nullable|string|in:Reguler,Khusus,Darurat',
                'jenis_generik' => 'nullable|string|in:Non-Generic,Generic Polos,Branded Generic',
                'jenis_formularium' => 'nullable|string|in:Formularium,Non-Formularium',
                'bentuk_obat' => 'nullable|string|in:padat,cair,gas',
            ]);

            $obat = Daftar_Obat::findOrFail($id);
            
            $updateData = $validated;

            if ($request->jenis_barang === 'inventaris') {
                $updateData += $request->only([
                    'deskripsi',
                    'jenis_inventaris',
                    'satuan',
                    'penyimpanan',
                    'gudang_kategori',
                ]);
            } else {
                // For farmasi and alkes
                $updateData += $request->only([
                    'kode',
                    'jenis_formularium',
                    'kfa_kode',
                    'nama_industri',
                    'nama_dagang',
                    'merek',
                    'satuan_kecil',
                    'nilai_satuan_kecil',
                    'satuan_sedang',
                    'nilai_satuan_sedang',
                    'satuan_besar',
                    'nilai_satuan_besar',
                    'penyimpanan',
                    'barcode',
                    'gudang_kategori',
                    'jenis_obat',
                    'jenis_generik',
                    'bentuk_obat',
                ]);

                // Set default values for required fields
                if (empty($updateData['nilai_satuan_kecil'])) {
                    $updateData['nilai_satuan_kecil'] = 1;
                }

                // Handle merek based on jenis_generik
                if (($updateData['jenis_generik'] ?? '') === 'Non-Generic') {
                    $updateData['merek'] = '-';
                }
            }

            $obat->update($updateData);

            // Note: Sync to Redis is now manual trigger only via Sinkron button

            return Redirect::back()->with('success', 'Data berhasil diperbarui');
        } catch (\Illuminate\Validation\ValidationException $e) {
            return Redirect::back()
                ->withErrors($e->errors())
                ->withInput();
        } catch (\Exception $e) {
            Log::error('Error updating daftar obat: ' . $e->getMessage());
            return Redirect::back()
                ->with('error', 'Terjadi kesalahan saat memperbarui data: ' . $e->getMessage())
                ->withInput();
        }
    }

    public function destroy($id)
    {
        $obat = Daftar_Obat::findOrFail($id);
        
        // Note: Sync to Redis is now manual trigger only via Sinkron button
        
        $obat->delete();
        return Redirect::back()->with('success', 'Obat berhasil dihapus');
    }

    /**
     * Get sync status
     */
    public function getSyncStatus()
    {
        try {
            $status = $this->syncService->getSyncStatus();
            
            return response()->json([
                'success' => true,
                'data' => $status
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get sync status: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Apply actions from Redis (Non-master only)
     */
    public function applySync()
    {
        try {
            $appliedCount = $this->syncService->applyActionsFromRedis();
            
            return response()->json([
                'success' => true,
                'message' => "Applied {$appliedCount} actions from Redis",
                'applied_count' => $appliedCount
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to apply sync: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Sync all data to Redis (Master only)
     */
    public function syncAllToRedis()
    {
        try {
            if (!$this->syncService->isMaster()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only master can sync data to Redis'
                ], 403);
            }

            // Get all daftar obat data
            $allObat = Daftar_Obat::all();
            $syncedCount = 0;

            // Clear existing Redis data first
            $this->syncService->clearRedisData();

            // Sync all data to Redis
            foreach ($allObat as $obat) {
                $this->syncService->syncToRedis($obat, 'create');
                $syncedCount++;
            }
            
            return response()->json([
                'success' => true,
                'message' => "Synced {$syncedCount} records to Redis successfully",
                'synced_count' => $syncedCount
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to sync data to Redis: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Clear Redis data (Master only)
     */
    public function clearSync()
    {
        try {
            if (!$this->syncService->isMaster()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only master can clear sync data'
                ], 403);
            }

            $this->syncService->clearRedisData();
            
            return response()->json([
                'success' => true,
                'message' => 'Redis sync data cleared successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to clear sync data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get data from Redis (Non-master only)
     */
    public function getFromRedis()
    {
        try {
            $data = $this->syncService->getFromRedis();
            
            return response()->json([
                'success' => true,
                'data' => $data,
                'count' => count($data)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get data from Redis: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get recent actions from Redis (Non-master only)
     */
    public function getRecentActions(Request $request)
    {
        try {
            $limit = $request->get('limit', 100);
            $actions = $this->syncService->getRecentActions($limit);
            
            return response()->json([
                'success' => true,
                'data' => $actions,
                'count' => count($actions)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get recent actions: ' . $e->getMessage()
            ], 500);
        }
    }
}
