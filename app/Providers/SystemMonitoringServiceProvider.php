<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\SimpleSystemMonitoringService;
use Illuminate\Support\Facades\Log;

class SystemMonitoringServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     *
     * @return void
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     *
     * @return void
     */
    public function boot(): void
    {
        // Start background monitoring if enabled
        $this->startBackgroundMonitoring();
    }


    /**
     * Start background monitoring
     *
     * @return void
     */
    private function startBackgroundMonitoring(): void
    {
        try {
            // Check if system monitoring is enabled
            if (!config('system-monitoring.enabled', true)) {
                return;
            }

            // Check if we're in a web context (not CLI)
            if (php_sapi_name() === 'cli') {
                return;
            }

            // Start background monitoring using different methods
            $this->startWebBackgroundMonitoring();
        } catch (\Exception $e) {
            Log::error('Failed to start background monitoring', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }

    /**
     * Start web-based background monitoring
     *
     * @return void
     */
    private function startWebBackgroundMonitoring(): void
    {
        // Method 1: Using register_shutdown_function for PHP-FPM
        if (function_exists('fastcgi_finish_request')) {
            register_shutdown_function(function () {
                $this->executeBackgroundMonitoring();
            });
        }

        // Method 2: Using output buffering for other SAPIs
        else {
            ob_start(function ($buffer) {
                // Execute monitoring after output is sent
                $this->executeBackgroundMonitoring();
                return $buffer;
            });
        }
    }

    /**
     * Execute background monitoring
     *
     * @return void
     */
    private function executeBackgroundMonitoring(): void
    {
        try {
            $simpleService = app(SimpleSystemMonitoringService::class);
            $simpleService->checkAndTrigger('service_provider');
        } catch (\Exception $e) {
            Log::error('Background monitoring execution error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }
}
