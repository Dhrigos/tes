<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Jobs\SendSystemDataJob;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class SystemMonitoringCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'system:monitor {--force : Force execution regardless of interval}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send system monitoring data with configurable intervals';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        // Check if system monitoring is enabled
        if (!config('system-monitoring.enabled', true)) {
            $this->info('System monitoring is disabled.');
            return Command::SUCCESS;
        }

        $interval = config('system-monitoring.interval_seconds', 300);
        $lastExecution = Cache::get('last_system_monitoring_execution');

        // Check if we should skip this execution based on interval
        if (!$this->option('force') && $lastExecution) {
            // Convert to Carbon if it's a timestamp
            if (is_numeric($lastExecution)) {
                $lastExecution = \Carbon\Carbon::createFromTimestamp($lastExecution);
            } elseif (is_string($lastExecution)) {
                $lastExecution = \Carbon\Carbon::parse($lastExecution);
            }

            $timeSinceLastExecution = now()->diffInSeconds($lastExecution);
            if ($timeSinceLastExecution < $interval) {
                $this->info("Skipping execution. Last run was {$timeSinceLastExecution} seconds ago. Interval: {$interval} seconds.");
                return Command::SUCCESS;
            }
        }

        $this->info("Sending system monitoring data... (Interval: {$interval}s)");

        try {
            // Update last execution time
            Cache::put('last_system_monitoring_execution', now(), 3600);

            // Dispatch the job
            SendSystemDataJob::dispatch();

            $this->info('System monitoring job dispatched successfully.');

            Log::info('System monitoring job dispatched', [
                'interval' => $interval,
                'timestamp' => now()->toISOString(),
                'forced' => $this->option('force')
            ]);

            return Command::SUCCESS;
        } catch (\Exception $e) {
            $this->error("Error dispatching system monitoring job: " . $e->getMessage());

            Log::error('System monitoring command error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return Command::FAILURE;
        }
    }
}
