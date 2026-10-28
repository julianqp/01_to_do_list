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
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
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
