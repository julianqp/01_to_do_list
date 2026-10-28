import type { PublicUser } from '@todo/shared';

const notImplemented = (): never => {
  throw new Error('not implemented');
};

// null si el email ya existe (P2002, D-9).
export const createUser: (email: string, passwordHash: string) => Promise<PublicUser | null> =
  notImplemented;
export const findUserByEmail: (
  email: string,
) => Promise<{ id: string; email: string; passwordHash: string } | null> = notImplemented;
