import { format } from 'node:util';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app';
import * as authService from '../src/services/auth.service';
import { sidCookie } from './helpers';

const app = createApp();
const CREDENTIALS = { email: 'ana@example.com', password: 'correcta-horse-1' };

const errorBody = (code: string) => ({ error: { code, message: expect.any(String) } });

afterEach(() => {
  vi.restoreAllMocks();
});

describe('C-9 formato único de error', () => {
  it('C-9 ruta desconocida de /api → 404 NOT_FOUND', async () => {
    const res = await request(app).get('/api/no-existe');

    expect(res.status).toBe(404);
    expect(res.body).toEqual(errorBody('NOT_FOUND'));
  });

  it('C-9 C-14 JSON mal formado → 400 VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .set('Content-Type', 'application/json')
      .send('{"email": "ana@example.com", ');

    expect(res.status).toBe(400);
    expect(res.body).toEqual(errorBody('VALIDATION_ERROR'));
  });

  it('C-9 error no controlado → 500 INTERNAL_ERROR sin registrar el cuerpo de la petición', async () => {
    vi.spyOn(authService, 'login').mockRejectedValue(new Error('fallo inesperado'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const res = await request(app).post('/api/auth/login').send(CREDENTIALS);

    expect(res.status).toBe(500);
    expect(res.body).toEqual(errorBody('INTERNAL_ERROR'));
    // Plan §9: se registra con console.error (método, ruta y stack), nunca con el cuerpo.
    expect(consoleError).toHaveBeenCalled();
    for (const args of consoleError.mock.calls) {
      const logged = format(...args);
      expect(logged).not.toContain(CREDENTIALS.password);
      expect(logged).not.toContain(CREDENTIALS.email);
    }
  });
});

describe('D-13 C-12 protección CSRF: solo se acepta application/json', () => {
  it('D-13 logout con cookie válida y Content-Type de formulario → 415 y la sesión sigue viva', async () => {
    const signup = await request(app).post('/api/auth/signup').send(CREDENTIALS);
    expect(signup.status).toBe(201);
    const cookie = sidCookie(signup);

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', cookie)
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send('a=1');

    expect(res.status).toBe(415);
    expect(res.body).toEqual(errorBody('UNSUPPORTED_MEDIA_TYPE'));
    expect((await request(app).get('/api/auth/me').set('Cookie', cookie)).status).toBe(200);
  });

  it.each([
    ['/api/auth/signup', 'application/x-www-form-urlencoded'],
    ['/api/auth/signup', 'text/plain'],
    ['/api/auth/signup', '(sin cabecera)'],
    ['/api/auth/login', 'application/x-www-form-urlencoded'],
    ['/api/auth/login', 'text/plain'],
    ['/api/auth/login', '(sin cabecera)'],
  ])('D-13 %s con Content-Type %s → 415 UNSUPPORTED_MEDIA_TYPE', async (path, contentType) => {
    const req = request(app).post(path);
    const res = await (contentType !== '(sin cabecera)'
      ? req.set('Content-Type', contentType).send(`email=${CREDENTIALS.email}`)
      : req);

    expect(res.status).toBe(415);
    expect(res.body).toEqual(errorBody('UNSUPPORTED_MEDIA_TYPE'));
  });
});
