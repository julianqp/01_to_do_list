import { randomUUID } from 'node:crypto';
import type { Task, TaskStatus } from '@todo/shared';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { prisma } from '../src/repositories/prisma';
import { createTaskFor, NEW_TASK, signupCookie, utcIsoDate } from './helpers';

const app = createApp();
const TODAY = utcIsoDate(0);

const move = (cookie: string | undefined, id: string, body: object) => {
  const req = request(app).post(`/api/tasks/${id}/move`);
  return (cookie ? req.set('Cookie', cookie) : req).send(body);
};

const errorBody = (code: string) => ({ error: { code, message: expect.any(String) } });

const titlesIn = async (cookie: string, status: TaskStatus) =>
  ((await request(app).get('/api/tasks').set('Cookie', cookie)).body.tasks as Task[])
    .filter((task) => task.status === status)
    .map(({ title }) => title);

// Crea las tareas de la última a la primera y las pasa a `status`: la columna queda en el orden de
// la lista (cada tarea entra la primera, RF-010).
async function column(cookie: string, status: TaskStatus, titles: string[]) {
  const tasks: Task[] = [];
  for (const title of [...titles].reverse()) {
    const task = await createTaskFor(cookie, { title });
    const res = await request(app)
      .put(`/api/tasks/${task.id}`)
      .set('Cookie', cookie)
      .send({
        ...NEW_TASK,
        title,
        status,
        actualEndDate: status === 'done' ? '2026-10-27' : null,
      });
    expect(res.status).toBe(200);
    tasks.unshift(res.body.task as Task);
  }
  return tasks;
}

describe('POST /api/tasks/:id/move', () => {
  it('003 RF-001 de To do a In progress con `index` 0: responde con el estado nuevo y la lista la pone la primera de In progress', async () => {
    const ana = await signupCookie('ana@example.com');
    await column(ana, 'in_progress', ['Revisar el correo', 'Pagar el alquiler']);
    const [demo] = await column(ana, 'todo', ['Preparar la demo', 'Comprar pan']);

    const res = await move(ana, demo!.id, { status: 'in_progress', index: 0, today: TODAY });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ task: { ...demo, status: 'in_progress', actualEndDate: null } });
    expect(await titlesIn(ana, 'in_progress')).toEqual([
      'Preparar la demo',
      'Revisar el correo',
      'Pagar el alquiler',
    ]);
    expect(await titlesIn(ana, 'todo')).toEqual(['Comprar pan']);
  });

  it('003 RF-001 queda en el `index` pedido de la otra columna', async () => {
    const ana = await signupCookie('ana@example.com');
    await column(ana, 'in_progress', ['Revisar el correo', 'Pagar el alquiler']);
    const [demo] = await column(ana, 'todo', ['Preparar la demo']);

    await move(ana, demo!.id, { status: 'in_progress', index: 1, today: TODAY });

    expect(await titlesIn(ana, 'in_progress')).toEqual([
      'Revisar el correo',
      'Preparar la demo',
      'Pagar el alquiler',
    ]);
  });

  it('003 CA-2.1 RF-007 dentro de To do, de la tercera a la primera; el orden relativo del resto se mantiene', async () => {
    const ana = await signupCookie('ana@example.com');
    const tasks = await column(ana, 'todo', ['Comprar pan', 'Llamar al banco', 'Preparar la demo']);

    const res = await move(ana, tasks[2]!.id, { status: 'todo', index: 0, today: TODAY });

    expect(res.status).toBe(200);
    expect(await titlesIn(ana, 'todo')).toEqual([
      'Preparar la demo',
      'Comprar pan',
      'Llamar al banco',
    ]);
  });

  it('003 RF-007 dentro de To do, hacia abajo: `index` no cuenta la tarea que se mueve', async () => {
    const ana = await signupCookie('ana@example.com');
    const tasks = await column(ana, 'todo', ['Comprar pan', 'Llamar al banco', 'Preparar la demo']);

    await move(ana, tasks[0]!.id, { status: 'todo', index: 1, today: TODAY });

    expect(await titlesIn(ana, 'todo')).toEqual([
      'Llamar al banco',
      'Comprar pan',
      'Preparar la demo',
    ]);
  });

  it('003 D-3 un `index` mayor que la columna la pone al final', async () => {
    const ana = await signupCookie('ana@example.com');
    await column(ana, 'in_progress', ['Revisar el correo', 'Pagar el alquiler']);
    const [demo] = await column(ana, 'todo', ['Preparar la demo']);

    await move(ana, demo!.id, { status: 'in_progress', index: 99, today: TODAY });

    expect(await titlesIn(ana, 'in_progress')).toEqual([
      'Revisar el correo',
      'Pagar el alquiler',
      'Preparar la demo',
    ]);
  });

  it('003 RF-003 entra en Done con la fecha `today`', async () => {
    const ana = await signupCookie('ana@example.com');
    const [demo] = await column(ana, 'in_progress', ['Preparar la demo']);

    const res = await move(ana, demo!.id, { status: 'done', index: 0, today: TODAY });

    expect(res.status).toBe(200);
    expect(res.body.task).toMatchObject({ status: 'done', actualEndDate: TODAY });
  });

  it('003 CA-1.5 RF-004 sale de Done → sin fecha real de fin', async () => {
    const ana = await signupCookie('ana@example.com');
    const [demo] = await column(ana, 'done', ['Preparar la demo']);
    expect(demo!.actualEndDate).toBe('2026-10-27');

    const res = await move(ana, demo!.id, { status: 'todo', index: 0, today: TODAY });

    expect(res.status).toBe(200);
    expect(res.body.task).toMatchObject({ status: 'todo', actualEndDate: null });
  });

  it('003 E-15 dentro de Done conserva la fecha', async () => {
    const ana = await signupCookie('ana@example.com');
    const tasks = await column(ana, 'done', ['Comprar pan', 'Preparar la demo']);

    const res = await move(ana, tasks[1]!.id, { status: 'done', index: 0, today: TODAY });

    expect(res.status).toBe(200);
    expect(res.body.task).toMatchObject({ status: 'done', actualEndDate: '2026-10-27' });
    expect(await titlesIn(ana, 'done')).toEqual(['Preparar la demo', 'Comprar pan']);
  });

  it('003 RF-003 D-4 `today` posterior a «hoy UTC + 1» al entrar en Done → 400 VALIDATION_ERROR y no se mueve', async () => {
    const ana = await signupCookie('ana@example.com');
    const [demo] = await column(ana, 'todo', ['Preparar la demo']);

    const res = await move(ana, demo!.id, { status: 'done', index: 0, today: utcIsoDate(2) });

    expect(res.status).toBe(400);
    expect(res.body).toEqual(errorBody('VALIDATION_ERROR'));
    expect(await titlesIn(ana, 'todo')).toEqual(['Preparar la demo']);
  });

  it('003 C-14 cuerpo no válido → 400 VALIDATION_ERROR', async () => {
    const ana = await signupCookie('ana@example.com');
    const [demo] = await column(ana, 'todo', ['Preparar la demo']);

    for (const body of [
      {},
      { status: 'todo', today: TODAY },
      { status: 'todo', index: -1, today: TODAY },
      { status: 'todo', index: 1.5, today: TODAY },
      { status: 'archived', index: 0, today: TODAY },
      { status: 'todo', index: 0, today: '2026-02-31' },
    ]) {
      const res = await move(ana, demo!.id, body);
      expect(res.status).toBe(400);
      expect(res.body).toEqual(errorBody('VALIDATION_ERROR'));
    }
  });

  it('003 C-13 sin sesión → 401 UNAUTHENTICATED', async () => {
    const ana = await signupCookie('ana@example.com');
    const [demo] = await column(ana, 'todo', ['Preparar la demo']);

    const res = await move(undefined, demo!.id, { status: 'done', index: 0, today: TODAY });

    expect(res.status).toBe(401);
    expect(res.body).toEqual(errorBody('UNAUTHENTICATED'));
    expect(await titlesIn(ana, 'todo')).toEqual(['Preparar la demo']);
  });

  it('003 001/D-13 sin Content-Type JSON → 415 UNSUPPORTED_MEDIA_TYPE', async () => {
    const ana = await signupCookie('ana@example.com');
    const [demo] = await column(ana, 'todo', ['Preparar la demo']);

    const res = await request(app)
      .post(`/api/tasks/${demo!.id}/move`)
      .set('Cookie', ana)
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send('status=done');

    expect(res.status).toBe(415);
    expect(res.body).toEqual(errorBody('UNSUPPORTED_MEDIA_TYPE'));
  });

  it('003 E-9 E-10 RF-022 C-13 404 TASK_NOT_FOUND por tarea inexistente, borrada, ajena y con id mal formado', async () => {
    const ana = await signupCookie('ana@example.com');
    const luis = await signupCookie('luis@example.com');
    const [deleted] = await column(ana, 'todo', ['Preparar la demo']);
    const removed = await request(app)
      .delete(`/api/tasks/${deleted!.id}`)
      .set('Cookie', ana)
      .send({});
    expect(removed.status).toBe(204);
    const [foreign] = await column(luis, 'todo', ['Comprar pan']);
    const body = { status: 'in_progress', index: 0, today: TODAY };

    for (const id of [randomUUID(), deleted!.id, foreign!.id, 'no-es-un-uuid']) {
      const res = await move(ana, id, body);
      expect(res.status).toBe(404);
      expect(res.body).toEqual(errorBody('TASK_NOT_FOUND'));
    }
    expect(await titlesIn(luis, 'todo')).toEqual(['Comprar pan']);
  });

  it('003 RNF-003 el orden de Luis no cambia cuando Ana mueve y crea', async () => {
    const ana = await signupCookie('ana@example.com');
    const luis = await signupCookie('luis@example.com');
    await column(luis, 'todo', ['Comprar pan', 'Llamar al banco']);
    const positions = () =>
      prisma.task.findMany({
        where: { user: { email: 'luis@example.com' } },
        orderBy: { position: 'asc' },
        select: { title: true, position: true },
      });
    const before = await positions();
    const [demo] = await column(ana, 'backlog', ['Preparar la demo']);

    await move(ana, demo!.id, { status: 'todo', index: 0, today: TODAY });
    await createTaskFor(ana, { title: 'Revisar el correo' });

    expect(await positions()).toEqual(before);
  });

  it('003 E-11 dos `move` seguidos sobre la misma columna: queda el orden del segundo y no se repite ninguna posición', async () => {
    const ana = await signupCookie('ana@example.com');
    const [bread, bank, demo] = await column(ana, 'todo', [
      'Comprar pan',
      'Llamar al banco',
      'Preparar la demo',
    ]);

    await move(ana, demo!.id, { status: 'todo', index: 0, today: TODAY });
    await move(ana, bread!.id, { status: 'todo', index: 0, today: TODAY });

    expect(await titlesIn(ana, 'todo')).toEqual([
      'Comprar pan',
      'Preparar la demo',
      'Llamar al banco',
    ]);
    const rows = await prisma.task.findMany({
      where: { id: { in: [bread!.id, bank!.id, demo!.id] } },
    });
    expect(new Set(rows.map(({ position }) => position)).size).toBe(3);
  });

  it('003 E-11 D-2 dos `move` a la vez no repiten posición', async () => {
    const ana = await signupCookie('ana@example.com');
    const tasks = await column(ana, 'todo', ['Comprar pan', 'Llamar al banco', 'Preparar la demo']);

    const results = await Promise.all(
      tasks.map(({ id }) => move(ana, id, { status: 'in_progress', index: 0, today: TODAY })),
    );

    expect(results.map(({ status }) => status)).toEqual([200, 200, 200]);
    const rows = await prisma.task.findMany({ where: { status: 'in_progress' } });
    expect(new Set(rows.map(({ position }) => position)).size).toBe(3);
  });
});
