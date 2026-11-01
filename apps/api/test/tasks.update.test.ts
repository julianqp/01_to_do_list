import { randomUUID } from 'node:crypto';
import type { Task } from '@todo/shared';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { prisma } from '../src/repositories/prisma';
import { createTaskFor, NEW_TASK, signupCookie, utcIsoDate } from './helpers';

const app = createApp();

const UPDATE = { ...NEW_TASK, status: 'todo', actualEndDate: null };

const put = (cookie: string | undefined, id: string, body: object) => {
  const req = request(app).put(`/api/tasks/${id}`);
  return (cookie ? req.set('Cookie', cookie) : req).send(body);
};
const list = (cookie: string) => request(app).get('/api/tasks').set('Cookie', cookie);

const errorBody = (code: string) => ({ error: { code, message: expect.any(String) } });
const prismaPosition = (id: string, position: number) =>
  prisma.task.update({ where: { id }, data: { position } });

// Crea las tareas en este orden y las pasa a `status`: quedan de la última a la primera (RF-010).
async function column(cookie: string, status: 'todo' | 'in_progress', titles: string[]) {
  const tasks = [];
  for (const title of titles) {
    const task = await createTaskFor(cookie, { title });
    expect((await put(cookie, task.id, { ...UPDATE, title, status })).status).toBe(200);
    tasks.push(task);
  }
  return tasks;
}

const titlesIn = async (cookie: string, status: string) =>
  ((await list(cookie)).body.tasks as Task[])
    .filter((task) => task.status === status)
    .map(({ title }) => title);

describe('PUT /api/tasks/:id', () => {
  it('003 CA-2.4 RF-010 la segunda de To do pasa a In progress: sale la primera, y el orden relativo del resto no cambia', async () => {
    const ana = await signupCookie('ana@example.com');
    // «Preparar la demo» es la más antigua: por `createdAt` saldría la última de In progress.
    const [demo] = await column(ana, 'todo', ['Preparar la demo']);
    await column(ana, 'in_progress', ['Pagar el alquiler', 'Revisar el correo']);
    // To do: Comprar pan, Preparar la demo, Llamar al banco.
    const [bank, bread] = await column(ana, 'todo', ['Llamar al banco', 'Comprar pan']);
    await prismaPosition(bank!.id, 10);
    await prismaPosition(demo!.id, 5);
    await prismaPosition(bread!.id, 0);

    const res = await put(ana, demo!.id, {
      ...UPDATE,
      title: 'Preparar la demo',
      status: 'in_progress',
    });

    expect(res.status).toBe(200);
    expect(await titlesIn(ana, 'in_progress')).toEqual([
      'Preparar la demo',
      'Revisar el correo',
      'Pagar el alquiler',
    ]);
    expect(await titlesIn(ana, 'todo')).toEqual(['Comprar pan', 'Llamar al banco']);
  });

  it('003 RF-010 un PUT sin cambio de estado no la mueve', async () => {
    const ana = await signupCookie('ana@example.com');
    const [last] = await column(ana, 'todo', [
      'Llamar al banco',
      'Comprar pan',
      'Preparar la demo',
    ]);

    const res = await put(ana, last!.id, { ...UPDATE, title: 'Llamar a la gestoría' });

    expect(res.status).toBe(200);
    expect(await titlesIn(ana, 'todo')).toEqual([
      'Preparar la demo',
      'Comprar pan',
      'Llamar a la gestoría',
    ]);
  });

  it('003 RNF-003 C-13 el PUT de una tarea ajena da 404 TASK_NOT_FOUND y no cambia el orden de su dueño', async () => {
    const ana = await signupCookie('ana@example.com');
    const luis = await signupCookie('luis@example.com');
    const [bank] = await column(luis, 'todo', ['Llamar al banco', 'Comprar pan']);

    const res = await put(ana, bank!.id, { ...UPDATE, status: 'in_progress' });

    expect(res.status).toBe(404);
    expect(res.body).toEqual(errorBody('TASK_NOT_FOUND'));
    expect(await titlesIn(luis, 'todo')).toEqual(['Comprar pan', 'Llamar al banco']);
  });

  it('CA-3.2 CA-4.1 RF-013 D-2 sustituye la tarea completa y la devuelve', async () => {
    const ana = await signupCookie('ana@example.com');
    const task = await createTaskFor(ana, {
      description: 'Revisar con el equipo',
      estimatedStartDate: '2026-11-14',
    });

    const res = await put(ana, task.id, {
      title: 'Preparar la demo final',
      description: '',
      estimatedStartDate: null,
      estimatedEndDate: '2026-11-28',
      status: 'in_progress',
      actualEndDate: null,
    });

    const expected = {
      id: task.id,
      title: 'Preparar la demo final',
      description: '',
      status: 'in_progress',
      estimatedStartDate: null,
      estimatedEndDate: '2026-11-28',
      actualEndDate: null,
    };
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ task: expected });
    expect((await list(ana)).body.tasks).toEqual([expected]);
  });

  it('E-13 D-2 con dos PUT seguidos, queda el segundo', async () => {
    const ana = await signupCookie('ana@example.com');
    const task = await createTaskFor(ana);

    expect((await put(ana, task.id, { ...UPDATE, title: 'Primera pestaña' })).status).toBe(200);
    expect((await put(ana, task.id, { ...UPDATE, title: 'Segunda pestaña' })).status).toBe(200);

    expect((await list(ana)).body.tasks[0].title).toBe('Segunda pestaña');
  });

  it('CA-4.3 CA-4.5 RF-039 en Done guarda la fecha real de fin de hoy', async () => {
    const ana = await signupCookie('ana@example.com');
    const task = await createTaskFor(ana);

    const res = await put(ana, task.id, {
      ...UPDATE,
      status: 'done',
      actualEndDate: utcIsoDate(0),
    });

    expect(res.status).toBe(200);
    expect(res.body.task).toMatchObject({ status: 'done', actualEndDate: utcIsoDate(0) });
  });

  it('CA-4.8 RF-041 pasar a otro estado deja la fecha real de fin en null', async () => {
    const ana = await signupCookie('ana@example.com');
    const task = await createTaskFor(ana);
    await put(ana, task.id, { ...UPDATE, status: 'done', actualEndDate: '2026-10-27' });

    const res = await put(ana, task.id, {
      ...UPDATE,
      status: 'in_progress',
      actualEndDate: '2026-10-27',
    });

    expect(res.status).toBe(200);
    expect(res.body.task).toMatchObject({ status: 'in_progress', actualEndDate: null });
  });

  it('CA-4.7 RF-040 Done sin fecha real de fin → 400 VALIDATION_ERROR y la tarea no cambia', async () => {
    const ana = await signupCookie('ana@example.com');
    const task = await createTaskFor(ana);

    const res = await put(ana, task.id, { ...UPDATE, status: 'done', actualEndDate: null });

    expect(res.status).toBe(400);
    expect(res.body).toEqual(errorBody('VALIDATION_ERROR'));
    expect((await list(ana)).body.tasks).toEqual([task]);
  });

  it('CA-4.6 RF-039 D-6 fin real «pasado mañana UTC» → 400 VALIDATION_ERROR y la tarea no cambia', async () => {
    const ana = await signupCookie('ana@example.com');
    const task = await createTaskFor(ana);

    const res = await put(ana, task.id, {
      ...UPDATE,
      status: 'done',
      actualEndDate: utcIsoDate(2),
    });

    expect(res.status).toBe(400);
    expect(res.body).toEqual(errorBody('VALIDATION_ERROR'));
    expect((await list(ana)).body.tasks).toEqual([task]);
  });

  it('RF-014 RF-018 cuerpo no válido → 400 VALIDATION_ERROR', async () => {
    const ana = await signupCookie('ana@example.com');
    const task = await createTaskFor(ana);

    for (const body of [
      { ...UPDATE, title: '' },
      { ...UPDATE, estimatedStartDate: '2026-11-28', estimatedEndDate: '2026-11-14' },
      { ...UPDATE, status: 'archived' },
      NEW_TASK,
    ]) {
      const res = await put(ana, task.id, body);
      expect(res.status).toBe(400);
      expect(res.body).toEqual(errorBody('VALIDATION_ERROR'));
    }
  });

  it('CA-3.6 RF-030 C-13 tarea inexistente → 404 TASK_NOT_FOUND', async () => {
    const ana = await signupCookie('ana@example.com');

    const res = await put(ana, randomUUID(), UPDATE);

    expect(res.status).toBe(404);
    expect(res.body).toEqual(errorBody('TASK_NOT_FOUND'));
  });

  it('E-18 RNF-003 C-13 tarea ajena → 404 TASK_NOT_FOUND, igual que una inexistente, y no cambia', async () => {
    const ana = await signupCookie('ana@example.com');
    const luis = await signupCookie('luis@example.com');
    const task = await createTaskFor(luis, { title: 'Comprar pan' });

    const res = await put(ana, task.id, { ...UPDATE, title: 'Robada' });

    expect(res.status).toBe(404);
    expect(res.body).toEqual(errorBody('TASK_NOT_FOUND'));
    expect((await list(luis)).body.tasks).toEqual([task]);
  });

  it('C-13 C-14 D-3 id mal formado → 404 TASK_NOT_FOUND', async () => {
    const ana = await signupCookie('ana@example.com');

    const res = await put(ana, 'no-es-un-uuid', UPDATE);

    expect(res.status).toBe(404);
    expect(res.body).toEqual(errorBody('TASK_NOT_FOUND'));
  });

  it('E-14 RF-030 PUT después de un DELETE → 404 TASK_NOT_FOUND', async () => {
    const ana = await signupCookie('ana@example.com');
    const task = await createTaskFor(ana);
    const deleted = await request(app).delete(`/api/tasks/${task.id}`).set('Cookie', ana).send({});
    expect(deleted.status).toBe(204);

    const res = await put(ana, task.id, UPDATE);

    expect(res.status).toBe(404);
    expect(res.body).toEqual(errorBody('TASK_NOT_FOUND'));
  });

  it('C-13 sin sesión → 401 UNAUTHENTICATED', async () => {
    const res = await put(undefined, randomUUID(), UPDATE);

    expect(res.status).toBe(401);
    expect(res.body).toEqual(errorBody('UNAUTHENTICATED'));
  });

  it('001 D-13 sin Content-Type JSON → 415 UNSUPPORTED_MEDIA_TYPE', async () => {
    const ana = await signupCookie('ana@example.com');
    const task = await createTaskFor(ana);

    const res = await request(app)
      .put(`/api/tasks/${task.id}`)
      .set('Cookie', ana)
      .set('Content-Type', 'text/plain')
      .send('title=x');

    expect(res.status).toBe(415);
    expect(res.body).toEqual(errorBody('UNSUPPORTED_MEDIA_TYPE'));
  });
});
