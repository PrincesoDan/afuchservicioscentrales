import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { ENTORNO_TEST } from './src/test/entorno';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // `server-only` lanza fuera del bundle de servidor de Next; en tests no aplica.
      'server-only': fileURLToPath(new URL('./src/test/server-only-vacio.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
    globalSetup: ['./src/test/global-setup.ts'],
    env: ENTORNO_TEST,
    // Los tests de integración comparten una base de datos: se ejecutan en serie.
    fileParallelism: false,
  },
});
