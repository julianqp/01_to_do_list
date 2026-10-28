import js from '@eslint/js';
import astro from 'eslint-plugin-astro';
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  globalIgnores([
    '**/dist/',
    '**/.astro/',
    'apps/api/src/generated/',
    'test-results/',
    'playwright-report/',
    'blob-report/',
  ]),
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    // C-1: prohibido `any` salvo justificación en comentario.
    rules: { '@typescript-eslint/no-explicit-any': 'error' },
  },
  astro.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat.recommended],
  },
);
