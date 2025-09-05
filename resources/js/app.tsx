import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';

import axios from 'axios';

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

    // Configure axios defaults
    axios.defaults.headers.common = axios.defaults.headers.common || {} as any;
    (axios.defaults.headers.common as any)['X-CSRF-TOKEN'] = token;
    (axios.defaults.headers.common as any)['X-Requested-With'] = 'XMLHttpRequest';
    axios.defaults.withCredentials = true;
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
