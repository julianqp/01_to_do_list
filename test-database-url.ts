import { existsSync } from 'node:fs';

// La base de test es la misma de .env cambiando el nombre a todo_test (docker/init-test-db.sql).
// La usan Vitest (plan §7) y el servidor que arranca Playwright.
export function testDatabaseUrl() {
  const envFile = new URL('./.env', import.meta.url);
  if (existsSync(envFile)) process.loadEnvFile(envFile);
  if (!process.env.DATABASE_URL) {
    throw new Error('Falta DATABASE_URL: copia .env.example a .env');
  }
  const url = new URL(process.env.DATABASE_URL);
  url.pathname = '/todo_test';
  return url.toString();
}
