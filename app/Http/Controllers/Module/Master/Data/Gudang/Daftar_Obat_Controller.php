<?php

namespace App\Http\Controllers\Module\Master\Data\Gudang;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Log;
use App\Models\Module\Master\Data\Gudang\Daftar_Obat;
use App\Models\Module\Master\Data\Gudang\Satuan_Barang;
use App\Models\Module\Master\Data\Gudang\Kategori_Barang;

class Daftar_Obat_Controller extends Controller
{
    public function index()
    {
        $daftarObat = Daftar_Obat::latest()->get();
        $satuanObats = Satuan_Barang::orderBy('nama')->get(['id', 'nama']);
        $kategoriBarangs = Kategori_Barang::orderBy('nama')->get(['id', 'nama']);
        return Inertia::render('module/master/gudang/daftar-obat/index', [
            'daftarObat' => $daftarObat,
            'satuanObats' => $satuanObats,
            'kategoriBarangs' => $kategoriBarangs,
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
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
        ]);

        $data = $validated + $request->only([
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

        if (($data['jenis_generik'] ?? '') === 'Non-Generic') {
            $data['merek'] = '-';
        }

        $obat = Daftar_Obat::create($data);

        // Push perubahan ke Redis agar app lain bisa menarik via tombol Sinkron
        $this->pushSyncMessage($obat, 'upsert');

        return Redirect::back()->with('success', 'Obat berhasil ditambahkan');
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
        ]);

        $obat = Daftar_Obat::findOrFail($id);

        $updateData = $validated + $request->only([
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

        if (($updateData['jenis_generik'] ?? '') === 'Non-Generic') {
            $updateData['merek'] = '-';
        }

        $obat->update($updateData);

        // Push perubahan ke Redis
        $obat->refresh();
        $this->pushSyncMessage($obat, 'upsert');

        return Redirect::back()->with('success', 'Obat berhasil diperbarui');
    }

    public function destroy($id)
    {
        $obat = Daftar_Obat::findOrFail($id);

        // Push pesan delete sebelum benar-benar menghapus
        $this->pushSyncMessage($obat, 'delete');
        $obat->delete();
        return Redirect::back()->with('success', 'Obat berhasil dihapus');
    }

    public function syncPull(Request $request)
    {
        $queueKey = env('BARANG_SYNC_QUEUE_KEY', 'barang:sync:queue');
        $batch = (int) env('BARANG_SYNC_BATCH', 100);
        $instanceId = env('APP_INSTANCE_ID', gethostname() ?: 'unknown-instance');

        $applied = 0;
        for ($i = 0; $i < $batch; $i++) {
            $raw = Redis::lpop($queueKey);
            if ($raw === null) {
                break;
            }

            $payload = json_decode($raw, true);
            if (!is_array($payload)) {
                continue;
            }

            if (($payload['source_instance'] ?? null) === $instanceId) {
                continue;
            }

            $event = $payload['event'] ?? 'upsert';
            $data = $payload['data'] ?? [];

            $identity = $data['kode'] ?? ($data['id'] ?? '');
            $timestamp = $data['updated_at'] ?? ($data['created_at'] ?? '');
            $dedupKey = sprintf('sync:barang:http:%s:%s:%s', $event, $identity, $timestamp);
            $isNew = Redis::setnx($dedupKey, '1');
            if (!$isNew) {
                continue;
            }
            Redis::expire($dedupKey, 120);

            if ($event === 'delete') {
                if (!empty($data['kode'])) {
                    Daftar_Obat::where('kode', $data['kode'])->delete();
                    $applied++;
                    continue;
                }
                if (!empty($data['id'])) {
                    Daftar_Obat::where('id', $data['id'])->delete();
                    $applied++;
                    continue;
                }
                continue;
            }

            $lookup = [];
            if (!empty($data['kode'])) {
                $lookup['kode'] = $data['kode'];
            } elseif (!empty($data['id'])) {
                $lookup['id'] = $data['id'];
            }
            if (empty($lookup)) {
                continue;
            }

            $write = collect($data)->only([
                'kode',
                'nama',
                'nama_dagang',
                'jenis_formularium',
                'kfa_kode',
                'nama_industri',
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
                'merek',
                'bentuk_obat',
            ])->toArray();

            // Validasi foreign key kategori agar tidak melanggar constraint
            if (array_key_exists('gudang_kategori', $write)) {
                $kategoriId = $write['gudang_kategori'];
                if ($kategoriId === '' || $kategoriId === null) {
                    $write['gudang_kategori'] = null;
                } else {
                    $kategoriId = is_numeric($kategoriId) ? (int) $kategoriId : $kategoriId;
                    if (!Kategori_Barang::where('id', $kategoriId)->exists()) {
                        $write['gudang_kategori'] = null;
                    } else {
                        $write['gudang_kategori'] = $kategoriId;
                    }
                }
            }

            Daftar_Obat::updateOrCreate($lookup, $write);
            $applied++;
        }

        return Redirect::back()->with('success', 'Sinkronisasi selesai. Perubahan diterapkan: ' . $applied);
    }

    private function pushSyncMessage(Daftar_Obat $obat, string $event): void
    {
        try {
            $queueKey = env('BARANG_SYNC_QUEUE_KEY', 'barang:sync:queue');
            $instanceId = env('APP_INSTANCE_ID', gethostname() ?: 'unknown-instance');

            $payload = [
                'version' => 1,
                'model' => 'Daftar_Obat',
                'event' => $event, // upsert|delete
                'source_instance' => $instanceId,
                'sent_at' => now()->toISOString(),
                'data' => [
                    'id' => $obat->id,
                    'kode' => $obat->kode,
                    'nama' => $obat->nama,
                    'nama_dagang' => $obat->nama_dagang,
                    'jenis_formularium' => $obat->jenis_formularium,
                    'kfa_kode' => $obat->kfa_kode,
                    'nama_industri' => $obat->nama_industri,
                    'satuan_kecil' => $obat->satuan_kecil,
                    'nilai_satuan_kecil' => $obat->nilai_satuan_kecil,
                    'satuan_sedang' => $obat->satuan_sedang,
                    'nilai_satuan_sedang' => $obat->nilai_satuan_sedang,
                    'satuan_besar' => $obat->satuan_besar,
                    'nilai_satuan_besar' => $obat->nilai_satuan_besar,
                    'penyimpanan' => $obat->penyimpanan,
                    'barcode' => $obat->barcode,
                    'gudang_kategori' => $obat->gudang_kategori,
                    'jenis_obat' => $obat->jenis_obat,
                    'jenis_generik' => $obat->jenis_generik,
                    'merek' => $obat->merek,
                    'bentuk_obat' => $obat->bentuk_obat,
                    'updated_at' => optional($obat->updated_at)->toISOString(),
                    'created_at' => optional($obat->created_at)->toISOString(),
                ],
            ];

            // Deduplikasi ringan di sisi publisher
            $identity = $payload['data']['kode'] ?: ($payload['data']['id'] ?? '');
            $timestamp = $payload['data']['updated_at'] ?? $payload['data']['created_at'] ?? now()->toISOString();
            $dedupKey = sprintf('sync:barang:pub:http:%s:%s:%s', $event, $identity, $timestamp);
            $isNew = Redis::setnx($dedupKey, '1');
            if (!$isNew) {
                return;
            }
            Redis::expire($dedupKey, 60);

            // Gunakan RPUSH agar bersama LPOP di sisi konsumer menjadi FIFO
            Redis::rpush($queueKey, json_encode($payload));
        } catch (\Throwable $e) {
            try {
                Log::warning('Sync push Redis gagal', [
                    'error' => $e->getMessage(),
                    'queue' => $queueKey,
                    'event' => $event,
                    'kode' => $obat->kode,
                ]);
            } catch (\Throwable $logError) {
                error_log('Sync push Redis gagal: ' . $e->getMessage());
            }
        }
    }
}
