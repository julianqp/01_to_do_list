import { PrismaPg } from '@prisma/adapter-pg';
import { parseEnv } from '../config/env';
import { PrismaClient } from '../generated/prisma/client';

const { DATABASE_URL } = parseEnv(process.env);

export const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: DATABASE_URL }),
});
