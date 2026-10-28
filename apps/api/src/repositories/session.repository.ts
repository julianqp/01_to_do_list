import type { PublicUser } from '@todo/shared';

const notImplemented = (): never => {
  throw new Error('not implemented');
};

export const createSession: (userId: string, tokenHash: string, expiresAt: Date) => Promise<void> =
  notImplemented;
export const findSessionByTokenHash: (
  tokenHash: string,
) => Promise<{ id: string; expiresAt: Date; user: PublicUser } | null> = notImplemented;
export const extendSession: (id: string, expiresAt: Date) => Promise<void> = notImplemented;
export const deleteSessionByTokenHash: (tokenHash: string) => Promise<void> = notImplemented;
export const deleteExpiredSessions: (userId: string, now: Date) => Promise<void> = notImplemented;
