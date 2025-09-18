<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use OpenTelemetry\SDK\Trace\TracerProvider;
use OpenTelemetry\SDK\Trace\SpanProcessor\SimpleSpanProcessor;
use OpenTelemetry\SDK\Trace\Exporter\OtlpExporter;
use OpenTelemetry\Context\ScopeInterface;

class OpenTelemetryTracing
{

    protected $tracer;

    public function __construct()
    {
        $exporter = new OtlpExporter(env('OTEL_EXPORTER_OTLP_ENDPOINT', 'http://localhost:4318/v1/traces'));
        $tracerProvider = new TracerProvider(
            new SimpleSpanProcessor($exporter)
        );

        $this->tracer = $tracerProvider->getTracer(env('OTEL_SERVICE_NAME', 'laravel-app'));
    }
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
         // Buat span untuk request ini
         $span = $this->tracer->spanBuilder($request->method() . ' ' . $request->path())->startSpan();
         $scope = $span->activate();
 
         try {
             $response = $next($request);
 
             // Tambahkan atribut tambahan
             $span->setAttribute('http.method', $request->method());
             $span->setAttribute('http.route', $request->path());
             $span->setAttribute('http.status_code', $response->getStatusCode());
         } catch (\Throwable $e) {
             $span->recordException($e);
             $span->setStatus(\OpenTelemetry\API\Trace\StatusCode::STATUS_ERROR, $e->getMessage());
             throw $e;
         } finally {
             $span->end();
             $scope->detach();
         }
 
         return $response;
    }
}
