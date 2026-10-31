import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { prisma } from '../src/repositories/prisma';
import { createTaskFor, NEW_TASK, signupCookie } from './helpers';

const app = createApp();

const list = (cookie?: string) => {
  const req = request(app).get('/api/tasks');
  return cookie ? req.set('Cookie', cookie) : req;
};

const titlesOf = (res: request.Response) =>
  (res.body as { tasks: { title: string }[] }).tasks.map(({ title }) => title);

describe('GET /api/tasks', () => {
  it('CA-1.4 RF-004 C-13 RNF-003 solo devuelve las tareas propias, y el recuento no cuenta las ajenas', async () => {
    const ana = await signupCookie('ana@example.com');
    const luis = await signupCookie('luis@example.com');
    await createTaskFor(ana, { title: 'Preparar la demo' });
    await createTaskFor(luis, { title: 'Comprar pan' });

    const res = await list(ana);

    expect(res.status).toBe(200);
    expect(titlesOf(res)).toEqual(['Preparar la demo']);
    expect(res.body.tasks).toHaveLength(1);
  });

  it('RF-002 C-16 cada tarea solo lleva los campos de Task (sin userId ni createdAt)', async () => {
    const ana = await signupCookie('ana@example.com');
    await createTaskFor(ana, { estimatedStartDate: '2026-11-14', estimatedEndDate: '2026-11-28' });

    const res = await list(ana);

    expect(res.body).toEqual({
      tasks: [
        {
          id: expect.any(String),
          title: 'Preparar la demo',
          description: '',
          status: 'backlog',
          estimatedStartDate: '2026-11-14',
          estimatedEndDate: '2026-11-28',
          actualEndDate: null,
        },
      ],
    });
  });

  it('CA-1.8 RF-002 de la más reciente a la más antigua por el momento de creación', async () => {
    const ana = await signupCookie('ana@example.com');
    const bread = await createTaskFor(ana, { title: 'Comprar pan' });
    const demo = await createTaskFor(ana, { title: 'Preparar la demo' });
    const old = await createTaskFor(ana, { title: 'Llamar al banco' });
    const createdAt = { [bread.id]: '2026-10-20', [demo.id]: '2026-10-25', [old.id]: '2026-10-01' };
    for (const [id, day] of Object.entries(createdAt)) {
      await prisma.task.update({ where: { id }, data: { createdAt: new Date(`${day}T10:00Z`) } });
    }

    expect(titlesOf(await list(ana))).toEqual([
      'Preparar la demo',
      'Comprar pan',
      'Llamar al banco',
    ]);
  });

  it('E-24 RF-002 D-1 con el mismo momento de creación, el orden es estable (id descendente)', async () => {
    const ana = await signupCookie('ana@example.com');
    const tasks = [];
    for (const title of ['Uno', 'Dos', 'Tres']) tasks.push(await createTaskFor(ana, { title }));
    await prisma.task.updateMany({ data: { createdAt: new Date('2026-10-29T10:00:00.000Z') } });

    const ids = (await list(ana)).body.tasks.map(({ id }: { id: string }) => id);

    expect(ids).toEqual(
      tasks
        .map(({ id }) => id)
        .sort()
        .reverse(),
    );
    expect((await list(ana)).body.tasks.map(({ id }: { id: string }) => id)).toEqual(ids);
  });

  it('E-22 RF-002 cambiar de estado no cambia el orden', async () => {
    const ana = await signupCookie('ana@example.com');
    const older = await createTaskFor(ana, { title: 'Comprar pan' });
    await prisma.task.update({
      where: { id: older.id },
      data: { createdAt: new Date('2026-10-20T10:00:00.000Z') },
    });
    await createTaskFor(ana, { title: 'Preparar la demo' });

    const res = await request(app)
      .put(`/api/tasks/${older.id}`)
      .set('Cookie', ana)
      .send({ ...NEW_TASK, title: 'Comprar pan', status: 'todo', actualEndDate: null });
    expect(res.status).toBe(200);

    expect(titlesOf(await list(ana))).toEqual(['Preparar la demo', 'Comprar pan']);
  });

  it('C-13 sin sesión → 401 UNAUTHENTICATED', async () => {
    const res = await list();

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: { code: 'UNAUTHENTICATED', message: expect.any(String) } });
  });
});
