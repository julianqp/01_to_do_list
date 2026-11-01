import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { prisma } from '../src/repositories/prisma';
import { createTaskFor, NEW_TASK, sidCookie, signupCookie } from './helpers';

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

  it('003 RF-008 el orden sale de `position`, no del momento de creación', async () => {
    const ana = await signupCookie('ana@example.com');
    const bread = await createTaskFor(ana, { title: 'Comprar pan' });
    const demo = await createTaskFor(ana, { title: 'Preparar la demo' });
    const bank = await createTaskFor(ana, { title: 'Llamar al banco' });
    const positions = { [demo.id]: 0, [bank.id]: 5, [bread.id]: 2 };
    for (const [id, position] of Object.entries(positions)) {
      await prisma.task.update({ where: { id }, data: { position } });
    }

    expect(titlesOf(await list(ana))).toEqual([
      'Preparar la demo',
      'Comprar pan',
      'Llamar al banco',
    ]);
  });

  it('003 RF-008 D-1 con la misma `position`, desempata `createdAt` descendente y después `id` descendente', async () => {
    const ana = await signupCookie('ana@example.com');
    const tasks = [];
    for (const title of ['Uno', 'Dos', 'Tres', 'Cuatro']) {
      tasks.push(await createTaskFor(ana, { title }));
    }
    await prisma.task.updateMany({
      data: { position: 7, createdAt: new Date('2026-10-29T10:00:00.000Z') },
    });
    const [newest] = tasks;
    await prisma.task.update({
      where: { id: newest!.id },
      data: { createdAt: new Date('2026-10-30T10:00:00.000Z') },
    });

    const ids = (await list(ana)).body.tasks.map(({ id }: { id: string }) => id);

    const sameMoment = tasks
      .slice(1)
      .map(({ id }) => id)
      .sort()
      .reverse();
    expect(ids).toEqual([newest!.id, ...sameMoment]);
    expect((await list(ana)).body.tasks.map(({ id }: { id: string }) => id)).toEqual(ids);
  });

  it('003 RF-010 cambiar de estado la pone la primera de la columna nueva, aunque sea la más antigua', async () => {
    const ana = await signupCookie('ana@example.com');
    const older = await createTaskFor(ana, { title: 'Comprar pan' });
    const newer = await createTaskFor(ana, { title: 'Preparar la demo' });
    const toTodo = (id: string, title: string) =>
      request(app)
        .put(`/api/tasks/${id}`)
        .set('Cookie', ana)
        .send({ ...NEW_TASK, title, status: 'todo', actualEndDate: null });

    expect((await toTodo(newer.id, 'Preparar la demo')).status).toBe(200);
    expect((await toTodo(older.id, 'Comprar pan')).status).toBe(200);

    expect(titlesOf(await list(ana))).toEqual(['Comprar pan', 'Preparar la demo']);
  });

  it('003 CA-2.2 RF-008 dos sesiones de la misma cuenta ven el mismo orden', async () => {
    const ana = await signupCookie('ana@example.com');
    const bread = await createTaskFor(ana, { title: 'Comprar pan' });
    const demo = await createTaskFor(ana, { title: 'Preparar la demo' });
    await prisma.task.update({ where: { id: bread.id }, data: { position: -1 } });
    await prisma.task.update({ where: { id: demo.id }, data: { position: 4 } });
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ana@example.com', password: 'correcta-horse-1' });
    expect(login.status).toBe(200);
    const otherSession = sidCookie(login);

    expect(otherSession).not.toBe(ana);
    expect(titlesOf(await list(otherSession))).toEqual(['Comprar pan', 'Preparar la demo']);
    expect(titlesOf(await list(ana))).toEqual(['Comprar pan', 'Preparar la demo']);
  });

  it('C-13 sin sesión → 401 UNAUTHENTICATED', async () => {
    const res = await list();

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: { code: 'UNAUTHENTICATED', message: expect.any(String) } });
  });
});
