<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use App\Jobs\SendSystemDataJob;
use Carbon\Carbon;

class SystemMonitoringMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle(Request $request, Closure $next)
    {
        // Check if system monitoring is enabled
        if (!config('system-monitoring.enabled', true)) {
            return $next($request);
        }

        $interval = config('system-monitoring.interval_seconds', 300);
        $lastExecution = Cache::get('last_system_monitoring_execution');
        $currentTime = now();

        // Check if we should trigger monitoring
        $shouldTrigger = false;
        if (!$lastExecution) {
            $shouldTrigger = true;
        } else {
            // Convert to Carbon if it's a timestamp
            if (is_numeric($lastExecution)) {
                $lastExecution = Carbon::createFromTimestamp($lastExecution);
            } elseif (is_string($lastExecution)) {
                $lastExecution = Carbon::parse($lastExecution);
            }

            $timeSinceLastExecution = $currentTime->diffInSeconds($lastExecution);
            if ($timeSinceLastExecution >= $interval) {
                $shouldTrigger = true;
            }
        }

        if ($shouldTrigger) {
            try {
                // Update last execution time
                Cache::put('last_system_monitoring_execution', $currentTime, 3600);

                // Dispatch the job
                SendSystemDataJob::dispatch();

                Log::info('System monitoring triggered', [
                    'trigger_source' => 'middleware',
                    'timestamp' => now()->toISOString(),
                    'interval_seconds' => $interval
                ]);
            } catch (\Exception $e) {
                Log::error('System monitoring middleware error', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
            }
        }

        return $next($request);
    }
}
