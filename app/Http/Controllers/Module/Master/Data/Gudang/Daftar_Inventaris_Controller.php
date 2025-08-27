<?php

namespace App\Http\Controllers\Module\Master\Data\Gudang;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Log;
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

        // Push perubahan ke Redis agar app lain bisa menarik via tombol Sinkron
        $this->pushSyncMessage($inventaris, 'upsert');

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

        // Push perubahan ke Redis
        $inventaris->refresh();
        $this->pushSyncMessage($inventaris, 'upsert');

        return Redirect::back()->with('success', 'Inventaris berhasil diperbarui');
    }

    public function destroy($id)
    {
        $inventaris = Daftar_Inventaris::findOrFail($id);

        // Push pesan delete sebelum benar-benar menghapus
        $this->pushSyncMessage($inventaris, 'delete');
        $inventaris->delete();
        return Redirect::back()->with('success', 'Inventaris berhasil dihapus');
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
            $set = Redis::set($dedupKey, '1', 'NX', 'EX', 120);
            if ($set !== true) {
                continue;
            }

            if ($event === 'delete') {
                if (!empty($data['id'])) {
                    Daftar_Inventaris::where('id', $data['id'])->delete();
                    $applied++;
                    continue;
                }
                if (!empty($data['kode'])) {
                    Daftar_Inventaris::where('kode', $data['kode'])->delete();
                    $applied++;
                    continue;
                }
                continue;
            }

            $lookup = [];
            if (!empty($data['id'])) {
                $lookup['id'] = $data['id'];
            } elseif (!empty($data['kode'])) {
                $lookup['kode'] = $data['kode'];
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

            Daftar_Inventaris::updateOrCreate($lookup, $write);
            $applied++;
        }

        return Redirect::back()->with('success', 'Sinkronisasi selesai. Perubahan diterapkan: ' . $applied);
    }

    private function pushSyncMessage(Daftar_Inventaris $inventaris, string $event): void
    {
        try {
            $queueKey = env('BARANG_SYNC_QUEUE_KEY', 'barang:sync:queue');
            $instanceId = env('APP_INSTANCE_ID', gethostname() ?: 'unknown-instance');

            $payload = [
                'version' => 1,
                'model' => 'Daftar_Inventaris',
                'event' => $event, // upsert|delete
                'source_instance' => $instanceId,
                'sent_at' => now()->toISOString(),
                'data' => [
                    'id' => $inventaris->id,
                    'kode' => $inventaris->kode,
                    'nama' => $inventaris->nama,
                    'nama_dagang' => $inventaris->nama_dagang,
                    'jenis_formularium' => $inventaris->jenis_formularium,
                    'kfa_kode' => $inventaris->kfa_kode,
                    'nama_industri' => $inventaris->nama_industri,
                    'satuan_kecil' => $inventaris->satuan_kecil,
                    'nilai_satuan_kecil' => $inventaris->nilai_satuan_kecil,
                    'satuan_sedang' => $inventaris->satuan_sedang,
                    'nilai_satuan_sedang' => $inventaris->nilai_satuan_sedang,
                    'satuan_besar' => $inventaris->satuan_besar,
                    'nilai_satuan_besar' => $inventaris->nilai_satuan_besar,
                    'penyimpanan' => $inventaris->penyimpanan,
                    'barcode' => $inventaris->barcode,
                    'gudang_kategori' => $inventaris->gudang_kategori,
                    'jenis_obat' => $inventaris->jenis_obat,
                    'jenis_generik' => $inventaris->jenis_generik,
                    'merek' => $inventaris->merek,
                    'bentuk_obat' => $inventaris->bentuk_obat,
                    'updated_at' => optional($inventaris->updated_at)->toISOString(),
                    'created_at' => optional($inventaris->created_at)->toISOString(),
                ],
            ];

            // Deduplikasi ringan di sisi publisher
            $identity = $payload['data']['kode'] ?: ($payload['data']['id'] ?? '');
            $timestamp = $payload['data']['updated_at'] ?? $payload['data']['created_at'] ?? now()->toISOString();
            $dedupKey = sprintf('sync:barang:pub:http:%s:%s:%s', $event, $identity, $timestamp);
            $set = Redis::set($dedupKey, '1', 'NX', 'EX', 60);
            if ($set !== true) {
                return;
            }

            // Gunakan RPUSH agar bersama LPOP di sisi konsumer menjadi FIFO
            Redis::rpush($queueKey, json_encode($payload));
        } catch (\Throwable $e) {
            Log::warning('Sync push Redis gagal', [
                'error' => $e->getMessage(),
                'queue' => $queueKey,
                'event' => $event,
                'kode' => $inventaris->kode,
            ]);
        }
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
