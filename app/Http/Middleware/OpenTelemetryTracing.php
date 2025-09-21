<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use OpenTelemetry\API\Trace\TracerInterface;
use OpenTelemetry\API\Trace\SpanInterface;
use OpenTelemetry\API\Trace\StatusCode;
use OpenTelemetry\Context\Context;

class OpenTelemetryTracing
{
    protected $tracer;

    public function __construct()
    {
        // Set environment variables for SigNoz OTLP configuration
        $this->configureEnvironment();

        // Get the global tracer instance
        $this->tracer = \OpenTelemetry\API\Globals::tracerProvider()
            ->getTracer(
                env('OTEL_SERVICE_NAME', 'laravel-app'),
                env('OTEL_SERVICE_VERSION', '1.0.0')
            );
    }

    protected function configureEnvironment()
    {
        // Check if OpenTelemetry is enabled
        if (!config('opentelemetry.enabled', true)) {
            return;
        }

        $config = config('opentelemetry');

        // SigNoz OTLP endpoint configuration
        if (!env('OTEL_EXPORTER_OTLP_ENDPOINT')) {
            putenv('OTEL_EXPORTER_OTLP_ENDPOINT=' . $config['exporter']['endpoint']);
        }

        // Service configuration
        if (!env('OTEL_SERVICE_NAME')) {
            putenv('OTEL_SERVICE_NAME=' . $config['service']['name']);
        }

        if (!env('OTEL_SERVICE_VERSION')) {
            putenv('OTEL_SERVICE_VERSION=' . $config['service']['version']);
        }

        // OTLP protocol (grpc or http/protobuf)
        if (!env('OTEL_EXPORTER_OTLP_PROTOCOL')) {
            putenv('OTEL_EXPORTER_OTLP_PROTOCOL=' . $config['exporter']['protocol']);
        }

        // Headers for authentication if needed
        if (!env('OTEL_EXPORTER_OTLP_HEADERS')) {
            putenv('OTEL_EXPORTER_OTLP_HEADERS=' . $config['exporter']['headers']);
        }

        // Sampling configuration
        if (!env('OTEL_TRACES_SAMPLER')) {
            putenv('OTEL_TRACES_SAMPLER=' . $config['sampling']['type']);
        }

        if (!env('OTEL_TRACES_SAMPLER_ARG')) {
            putenv('OTEL_TRACES_SAMPLER_ARG=' . $config['sampling']['ratio']);
        }

        // Resource attributes
        if (!env('OTEL_RESOURCE_ATTRIBUTES')) {
            $attributes = [];
            foreach ($config['resource']['attributes'] as $key => $value) {
                $attributes[] = $key . '=' . $value;
            }
            putenv('OTEL_RESOURCE_ATTRIBUTES=' . implode(',', $attributes));
        }
    }
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check if OpenTelemetry is enabled
        if (!config('opentelemetry.enabled', true)) {
            return $next($request);
        }

        $startTime = microtime(true);

        // Create span for this request
        $spanName = $request->method() . ' ' . $request->path();
        $span = $this->tracer->spanBuilder($spanName)
            ->setSpanKind(\OpenTelemetry\API\Trace\SpanKind::KIND_SERVER)
            ->startSpan();

        $scope = $span->activate();

        try {
            // Set basic HTTP attributes
            $span->setAttribute('http.method', $request->method());
            $span->setAttribute('http.url', $request->fullUrl());
            $span->setAttribute('http.route', $request->path());
            $span->setAttribute('http.user_agent', $request->userAgent() ?? '');
            $span->setAttribute('http.request_content_length', $request->header('Content-Length', 0));

            // Set client IP
            $span->setAttribute('http.client_ip', $request->ip());

            // Set request ID if available
            if ($request->hasHeader('X-Request-ID')) {
                $span->setAttribute('http.request_id', $request->header('X-Request-ID'));
            }

            // Set custom attributes
            $span->setAttribute('app.name', config('app.name', 'Laravel'));
            $span->setAttribute('app.environment', config('app.env', 'local'));
            $span->setAttribute('app.version', config('app.version', '1.0.0'));

            $response = $next($request);

            // Set response attributes
            $span->setAttribute('http.status_code', $response->getStatusCode());
            $span->setAttribute('http.response_content_length', $response->headers->get('Content-Length', 0));

            // Set status based on HTTP status code
            if ($response->getStatusCode() >= 400) {
                $span->setStatus(StatusCode::STATUS_ERROR, 'HTTP ' . $response->getStatusCode());
            } else {
                $span->setStatus(StatusCode::STATUS_OK);
            }

            // Add performance metrics
            $duration = (microtime(true) - $startTime) * 1000; // Convert to milliseconds
            $span->setAttribute('http.duration_ms', round($duration, 2));
        } catch (\Throwable $e) {
            // Record exception details
            $span->recordException($e);
            $span->setStatus(StatusCode::STATUS_ERROR, $e->getMessage());

            // Add error attributes
            $span->setAttribute('error.type', get_class($e));
            $span->setAttribute('error.message', $e->getMessage());
            $span->setAttribute('error.file', $e->getFile());
            $span->setAttribute('error.line', $e->getLine());

            // Add performance metrics even for errors
            $duration = (microtime(true) - $startTime) * 1000;
            $span->setAttribute('http.duration_ms', round($duration, 2));

            throw $e;
        } finally {
            $span->end();
            $scope->detach();
        }

        return $response;
    }
}
