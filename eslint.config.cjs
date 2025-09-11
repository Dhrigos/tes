// Flat config for ESLint v9 (CommonJS)
const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const react = require('eslint-plugin-react');
const reactHooks = require('eslint-plugin-react-hooks');

module.exports = tseslint.config(
    // Base configs
    js.configs.recommended,
    ...tseslint.configs.recommended,

    // React plugins
    {
        plugins: { react, 'react-hooks': reactHooks },
        settings: { react: { version: 'detect' } },
    },

    // Project rules for TS/TSX files
    {
        files: ['resources/js/**/*.{ts,tsx}'],
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
            'no-empty': 'off',
            '@typescript-eslint/ban-ts-comment': 'off',
            '@typescript-eslint/no-unsafe-function-type': 'off',
        },
    },

    // Ignore vendor/build output
    {
        ignores: ['vendor/**', 'node_modules/**', 'public/**', 'bootstrap/**', 'eslint.config.cjs'],
    },
);
