import { useEffect, useState } from 'react';

export default function ThemeToggle() {
    const [dark, setDark] = useState(false);

    useEffect(() => {
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
            setDark(true);
        } else {
            document.documentElement.classList.remove('dark');
            setDark(false);
        }
    }, []);

    const toggleTheme = () => {
        if (dark) {
            document.documentElement.classList.remove('dark');
            localStorage.theme = 'light';
            setDark(false);
        } else {
            document.documentElement.classList.add('dark');
            localStorage.theme = 'dark';
            setDark(true);
        }
    };

    return (
        <button
            onClick={toggleTheme}
            className="rounded-lg border px-2 py-2 text-sm font-medium transition hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:text-white"
        >
            {dark ? '🌙' : '☀️'}
        </button>
    );
}
