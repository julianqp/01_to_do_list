import {
  loginInputSchema,
  signupInputSchema,
  type LoginInput,
  type SignupInput,
} from '@todo/shared';
import { Router } from 'express';
import * as authService from '../services/auth.service';
import { requireAuth } from './middleware/require-auth';
import { validateBody } from './middleware/validate-body';
import { clearSessionCookie, readCookie, SESSION_COOKIE, setSessionCookie } from './session-cookie';

export const authRouter = Router();

authRouter.post('/signup', validateBody(signupInputSchema), async (req, res) => {
  const { user, token } = await authService.signup(req.body as SignupInput);
  setSessionCookie(res, token);
  res.status(201).json({ user });
});

authRouter.post('/login', validateBody(loginInputSchema), async (req, res) => {
  const { user, token } = await authService.login(req.body as LoginInput);
  setSessionCookie(res, token);
  res.json({ user });
});

// D-13: el cuerpo es `{}`; requireJson ya exige application/json.
authRouter.post('/logout', async (req, res) => {
  await authService.logout(readCookie(req.headers.cookie, SESSION_COOKIE));
  clearSessionCookie(res);
  res.status(204).end();
});

authRouter.get('/me', requireAuth, (_req, res) => {
  res.json({ user: res.locals.user });
});
