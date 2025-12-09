import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    plugins: [
        nodePolyfills({
            // Enable polyfills for specific globals and modules
            globals: {
                Buffer: true,
                global: true,
                process: true,
            },
            // Enable polyfills for specific Node.js modules
            protocolImports: true,
        }),
    ],
    resolve: {
        alias: {
            buffer: 'buffer',
            // Use our custom polyfill for async_hooks
            'async_hooks': path.resolve(__dirname, './src/polyfills/async_hooks.ts'),
            'node:async_hooks': path.resolve(__dirname, './src/polyfills/async_hooks.ts'),
        },
    },
    optimizeDeps: {
        esbuildOptions: {
            // Node.js global to browser globalThis
            define: {
                global: 'globalThis',
            },
        },
        // Force include these dependencies
        include: ['buffer'],
    },
    build: {
        commonjsOptions: {
            transformMixedEsModules: true,
        },
    },
});
