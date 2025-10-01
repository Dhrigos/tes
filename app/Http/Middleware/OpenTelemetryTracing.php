<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use OpenTelemetry\SDK\Trace\TracerProviderBuilder;
use OpenTelemetry\SDK\Trace\SpanProcessor\SimpleSpanProcessor;
use OpenTelemetry\Contrib\Otlp\SpanExporterFactory;
use OpenTelemetry\API\Trace\StatusCode;
use Illuminate\Support\Facades\Log;

class OpenTelemetryTracing
{

    protected $tracer;
    protected $enabled;
    protected $tracerProvider;

    public function __construct()
    {
        // Cek apakah OpenTelemetry diaktifkan via env tanpa memblokir production
        $this->enabled = (bool) (getenv('OTEL_ENABLED') ?: env('OTEL_ENABLED', false));

        if (!$this->enabled) {
            return;
        }

        try {
            // Set environment variables for OTLP configuration
            if (!getenv('OTEL_EXPORTER_OTLP_ENDPOINT')) {
                // Gunakan base endpoint; path signal akan ditangani exporter
                putenv('OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318');
            }
            if (!getenv('OTEL_EXPORTER_OTLP_PROTOCOL')) {
                // Pastikan menggunakan HTTP/protobuf untuk collector 4318
                putenv('OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf');
            }
            if (!getenv('OTEL_SERVICE_NAME')) {
                putenv('OTEL_SERVICE_NAME=laravel-app');
            }
            if (!getenv('OTEL_TRACES_EXPORTER')) {
                putenv('OTEL_TRACES_EXPORTER=otlp');
            }

            // Create OTLP exporter using factory
            $exporterFactory = new SpanExporterFactory();
            $exporter = $exporterFactory->create();

            // Buat tracer provider via builder
            // Gunakan SimpleSpanProcessor (stabil dan tanpa konfigurasi tambahan)
            $tracerProvider = (new TracerProviderBuilder())
                ->addSpanProcessor(new SimpleSpanProcessor($exporter))
                ->build();

            $this->tracerProvider = $tracerProvider;
            $this->tracer = $tracerProvider->getTracer(getenv('OTEL_SERVICE_NAME') ?: 'laravel-app');

            // Log konfigurasi yang dipakai untuk verifikasi
            $resolvedTracesEndpoint = getenv('OTEL_EXPORTER_OTLP_TRACES_ENDPOINT') ?: getenv('OTEL_EXPORTER_OTLP_ENDPOINT');
            $resolvedMetricsEndpoint = getenv('OTEL_EXPORTER_OTLP_METRICS_ENDPOINT') ?: getenv('OTEL_EXPORTER_OTLP_ENDPOINT');
            Log::info('[OTEL] Initialized', [
                'service' => getenv('OTEL_SERVICE_NAME') ?: 'laravel-app',
                'protocol' => getenv('OTEL_EXPORTER_OTLP_PROTOCOL') ?: 'http/protobuf',
                'traces_endpoint' => $resolvedTracesEndpoint,
                'metrics_endpoint' => $resolvedMetricsEndpoint,
                'traces_exporter' => getenv('OTEL_TRACES_EXPORTER') ?: 'otlp',
            ]);
        } catch (\Throwable $e) {
            // Jika gagal inisialisasi, disable OpenTelemetry
            $this->enabled = false;
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
            $span->setAttribute('http.response.status_code', $response->getStatusCode());
            $span->setAttribute('url.path', $request->path());
            $span->setAttribute('client.address', $request->ip());

            // Informasi route (jika tersedia)
            $route = $request->route();
            if ($route) {
                try {
                    $span->setAttribute('http.route.name', method_exists($route, 'getName') ? ($route->getName() ?: '') : '');
                } catch (\Throwable $__) {
                    // ignore
                }
                try {
                    if (method_exists($route, 'getActionName')) {
                        $span->setAttribute('http.route.action', $route->getActionName());
                    }
                } catch (\Throwable $__) {
                    // ignore
                }
            }

            // Informasi user terautentikasi (jika ada)
            try {
                $user = $request->user();
                if ($user) {
                    // enduser.id sesuai semantic conventions
                    $id = method_exists($user, 'getAuthIdentifier') ? $user->getAuthIdentifier() : ($user->id ?? null);
                    if ($id !== null) {
                        $span->setAttribute('enduser.id', (string) $id);
                    }
                    if (isset($user->name)) {
                        $span->setAttribute('enduser.name', (string) $user->name);
                    }
                    if (isset($user->email)) {
                        $span->setAttribute('enduser.email', (string) $user->email);
                    }
                    // Dukungan Spatie roles jika tersedia
                    if (method_exists($user, 'getRoleNames')) {
                        try {
                            $roles = $user->getRoleNames(); // Collection
                            if ($roles && method_exists($roles, 'toArray')) {
                                $span->setAttribute('enduser.role', implode(',', $roles->toArray()));
                            }
                        } catch (\Throwable $___) {
                            // ignore role errors
                        }
                    } elseif (isset($user->role)) {
                        $span->setAttribute('enduser.role', (string) $user->role);
                    }
                }
            } catch (\Throwable $__) {
                // ignore user attribute errors
            }

            // Tandai error jika status >= 500 walau tanpa exception
            if ($response->getStatusCode() >= 500) {
                $span->setStatus(StatusCode::STATUS_ERROR, 'HTTP ' . $response->getStatusCode());
                $span->setAttribute('error', true);
            }

            // Tambahkan header korelasi ke response
            try {
                $context = $span->getContext();
                if ($context) {
                    $traceId = method_exists($context, 'getTraceId') ? $context->getTraceId() : null;
                    $spanId = method_exists($context, 'getSpanId') ? $context->getSpanId() : null;
                    $flags = method_exists($context, 'getTraceFlags') ? (int) $context->getTraceFlags() : 1; // default sampled
                    $sampled = (($flags & 0x01) === 0x01) ? '01' : '00';
                    if ($traceId && $spanId) {
                        $traceparent = sprintf('00-%s-%s-%s', $traceId, $spanId, $sampled);
                        $response->headers->set('traceparent', $traceparent);
                        $response->headers->set('x-trace-id', $traceId);
                    }
                }
            } catch (\Throwable $__) {
                // ignore header injection failures
            }

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

    /**
     * Flush dan shutdown tracer provider setelah response terkirim
     */
    public function terminate(Request $request, Response $response): void
    {
        if ($this->enabled && $this->tracerProvider) {
            // Pastikan span batch ter-flush
            $this->tracerProvider->shutdown();
        }
    }
}
