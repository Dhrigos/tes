<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class SystemDataService
{
    /**
     * The external API URL
     *
     * @var string
     */
    protected $apiUrl;

    /**
     * The API token
     *
     * @var string
     */
    protected $apiToken;

    /**
     * Create a new service instance.
     */
    public function __construct()
    {
        $this->apiUrl = config('system-monitoring.api_url');
        $this->apiToken = config('system-monitoring.api_token');
    }

    /**
     * Get Telescope data from database
     *
     * @return array
     */
    public function getTelescopeData(): array
    {
        try {
            // Get recent telescope entries (last 5 minutes)
            $telescopeEntries = DB::table('telescope_entries')
                ->where('created_at', '>=', now()->subMinutes(5))
                ->select([
                    'type',
                    'content',
                    'created_at',
                    'batch_id'
                ])
                ->orderBy('created_at', 'desc')
                ->limit(50)
                ->get();

            // Process entries to extract detailed information
            $processedEntries = $telescopeEntries->map(function ($entry) {
                $content = json_decode($entry->content, true);

                $processedEntry = [
                    'type' => $entry->type,
                    'created_at' => $entry->created_at,
                    'batch_id' => $entry->batch_id,
                    'content' => $content
                ];

                // Extract specific fields based on entry type
                if ($entry->type === 'request' && $content) {
                    $processedEntry['method'] = $content['method'] ?? null;
                    $processedEntry['path'] = $content['uri'] ?? null;
                    $processedEntry['status'] = $content['response_status'] ?? null;
                    $processedEntry['duration'] = $content['duration'] ?? null;
                    $processedEntry['user'] = $content['user'] ?? null;
                } elseif ($entry->type === 'query' && $content) {
                    $processedEntry['query'] = $content['sql'] ?? null;
                    $processedEntry['duration'] = $content['time'] ?? null;
                } elseif ($entry->type === 'job' && $content) {
                    $processedEntry['job'] = $content['name'] ?? null;
                    $processedEntry['duration'] = $content['time'] ?? null;
                } elseif ($entry->type === 'exception' && $content) {
                    $processedEntry['type'] = $content['class'] ?? null;
                    $processedEntry['message'] = $content['message'] ?? null;
                    $processedEntry['stack_trace'] = $content['trace'] ?? null;
                } elseif ($entry->type === 'log' && $content) {
                    $processedEntry['level'] = $content['level'] ?? null;
                    $processedEntry['message'] = $content['message'] ?? null;
                }

                return $processedEntry;
            });

            // Get telescope statistics
            $stats = [
                'total_entries' => DB::table('telescope_entries')->count(),
                'recent_entries' => $telescopeEntries->count(),
                'entry_types' => DB::table('telescope_entries')
                    ->select('type', DB::raw('count(*) as count'))
                    ->where('created_at', '>=', now()->subMinutes(5))
                    ->groupBy('type')
                    ->get()
                    ->pluck('count', 'type')
                    ->toArray(),
                'recent_entries_data' => $processedEntries->toArray()
            ];

            return $stats;
        } catch (\Exception $e) {
            Log::error('Failed to get Telescope data', ['error' => $e->getMessage()]);
            return [
                'error' => 'Failed to retrieve Telescope data',
                'message' => $e->getMessage()
            ];
        }
    }

    /**
     * Get Pulse data from database
     *
     * @return array
     */
    public function getPulseData(): array
    {
        try {
            // Get recent pulse entries (last 5 minutes)
            $pulseEntries = DB::table('pulse_entries')
                ->where('timestamp', '>=', now()->subMinutes(5)->timestamp)
                ->select([
                    'id',
                    'timestamp',
                    'type',
                    'key',
                    'value'
                ])
                ->orderBy('timestamp', 'desc')
                ->limit(50)
                ->get();

            // Process entries to extract detailed information
            $processedEntries = $pulseEntries->map(function ($entry) {
                $processedEntry = [
                    'id' => $entry->id,
                    'timestamp' => $entry->timestamp,
                    'type' => $entry->type,
                    'key' => $entry->key,
                    'value' => $entry->value
                ];

                // Extract specific fields based on entry type
                if ($entry->type === 'slow_request' && $entry->key) {
                    // Parse key format: ["GET","/api/endpoint","Controller@method"]
                    $keyData = json_decode($entry->key, true);
                    if (is_array($keyData) && count($keyData) >= 3) {
                        $processedEntry['method'] = $keyData[0] ?? null;
                        $processedEntry['path'] = $keyData[1] ?? null;
                        $processedEntry['controller'] = $keyData[2] ?? null;
                    }
                    $processedEntry['duration'] = $entry->value;
                } elseif ($entry->type === 'slow_outgoing_request' && $entry->key) {
                    $keyData = json_decode($entry->key, true);
                    if (is_array($keyData) && count($keyData) >= 3) {
                        $processedEntry['method'] = $keyData[0] ?? null;
                        $processedEntry['path'] = $keyData[1] ?? null;
                        $processedEntry['controller'] = $keyData[2] ?? null;
                    }
                    $processedEntry['duration'] = $entry->value;
                } elseif ($entry->type === 'user_request' && $entry->key) {
                    $processedEntry['user_id'] = $entry->key;
                    $processedEntry['request_count'] = $entry->value;
                } elseif ($entry->type === 'user_job' && $entry->key) {
                    $processedEntry['job_name'] = $entry->key;
                    $processedEntry['duration'] = $entry->value;
                }

                return $processedEntry;
            });

            // Get pulse statistics
            $stats = [
                'total_entries' => DB::table('pulse_entries')->count(),
                'recent_entries' => $pulseEntries->count(),
                'entry_types' => DB::table('pulse_entries')
                    ->select('type', DB::raw('count(*) as count'))
                    ->where('timestamp', '>=', now()->subMinutes(5)->timestamp)
                    ->groupBy('type')
                    ->get()
                    ->pluck('count', 'type')
                    ->toArray(),
                'recent_entries_data' => $processedEntries->toArray()
            ];

            return $stats;
        } catch (\Exception $e) {
            Log::error('Failed to get Pulse data', ['error' => $e->getMessage()]);
            return [
                'error' => 'Failed to retrieve Pulse data',
                'message' => $e->getMessage()
            ];
        }
    }

    /**
     * Send data to external API
     *
     * @param array $payload
     * @return array
     */
    public function sendToExternalApi(array $payload): array
    {
        try {
            if (empty($this->apiUrl) || empty($this->apiToken)) {
                return [
                    'success' => false,
                    'error' => 'API URL or token not configured'
                ];
            }

            $response = Http::withHeaders([
                'X-API-Token' => $this->apiToken,
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
                'User-Agent' => 'Laravel-System-Monitor/1.0'
            ])
                ->timeout(30)
                ->retry(3, 1000)
                ->post($this->apiUrl, $payload);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'response' => $response->json(),
                    'status_code' => $response->status()
                ];
            } else {
                return [
                    'success' => false,
                    'error' => 'API request failed',
                    'status_code' => $response->status(),
                    'response' => $response->body()
                ];
            }
        } catch (\Exception $e) {
            Log::error('Failed to send data to external API', [
                'error' => $e->getMessage(),
                'url' => $this->apiUrl
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Test API connection
     *
     * @return array
     */
    public function testApiConnection(): array
    {
        $testPayload = [
            'timestamp' => now()->toISOString(),
            'test' => true,
            'message' => 'API connection test'
        ];

        return $this->sendToExternalApi($testPayload);
    }

    /**
     * Get system health status
     *
     * @return array
     */
    public function getSystemHealth(): array
    {
        return [
            'database_connection' => $this->checkDatabaseConnection(),
            'api_configuration' => [
                'url_configured' => !empty($this->apiUrl),
                'token_configured' => !empty($this->apiToken)
            ],
            'last_successful_send' => Cache::get('last_successful_api_send'),
            'last_error' => Cache::get('last_api_error')
        ];
    }

    /**
     * Check database connection
     *
     * @return bool
     */
    private function checkDatabaseConnection(): bool
    {
        try {
            DB::connection()->getPdo();
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }
}
