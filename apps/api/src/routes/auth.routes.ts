import {
  loginInputSchema,
  signupInputSchema,
  type LoginInput,
  type SignupInput,
} from '@todo/shared';
import { Router } from 'express';
import * as authService from '../services/auth.service';
import { validateBody } from './middleware/validate-body';
import { setSessionCookie } from './session-cookie';

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
