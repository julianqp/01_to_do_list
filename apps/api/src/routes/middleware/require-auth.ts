import type { PublicUser } from '@todo/shared';
import type { RequestHandler } from 'express';
import * as authService from '../../services/auth.service';
import { readCookie, SESSION_COOKIE, setSessionCookie } from '../session-cookie';

declare global {
  // Así tipa Express `res.locals` (su `Locals` extiende `Express.Locals`); no hay forma sin namespace.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Locals {
      // Lo deja requireAuth en las rutas protegidas.
      user: PublicUser;
    }
  }
}

// C-13: las rutas protegidas leen el usuario de `res.locals.user`, nunca del cuerpo ni de la URL.
// D-3: cada petición autenticada renueva la sesión y vuelve a emitir la cookie.
export const requireAuth: RequestHandler = async (req, res, next) => {
  const token = readCookie(req.headers.cookie, SESSION_COOKIE);
  res.locals.user = await authService.authenticate(token);
  // authenticate lanza UNAUTHENTICATED si no hay token: aquí siempre lo hay.
  setSessionCookie(res, token!);
  next();
};
