<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Services\SystemDataService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class SendSystemDataJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public $tries = 3;

    /**
     * The maximum number of seconds the job can run.
     *
     * @var int
     */
    public $timeout = 60;

    /**
     * The system data service instance.
     *
     * @var SystemDataService
     */
    protected $systemDataService;

    /**
     * Create a new job instance.
     *
     * @param SystemDataService|null $systemDataService
     */
    public function __construct(?SystemDataService $systemDataService = null)
    {
        $this->systemDataService = $systemDataService ?? app(SystemDataService::class);
    }

    /**
     * Execute the job.
     *
     * @return void
     */
    public function handle(): void
    {
        try {
            Log::info('Starting system data job execution');

            // Get data
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

            // Send data
            $result = $this->systemDataService->sendToExternalApi($payload);

            if ($result['success']) {
                Cache::put('last_successful_api_send', now()->toISOString(), 3600);
                Log::info('System data sent successfully via job', [
                    'timestamp' => $payload['timestamp'],
                    'response' => $result['response'] ?? null
                ]);
            } else {
                Cache::put('last_api_error', $result['error'], 3600);
                Log::error('Failed to send system data via job', [
                    'error' => $result['error'],
                    'status_code' => $result['status_code'] ?? null
                ]);

                // If it's a configuration error, don't retry
                if (str_contains($result['error'], 'not configured')) {
                    $this->fail();
                    return;
                }

                // For other errors, let it retry
                throw new \Exception($result['error']);
            }
        } catch (\Exception $e) {
            Log::error('System data job failed', [
                'error' => $e->getMessage(),
                'attempt' => $this->attempts(),
                'trace' => $e->getTraceAsString()
            ]);

            // Re-throw to trigger retry mechanism
            throw $e;
        }
    }

    /**
     * Handle a job failure.
     *
     * @param \Throwable $exception
     * @return void
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('System data job failed permanently', [
            'error' => $exception->getMessage(),
            'attempts' => $this->attempts(),
            'trace' => $exception->getTraceAsString()
        ]);

        Cache::put('last_api_error', $exception->getMessage(), 3600);
    }

    /**
     * Get the tags that should be assigned to the job.
     *
     * @return array
     */
    public function tags(): array
    {
        return ['system-monitoring', 'api-send'];
    }
}
