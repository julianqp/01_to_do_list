import type { PublicUser } from '@todo/shared';
import { Prisma } from '../generated/prisma/client';
import { prisma } from './prisma';

// RNF-002: fuera de este fichero nunca sale el hash, salvo en findUserByEmail para el login.
const publicUser = { id: true, email: true } as const;

// null si el email ya existe (P2002, D-9).
export async function createUser(email: string, passwordHash: string): Promise<PublicUser | null> {
  try {
    return await prisma.user.create({ data: { email, passwordHash }, select: publicUser });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return null;
    }
    throw error;
  }
}

export function findUserByEmail(
  email: string,
): Promise<{ id: string; email: string; passwordHash: string } | null> {
  return prisma.user.findUnique({
    where: { email },
    select: { ...publicUser, passwordHash: true },
  });
}
