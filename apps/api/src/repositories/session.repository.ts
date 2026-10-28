import type { PublicUser } from '@todo/shared';
import { prisma } from './prisma';

export async function createSession(
  userId: string,
  tokenHash: string,
  expiresAt: Date,
): Promise<void> {
  await prisma.session.create({ data: { userId, tokenHash, expiresAt } });
}

export function findSessionByTokenHash(
  tokenHash: string,
): Promise<{ id: string; expiresAt: Date; user: PublicUser } | null> {
  return prisma.session.findUnique({
    where: { tokenHash },
    select: { id: true, expiresAt: true, user: { select: { id: true, email: true } } },
  });
}

// `updateMany`/`deleteMany` no fallan si la sesión ya no existe (p. ej., cerrada en otra pestaña, E-6).
export async function extendSession(id: string, expiresAt: Date): Promise<void> {
  await prisma.session.updateMany({ where: { id }, data: { expiresAt } });
}

export async function deleteSessionByTokenHash(tokenHash: string): Promise<void> {
  await prisma.session.deleteMany({ where: { tokenHash } });
}

// D-3: limpieza de las sesiones caducadas de un usuario.
export async function deleteExpiredSessions(userId: string, now: Date): Promise<void> {
  await prisma.session.deleteMany({ where: { userId, expiresAt: { lte: now } } });
}
