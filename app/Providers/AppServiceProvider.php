<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Check if we should force HTTPS based on configuration
        $forceHttps = config('url.force_https', false);
        $forceHttpsInProduction = config('url.force_https_in_production', true);
        $appEnv = config('app.env');
        $appUrl = config('app.url');

        // Force HTTPS in production if enabled
        if (($appEnv === 'production' || $appEnv === 'staging') && $forceHttpsInProduction) {
            URL::forceScheme('https');
        }
        // Force HTTPS if explicitly enabled
        elseif ($forceHttps) {
            URL::forceScheme('https');
        }
        // Force HTTPS if APP_URL is HTTPS (even in local)
        elseif ($appUrl && str_starts_with($appUrl, 'https://')) {
            URL::forceScheme('https');
        }
        // Force HTTP in local development only if APP_URL is HTTP
        elseif ($appEnv === 'local' && (!$appUrl || str_starts_with($appUrl, 'http://'))) {
            URL::forceScheme('http');
        }

        // Force HTTPS if behind proxy (like nginx/load balancer)
        $httpsHeaders = config('url.https_headers', ['X-Forwarded-Proto', 'X-Forwarded-Ssl']);
        foreach ($httpsHeaders as $header) {
            if (request()->header($header) === 'https' || request()->header($header) === 'on') {
                URL::forceScheme('https');
                break;
            }
        }
    }
}
