import type { Task } from '@todo/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { apiError, json, mockBrowser } from '../components/test-utils';
import { useCreateTask, useDeleteTask, useTasks, useUpdateTask } from './task-queries';

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
