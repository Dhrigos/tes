<?php

return [
    /*
    |--------------------------------------------------------------------------
    | URL Configuration
    |--------------------------------------------------------------------------
    |
    | This file contains configuration for URL generation and HTTPS forcing.
    |
    */

    'force_https' => env('FORCE_HTTPS', false),
    'force_https_in_production' => env('FORCE_HTTPS_IN_PRODUCTION', true),
    'trusted_proxies' => env('TRUSTED_PROXIES', '*'),

    /*
    |--------------------------------------------------------------------------
    | HTTPS Detection Headers
    |--------------------------------------------------------------------------
    |
    | Headers that indicate HTTPS when behind a proxy/load balancer.
    |
    */
    'https_headers' => [
        'X-Forwarded-Proto',
        'X-Forwarded-Ssl',
        'X-Forwarded-For',
        'X-Forwarded-Host',
        'X-Forwarded-Port',
    ],
];
