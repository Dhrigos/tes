import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
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
        server: isDevServer
            ? {
                  host: '100.106.3.92', // bisa diakses dari LAN/WAN
                  port: 5173,
                  cors: {
                      origin: '*', // bisa juga spesifik: "http://100.106.3.92:82"
                  },
              }
            : undefined, // kalau VITE_DEV_SERVER != true, pakai default
    };
});
