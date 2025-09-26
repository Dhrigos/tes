<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>
        <script>
            // Ensure all HTML forms that POST include CSRF token automatically
            document.addEventListener('DOMContentLoaded', function () {
                var meta = document.querySelector('meta[name="csrf-token"]');
                var token = meta ? meta.getAttribute('content') : '';
                if (!token) return;
                var forms = document.querySelectorAll('form');
                forms.forEach(function (form) {
                    var method = (form.getAttribute('method') || '').toLowerCase();
                    if (!method || ['post', 'put', 'patch', 'delete'].indexOf(method) === -1) return;
                    if (form.querySelector('input[name="_token"]')) return;
                    var input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = '_token';
                    input.value = token;
                    form.appendChild(input);
                });
            });
        </script>
        <script>
            // Wrap window.fetch to always include credentials and XSRF header from cookie
            (function(){
                var originalFetch = window.fetch;
                function getCookie(name){
                    var value = document.cookie.match('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g,'\\$1') + '=([^;]*)');
                    return value ? decodeURIComponent(value[1]) : '';
                }
                window.fetch = function(resource, init){
                    init = init || {};
                    // Ensure cookies are sent for same-origin requests
                    if (!('credentials' in init)) {
                        init.credentials = 'same-origin';
                    }
                    // Add XSRF header if cookie exists and header not already set
                    var xsrf = getCookie('XSRF-TOKEN');
                    if (xsrf) {
                        init.headers = init.headers || {};
                        var headers = init.headers;
                        var hasHeader = false;
                        if (headers instanceof Headers) {
                            hasHeader = headers.has('X-XSRF-TOKEN');
                            if (!hasHeader) headers.set('X-XSRF-TOKEN', xsrf);
                        } else if (Array.isArray(headers)) {
                            hasHeader = headers.some(function(h){ return (h[0]||'').toLowerCase()==='x-xsrf-token'; });
                            if (!hasHeader) headers.push(['X-XSRF-TOKEN', xsrf]);
                        } else {
                            // plain object
                            if (!('X-XSRF-TOKEN' in headers) && !('x-xsrf-token' in headers)) {
                                headers['X-XSRF-TOKEN'] = xsrf;
                            }
                        }
                    }
                    // Identify AJAX requests explicitly
                    if (!init.headers) init.headers = {};
                    if (init.headers instanceof Headers) {
                        if (!init.headers.has('X-Requested-With')) init.headers.set('X-Requested-With', 'XMLHttpRequest');
                    } else if (Array.isArray(init.headers)) {
                        if (!init.headers.some(function(h){ return (h[0]||'').toLowerCase()==='x-requested-with'; })) {
                            init.headers.push(['X-Requested-With', 'XMLHttpRequest']);
                        }
                    } else {
                        if (!('X-Requested-With' in init.headers) && !('x-requested-with' in init.headers)) {
                            init.headers['X-Requested-With'] = 'XMLHttpRequest';
                        }
                    }
                    return originalFetch(resource, init);
                };
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: oklch(1 0 0);
            }

            html.dark {
                background-color: oklch(0.145 0 0);
            }
        </style>

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
