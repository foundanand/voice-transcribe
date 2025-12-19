import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      // 1. prevent vite from obscuring rust errors
      clearScreen: false,
      // 2. tauri expects a fixed port, fail if that port is not available
      server: {
        port: 5173,
        strictPort: true,
        host: env.TAURI_DEV_HOST || '0.0.0.0',
        hmr: env.TAURI_DEV_HOST
          ? {
              protocol: 'ws',
              host: env.TAURI_DEV_HOST,
              port: 1421,
            }
          : undefined,
      },
      // 3. to make use of `TAURI_DEBUG` and other env variables
      // https://tauri.app/v1/api/config#buildconfig.withglobaltauri
      envPrefix: ['VITE_', 'TAURI_'],
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        }
      },
      build: {
        // Tauri supports es2021
        target: process.env.TAURI_PLATFORM == 'windows' ? 'chrome105' : 'safari13',
        // don't minify for debug builds
        minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
        // produce sourcemaps for debug builds
        sourcemap: !!process.env.TAURI_DEBUG,
      },
    };
});
