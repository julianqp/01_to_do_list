import { defineConfig, devices } from '@playwright/test';
import { testDatabaseUrl } from './test-database-url';

const baseURL = 'https://localhost:4321';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL,
    // D-1 (ADR-0001): certificado autofirmado en desarrollo.
    ignoreHTTPSErrors: true,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // D-18: el Firefox de Playwright no arranca en macOS 27; se prueba con el Google Chrome instalado.
    { name: 'chrome', use: { ...devices['Desktop Chrome'], channel: 'chrome' } },
    // Plan 004 D-20: WebKit a veces pierde una conexión keep-alive con el servidor de desarrollo al
    // pedir un módulo y la isla no se hidrata. Un reintento; el informe lo marca como «flaky».
    { name: 'webkit', retries: 1, use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'pnpm dev',
    url: baseURL,
    ignoreHTTPSErrors: true,
    // Nunca reutiliza un `pnpm dev` ya abierto: ese apunta a la base de desarrollo.
    reuseExistingServer: false,
    env: { DATABASE_URL: testDatabaseUrl() },
  },
});
