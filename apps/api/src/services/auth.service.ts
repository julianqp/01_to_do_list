import type { LoginInput, PublicUser, SignupInput } from '@todo/shared';
import { AppError } from '../errors';
import { createSession, deleteExpiredSessions } from '../repositories/session.repository';
import { createUser, findUserByEmail } from '../repositories/user.repository';
import { hashPassword, verifyPassword } from './password';
import { generateSessionToken, hashSessionToken } from './session-token';

const notImplemented = (): never => {
  throw new Error('not implemented');
};

// D-3: la sesión caduca a los 7 días sin uso.
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// D-3: al registrarse o iniciar sesión se borran antes las sesiones caducadas de ese usuario.
async function startSession(userId: string): Promise<string> {
  const now = new Date();
  await deleteExpiredSessions(userId, now);
  const token = generateSessionToken();
  await createSession(userId, hashSessionToken(token), new Date(now.getTime() + SESSION_TTL_MS));
  return token;
}

// Lanza AppError EMAIL_ALREADY_REGISTERED.
export async function signup(input: SignupInput): Promise<{ user: PublicUser; token: string }> {
  // D-9: el índice único detecta el duplicado, también en la carrera de E-8.
  const user = await createUser(input.email, await hashPassword(input.password));
  if (!user) throw new AppError('EMAIL_ALREADY_REGISTERED', 409);
  return { user, token: await startSession(user.id) };
}

// Lanza AppError INVALID_CREDENTIALS.
export async function login(input: LoginInput): Promise<{ user: PublicUser; token: string }> {
  const account = await findUserByEmail(input.email);
  // RF-009: el mismo error si el email no existe o la contraseña no coincide. D-8: sin igualar tiempos.
  if (!account || !(await verifyPassword(input.password, account.passwordHash))) {
    throw new AppError('INVALID_CREDENTIALS', 401);
  }
  const user: PublicUser = { id: account.id, email: account.email };
  return { user, token: await startSession(user.id) };
}

export const logout: (token: string | undefined) => Promise<void> = notImplemented;
// Lanza AppError UNAUTHENTICATED | SESSION_EXPIRED; renueva la sesión (D-3).
export const authenticate: (token: string | undefined) => Promise<PublicUser> = notImplemented;
