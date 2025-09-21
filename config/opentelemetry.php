<?php

return [
    /*
    |--------------------------------------------------------------------------
    | OpenTelemetry Configuration
    |--------------------------------------------------------------------------
    |
    | This file contains configuration for OpenTelemetry tracing integration
    | with SigNoz observability platform.
    |
    */

    'enabled' => env('OTEL_ENABLED', true),

    'service' => [
        'name' => env('OTEL_SERVICE_NAME', 'laravel-app'),
        'version' => env('OTEL_SERVICE_VERSION', '1.0.0'),
        'namespace' => env('OTEL_SERVICE_NAMESPACE', 'default'),
    ],

    'exporter' => [
        'endpoint' => env('OTEL_EXPORTER_OTLP_ENDPOINT', 'http://localhost:4318/v1/traces'),
        'protocol' => env('OTEL_EXPORTER_OTLP_PROTOCOL', 'http/protobuf'),
        'headers' => env('OTEL_EXPORTER_OTLP_HEADERS', ''),
        'timeout' => env('OTEL_EXPORTER_OTLP_TIMEOUT', 10),
    ],

    'sampling' => [
        'type' => env('OTEL_TRACES_SAMPLER', 'traceidratio'),
        'ratio' => env('OTEL_TRACES_SAMPLER_ARG', 1.0),
    ],

    'resource' => [
        'attributes' => [
            'service.name' => env('OTEL_SERVICE_NAME', 'laravel-app'),
            'service.version' => env('OTEL_SERVICE_VERSION', '1.0.0'),
            'service.namespace' => env('OTEL_SERVICE_NAMESPACE', 'default'),
            'deployment.environment' => env('APP_ENV', 'local'),
            'host.name' => gethostname(),
        ],
    ],

    'span' => [
        'max_attributes' => env('OTEL_SPAN_ATTRIBUTE_COUNT_LIMIT', 128),
        'max_events' => env('OTEL_SPAN_EVENT_COUNT_LIMIT', 128),
        'max_links' => env('OTEL_SPAN_LINK_COUNT_LIMIT', 128),
    ],

    'batch' => [
        'max_export_batch_size' => env('OTEL_BSP_MAX_EXPORT_BATCH_SIZE', 512),
        'export_timeout' => env('OTEL_BSP_EXPORT_TIMEOUT', 30000),
        'schedule_delay' => env('OTEL_BSP_SCHEDULE_DELAY', 5000),
    ],
];
