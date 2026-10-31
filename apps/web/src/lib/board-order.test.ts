import type { Task, TaskStatus } from '@todo/shared';
import { describe, expect, it } from 'vitest';
import {
  groupByStatus,
  placeTask,
  placementFromOver,
  placementOf,
  samePlacement,
  stepPlacement,
} from './board-order';

const task = (id: string, status: TaskStatus): Task => ({
  id,
  title: id,
  description: '',
  status,
  estimatedStartDate: null,
  estimatedEndDate: null,
  actualEndDate: null,
});

// To do: pan, banco, demo; In progress: correo, informe; Backlog y Done vacías. Mezcladas, como llegan
// del servidor: el orden de cada columna es el de la lista.
const TASKS = [
  task('correo', 'in_progress'),
  task('pan', 'todo'),
  task('banco', 'todo'),
  task('informe', 'in_progress'),
  task('demo', 'todo'),
];

const idsByStatus = (tasks: Task[]) =>
  Object.fromEntries(
    Object.entries(groupByStatus(tasks)).map(([status, group]) => [
      status,
      group.map(({ id }) => id),
    ]),
  );

describe('groupByStatus', () => {
  it('reparte por estado sin reordenar, con las cuatro columnas aunque estén vacías', () => {
    expect(idsByStatus(TASKS)).toEqual({
      backlog: [],
      todo: ['pan', 'banco', 'demo'],
      in_progress: ['correo', 'informe'],
      done: [],
    });
  });
});

describe('placeTask', () => {
  const demo = TASKS[4]!;

  it('003 RF-007 dentro de la misma columna, la pone en `to` sin cambiar el orden relativo del resto', () => {
    const tasks = placeTask(TASKS, demo, { status: 'todo', index: 0 });

    expect(idsByStatus(tasks)).toMatchObject({
      todo: ['demo', 'pan', 'banco'],
      in_progress: ['correo', 'informe'],
    });
  });

  it('003 RF-001 en otra columna, con el estado nuevo; las demás columnas no cambian', () => {
    const tasks = placeTask(TASKS, demo, { status: 'in_progress', index: 1 });

    expect(idsByStatus(tasks)).toMatchObject({
      todo: ['pan', 'banco'],
      in_progress: ['correo', 'demo', 'informe'],
    });
    expect(tasks.find(({ id }) => id === 'demo')?.status).toBe('in_progress');
    expect(tasks).toHaveLength(TASKS.length);
  });

  it('003 E-1 en una columna vacía y al final de una columna', () => {
    expect(idsByStatus(placeTask(TASKS, demo, { status: 'done', index: 0 }))).toMatchObject({
      todo: ['pan', 'banco'],
      done: ['demo'],
    });
    expect(
      idsByStatus(placeTask(TASKS, TASKS[1]!, { status: 'in_progress', index: 2 })),
    ).toMatchObject({ in_progress: ['correo', 'informe', 'pan'] });
  });

  it('un `index` mayor que la columna la pone al final', () => {
    expect(idsByStatus(placeTask(TASKS, demo, { status: 'in_progress', index: 9 }))).toMatchObject({
      in_progress: ['correo', 'informe', 'demo'],
    });
  });

  it('usa la tarea que recibe (con sus datos nuevos) y no cambia la lista original', () => {
    const tasks = placeTask(
      TASKS,
      { ...demo, actualEndDate: '2026-10-31' },
      {
        status: 'done',
        index: 0,
      },
    );

    expect(tasks.find(({ id }) => id === 'demo')?.actualEndDate).toBe('2026-10-31');
    expect(idsByStatus(TASKS).todo).toEqual(['pan', 'banco', 'demo']);
  });
});

describe('placementOf y samePlacement', () => {
  it('la posición de una tarea dentro de su columna; undefined si no está', () => {
    expect(placementOf(TASKS, 'demo')).toEqual({ status: 'todo', index: 2 });
    expect(placementOf(TASKS, 'informe')).toEqual({ status: 'in_progress', index: 1 });
    expect(placementOf(TASKS, 'otra')).toBeUndefined();
  });

  it('003 RF-011 compara estado y posición', () => {
    expect(samePlacement({ status: 'todo', index: 1 }, { status: 'todo', index: 1 })).toBe(true);
    expect(samePlacement({ status: 'todo', index: 1 }, { status: 'todo', index: 0 })).toBe(false);
    expect(samePlacement({ status: 'todo', index: 1 }, { status: 'done', index: 1 })).toBe(false);
  });
});

describe('stepPlacement', () => {
  const groups = groupByStatus(TASKS);

  it('003 CA-3.3 RF-014 arriba y abajo, una posición dentro de su columna', () => {
    expect(stepPlacement(groups, { status: 'todo', index: 1 }, 'ArrowUp')).toEqual({
      status: 'todo',
      index: 0,
    });
    expect(stepPlacement(groups, { status: 'todo', index: 1 }, 'ArrowDown')).toEqual({
      status: 'todo',
      index: 2,
    });
  });

  it('003 CA-3.4 RF-014 izquierda y derecha, a la primera de la columna vecina, también si está vacía', () => {
    expect(stepPlacement(groups, { status: 'todo', index: 1 }, 'ArrowRight')).toEqual({
      status: 'in_progress',
      index: 0,
    });
    expect(stepPlacement(groups, { status: 'todo', index: 2 }, 'ArrowLeft')).toEqual({
      status: 'backlog',
      index: 0,
    });
    expect(stepPlacement(groups, { status: 'in_progress', index: 1 }, 'ArrowRight')).toEqual({
      status: 'done',
      index: 0,
    });
  });

  it('003 CA-3.7 RF-015 en los bordes no hay sitio: undefined', () => {
    const backlog = groupByStatus([task('demo', 'backlog'), task('pan', 'backlog')]);
    expect(stepPlacement(backlog, { status: 'backlog', index: 0 }, 'ArrowUp')).toBeUndefined();
    expect(stepPlacement(backlog, { status: 'backlog', index: 0 }, 'ArrowLeft')).toBeUndefined();
    expect(stepPlacement(groups, { status: 'todo', index: 2 }, 'ArrowDown')).toBeUndefined();
    const done = groupByStatus([task('demo', 'done')]);
    expect(stepPlacement(done, { status: 'done', index: 0 }, 'ArrowRight')).toBeUndefined();
  });

  it('003 E-3 con una sola tarjeta, arriba y abajo no la mueven', () => {
    const single = groupByStatus([task('demo', 'todo')]);
    expect(stepPlacement(single, { status: 'todo', index: 0 }, 'ArrowUp')).toBeUndefined();
    expect(stepPlacement(single, { status: 'todo', index: 0 }, 'ArrowDown')).toBeUndefined();
    expect(stepPlacement(single, { status: 'todo', index: 0 }, 'ArrowRight')).toEqual({
      status: 'in_progress',
      index: 0,
    });
  });
});

describe('placementFromOver', () => {
  const groups = groupByStatus(TASKS);

  it('003 D-9 RF-007 en la misma columna, la posición de la tarjeta de debajo, hacia arriba y hacia abajo (como arrayMove)', () => {
    const up = { kind: 'card', id: 'pan' } as const;
    const down = { kind: 'card', id: 'demo' } as const;
    // `below` no cuenta dentro de la misma columna: no oscila al cambiar el orden.
    for (const below of [false, true]) {
      expect(placementFromOver(groups, 'demo', up, below)).toEqual({ status: 'todo', index: 0 });
      expect(placementFromOver(groups, 'pan', down, below)).toEqual({ status: 'todo', index: 2 });
    }
  });

  it('003 D-9 sobre sí misma, donde está', () => {
    expect(placementFromOver(groups, 'banco', { kind: 'card', id: 'banco' }, true)).toEqual({
      status: 'todo',
      index: 1,
    });
  });

  it('003 D-9 RF-001 en otra columna, antes o después de la tarjeta según el centro', () => {
    const over = { kind: 'card', id: 'informe' } as const;
    expect(placementFromOver(groups, 'demo', over, false)).toEqual({
      status: 'in_progress',
      index: 1,
    });
    expect(placementFromOver(groups, 'demo', over, true)).toEqual({
      status: 'in_progress',
      index: 2,
    });
  });

  it('003 E-1 sobre una columna vacía, al final, que es la primera', () => {
    expect(placementFromOver(groups, 'demo', { kind: 'column', status: 'done' }, false)).toEqual({
      status: 'done',
      index: 0,
    });
  });

  it('sobre una columna con tarjetas (sin tarjeta debajo), al final sin contar la que se mueve', () => {
    expect(
      placementFromOver(groups, 'demo', { kind: 'column', status: 'in_progress' }, false),
    ).toEqual({ status: 'in_progress', index: 2 });
    expect(placementFromOver(groups, 'demo', { kind: 'column', status: 'todo' }, false)).toEqual({
      status: 'todo',
      index: 2,
    });
  });
});
