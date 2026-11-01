import type { UpdateTaskInput } from '@todo/shared';
import { describe, expect, it } from 'vitest';
import { AppError } from '../errors';
import { prisma } from '../repositories/prisma';
import { createTask, deleteTask, listTasks, moveTask, updateTask } from './tasks.service';

const NEW_TASK = {
  title: 'Preparar la demo',
  description: '',
  estimatedStartDate: null,
  estimatedEndDate: null,
};
const done = (actualEndDate: string): UpdateTaskInput => ({
  ...NEW_TASK,
  status: 'done',
  actualEndDate,
});
// 30/10/2026 a las 23:00 UTC: en UTC + 1 ya es el 31; en Kiritimati (UTC + 14), el 31 por la tarde.
const NOW = new Date('2026-10-30T23:00:00.000Z');

async function givenUser(email: string) {
  return prisma.user.create({ data: { email, passwordHash: 'x' }, select: { id: true } });
}

async function rejection(promise: Promise<unknown>) {
  const error = await promise.catch((e: unknown) => e);
  expect(error).toBeInstanceOf(AppError);
  return error as AppError;
}

describe('tasks.service', () => {
  it('RF-011 D-5 crea la tarea en Backlog y devuelve solo los campos de Task, con las fechas en ISO', async () => {
    const ana = await givenUser('ana@example.com');

    const task = await createTask(ana.id, {
      ...NEW_TASK,
      estimatedStartDate: '2026-11-14',
      estimatedEndDate: '2026-11-28',
    });

    expect(task).toEqual({
      id: expect.any(String),
      title: 'Preparar la demo',
      description: '',
      status: 'backlog',
      estimatedStartDate: '2026-11-14',
      estimatedEndDate: '2026-11-28',
      actualEndDate: null,
    });
    expect(await listTasks(ana.id)).toEqual([task]);
  });

  it('RF-039 D-6 con `now` fijo, acepta como fin real «hoy UTC + 1» y rechaza «+ 2» con VALIDATION_ERROR', async () => {
    const ana = await givenUser('ana@example.com');
    const task = await createTask(ana.id, NEW_TASK);

    await expect(updateTask(ana.id, task.id, done('2026-10-31'), NOW)).resolves.toMatchObject({
      status: 'done',
      actualEndDate: '2026-10-31',
    });

    const error = await rejection(updateTask(ana.id, task.id, done('2026-11-01'), NOW));
    expect(error).toMatchObject({ code: 'VALIDATION_ERROR', status: 400 });
    expect((await listTasks(ana.id))[0]?.actualEndDate).toBe('2026-10-31');
  });

  it('C-13 D-3 E-18 updateTask de una tarea ajena lanza TASK_NOT_FOUND y no la cambia', async () => {
    const ana = await givenUser('ana@example.com');
    const luis = await givenUser('luis@example.com');
    const task = await createTask(luis.id, { ...NEW_TASK, title: 'Comprar pan' });

    const error = await rejection(
      updateTask(ana.id, task.id, { ...NEW_TASK, status: 'todo', actualEndDate: null }, NOW),
    );

    expect(error).toMatchObject({ code: 'TASK_NOT_FOUND', status: 404 });
    expect(await listTasks(luis.id)).toEqual([task]);
  });

  it('C-13 D-3 E-18 deleteTask de una tarea ajena lanza TASK_NOT_FOUND y no la borra', async () => {
    const ana = await givenUser('ana@example.com');
    const luis = await givenUser('luis@example.com');
    const task = await createTask(luis.id, { ...NEW_TASK, title: 'Comprar pan' });

    const error = await rejection(deleteTask(ana.id, task.id));

    expect(error).toMatchObject({ code: 'TASK_NOT_FOUND', status: 404 });
    expect(await listTasks(luis.id)).toEqual([task]);
  });

  it('E-14 RF-030 updateTask y deleteTask de una tarea que ya no existe lanzan TASK_NOT_FOUND', async () => {
    const ana = await givenUser('ana@example.com');
    const task = await createTask(ana.id, NEW_TASK);
    await deleteTask(ana.id, task.id);

    expect(await rejection(deleteTask(ana.id, task.id))).toMatchObject({ code: 'TASK_NOT_FOUND' });
    expect(await rejection(updateTask(ana.id, task.id, done('2026-10-30'), NOW))).toMatchObject({
      code: 'TASK_NOT_FOUND',
    });
  });

  describe('moveTask', () => {
    it('003 RF-003 D-4 con `now` fijo, entrar en Done con «hoy UTC + 1» se acepta y con «+ 2» lanza VALIDATION_ERROR', async () => {
      const ana = await givenUser('ana@example.com');
      const task = await createTask(ana.id, NEW_TASK);

      const error = await rejection(
        moveTask(ana.id, task.id, { status: 'done', index: 0, today: '2026-11-01' }, NOW),
      );
      expect(error).toMatchObject({ code: 'VALIDATION_ERROR', status: 400 });
      expect((await listTasks(ana.id))[0]).toEqual(task);

      await expect(
        moveTask(ana.id, task.id, { status: 'done', index: 0, today: '2026-10-31' }, NOW),
      ).resolves.toMatchObject({ status: 'done', actualEndDate: '2026-10-31' });
    });

    it('003 E-15 dentro de Done conserva la fecha y no comprueba el límite', async () => {
      const ana = await givenUser('ana@example.com');
      const task = await createTask(ana.id, NEW_TASK);
      await moveTask(ana.id, task.id, { status: 'done', index: 0, today: '2026-10-27' }, NOW);

      await expect(
        moveTask(ana.id, task.id, { status: 'done', index: 0, today: '2030-01-01' }, NOW),
      ).resolves.toMatchObject({ status: 'done', actualEndDate: '2026-10-27' });
    });

    it('003 RF-004 al salir de Done se queda sin fecha real de fin, sin comprobar `today`', async () => {
      const ana = await givenUser('ana@example.com');
      const task = await createTask(ana.id, NEW_TASK);
      await moveTask(ana.id, task.id, { status: 'done', index: 0, today: '2026-10-27' }, NOW);

      await expect(
        moveTask(ana.id, task.id, { status: 'todo', index: 0, today: '2030-01-01' }, NOW),
      ).resolves.toMatchObject({ status: 'todo', actualEndDate: null });
    });

    it('003 E-10 RNF-003 C-13 mover una tarea ajena lanza TASK_NOT_FOUND y no cambia ni la tarea ni el orden de su dueño', async () => {
      const ana = await givenUser('ana@example.com');
      const luis = await givenUser('luis@example.com');
      await createTask(ana.id, NEW_TASK);
      const bread = await createTask(luis.id, { ...NEW_TASK, title: 'Comprar pan' });
      await createTask(luis.id, { ...NEW_TASK, title: 'Llamar al banco' });
      const before = await prisma.task.findMany({
        where: { userId: luis.id },
        orderBy: { id: 'asc' },
      });

      const error = await rejection(
        moveTask(ana.id, bread.id, { status: 'backlog', index: 0, today: '2026-10-30' }, NOW),
      );

      expect(error).toMatchObject({ code: 'TASK_NOT_FOUND', status: 404 });
      expect(
        await prisma.task.findMany({ where: { userId: luis.id }, orderBy: { id: 'asc' } }),
      ).toEqual(before);
    });

    it('003 RF-007 D-2 mover a `index` 1 de una columna con tres desplaza solo las de debajo', async () => {
      const ana = await givenUser('ana@example.com');
      const moved = await createTask(ana.id, { ...NEW_TASK, title: 'Preparar la demo' });
      for (const title of ['Llamar al banco', 'Comprar pan', 'Revisar el correo']) {
        const task = await createTask(ana.id, { ...NEW_TASK, title });
        await moveTask(ana.id, task.id, { status: 'todo', index: 0, today: '2026-10-30' }, NOW);
      }
      const positions = async () =>
        Object.fromEntries(
          (await prisma.task.findMany({ where: { status: 'todo' } })).map((row) => [
            row.title,
            row.position,
          ]),
        );
      const before = await positions();

      await moveTask(ana.id, moved.id, { status: 'todo', index: 1, today: '2026-10-30' }, NOW);

      const after = await positions();
      expect(after['Revisar el correo']).toBe(before['Revisar el correo']);
      expect(after['Comprar pan']).toBe(before['Comprar pan']! + 1);
      expect(after['Llamar al banco']).toBe(before['Llamar al banco']! + 1);
      expect(after['Preparar la demo']).toBe(before['Comprar pan']);
      expect((await listTasks(ana.id)).map(({ title }) => title)).toEqual([
        'Revisar el correo',
        'Preparar la demo',
        'Comprar pan',
        'Llamar al banco',
      ]);
    });
  });
});
