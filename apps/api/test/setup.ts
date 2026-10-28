import { afterAll, beforeEach } from 'vitest';
import { prisma } from '../src/repositories/prisma';

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE "Session", "User"`;
});

afterAll(async () => {
  await prisma.$disconnect();
});
