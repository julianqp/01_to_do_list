import { existsSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

// La base de test es la misma de .env cambiando el nombre a todo_test (docker/init-test-db.sql).
function testDatabaseUrl() {
  const envFile = new URL('./.env', import.meta.url);
  if (existsSync(envFile)) process.loadEnvFile(envFile);
  if (!process.env.DATABASE_URL) {
    throw new Error('Falta DATABASE_URL: copia .env.example a .env');
  }
  const url = new URL(process.env.DATABASE_URL);
  url.pathname = '/todo_test';
  return url.toString();
}

export default defineConfig({
  test: {
    passWithNoTests: true,
    projects: [
      {
        test: {
          name: 'shared',
          root: './packages/shared',
          include: ['src/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'api',
          root: './apps/api',
          include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
          env: { DATABASE_URL: testDatabaseUrl() },
          globalSetup: ['./test/global-setup.ts'],
          setupFiles: ['./test/setup.ts'],
          // Todos los ficheros comparten la base todo_test.
          fileParallelism: false,
        },
      },
      {
        test: {
          name: 'web',
          root: './apps/web',
          include: ['src/**/*.test.{ts,tsx}'],
          environment: 'jsdom',
        },
      },
    ],
  },
});
