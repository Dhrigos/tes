<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\DaftarObatSyncService;

class SyncDaftarObat extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'daftar-obat:sync {--apply : Apply actions from Redis} {--status : Show sync status} {--clear : Clear Redis data}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Synchronize daftar obat data using Redis';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $syncService = new DaftarObatSyncService();

        if ($this->option('status')) {
            $this->showStatus($syncService);
            return;
        }

        if ($this->option('clear')) {
            $this->clearData($syncService);
            return;
        }

        if ($this->option('apply')) {
            $this->applySync($syncService);
            return;
        }

        // Default: show help
        $this->showHelp();
    }

    protected function showStatus(DaftarObatSyncService $syncService)
    {
        $status = $syncService->getSyncStatus();

        $this->info('=== Daftar Obat Sync Status ===');
        $this->line('Master Mode: ' . ($status['is_master'] ? 'YES' : 'NO'));
        $this->line('Clinic Code: ' . $status['clinic_code']);
        $this->line('Redis Connected: ' . ($status['redis_connected'] ? 'YES' : 'NO'));
        $this->line('Records in Redis: ' . $status['records_count']);
        $this->line('Actions in Redis: ' . $status['actions_count']);

        if ($status['is_master']) {
            $this->info('This instance is MASTER - it will sync data TO Redis');
        } else {
            $this->info('This instance is NON-MASTER - it will sync data FROM Redis');
        }
    }

    protected function applySync(DaftarObatSyncService $syncService)
    {
        if ($syncService->isMaster()) {
            $this->error('Cannot apply sync on master instance');
            return;
        }

        $this->info('Applying actions from Redis...');
        $appliedCount = $syncService->applyActionsFromRedis();
        
        $this->info("Applied {$appliedCount} actions from Redis");
    }

    protected function clearData(DaftarObatSyncService $syncService)
    {
        if (!$syncService->isMaster()) {
            $this->error('Only master can clear Redis data');
            return;
        }

        if ($this->confirm('Are you sure you want to clear all Redis sync data?')) {
            $syncService->clearRedisData();
            $this->info('Redis sync data cleared successfully');
        } else {
            $this->info('Operation cancelled');
        }
    }

    protected function showHelp()
    {
        $this->info('Daftar Obat Sync Commands:');
        $this->line('');
        $this->line('Show sync status:');
        $this->line('  php artisan daftar-obat:sync --status');
        $this->line('');
        $this->line('Apply actions from Redis (non-master only):');
        $this->line('  php artisan daftar-obat:sync --apply');
        $this->line('');
        $this->line('Clear Redis data (master only):');
        $this->line('  php artisan daftar-obat:sync --clear');
    }
}
