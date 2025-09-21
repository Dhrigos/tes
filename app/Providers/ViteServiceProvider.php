<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Vite;

class ViteServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Override Vite asset URL for development
        if (app()->environment('local') && config('vite.https', false)) {
            Vite::useHotFile(config('vite.dev_server_url', 'https://100.106.3.92:5173'));
        }

        // Force HTTPS for asset URLs if APP_URL is HTTPS
        $appUrl = config('app.url');
        if ($appUrl && str_starts_with($appUrl, 'https://')) {
            // This ensures all asset URLs use HTTPS
            app('url')->forceScheme('https');
        }
    }
}
