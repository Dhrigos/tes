<?php

namespace App\Http\Controllers;

use App\Services\SystemDataService;
use App\Services\SimpleSystemMonitoringService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SystemMonitoringController extends Controller
{
    /**
     * The system data service instance.
     *
     * @var SystemDataService
     */
    protected $systemDataService;

    /**
     * The simple system monitoring service instance.
     *
     * @var SimpleSystemMonitoringService
     */
    protected $simpleSystemMonitoringService;

    /**
     * Create a new controller instance.
     *
     * @param SystemDataService $systemDataService
     * @param SimpleSystemMonitoringService $simpleSystemMonitoringService
     */
    public function __construct(SystemDataService $systemDataService, SimpleSystemMonitoringService $simpleSystemMonitoringService)
    {
        $this->systemDataService = $systemDataService;
        $this->simpleSystemMonitoringService = $simpleSystemMonitoringService;
    }

    /**
     * Test API connection
     *
     * @return JsonResponse
     */
    public function test(): JsonResponse
    {
        try {
            $result = $this->systemDataService->testApiConnection();

            return response()->json([
                'success' => $result['success'],
                'message' => $result['success'] ? 'API connection test successful' : 'API connection test failed',
                'data' => $result
            ], $result['success'] ? 200 : 400);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Test failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get system health status
     *
     * @return JsonResponse
     */
    public function health(): JsonResponse
    {
        try {
            $health = $this->systemDataService->getSystemHealth();

            return response()->json([
                'success' => true,
                'message' => 'System health retrieved successfully',
                'data' => $health
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get system health: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get Telescope data sample
     *
     * @return JsonResponse
     */
    public function telescopeData(): JsonResponse
    {
        try {
            $data = $this->systemDataService->getTelescopeData();

            return response()->json([
                'success' => true,
                'message' => 'Telescope data retrieved successfully',
                'data' => $data
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get Telescope data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get Pulse data sample
     *
     * @return JsonResponse
     */
    public function pulseData(): JsonResponse
    {
        try {
            $data = $this->systemDataService->getPulseData();

            return response()->json([
                'success' => true,
                'message' => 'Pulse data retrieved successfully',
                'data' => $data
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get Pulse data: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Manually trigger data send
     *
     * @return JsonResponse
     */
    public function sendData(): JsonResponse
    {
        try {
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

            return response()->json([
                'success' => $result['success'],
                'message' => $result['success'] ? 'Data sent successfully' : 'Failed to send data',
                'data' => $result
            ], $result['success'] ? 200 : 400);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Send data failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Start automatic system monitoring
     *
     * @return JsonResponse
     */
    public function startAuto(): JsonResponse
    {
        try {
            $this->simpleSystemMonitoringService->checkAndTrigger('manual_start');

            return response()->json([
                'success' => true,
                'message' => 'Automatic system monitoring started successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to start automatic system monitoring: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Force execute system monitoring
     *
     * @return JsonResponse
     */
    public function forceExecute(): JsonResponse
    {
        try {
            $result = $this->simpleSystemMonitoringService->forceExecute();

            return response()->json($result, $result['success'] ? 200 : 400);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to force execute system monitoring: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get auto monitoring status
     *
     * @return JsonResponse
     */
    public function autoStatus(): JsonResponse
    {
        try {
            $status = $this->simpleSystemMonitoringService->getStatus();

            return response()->json([
                'success' => true,
                'message' => 'Auto monitoring status retrieved successfully',
                'data' => $status
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get auto monitoring status: ' . $e->getMessage()
            ], 500);
        }
    }
}
