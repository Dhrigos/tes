import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';

// Import Laravel Echo and Pusher
import Echo from 'laravel-echo';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Configure CSRF token for Inertia
const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
if (token) {
    // Set CSRF token for all requests
    (window as any).axios = (window as any).axios || {};
    (window as any).axios.defaults = (window as any).axios.defaults || {};
    (window as any).axios.defaults.headers = (window as any).axios.defaults.headers || {};
    (window as any).axios.defaults.headers.common = (window as any).axios.defaults.headers.common || {};
    (window as any).axios.defaults.headers.common['X-CSRF-TOKEN'] = token;

    // Also set for fetch requests
    const originalFetch = window.fetch;
    window.fetch = function (url, options = {}) {
        if (typeof url === 'string' && (url.startsWith('/') || url.includes(window.location.hostname))) {
            options.headers = {
                ...options.headers,
                'X-CSRF-TOKEN': token,
                'X-Requested-With': 'XMLHttpRequest',
            };
        }
        return originalFetch(url, options);
    };
}

// Configure Laravel Echo with proper error handling and kode klinik filtering
try {
    const reverbKey = import.meta.env.VITE_REVERB_APP_KEY;
    const reverbHost = import.meta.env.VITE_REVERB_HOST || window.location.hostname;
    const reverbPort = Number(import.meta.env.VITE_REVERB_PORT || 8080);
    const reverbScheme = import.meta.env.VITE_REVERB_SCHEME || 'http';

    if (reverbKey) {
        (window as any).Echo = new Echo({
            broadcaster: 'reverb',
            key: reverbKey,
            wsHost: reverbHost,
            wsPort: reverbPort,
            wssPort: reverbPort,
            forceTLS: reverbScheme === 'https',
            enabledTransports: ['ws', 'wss'],
            auth: {
                headers: {
                    'X-CSRF-TOKEN': token || '',
                },
            },
        });

        // Function to initialize Echo with web settings
        const initializeEchoWithSettings = async () => {
            try {
                // Fetch web settings from backend
                const response = await fetch('/api/web-settings/show');
                const webSettings = await response.json();

                if (webSettings.success) {
                    const settings = webSettings.data;
                    const isGudangUtama = settings.is_gudangutama_active || false;

                    // DUAL CODE SYSTEM:
                    // 1. VITE_KODE_KLINIK = Kredensial/Identitas Aplikasi (unik per aplikasi)
                    // 2. web_settings.kode_klinik = Kode Grup untuk Broadcasting (sama untuk grup yang sama)
                    const kodeKredensial = import.meta.env.VITE_KODE_KLINIK || 'KL001';
                    const kodeGrup = settings.kode_klinik || 'KL001';
                    const namaKlinik = import.meta.env.VITE_NAMA_KLINIK || 'Klinik';

                    console.log(`🏥 Kode Kredensial (Identitas): ${kodeKredensial}`);
                    console.log(`🔗 Kode Grup (Broadcasting): ${kodeGrup}`);
                    console.log(`🏢 Nama Klinik: ${namaKlinik}`);
                    console.log(`🏗️ Is Gudang Utama: ${isGudangUtama ? 'Yes' : 'No'}`);
                    console.log(`📡 Aplikasi dengan kode grup ${kodeGrup} dapat saling broadcast`);
                    console.log(`🔐 Aplikasi ${kodeKredensial} hanya dapat akses data miliknya sendiri`);

                    // Subscribe to specific grup channel untuk broadcasting
                    (window as any).Echo.channel(`permintaan-barang.${kodeGrup}`).listen('permintaan-barang-updated', (e: any) => {
                        console.log(`📡 Event received for grup ${kodeGrup}:`, e);

                        // Handle different event types
                        switch (e.event_type) {
                            case 'permintaan_baru':
                                console.log('🆕 Permintaan baru diterima');
                                // Trigger UI update for new request
                                break;
                            case 'permintaan_dikonfirmasi':
                                console.log('✅ Permintaan dikonfirmasi');
                                // Update request status to confirmed
                                break;
                            case 'barang_diproses':
                                console.log('🚚 Barang sedang diproses');
                                // Update request status to processed
                                break;
                            case 'barang_dikirim':
                                console.log('📦 Barang sudah dikirim');
                                // Update request status to shipped
                                break;
                            case 'barang_diterima':
                                console.log('📥 Barang sudah diterima');
                                // Update request status to received
                                break;
                            default:
                                console.log('📡 Event type tidak dikenal:', e.event_type);
                        }
                    });

                    // Reverb uses standard Echo events
                    const connection = (window as any).Echo.connector.connection as any;
                    if (connection && connection.bind) {
                        connection.bind('connected', () => {
                            console.log(`✅ Reverb connected for aplikasi ${kodeKredensial}`);
                            console.log(`📡 Listening to grup channel: permintaan-barang.${kodeGrup}`);
                            console.log(`🏗️ Role: ${isGudangUtama ? 'Master (Gudang Utama)' : 'Client (Klinik Cabang)'}`);
                            console.log(`🔗 Grup: ${kodeGrup} - Aplikasi dalam grup ini dapat saling broadcast`);
                            console.log(`🔐 Identitas: ${kodeKredensial} - Hanya dapat akses data miliknya`);
                        });
                        connection.bind('error', (error: any) => console.error('❌ Reverb connection error:', error));
                    }

                    console.log(`🚀 Laravel Echo (Reverb) initialized for aplikasi ${kodeKredensial}`);
                    console.log(`📡 Subscribed to grup channel: permintaan-barang.${kodeGrup}`);
                    console.log(`🏗️ Application Role: ${isGudangUtama ? 'Master' : 'Client'}`);
                    console.log(`🔗 Group Code: ${kodeGrup} - Applications with same group code can broadcast`);
                    console.log(`🔐 Credential Code: ${kodeKredensial} - Unique app identity for data access`);

                    // Store settings globally for other components to use
                    (window as any).appSettings = {
                        isGudangUtama,
                        kodeKredensial,
                        kodeGrup,
                        namaKlinik,
                        webSettings: settings,
                    };
                } else {
                    console.warn('⚠️ Failed to fetch web settings, using defaults');
                    initializeEchoWithDefaults();
                }
            } catch (error) {
                console.warn('⚠️ Error fetching web settings, using defaults:', error);
                initializeEchoWithDefaults();
            }
        };

        // Fallback initialization with defaults
        const initializeEchoWithDefaults = () => {
            const kodeKredensial = import.meta.env.VITE_KODE_KLINIK || 'KL001';
            const namaKlinik = import.meta.env.VITE_NAMA_KLINIK || 'Klinik';
            const isGudangUtama = import.meta.env.VITE_IS_GUDANG_UTAMA === 'true';

            console.log(`🏥 Kode Kredensial (Identitas) (default): ${kodeKredensial}`);
            console.log(`🔗 Kode Grup (Broadcasting) (default): ${kodeKredensial}`);
            console.log(`🏢 Nama Klinik (default): ${namaKlinik}`);
            console.log(`🏗️ Is Gudang Utama (default): ${isGudangUtama ? 'Yes' : 'No'}`);
            console.log(`📡 Aplikasi dengan kode grup ${kodeKredensial} dapat saling broadcast`);
            console.log(`🔐 Aplikasi ${kodeKredensial} hanya dapat akses data miliknya sendiri`);

            // Subscribe to channel with defaults
            (window as any).Echo.channel(`permintaan-barang.${kodeKredensial}`).listen('permintaan-barang-updated', (e: any) => {
                console.log(`📡 Event received for grup ${kodeKredensial}:`, e);
            });

            console.log(`🚀 Laravel Echo (Reverb) initialized with defaults`);
            console.log(`📡 Subscribed to channel: permintaan-barang.${kodeKredensial}`);
            console.log(`🔗 Group Code: ${kodeKredensial} - Applications with same group code can broadcast`);
            console.log(`🔐 Credential Code: ${kodeKredensial} - Unique app identity for data access`);
        };

        // Initialize Echo with web settings
        initializeEchoWithSettings();
    } else {
        console.info('ℹ️ Reverb is not configured. Set VITE_REVERB_* env vars to enable.');
    }
} catch (error) {
    console.error('❌ Failed to initialize Laravel Echo (Reverb):', error);
}

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
