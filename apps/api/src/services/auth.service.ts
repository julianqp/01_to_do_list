import type { LoginInput, PublicUser, SignupInput } from '@todo/shared';

const notImplemented = (): never => {
  throw new Error('not implemented');
};

// Lanza AppError EMAIL_ALREADY_REGISTERED.
export const signup: (input: SignupInput) => Promise<{ user: PublicUser; token: string }> =
  notImplemented;
// Lanza AppError INVALID_CREDENTIALS.
export const login: (input: LoginInput) => Promise<{ user: PublicUser; token: string }> =
  notImplemented;
export const logout: (token: string | undefined) => Promise<void> = notImplemented;
// Lanza AppError UNAUTHENTICATED | SESSION_EXPIRED; renueva la sesión (D-3).
export const authenticate: (token: string | undefined) => Promise<PublicUser> = notImplemented;
