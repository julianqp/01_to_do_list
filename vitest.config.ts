import { defineConfig } from 'vitest/config';
import { testDatabaseUrl } from './test-database-url';

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
