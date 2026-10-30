import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { prisma } from '../src/repositories/prisma';
import { NEW_TASK, signupCookie } from './helpers';

const app = createApp();

const create = (cookie: string | undefined, body: object) => {
  const req = request(app).post('/api/tasks');
  return (cookie ? req.set('Cookie', cookie) : req).send(body);
};

const errorBody = (code: string) => ({ error: { code, message: expect.any(String) } });

describe('POST /api/tasks', () => {
  it('CA-2.1 CA-2.2 RF-011 crea la tarea a nombre del usuario, en Backlog, con sus datos', async () => {
    const ana = await signupCookie('ana@example.com');

    const res = await create(ana, {
      ...NEW_TASK,
      description: 'Revisar con el equipo',
      estimatedStartDate: '2026-11-14',
      estimatedEndDate: '2026-11-28',
    });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      task: {
        id: expect.any(String),
        title: 'Preparar la demo',
        description: 'Revisar con el equipo',
        status: 'backlog',
        estimatedStartDate: '2026-11-14',
        estimatedEndDate: '2026-11-28',
        actualEndDate: null,
      },
    });
    const owner = await prisma.user.findUniqueOrThrow({ where: { email: 'ana@example.com' } });
    expect(await prisma.task.findUniqueOrThrow({ where: { id: res.body.task.id } })).toMatchObject({
      userId: owner.id,
    });
  });

  it('RF-011 D-2 aunque el cuerpo traiga status: "done", la tarea entra en Backlog', async () => {
    const ana = await signupCookie('ana@example.com');

    const res = await create(ana, { ...NEW_TASK, status: 'done', actualEndDate: '2026-10-29' });

    expect(res.status).toBe(201);
    expect(res.body.task).toMatchObject({ status: 'backlog', actualEndDate: null });
  });

  it('E-5 RF-020 guarda el título sin los espacios iniciales y finales', async () => {
    const ana = await signupCookie('ana@example.com');

    const res = await create(ana, { ...NEW_TASK, title: '  Comprar pan  ' });

    expect(res.status).toBe(201);
    expect(res.body.task.title).toBe('Comprar pan');
  });

  it.each([
    ['RF-014 título vacío', { title: '   ' }],
    ['RF-015 título de 201 caracteres', { title: 'a'.repeat(201) }],
    ['RF-016 descripción de 5001 caracteres', { description: 'a'.repeat(5001) }],
    ['RF-017 fecha que no existe', { estimatedStartDate: '2026-02-31' }],
    [
      'RF-018 fin anterior al inicio',
      { estimatedStartDate: '2026-11-28', estimatedEndDate: '2026-11-14' },
    ],
    ['C-14 cuerpo sin campos', null],
  ])('%s → 400 VALIDATION_ERROR y no crea la tarea', async (_name, fields) => {
    const ana = await signupCookie('ana@example.com');

    const res = await create(ana, fields ? { ...NEW_TASK, ...fields } : {});

    expect(res.status).toBe(400);
    expect(res.body).toEqual(errorBody('VALIDATION_ERROR'));
    expect(await prisma.task.count()).toBe(0);
  });

  it('C-13 sin sesión → 401 UNAUTHENTICATED y no crea la tarea', async () => {
    const res = await create(undefined, NEW_TASK);

    expect(res.status).toBe(401);
    expect(res.body).toEqual(errorBody('UNAUTHENTICATED'));
    expect(await prisma.task.count()).toBe(0);
  });

  it('001 D-13 sin Content-Type JSON → 415 UNSUPPORTED_MEDIA_TYPE', async () => {
    const ana = await signupCookie('ana@example.com');

    const res = await request(app)
      .post('/api/tasks')
      .set('Cookie', ana)
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send('title=Preparar');

    expect(res.status).toBe(415);
    expect(res.body).toEqual(errorBody('UNSUPPORTED_MEDIA_TYPE'));
    expect(await prisma.task.count()).toBe(0);
  });
});
