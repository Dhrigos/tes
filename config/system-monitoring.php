<?php

return [
    /*
    |--------------------------------------------------------------------------
    | System Monitoring Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for automatic system monitoring
    |
    */

    'enabled' => env('SYSTEM_MONITORING_ENABLED', true),

    'interval_seconds' => env('SYSTEM_MONITORING_INTERVAL', 300), // 5 minutes default

    /*
    |--------------------------------------------------------------------------
    | External API Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for sending system data to external monitoring API
    |
    */

    'api_url' => env('SYSTEM_MONITORING_API_URL', 'http://localhost:3001/api/monitoring'),

    'api_token' => env('SYSTEM_MONITORING_API_TOKEN', 'prod-token-123'),

    /*
    |--------------------------------------------------------------------------
    | Data Collection Settings
    |--------------------------------------------------------------------------
    |
    | Settings for collecting data from Telescope and Pulse
    |
    */

    'data_retention_minutes' => env('SYSTEM_MONITORING_DATA_RETENTION', 5),

    'max_entries_per_type' => env('SYSTEM_MONITORING_MAX_ENTRIES', 100),

    /*
    |--------------------------------------------------------------------------
    | API Request Settings
    |--------------------------------------------------------------------------
    |
    | Settings for API requests to external service
    |
    */

    'timeout' => env('SYSTEM_MONITORING_TIMEOUT', 30),

    'retry_attempts' => env('SYSTEM_MONITORING_RETRY_ATTEMPTS', 3),

    'retry_delay' => env('SYSTEM_MONITORING_RETRY_DELAY', 1000),

    /*
    |--------------------------------------------------------------------------
    | Logging Settings
    |--------------------------------------------------------------------------
    |
    | Settings for logging system monitoring activities
    |
    */

    'log_successful_sends' => env('SYSTEM_MONITORING_LOG_SUCCESS', true),

    'log_failed_sends' => env('SYSTEM_MONITORING_LOG_FAILURES', true),

    'log_level' => env('SYSTEM_MONITORING_LOG_LEVEL', 'info'),
];
