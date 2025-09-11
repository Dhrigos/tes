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
    // Configure axios defaults (no window any casting)
    axios.defaults.headers.common = axios.defaults.headers.common || ({} as Record<string, string>);
    (axios.defaults.headers.common as Record<string, string>)['X-CSRF-TOKEN'] = token;
    (axios.defaults.headers.common as Record<string, string>)['X-Requested-With'] = 'XMLHttpRequest';
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
