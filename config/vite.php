<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Vite Development Server URL
    |--------------------------------------------------------------------------
    |
    | This URL is used by the Vite helper to generate asset URLs when running
    | in development mode. It should match the URL where your Vite dev server
    | is running.
    |
    */

    'dev_server_url' => env('VITE_DEV_SERVER_URL', 'https://100.106.3.92:5173'),

    /*
    |--------------------------------------------------------------------------
    | Vite Development Server HTTPS
    |--------------------------------------------------------------------------
    |
    | Whether the Vite development server is running with HTTPS.
    |
    */

    'https' => env('VITE_HTTPS', true),
];
