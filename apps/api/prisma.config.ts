import { existsSync } from 'node:fs';
import { defineConfig } from 'prisma/config';

// Prisma 7 no carga .env por sí solo. No pisa variables ya definidas (p. ej. la DATABASE_URL de los tests).
const envFile = new URL('../../.env', import.meta.url);
if (existsSync(envFile)) process.loadEnvFile(envFile);

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  // Sin DATABASE_URL solo funciona `prisma generate` (el postinstall de un clon recién hecho, antes de crear .env).
  datasource: { url: process.env.DATABASE_URL },
});
