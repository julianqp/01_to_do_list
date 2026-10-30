import type { UpdateTaskInput } from '@todo/shared';
import { describe, expect, it } from 'vitest';
import { AppError } from '../errors';
import { prisma } from '../repositories/prisma';
import { createTask, deleteTask, listTasks, updateTask } from './tasks.service';

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
});
