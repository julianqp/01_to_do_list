import type { CreateTaskInput, Task, UpdateTaskInput } from '@todo/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './api';
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
