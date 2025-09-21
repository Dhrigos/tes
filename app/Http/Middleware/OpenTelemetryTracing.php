<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use OpenTelemetry\SDK\Trace\TracerProvider;
use OpenTelemetry\SDK\Trace\SpanProcessor\SimpleSpanProcessor;
use OpenTelemetry\Contrib\Otlp\SpanExporterFactory;
use OpenTelemetry\API\Trace\StatusCode;

class OpenTelemetryTracing
{

    protected $tracer;
    protected $enabled;

    public function __construct()
    {
        // Cek apakah OpenTelemetry diaktifkan
        $this->enabled = env('OTEL_ENABLED', false) && env('APP_ENV') !== 'production';

        if (!$this->enabled) {
            return;
        }

        try {
            // Set environment variables for OTLP configuration
            if (!env('OTEL_EXPORTER_OTLP_ENDPOINT')) {
                putenv('OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces');
            }
            if (!env('OTEL_SERVICE_NAME')) {
                putenv('OTEL_SERVICE_NAME=laravel-app');
            }

            // Create OTLP exporter using factory
            $exporterFactory = new SpanExporterFactory();
            $exporter = $exporterFactory->create();

            // Create tracer provider with simple span processor
            $tracerProvider = new TracerProvider(
                new SimpleSpanProcessor($exporter)
            );

            $this->tracer = $tracerProvider->getTracer(env('OTEL_SERVICE_NAME', 'laravel-app'));
        } catch (\Throwable $e) {
            // Jika gagal inisialisasi, disable OpenTelemetry
            $this->enabled = false;
            \Log::warning('OpenTelemetry initialization failed: ' . $e->getMessage());
        }
    }
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Jika OpenTelemetry tidak diaktifkan, langsung return response
        if (!$this->enabled || !$this->tracer) {
            return $next($request);
        }

        // Buat span untuk request ini
        $span = $this->tracer->spanBuilder($request->method() . ' ' . $request->path())->startSpan();
        $scope = $span->activate();

        try {
            $response = $next($request);

            // Tambahkan atribut tambahan
            $span->setAttribute('http.method', $request->method());
            $span->setAttribute('http.route', $request->path());
            $span->setAttribute('http.status_code', $response->getStatusCode());

            return $response;
        } catch (\Throwable $e) {
            $span->recordException($e);
            $span->setStatus(StatusCode::STATUS_ERROR, $e->getMessage());
            throw $e;
        } finally {
            $span->end();
            $scope->detach();
        }
    }
}
