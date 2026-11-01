import type { Task } from '@todo/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { apiError, json, mockBrowser } from '../components/test-utils';
import type { Placement } from './board-order';
import {
  useCreateTask,
  useDeleteTask,
  useMoveTask,
  useTasks,
  useUpdateTask,
  type MoveVariables,
} from './task-queries';

const browser = mockBrowser();

const TASK: Task = {
  id: '3f2c1a9e-8b7d-4c6e-9f1a-2b3c4d5e6f70',
  title: 'Preparar la demo',
  description: '',
  status: 'backlog',
  estimatedStartDate: null,
  estimatedEndDate: null,
  actualEndDate: null,
};
const INPUT = {
  title: 'Preparar la demo',
  description: '',
  estimatedStartDate: null,
  estimatedEndDate: null,
};
const UPDATE = { ...INPUT, status: 'todo' as const, actualEndDate: null };

// Las tres mutaciones tienen la misma forma; cada caso pasa las `variables` de su hook.
type AnyMutation = { mutateAsync: (variables: never) => Promise<unknown>; isPending: boolean };
const asAnyMutation = (useHook: () => unknown) => useHook as () => AnyMutation;
const run = (mutation: AnyMutation, variables: unknown) =>
  (mutation.mutateAsync as (variables: unknown) => Promise<unknown>)(variables);

// La lista se vuelve a pedir solo si hay alguien mirándola: el hook monta la consulta y la mutación.
function renderTasksWith<T>(useMutationHook: () => T) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return renderHook(() => ({ tasks: useTasks({ enabled: true }), mutation: useMutationHook() }), {
    wrapper,
  });
}

// La segunda petición de la lista no responde hasta llamar a `release`.
function holdSecondList() {
  let release!: () => void;
  let calls = 0;
  browser.routes['GET /api/tasks'] = () => {
    calls += 1;
    if (calls === 1) return json(200, { tasks: [] });
    return new Promise<Response>((resolve) => {
      release = () => resolve(new Response(JSON.stringify({ tasks: [TASK] }), { status: 200 }));
    });
  };
  return {
    release: () => release(),
    secondRequested: () => calls >= 2,
  };
}

const getsOfList = () => browser.callsTo('GET', '/api/tasks').length;

describe('task-queries', () => {
  it('RF-002 useTasks pide GET /api/tasks y devuelve la lista tal cual', async () => {
    browser.routes['GET /api/tasks'] = () => json(200, { tasks: [TASK] });

    const { result } = renderTasksWith(() => null);

    await waitFor(() => expect(result.current.tasks.data).toEqual([TASK]));
  });

  it('RF-004 useTasks no pide nada mientras no está habilitada', () => {
    const client = new QueryClient();
    renderHook(() => useTasks({ enabled: false }), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    });

    expect(getsOfList()).toBe(0);
  });

  it.each([
    [
      'useCreateTask',
      'POST /api/tasks',
      () => json(201, { task: TASK }),
      () => useCreateTask(),
      INPUT,
    ],
    [
      'useUpdateTask',
      `PUT /api/tasks/${TASK.id}`,
      () => json(200, { task: TASK }),
      () => useUpdateTask(),
      { id: TASK.id, input: UPDATE },
    ],
    [
      'useDeleteTask',
      `DELETE /api/tasks/${TASK.id}`,
      () => Promise.resolve(new Response(null, { status: 204 })),
      () => useDeleteTask(),
      TASK.id,
    ],
  ] as const)(
    'RF-024 D-7 %s solo se resuelve después de volver a pedir la lista',
    async (_name, route, handler, useHook, variables) => {
      const list = holdSecondList();
      browser.routes[route] = handler;
      const { result } = renderTasksWith(asAnyMutation(useHook));
      await waitFor(() => expect(result.current.tasks.isSuccess).toBe(true));

      let resolved = false;
      let pending!: Promise<unknown>;
      act(() => {
        pending = run(result.current.mutation, variables).then(() => {
          resolved = true;
        });
      });
      await waitFor(() => expect(list.secondRequested()).toBe(true));
      expect(resolved).toBe(false);
      expect(result.current.mutation.isPending).toBe(true);

      await act(async () => {
        list.release();
        await pending;
      });
      expect(resolved).toBe(true);
      await waitFor(() => expect(result.current.tasks.data).toEqual([TASK]));
    },
  );

  it('RF-013 useUpdateTask envía PUT a la tarea con la tarea completa', async () => {
    browser.routes['GET /api/tasks'] = () => json(200, { tasks: [] });
    browser.routes[`PUT /api/tasks/${TASK.id}`] = () => json(200, { task: TASK });
    const { result } = renderTasksWith(() => useUpdateTask());

    await act(() => result.current.mutation.mutateAsync({ id: TASK.id, input: UPDATE }));

    const [, init] = browser.callsTo('PUT', `/api/tasks/${TASK.id}`)[0]!;
    expect(init?.body).toBe(JSON.stringify(UPDATE));
  });

  it.each([
    ['useUpdateTask', 'PUT', () => useUpdateTask(), { id: TASK.id, input: UPDATE }],
    ['useDeleteTask', 'DELETE', () => useDeleteTask(), TASK.id],
  ] as const)(
    'RF-030 D-7 en %s, TASK_NOT_FOUND también vuelve a pedir la lista',
    async (_name, method, useHook, variables) => {
      browser.routes['GET /api/tasks'] = () => json(200, { tasks: [] });
      browser.routes[`${method} /api/tasks/${TASK.id}`] = () => apiError(404, 'TASK_NOT_FOUND');
      const { result } = renderTasksWith(asAnyMutation(useHook));
      await waitFor(() => expect(result.current.tasks.isSuccess).toBe(true));

      await act(async () => {
        await run(result.current.mutation, variables).catch(() => {});
      });

      expect(getsOfList()).toBe(2);
    },
  );

  it('CA-4.4 D-7 con un error de red al guardar, no se vuelve a pedir la lista (sin cambios en el tablero)', async () => {
    browser.routes['GET /api/tasks'] = () => json(200, { tasks: [TASK] });
    browser.routes[`PUT /api/tasks/${TASK.id}`] = () => Promise.reject(new TypeError('offline'));
    const { result } = renderTasksWith(() => useUpdateTask());
    await waitFor(() => expect(result.current.tasks.isSuccess).toBe(true));

    await act(async () => {
      await result.current.mutation.mutateAsync({ id: TASK.id, input: UPDATE }).catch(() => {});
    });

    expect(getsOfList()).toBe(1);
    expect(result.current.tasks.data).toEqual([TASK]);
  });
});

describe('useMoveTask', () => {
  const TODAY = '2026-10-31';
  const task = (id: string, status: Task['status'], overrides: Partial<Task> = {}): Task => ({
    ...TASK,
    id,
    title: id,
    status,
    ...overrides,
  });
  const BREAD = task('pan', 'todo');
  const DEMO = task('demo', 'todo');
  const MAIL = task('correo', 'in_progress');
  const SEED = [BREAD, DEMO, MAIL];

  const moveTo = (moved: Task, from: Placement, to: Placement): MoveVariables => ({
    task: moved,
    from,
    to,
    today: TODAY,
  });
  const DEMO_TO_PROGRESS = moveTo(
    DEMO,
    { status: 'todo', index: 1 },
    { status: 'in_progress', index: 0 },
  );
  const moveRoute = (id: string) => `POST /api/tasks/${id}/move`;

  // Una respuesta que no llega hasta llamar a `settle`.
  function hold(id: string) {
    let settle!: (response: Response | Error) => void;
    browser.routes[moveRoute(id)] = () =>
      new Promise<Response>((resolve, reject) => {
        settle = (response) => (response instanceof Error ? reject(response) : resolve(response));
      });
    return { settle: (response: Response | Error) => settle(response) };
  }

  async function renderBoard(tasks: Task[] = SEED) {
    browser.routes['GET /api/tasks'] = () => json(200, { tasks });
    const view = renderTasksWith(useMoveTask);
    await waitFor(() => expect(view.result.current.tasks.data).toEqual(tasks));
    return view;
  }

  // "estado:id" en el orden de la caché, por columna.
  const column = (view: Awaited<ReturnType<typeof renderBoard>>, status: Task['status']) =>
    (view.result.current.tasks.data ?? [])
      .filter((candidate) => candidate.status === status)
      .map(({ id }) => id);

  it('003 RF-020 con el `fetch` pendiente, la caché ya tiene la tarjeta en su sitio nuevo', async () => {
    const view = await renderBoard();
    const response = hold('demo');

    act(() => view.result.current.mutation.mutate(DEMO_TO_PROGRESS));

    await waitFor(() => expect(column(view, 'in_progress')).toEqual(['demo', 'correo']));
    expect(column(view, 'todo')).toEqual(['pan']);
    expect(browser.callsTo('POST', '/api/tasks/demo/move')).toHaveLength(1);
    expect(browser.callsTo('POST', '/api/tasks/demo/move')[0]?.[1]?.body).toBe(
      JSON.stringify({ status: 'in_progress', index: 0, today: TODAY }),
    );

    await act(async () => response.settle(new Response(JSON.stringify({ task: DEMO }))));
  });

  it('003 CA-1.4 RF-003 la tarjeta optimista lleva el estado nuevo y la fecha de hoy al entrar en Done', async () => {
    const view = await renderBoard();
    const response = hold('demo');

    act(() =>
      view.result.current.mutation.mutate(
        moveTo(DEMO, { status: 'todo', index: 1 }, { status: 'done', index: 0 }),
      ),
    );

    await waitFor(() =>
      expect(view.result.current.tasks.data?.find(({ id }) => id === 'demo')).toMatchObject({
        status: 'done',
        actualEndDate: TODAY,
      }),
    );
    await act(async () => response.settle(new Response(JSON.stringify({ task: DEMO }))));
  });

  it('003 RF-004 la tarjeta optimista se queda sin fecha real de fin al salir de Done', async () => {
    const finished = task('fin', 'done', { actualEndDate: '2026-10-27' });
    const view = await renderBoard([finished]);
    const response = hold('fin');

    act(() =>
      view.result.current.mutation.mutate(
        moveTo(finished, { status: 'done', index: 0 }, { status: 'todo', index: 0 }),
      ),
    );

    await waitFor(() =>
      expect(view.result.current.tasks.data?.[0]).toMatchObject({
        status: 'todo',
        actualEndDate: null,
      }),
    );
    await act(async () => response.settle(new Response(JSON.stringify({ task: finished }))));
  });

  it.each([
    ['NetworkError', () => Promise.reject(new TypeError('Failed to fetch'))],
    ['500', () => Promise.resolve(new Response('', { status: 500 }))],
  ])('003 RF-021 con %s, la tarjeta vuelve a `from`', async (_name, handler) => {
    const view = await renderBoard();
    browser.routes[moveRoute('demo')] = handler;

    await act(() => run(view.result.current.mutation, DEMO_TO_PROGRESS).catch(() => undefined));

    await waitFor(() => expect(column(view, 'todo')).toEqual(['pan', 'demo']));
    expect(column(view, 'in_progress')).toEqual(['correo']);
    // D-12: sin reintentos.
    expect(browser.callsTo('POST', '/api/tasks/demo/move')).toHaveLength(1);
  });

  it('003 RF-022 con TASK_NOT_FOUND, la tarjeta se quita de la caché', async () => {
    const view = await renderBoard();
    browser.routes[moveRoute('demo')] = () => apiError(404, 'TASK_NOT_FOUND');
    let lists = 0;
    browser.routes['GET /api/tasks'] = () => {
      lists += 1;
      return json(200, { tasks: [BREAD, MAIL] });
    };

    await act(() => run(view.result.current.mutation, DEMO_TO_PROGRESS).catch(() => undefined));

    await waitFor(() => expect(column(view, 'in_progress')).toEqual(['correo']));
    expect(column(view, 'todo')).toEqual(['pan']);
    expect(lists).toBeGreaterThan(0);
  });

  it('003 E-12 dos movimientos, el primero falla y el segundo va bien: solo el primero vuelve', async () => {
    const view = await renderBoard();
    const demo = hold('demo');
    const bread = hold('pan');
    const after = [task('pan', 'done', { actualEndDate: TODAY }), DEMO, MAIL];

    act(() => view.result.current.mutation.mutate(DEMO_TO_PROGRESS));
    await waitFor(() => expect(column(view, 'in_progress')).toEqual(['demo', 'correo']));
    act(() =>
      view.result.current.mutation.mutate(
        moveTo(BREAD, { status: 'todo', index: 0 }, { status: 'done', index: 0 }),
      ),
    );
    await waitFor(() => expect(column(view, 'done')).toEqual(['pan']));

    await act(async () => demo.settle(new TypeError('Failed to fetch')));

    // Vuelve solo la primera; la segunda sigue en su sitio nuevo.
    await waitFor(() => expect(column(view, 'todo')).toEqual(['demo']));
    expect(column(view, 'in_progress')).toEqual(['correo']);
    expect(column(view, 'done')).toEqual(['pan']);

    browser.routes['GET /api/tasks'] = () => json(200, { tasks: after });
    await act(async () => bread.settle(new Response(JSON.stringify({ task: after[0] }))));
    await waitFor(() => expect(view.result.current.mutation.isPending).toBe(false));
    expect(column(view, 'done')).toEqual(['pan']);
  });

  it('003 D-12 GET /api/tasks se vuelve a pedir solo cuando no queda ningún movimiento pendiente', async () => {
    const view = await renderBoard();
    const demo = hold('demo');
    const bread = hold('pan');
    const before = getsOfList();

    act(() => view.result.current.mutation.mutate(DEMO_TO_PROGRESS));
    await waitFor(() => expect(browser.callsTo('POST', '/api/tasks/demo/move')).toHaveLength(1));
    act(() =>
      view.result.current.mutation.mutate(
        moveTo(BREAD, { status: 'todo', index: 0 }, { status: 'done', index: 0 }),
      ),
    );
    await waitFor(() => expect(browser.callsTo('POST', '/api/tasks/pan/move')).toHaveLength(1));

    await act(async () => demo.settle(new Response(JSON.stringify({ task: DEMO }))));
    await waitFor(() => expect(column(view, 'in_progress')).toEqual(['demo', 'correo']));
    expect(getsOfList()).toBe(before);

    await act(async () => bread.settle(new Response(JSON.stringify({ task: BREAD }))));
    await waitFor(() => expect(getsOfList()).toBe(before + 1));
  });
});
