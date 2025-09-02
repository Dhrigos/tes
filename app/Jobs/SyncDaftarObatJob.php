<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Services\DaftarObatSyncService;
use Illuminate\Support\Facades\Log;

class SyncDaftarObatJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct()
    {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            $syncService = new DaftarObatSyncService();
            
            if (!$syncService->isMaster()) {
                // Non-master: apply actions from Redis
                $appliedCount = $syncService->applyActionsFromRedis();
                Log::info("Background sync applied {$appliedCount} actions from Redis");
            } else {
                // Master: no action needed, data is already synced to Redis on CRUD operations
                Log::info("Background sync: Master instance, no action needed");
            }
        } catch (\Exception $e) {
            Log::error('Background sync failed', ['error' => $e->getMessage()]);
            throw $e;
        }
    }
}
