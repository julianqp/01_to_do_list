import {
  actualEndDateAfterMove,
  type CreateTaskInput,
  type IsoDate,
  type Task,
  type UpdateTaskInput,
} from '@todo/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './api';
import { placeTask, type Placement } from './board-order';
import { isTaskNotFound } from './task-messages';

const TASKS_KEY = ['tasks'];

type TaskResponse = { task: Task };

export function useTasks({ enabled }: { enabled: boolean }) {
  return useQuery({
    queryKey: TASKS_KEY,
    queryFn: () => apiFetch<{ tasks: Task[] }>('/api/tasks').then(({ tasks }) => tasks),
    enabled,
  });
}

// D-7: al terminar, la mutación espera a tener la lista nueva (el botón sigue en «Guardando…»). Sin
// actualizaciones optimistas: el orden y los recuentos salen siempre del servidor (RF-002, RF-024).
// TASK_NOT_FOUND también la vuelve a pedir, para quitar la tarjeta (RF-030).
function useRefetchTasks() {
  const queryClient = useQueryClient();
  const refetch = () => queryClient.invalidateQueries({ queryKey: TASKS_KEY });
  return {
    onSuccess: refetch,
    onError: (error: Error) => (isTaskNotFound(error) ? refetch() : undefined),
  };
}

export function useCreateTask() {
  return useMutation({
    mutationFn: (input: CreateTaskInput) =>
      apiFetch<TaskResponse>('/api/tasks', { method: 'POST', body: input }).then(
        ({ task }) => task,
      ),
    ...useRefetchTasks(),
  });
}

export function useUpdateTask() {
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTaskInput }) =>
      apiFetch<TaskResponse>(`/api/tasks/${id}`, { method: 'PUT', body: input }).then(
        ({ task }) => task,
      ),
    ...useRefetchTasks(),
  });
}

export function useDeleteTask() {
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/api/tasks/${id}`, { method: 'DELETE' }),
    ...useRefetchTasks(),
  });
}

export type MoveVariables = { task: Task; from: Placement; to: Placement; today: IsoDate };

const MOVE_KEY = ['moveTask'];

// Spec 003, D-12: al revés que el diálogo (D-7), la tarjeta se ve en su sitio antes de la respuesta
// (RF-020). Si falla, solo esa tarjeta vuelve, sobre la caché actual: los demás movimientos no se
// tocan (RF-021, E-12). La lista se vuelve a pedir cuando no queda ninguno pendiente: si no, pisaría
// los que siguen en camino (R-7).
export function useMoveTask() {
  const queryClient = useQueryClient();
  const updateTasks = (update: (tasks: Task[]) => Task[]) =>
    queryClient.setQueryData<Task[]>(TASKS_KEY, (tasks) => tasks && update(tasks));
  return useMutation({
    mutationKey: MOVE_KEY,
    // D-19: sin conexión se intenta igual, para que falle y la tarjeta vuelva (E-7), en vez de pausarse.
    networkMode: 'always',
    mutationFn: ({ task, to, today }: MoveVariables) =>
      apiFetch<TaskResponse>(`/api/tasks/${task.id}/move`, {
        method: 'POST',
        body: { status: to.status, index: to.index, today },
      }).then(({ task: moved }) => moved),
    onMutate: async ({ task, to, today }) => {
      await queryClient.cancelQueries({ queryKey: TASKS_KEY });
      const actualEndDate = actualEndDateAfterMove(task, to.status, today);
      updateTasks((tasks) => placeTask(tasks, { ...task, actualEndDate }, to));
    },
    onError: (error, { task, from }) => {
      updateTasks((tasks) =>
        isTaskNotFound(error)
          ? tasks.filter(({ id }) => id !== task.id)
          : placeTask(tasks, task, from),
      );
    },
    onSettled: () =>
      queryClient.isMutating({ mutationKey: MOVE_KEY }) === 1
        ? queryClient.invalidateQueries({ queryKey: TASKS_KEY })
        : undefined,
  });
}
