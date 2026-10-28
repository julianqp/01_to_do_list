import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { sidCookie } from './helpers';

const app = createApp();
const PASSWORD = 'correcta-horse-1';

const signup = (body: object) => request(app).post('/api/auth/signup').send(body);
const login = (body: object) => request(app).post('/api/auth/login').send(body);

async function givenAccount(email = 'ana@example.com', password = PASSWORD) {
  expect((await signup({ email, password })).status).toBe(201);
}

describe('POST /api/auth/login', () => {
  it('CA-2.1 RF-008 inicia sesión, devuelve solo id y email y emite la cookie', async () => {
    await givenAccount();

    const res = await login({ email: 'ana@example.com', password: PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ user: { id: expect.any(String), email: 'ana@example.com' } });
    const me = await request(app).get('/api/auth/me').set('Cookie', sidCookie(res));
    expect(me.status).toBe(200);
    expect(me.body).toEqual({ user: res.body.user });
  });

  it('CA-2.2 RF-003 entra con el email escrito con otras mayúsculas', async () => {
    await givenAccount();

    const res = await login({ email: 'Ana@Example.com', password: PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('ana@example.com');
  });

  it('CA-2.3 CA-2.4 RF-009 contraseña incorrecta y email inexistente dan la misma respuesta 401', async () => {
    await givenAccount();

    const wrongPassword = await login({ email: 'ana@example.com', password: 'otra-contrasena' });
    const unknownEmail = await login({ email: 'luis@example.com', password: PASSWORD });

    expect(wrongPassword.status).toBe(401);
    expect(wrongPassword.body).toEqual({
      error: { code: 'INVALID_CREDENTIALS', message: expect.any(String) },
    });
    // Mismo status y mismo cuerpo: la API no revela cuál de los dos falla.
    expect(unknownEmail.status).toBe(wrongPassword.status);
    expect(unknownEmail.body).toEqual(wrongPassword.body);
    expect(wrongPassword.headers['set-cookie']).toBeUndefined();
    expect(unknownEmail.headers['set-cookie']).toBeUndefined();
  });

  it('E-4 entra con una contraseña con espacios, tildes y emoji tal cual, sin recortar', async () => {
    const password = '  a ñ 😀 b  ';
    await givenAccount('ana@example.com', password);

    expect((await login({ email: 'ana@example.com', password })).status).toBe(200);
    expect((await login({ email: 'ana@example.com', password: password.trim() })).status).toBe(401);
  });

  it.each([
    ['vacíos', { email: '', password: '' }],
    ['solo con espacios', { email: '   ', password: '   ' }],
  ])('RF-007 campos %s → 400 VALIDATION_ERROR', async (_name, body) => {
    const res = await login(body);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: { code: 'VALIDATION_ERROR', message: expect.any(String) } });
  });
});
