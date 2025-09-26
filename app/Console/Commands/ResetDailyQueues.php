<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Module\Pemdaftaran\Antrian_Pasien;
use Carbon\Carbon;

class ResetDailyQueues extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'queue:reset-daily';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Reset daily queue numbers at midnight';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        try {
            $today = now()->toDateString();
            $yesterday = now()->subDay()->toDateString();
            
            // Log the reset action
            $this->info("Starting daily queue reset for date: {$today}");
            
            // Archive yesterday's queues (optional - for reporting purposes)
            $yesterdayQueues = Antrian_Pasien::whereDate('tanggal', $yesterday)->count();
            
            if ($yesterdayQueues > 0) {
                $this->info("Found {$yesterdayQueues} queues from yesterday to archive");
                
                // You can add archiving logic here if needed
                // For now, we'll just log the count
            }
            
            // The queue numbers will automatically reset because they're date-based
            // New queues created today will start from 1 for each prefix
            
            $this->info("Daily queue reset completed successfully");
            
            // Log to Laravel log
            \Log::info("Daily queue reset executed", [
                'date' => $today,
                'yesterday_queues' => $yesterdayQueues,
                'executed_at' => now()->toDateTimeString()
            ]);
            
            return 0;
            
        } catch (\Exception $e) {
            $this->error("Error during daily queue reset: " . $e->getMessage());
            
            \Log::error("Daily queue reset failed", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'executed_at' => now()->toDateTimeString()
            ]);
            
            return 1;
        }
    }
}
