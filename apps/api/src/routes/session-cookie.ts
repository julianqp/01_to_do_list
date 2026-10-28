import type { Response } from 'express';

const notImplemented = (): never => {
  throw new Error('not implemented');
};

export const SESSION_COOKIE = 'sid';

// Lector propio de la cabecera `Cookie` (D-5).
export const readCookie: (header: string | undefined, name: string) => string | undefined =
  notImplemented;
// `sid=<token>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000` (plan §4.3, D-3).
export const setSessionCookie: (res: Response, token: string) => void = notImplemented;
export const clearSessionCookie: (res: Response) => void = notImplemented;
