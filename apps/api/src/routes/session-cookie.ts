import type { CookieOptions, Response } from 'express';

export const SESSION_COOKIE = 'sid';

// D-3: la cookie dura 30 días, más que la sesión del servidor (7 días sin uso).
const COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

// C-12: httpOnly, secure y sameSite=lax.
const COOKIE_OPTIONS: CookieOptions = { httpOnly: true, secure: true, sameSite: 'lax', path: '/' };

// Lector propio de la cabecera `Cookie` (D-5). El token es base64url: no hace falta decodificarlo.
export function readCookie(header: string | undefined, name: string): string | undefined {
  for (const pair of header?.split(';') ?? []) {
    const separator = pair.indexOf('=');
    if (separator !== -1 && pair.slice(0, separator).trim() === name) {
      return pair.slice(separator + 1).trim();
    }
  }
  return undefined;
}

// `sid=<token>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000` (plan §4.3, D-3).
export function setSessionCookie(res: Response, token: string): void {
  res.cookie(SESSION_COOKIE, token, { ...COOKIE_OPTIONS, maxAge: COOKIE_MAX_AGE_MS });
}

// Mismos atributos que al crearla: si no coinciden `path` y compañía, el navegador no la borra.
export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE, COOKIE_OPTIONS);
}
