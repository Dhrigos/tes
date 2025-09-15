<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\SystemDataService;
use Illuminate\Support\Facades\Log;

class SendSystemDataCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'system:send-data';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send system data from Telescope and Pulse to external API every minute';

    /**
     * The system data service instance.
     *
     * @var SystemDataService
     */
    protected $systemDataService;

    /**
     * Create a new command instance.
     *
     * @param SystemDataService $systemDataService
     */
    public function __construct(SystemDataService $systemDataService)
    {
        parent::__construct();
        $this->systemDataService = $systemDataService;
    }

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        try {
            // Increase memory limit for CLI execution to avoid OOM on large payloads
            @ini_set('memory_limit', '512M');
            // Check if system monitoring is enabled
            if (!config('system-monitoring.enabled', true)) {
                $this->info('System monitoring is disabled. Skipping data collection.');
                return Command::SUCCESS;
            }

            // Check if we should skip this execution based on interval
            $interval = config('system-monitoring.interval_seconds', 300);
            $lastExecution = cache('last_system_monitoring_execution');

            if ($lastExecution && $interval > 60) {
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

            $this->info('Starting to collect and send system data...');

            // Update last execution time
            cache(['last_system_monitoring_execution' => now()], 3600);

            // Collect data from Telescope and Pulse
            $telescopeData = $this->systemDataService->getTelescopeData();
            $pulseData = $this->systemDataService->getPulseData();

            // Prepare payload
            $payload = [
                'timestamp' => now()->toISOString(),
                'system' => 'laravel_app',
                'telescope' => $telescopeData,
                'pulse' => $pulseData,
                'server_info' => [
                    'php_version' => PHP_VERSION,
                    'laravel_version' => app()->version(),
                    'memory_usage' => memory_get_usage(true),
                    'peak_memory' => memory_get_peak_usage(true),
                ]
            ];

            // Send data to external API
            $result = $this->systemDataService->sendToExternalApi($payload);

            if ($result['success']) {
                $this->info('System data sent successfully to external API');
                Log::info('System data sent successfully', [
                    'timestamp' => $payload['timestamp'],
                    'response' => $result['response']
                ]);
            } else {
                $this->error('Failed to send system data: ' . $result['error']);
                Log::error('Failed to send system data', [
                    'error' => $result['error'],
                    'payload' => $payload
                ]);
            }

            return Command::SUCCESS;
        } catch (\Exception $e) {
            $this->error('Error occurred: ' . $e->getMessage());
            Log::error('System data command error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return Command::FAILURE;
        }
    }
}
