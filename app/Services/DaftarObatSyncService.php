<?php

namespace App\Services;

use App\Models\Module\Master\Data\Gudang\Daftar_Obat;
use App\Models\Settings\Web_Setting;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Log;

class DaftarObatSyncService
{
    protected $redis;
    protected $webSetting;

    public function __construct()
    {
        $this->redis = Redis::connection();
        $this->webSetting = Web_Setting::first();
    }

    /**
     * Check if this instance is master
     */
    public function isMaster(): bool
    {
        return $this->webSetting && $this->webSetting->is_gudangutama_active == 1;
    }

    /**
     * Get the clinic code for synchronization
     */
    public function getClinicCode(): string
    {
        return $this->webSetting->kode_klinik ?? 'default';
    }

    /**
     * Generate Redis key for daftar obat data
     */
    protected function getRedisKey(string $action = 'data'): string
    {
        $clinicCode = $this->getClinicCode();
        return "daftar_obat:{$clinicCode}:{$action}";
    }

    /**
     * Sync data to Redis (Master only)
     */
    public function syncToRedis(Daftar_Obat $obat, string $action = 'create'): void
    {
        if (!$this->isMaster()) {
            Log::info('Non-master instance, skipping Redis sync');
            return;
        }

        try {
            $clinicCode = $this->getClinicCode();
            $data = [
                'id' => $obat->id,
                'kode' => $obat->kode,
                'nama' => $obat->nama,
                'jenis_barang' => $obat->jenis_barang,
                'nama_dagang' => $obat->nama_dagang,
                'deskripsi' => $obat->deskripsi,
                'jenis_inventaris' => $obat->jenis_inventaris,
                'satuan' => $obat->satuan,
                'jenis_formularium' => $obat->jenis_formularium,
                'kfa_kode' => $obat->kfa_kode,
                'nama_industri' => $obat->nama_industri,
                'merek' => $obat->merek,
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
                'bentuk_obat' => $obat->bentuk_obat,
                'created_at' => $obat->created_at?->toISOString(),
                'updated_at' => $obat->updated_at?->toISOString(),
                'action' => $action,
                'clinic_code' => $clinicCode,
                'timestamp' => now()->toISOString(),
            ];

            // Store individual record
            $this->redis->hset($this->getRedisKey('records'), $obat->id, json_encode($data));

            // Add to action log
            $this->redis->lpush($this->getRedisKey('actions'), json_encode($data));

            // Keep only last 1000 actions
            $this->redis->ltrim($this->getRedisKey('actions'), 0, 999);

            Log::info("Synced daftar obat {$action} to Redis", ['obat_id' => $obat->id, 'clinic_code' => $clinicCode]);

        } catch (\Exception $e) {
            Log::error('Failed to sync to Redis', [
                'obat_id' => $obat->id,
                'action' => $action,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Get all data from Redis (Non-master only)
     */
    public function getFromRedis(): array
    {
        if ($this->isMaster()) {
            Log::info('Master instance, skipping Redis fetch');
            return [];
        }

        try {
            $records = $this->redis->hgetall($this->getRedisKey('records'));
            $data = [];

            foreach ($records as $id => $recordJson) {
                $record = json_decode($recordJson, true);
                if ($record) {
                    $data[] = $record;
                }
            }

            Log::info('Fetched daftar obat data from Redis', ['count' => count($data)]);
            return $data;

        } catch (\Exception $e) {
            Log::error('Failed to fetch from Redis', ['error' => $e->getMessage()]);
            return [];
        }
    }

    /**
     * Get recent actions from Redis (Non-master only)
     */
    public function getRecentActions(int $limit = 100): array
    {
        if ($this->isMaster()) {
            return [];
        }

        try {
            $actions = $this->redis->lrange($this->getRedisKey('actions'), 0, $limit - 1);
            $data = [];

            foreach ($actions as $actionJson) {
                $action = json_decode($actionJson, true);
                if ($action) {
                    $data[] = $action;
                }
            }

            return $data;

        } catch (\Exception $e) {
            Log::error('Failed to fetch actions from Redis', ['error' => $e->getMessage()]);
            return [];
        }
    }

    /**
     * Apply actions from Redis to local database (Non-master only)
     */
    public function applyActionsFromRedis(): int
    {
        if ($this->isMaster()) {
            return 0;
        }

        $appliedCount = 0;
        $actions = $this->getRecentActions(1000);
        
        // Get the last applied timestamp to avoid processing old actions
        $lastAppliedTimestamp = $this->getLastAppliedTimestamp();
        $newActions = [];

        foreach ($actions as $action) {
            $actionTimestamp = $action['timestamp'] ?? null;
            
            // Only process actions newer than the last applied timestamp
            if (!$lastAppliedTimestamp || !$actionTimestamp || 
                strtotime($actionTimestamp) > strtotime($lastAppliedTimestamp)) {
                $newActions[] = $action;
            }
        }

        foreach ($newActions as $action) {
            try {
                switch ($action['action']) {
                    case 'create':
                    case 'update':
                        $this->createOrUpdateFromRedis($action);
                        $appliedCount++;
                        break;
                    case 'delete':
                        $this->deleteFromRedis($action);
                        $appliedCount++;
                        break;
                }
            } catch (\Exception $e) {
                Log::error('Failed to apply action from Redis', [
                    'action' => $action,
                    'error' => $e->getMessage()
                ]);
            }
        }

        // Update the last applied timestamp
        if ($appliedCount > 0) {
            $this->setLastAppliedTimestamp(now()->toISOString());
        }

        Log::info("Applied {$appliedCount} new actions from Redis");
        return $appliedCount;
    }

    /**
     * Get the last applied timestamp from Redis
     */
    protected function getLastAppliedTimestamp(): ?string
    {
        try {
            return $this->redis->get($this->getRedisKey('last_applied_timestamp'));
        } catch (\Exception $e) {
            Log::error('Failed to get last applied timestamp', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Set the last applied timestamp in Redis
     */
    protected function setLastAppliedTimestamp(string $timestamp): void
    {
        try {
            $this->redis->set($this->getRedisKey('last_applied_timestamp'), $timestamp);
        } catch (\Exception $e) {
            Log::error('Failed to set last applied timestamp', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Create or update record from Redis data
     */
    protected function createOrUpdateFromRedis(array $data): void
    {
        $obat = Daftar_Obat::updateOrCreate(
            ['id' => $data['id']],
            [
                'kode' => $data['kode'],
                'nama' => $data['nama'],
                'jenis_barang' => $data['jenis_barang'],
                'nama_dagang' => $data['nama_dagang'],
                'deskripsi' => $data['deskripsi'],
                'jenis_inventaris' => $data['jenis_inventaris'],
                'satuan' => $data['satuan'],
                'jenis_formularium' => $data['jenis_formularium'],
                'kfa_kode' => $data['kfa_kode'],
                'nama_industri' => $data['nama_industri'],
                'merek' => $data['merek'],
                'satuan_kecil' => $data['satuan_kecil'],
                'nilai_satuan_kecil' => $data['nilai_satuan_kecil'],
                'satuan_sedang' => $data['satuan_sedang'],
                'nilai_satuan_sedang' => $data['nilai_satuan_sedang'],
                'satuan_besar' => $data['satuan_besar'],
                'nilai_satuan_besar' => $data['nilai_satuan_besar'],
                'penyimpanan' => $data['penyimpanan'],
                'barcode' => $data['barcode'],
                'gudang_kategori' => $data['gudang_kategori'],
                'jenis_obat' => $data['jenis_obat'],
                'jenis_generik' => $data['jenis_generik'],
                'bentuk_obat' => $data['bentuk_obat'],
                'created_at' => $data['created_at'] ? \Carbon\Carbon::parse($data['created_at']) : now(),
                'updated_at' => $data['updated_at'] ? \Carbon\Carbon::parse($data['updated_at']) : now(),
            ]
        );
    }

    /**
     * Delete record from Redis data
     */
    protected function deleteFromRedis(array $data): void
    {
        Daftar_Obat::where('id', $data['id'])->delete();
    }

    /**
     * Clear Redis data for this clinic
     */
    public function clearRedisData(): void
    {
        try {
            $this->redis->del($this->getRedisKey('records'));
            $this->redis->del($this->getRedisKey('actions'));
            $this->redis->del($this->getRedisKey('last_applied_timestamp'));
            Log::info('Cleared Redis data for clinic', ['clinic_code' => $this->getClinicCode()]);
        } catch (\Exception $e) {
            Log::error('Failed to clear Redis data', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get sync status
     */
    public function getSyncStatus(): array
    {
        $isMaster = $this->isMaster();
        $clinicCode = $this->getClinicCode();

        $status = [
            'is_master' => $isMaster,
            'clinic_code' => $clinicCode,
            'redis_connected' => false,
            'records_count' => 0,
            'actions_count' => 0,
        ];

        try {
            $status['redis_connected'] = $this->redis->ping() === 'PONG';
            
            if ($status['redis_connected']) {
                $status['records_count'] = $this->redis->hlen($this->getRedisKey('records'));
                $status['actions_count'] = $this->redis->llen($this->getRedisKey('actions'));
            }
        } catch (\Exception $e) {
            Log::error('Failed to get sync status', ['error' => $e->getMessage()]);
        }

        return $status;
    }
}
