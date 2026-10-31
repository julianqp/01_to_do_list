import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { prisma } from '../src/repositories/prisma';
import { createTaskFor, signupCookie } from './helpers';

const app = createApp();

const remove = (cookie: string | undefined, id: string) => {
  const req = request(app).delete(`/api/tasks/${id}`);
  return (cookie ? req.set('Cookie', cookie) : req).send({});
};
const list = (cookie: string) => request(app).get('/api/tasks').set('Cookie', cookie);

const errorBody = (code: string) => ({ error: { code, message: expect.any(String) } });

describe('DELETE /api/tasks/:id', () => {
  it('CA-5.2 RF-027 borra la tarea → 204 sin cuerpo y deja de aparecer', async () => {
    const ana = await signupCookie('ana@example.com');
    const task = await createTaskFor(ana);
    const other = await createTaskFor(ana, { title: 'Comprar pan' });

    const res = await remove(ana, task.id);

    expect(res.status).toBe(204);
    expect(res.text).toBe('');
    expect((await list(ana)).body.tasks).toEqual([other]);
  });

  it('RF-030 C-13 tarea inexistente → 404 TASK_NOT_FOUND', async () => {
    const ana = await signupCookie('ana@example.com');

    const res = await remove(ana, randomUUID());

    expect(res.status).toBe(404);
    expect(res.body).toEqual(errorBody('TASK_NOT_FOUND'));
  });

  it('E-18 RNF-003 C-13 tarea ajena → 404 TASK_NOT_FOUND, igual que una inexistente, y no la borra', async () => {
    const ana = await signupCookie('ana@example.com');
    const luis = await signupCookie('luis@example.com');
    const task = await createTaskFor(luis, { title: 'Comprar pan' });

    const res = await remove(ana, task.id);

    expect(res.status).toBe(404);
    expect(res.body).toEqual(errorBody('TASK_NOT_FOUND'));
    expect((await list(luis)).body.tasks).toEqual([task]);
  });

  it('C-13 C-14 D-3 id mal formado → 404 TASK_NOT_FOUND', async () => {
    const ana = await signupCookie('ana@example.com');

    const res = await remove(ana, 'no-es-un-uuid');

    expect(res.status).toBe(404);
    expect(res.body).toEqual(errorBody('TASK_NOT_FOUND'));
  });

  it('E-14 RF-030 DELETE después de un DELETE → 404 TASK_NOT_FOUND', async () => {
    const ana = await signupCookie('ana@example.com');
    const task = await createTaskFor(ana);
    expect((await remove(ana, task.id)).status).toBe(204);

    const res = await remove(ana, task.id);

    expect(res.status).toBe(404);
    expect(res.body).toEqual(errorBody('TASK_NOT_FOUND'));
  });

  it('C-13 sin sesión → 401 UNAUTHENTICATED y no la borra', async () => {
    const ana = await signupCookie('ana@example.com');
    const task = await createTaskFor(ana);

    const res = await remove(undefined, task.id);

    expect(res.status).toBe(401);
    expect(res.body).toEqual(errorBody('UNAUTHENTICATED'));
    expect(await prisma.task.count()).toBe(1);
  });

  it('001 D-13 sin Content-Type JSON → 415 UNSUPPORTED_MEDIA_TYPE y no la borra', async () => {
    const ana = await signupCookie('ana@example.com');
    const task = await createTaskFor(ana);

    const res = await request(app).delete(`/api/tasks/${task.id}`).set('Cookie', ana);

    expect(res.status).toBe(415);
    expect(res.body).toEqual(errorBody('UNSUPPORTED_MEDIA_TYPE'));
    expect(await prisma.task.count()).toBe(1);
  });

  it('C-16 RNF-003 borrar el usuario borra sus tareas en cascada', async () => {
    const ana = await signupCookie('ana@example.com');
    const luis = await signupCookie('luis@example.com');
    await createTaskFor(ana);
    await createTaskFor(ana, { title: 'Comprar pan' });
    await createTaskFor(luis, { title: 'Llamar al banco' });

    await prisma.user.delete({ where: { email: 'ana@example.com' } });

    expect(await prisma.task.count()).toBe(1);
    expect((await list(luis)).body.tasks).toHaveLength(1);
  });
});
