<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class VerifySyncToken
{
    public function handle(Request $request, Closure $next)
    {
        $token = $request->header('X-Sync-Token');
        if (!$token || $token !== env('PASIEN_SYNC_TOKEN')) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        return $next($request);
    }
}
