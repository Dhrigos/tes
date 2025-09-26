// @ts-ignore
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import laravel from 'laravel-vite-plugin';
import { resolve } from 'node:path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    // Load env variables
    const env = loadEnv(mode, process.cwd(), '');

    // Cek VITE_DEV_SERVER
    const isDevServer = env.VITE_DEV_SERVER === 'true';

    return {
        plugins: [
            laravel({
                input: ['resources/css/app.css', 'resources/js/app.tsx'],
                ssr: 'resources/js/ssr.tsx',
                refresh: true,
            }),
            react(),
            tailwindcss(),
        ],
        esbuild: {
            jsx: 'automatic',
        },
        resolve: {
            alias: {
                '@': resolve(__dirname, 'resources/js'),
                'ziggy-js': resolve(__dirname, 'vendor/tightenco/ziggy'),
            },
        },
        optimizeDeps: {
            include: [
                // Pre-bundle TinyMCE community submodules used via dynamic import to avoid re-optimizing
                'tinymce/tinymce',
                'tinymce/icons/default/icons',
                'tinymce/themes/silver',
                'tinymce/models/dom',
                'tinymce/plugins/lists',
                'tinymce/plugins/link',
                'tinymce/plugins/code',
                'tinymce/plugins/help',
            ],
            // Force re-optimization on dev server start to prevent "Outdated Optimize Dep" cache mismatches
            force: isDevServer,
        },
        server: isDevServer
            ? {
                  host: '0.0.0.0', // bisa diakses dari LAN/WAN
                  port: parseInt(env.VITE_HMR_PORT) || 5173,
                  https: {
                      key: fs.readFileSync(env.VITE_SSL_KEY || '/etc/nginx/ssl/selfsigned.key'),
                      cert: fs.readFileSync(env.VITE_SSL_CERT || '/etc/nginx/ssl/selfsigned.crt'),
                  },
                  //   cors: true,
                  hmr: {
                      host: env.VITE_HMR_HOST || '100.106.3.92',
                      protocol: 'wss',
                      port: parseInt(env.VITE_HMR_PORT) || 5173,
                  },
              }
            : undefined, // kalau VITE_DEV_SERVER != true, pakai default
    };
});
