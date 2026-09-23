import { defineConfig, devices } from '@playwright/test';
import { ENTORNO_E2E, PUERTO } from './e2e/entorno';

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  // Los flujos comparten base de datos: en serie.
  workers: 1,
  fullyParallel: false,
  timeout: 90_000,
  // El servidor de desarrollo compila cada ruta la primera vez que se visita.
  expect: { timeout: 20_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: `http://localhost:${PUERTO}`, trace: 'retain-on-failure' },
  projects: [
    { name: 'escritorio', use: { ...devices['Desktop Chrome'] } },
    { name: 'movil', use: { ...devices['Pixel 7'] }, testMatch: /publico\.spec\.ts/ },
  ],
  webServer: {
    // Servidor de desarrollo: `next start` exige Resend (producción) y los e2e leen correos de archivo.
    command: `pnpm exec next dev -p ${PUERTO}`,
    port: PUERTO,
    env: ENTORNO_E2E,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
