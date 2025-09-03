<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken as Middleware;
use Illuminate\Support\Facades\Log;

class HandleCsrfToken extends Middleware
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * @var array<int, string>
     */
    protected $except = [
        'api/*',
        'webhook/*',
        'datamaster/gudang/daftar-obat*',
    ];

    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle($request, Closure $next)
    {
        // Log CSRF token for debugging
        Log::info('CSRF Token Check', [
            'url' => $request->url(),
            'method' => $request->method(),
            'token' => $request->header('X-CSRF-TOKEN'),
            'session_token' => $request->session()->token(),
            'has_token' => $request->hasHeader('X-CSRF-TOKEN'),
        ]);

        // Add custom CSRF token validation logic here if needed
        return parent::handle($request, $next);
    }
}
