<?php

namespace App\Services;

use App\Jobs\SendSystemDataJob;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class SimpleSystemMonitoringService
{
    /**
     * The system data service instance.
     *
     * @var SystemDataService
     */
    protected $systemDataService;

    /**
     * Create a new service instance.
     *
     * @param SystemDataService $systemDataService
     */
    public function __construct(SystemDataService $systemDataService)
    {
        $this->systemDataService = $systemDataService;
    }

    /**
     * Check and trigger system monitoring if needed
     *
     * @param string $triggerSource
     * @return void
     */
    public function checkAndTrigger(string $triggerSource = 'unknown'): void
    {
        try {
            // Check if system monitoring is enabled
            if (!config('system-monitoring.enabled', true)) {
                Log::info('System monitoring disabled', ['trigger_source' => $triggerSource]);
                return;
            }

            // Get last execution time
            $lastExecution = Cache::get('simple_system_monitoring_last_execution', 0);
            $currentTime = time();
            $interval = config('system-monitoring.interval_seconds', 60);

            // Log only when triggering to reduce spam
            if (($currentTime - $lastExecution) >= $interval) {
                Log::info('System monitoring check', [
                    'trigger_source' => $triggerSource,
                    'current_time' => $currentTime,
                    'last_execution' => $lastExecution,
                    'interval' => $interval,
                    'time_diff' => $currentTime - $lastExecution,
                    'should_trigger' => true
                ]);
            }

            // Check if enough time has passed since last execution
            if (($currentTime - $lastExecution) >= $interval) {
                // Update last execution time
                Cache::put('simple_system_monitoring_last_execution', $currentTime, 300);

                // Dispatch job to send data in background
                SendSystemDataJob::dispatch();

                Log::info('System monitoring triggered', [
                    'trigger_source' => $triggerSource,
                    'timestamp' => now()->toISOString(),
                    'interval_seconds' => $interval
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Simple system monitoring error', [
                'error' => $e->getMessage(),
                'trigger_source' => $triggerSource,
                'trace' => $e->getTraceAsString()
            ]);
        }
    }

    /**
     * Force execute system monitoring
     *
     * @return array
     */
    public function forceExecute(): array
    {
        try {
            SendSystemDataJob::dispatch();

            return [
                'success' => true,
                'message' => 'System monitoring job dispatched successfully',
                'timestamp' => now()->toISOString()
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to dispatch system monitoring job: ' . $e->getMessage(),
                'timestamp' => now()->toISOString()
            ];
        }
    }

    /**
     * Get monitoring status
     *
     * @return array
     */
    public function getStatus(): array
    {
        return [
            'enabled' => config('system-monitoring.enabled', true),
            'interval_seconds' => config('system-monitoring.interval_seconds', 60),
            'last_execution' => Cache::get('simple_system_monitoring_last_execution'),
            'last_successful_send' => Cache::get('last_successful_api_send'),
            'last_error' => Cache::get('last_api_error'),
            'methods_active' => [
                'middleware_monitoring' => true,
                'service_provider_monitoring' => true,
                'simple_monitoring' => true
            ]
        ];
    }
}
