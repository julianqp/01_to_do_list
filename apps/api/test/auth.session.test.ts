import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { prisma } from '../src/repositories/prisma';
import { sidCookie } from './helpers';

const app = createApp();
const EMAIL = 'ana@example.com';
const PASSWORD = 'correcta-horse-1';
const DAY = 24 * 60 * 60 * 1000;

const me = (cookie?: string) => {
  const req = request(app).get('/api/auth/me');
  return cookie ? req.set('Cookie', cookie) : req;
};
const logout = (cookie?: string) => {
  const req = request(app).post('/api/auth/logout');
  return (cookie ? req.set('Cookie', cookie) : req).send({});
};

async function signupCookie() {
  const res = await request(app)
    .post('/api/auth/signup')
    .send({ email: EMAIL, password: PASSWORD });
  expect(res.status).toBe(201);
  return sidCookie(res);
}

async function loginCookie() {
  const res = await request(app).post('/api/auth/login').send({ email: EMAIL, password: PASSWORD });
  expect(res.status).toBe(200);
  return sidCookie(res);
}

function sidSetCookie(res: request.Response) {
  const cookies = res.headers['set-cookie'] as unknown as string[] | undefined;
  return cookies?.find((c) => c.startsWith('sid='));
}

describe('GET /api/auth/me', () => {
  it('CA-4.1 RF-012 sin cookie → 401 UNAUTHENTICATED', async () => {
    const res = await me();

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: { code: 'UNAUTHENTICATED', message: expect.any(String) } });
  });

  it('RF-012 con un token desconocido → 401 UNAUTHENTICATED', async () => {
    const res = await me('sid=token-que-no-existe');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('CA-4.2 CA-5.2 RF-013 RF-017 E-5 sesión caducada → 401 SESSION_EXPIRED y se borra', async () => {
    const cookie = await signupCookie();
    await prisma.session.updateMany({ data: { expiresAt: new Date(Date.now() - DAY) } });

    const res = await me(cookie);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: { code: 'SESSION_EXPIRED', message: expect.any(String) } });
    expect(await prisma.session.count()).toBe(0);
  });

  it('CA-5.3 RF-018 D-3 sesión válida → 200, se renueva 7 días y se vuelve a emitir la cookie', async () => {
    const cookie = await signupCookie();
    await prisma.session.updateMany({ data: { expiresAt: new Date(Date.now() + DAY) } });

    const before = Date.now();
    const res = await me(cookie);
    const after = Date.now();

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ user: { id: expect.any(String), email: EMAIL } });
    const session = await prisma.session.findFirstOrThrow();
    expect(session.expiresAt.getTime()).toBeGreaterThanOrEqual(before + 7 * DAY);
    expect(session.expiresAt.getTime()).toBeLessThanOrEqual(after + 7 * DAY);
    expect(sidSetCookie(res)).toContain(cookie);
    expect(sidSetCookie(res)?.toLowerCase()).toContain('max-age=2592000');
  });
});

describe('POST /api/auth/logout', () => {
  it('CA-3.1 RF-011 E-6 cierra la sesión, borra la cookie y la misma cookie deja de valer', async () => {
    const cookie = await signupCookie();

    const res = await logout(cookie);

    expect(res.status).toBe(204);
    const cleared = sidSetCookie(res)?.toLowerCase();
    expect(cleared).toMatch(/^sid=;/);
    expect(cleared).toMatch(/expires=thu, 01 jan 1970|max-age=0/);
    expect(await prisma.session.count()).toBe(0);
    expect((await me(cookie)).status).toBe(401);
  });

  it('RF-011 sin cookie → 204 (idempotente)', async () => {
    expect((await logout()).status).toBe(204);
  });

  it('E-9 cerrar sesión en un navegador no cierra la del otro', async () => {
    await signupCookie();
    const browserA = await loginCookie();
    const browserB = await loginCookie();

    expect((await logout(browserA)).status).toBe(204);

    expect((await me(browserB)).status).toBe(200);
    expect((await me(browserA)).status).toBe(401);
  });
});

describe('limpieza y borrado de sesiones', () => {
  it('D-3 RNF-003 al iniciar sesión se borran las sesiones caducadas de ese usuario', async () => {
    await signupCookie();
    const expired = await prisma.session.findFirstOrThrow();
    await loginCookie();
    await prisma.session.update({
      where: { id: expired.id },
      data: { expiresAt: new Date(Date.now() - DAY) },
    });

    await loginCookie();

    const sessions = await prisma.session.findMany();
    expect(sessions.map((s) => s.id)).not.toContain(expired.id);
    expect(sessions).toHaveLength(2);
  });

  it('RNF-003 C-16 borrar un usuario borra sus sesiones', async () => {
    await signupCookie();
    expect(await prisma.session.count()).toBe(1);

    await prisma.user.delete({ where: { email: EMAIL } });

    expect(await prisma.session.count()).toBe(0);
  });
});
