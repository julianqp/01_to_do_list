import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { prisma } from '../src/repositories/prisma';
import { createTaskFor, NEW_TASK, signupCookie } from './helpers';

const app = createApp();

const create = (cookie: string | undefined, body: object) => {
  const req = request(app).post('/api/tasks');
  return (cookie ? req.set('Cookie', cookie) : req).send(body);
};

const errorBody = (code: string) => ({ error: { code, message: expect.any(String) } });

// Spec 003: el orden guardado de una columna, directamente de la base de datos (D-1).
const columnOrder = async (status: 'backlog' | 'todo' | 'in_progress') =>
  (
    await prisma.task.findMany({
      where: { status },
      orderBy: { position: 'asc' },
      select: { title: true },
    })
  ).map(({ title }) => title);

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

  it('003 CA-2.3 RF-009 la tarea nueva sale la primera de Backlog y el orden de las demás columnas no cambia', async () => {
    const ana = await signupCookie('ana@example.com');
    for (const [title, status] of [
      ['Comprar pan', 'backlog'],
      ['Llamar al banco', 'todo'],
      ['Preparar la demo', 'todo'],
      ['Pagar el alquiler', 'in_progress'],
    ] as const) {
      const task = await createTaskFor(ana, { title });
      if (status === 'backlog') continue;
      await prisma.task.update({ where: { id: task.id }, data: { status } });
    }
    const todo = await columnOrder('todo');
    const inProgress = await columnOrder('in_progress');

    const res = await create(ana, { ...NEW_TASK, title: 'Revisar el correo' });

    expect(res.status).toBe(201);
    expect(await columnOrder('backlog')).toEqual(['Revisar el correo', 'Comprar pan']);
    expect(await columnOrder('todo')).toEqual(todo);
    expect(await columnOrder('in_progress')).toEqual(inProgress);
    // Cada columna numera por su cuenta: el orden se mira por columna (002/D-7).
    const list = await request(app).get('/api/tasks').set('Cookie', ana);
    expect(
      (list.body.tasks as { title: string; status: string }[])
        .filter(({ status }) => status === 'backlog')
        .map(({ title }) => title),
    ).toEqual(['Revisar el correo', 'Comprar pan']);
  });

  it('003 RF-009 D-2 tres creaciones seguidas quedan de la más reciente a la más antigua, sin posiciones repetidas', async () => {
    const ana = await signupCookie('ana@example.com');

    for (const title of ['Uno', 'Dos', 'Tres']) await createTaskFor(ana, { title });

    const rows = await prisma.task.findMany({ orderBy: { position: 'asc' } });
    expect(rows.map(({ title }) => title)).toEqual(['Tres', 'Dos', 'Uno']);
    expect(new Set(rows.map(({ position }) => position)).size).toBe(3);
  });

  it('003 RF-009 D-2 creaciones a la vez no repiten posición', async () => {
    const ana = await signupCookie('ana@example.com');

    await Promise.all(
      ['Uno', 'Dos', 'Tres', 'Cuatro'].map((title) => createTaskFor(ana, { title })),
    );

    const rows = await prisma.task.findMany({ select: { position: true } });
    expect(new Set(rows.map(({ position }) => position)).size).toBe(4);
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
