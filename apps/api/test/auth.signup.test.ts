import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { prisma } from '../src/repositories/prisma';
import { sidCookie } from './helpers';

const app = createApp();
const PASSWORD = 'correcta-horse-1';

const signup = (body: object) => request(app).post('/api/auth/signup').send(body);

describe('POST /api/auth/signup', () => {
  it('CA-1.1 RF-001 RF-002 crea la cuenta, devuelve solo id y email e inicia sesión', async () => {
    const res = await signup({ email: 'ana@example.com', password: PASSWORD });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ user: { id: expect.any(String), email: 'ana@example.com' } });
    expect(await prisma.user.findUnique({ where: { email: 'ana@example.com' } })).toMatchObject({
      id: res.body.user.id,
    });

    const me = await request(app).get('/api/auth/me').set('Cookie', sidCookie(res));
    expect(me.status).toBe(200);
    expect(me.body).toEqual({ user: res.body.user });
  });

  it('RF-016 C-12 emite la cookie sid HttpOnly, Secure, SameSite=Lax, Path=/ y de 30 días', async () => {
    const res = await signup({ email: 'ana@example.com', password: PASSWORD });
    expect(res.status).toBe(201);

    const cookie = (res.headers['set-cookie'] as unknown as string[]).find((c) =>
      c.startsWith('sid='),
    );
    const attributes = cookie?.split(';').map((a) => a.trim().toLowerCase());
    expect(attributes).toEqual(
      expect.arrayContaining(['httponly', 'secure', 'samesite=lax', 'path=/', 'max-age=2592000']),
    );
  });

  it('RNF-002 C-12 no guarda la contraseña en claro ni la devuelve, y el token solo va en la cookie', async () => {
    const res = await signup({ email: 'ana@example.com', password: PASSWORD });
    expect(res.status).toBe(201);

    const user = await prisma.user.findUniqueOrThrow({ where: { email: 'ana@example.com' } });
    expect(user.passwordHash).not.toContain(PASSWORD);
    const token = sidCookie(res).slice('sid='.length);
    expect(JSON.stringify(res.body)).not.toContain(PASSWORD);
    expect(JSON.stringify(res.body)).not.toContain(token);
  });

  it('RF-003 guarda el email sin espacios y en minúsculas', async () => {
    const res = await signup({ email: '  ANA@Example.com ', password: PASSWORD });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('ana@example.com');
    expect(await prisma.user.count({ where: { email: 'ana@example.com' } })).toBe(1);
  });

  it('CA-1.2 RF-003 RF-004 rechaza un email ya registrado escrito con otras mayúsculas y espacios', async () => {
    expect((await signup({ email: 'ana@example.com', password: PASSWORD })).status).toBe(201);
    const before = await prisma.user.findUniqueOrThrow({ where: { email: 'ana@example.com' } });

    const res = await signup({ email: 'ANA@Example.com ', password: 'otra-contrasena-2' });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      error: { code: 'EMAIL_ALREADY_REGISTERED', message: expect.any(String) },
    });
    expect(await prisma.user.count()).toBe(1);
    // Sin modificar la cuenta existente.
    expect(await prisma.user.findUniqueOrThrow({ where: { id: before.id } })).toEqual(before);
  });

  it.each([
    ['RF-005 email con formato no válido', { email: 'ana@', password: PASSWORD }],
    ['RF-006 contraseña de 7 caracteres', { email: 'ana@example.com', password: '1234567' }],
    ['RF-007 campos vacíos', { email: '', password: '' }],
    ['RF-007 campos que faltan', {}],
  ])('%s → 400 VALIDATION_ERROR y no crea la cuenta', async (_name, body) => {
    const res = await signup(body);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: { code: 'VALIDATION_ERROR', message: expect.any(String) } });
    expect(await prisma.user.count()).toBe(0);
  });

  it('E-8 dos registros simultáneos con el mismo email crean una sola cuenta', async () => {
    const results = await Promise.all([
      signup({ email: 'ana@example.com', password: PASSWORD }),
      signup({ email: 'ana@example.com', password: PASSWORD }),
    ]);

    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(await prisma.user.count()).toBe(1);
  });
});
