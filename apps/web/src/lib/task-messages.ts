import { ApiError } from './api';

// D-19: textos del tablero. El `code` decide el texto (C-9); cualquier ApiError que no sea de sesión
// ni TASK_NOT_FOUND (p. ej. VALIDATION_ERROR si el servidor discrepa) es un error inesperado, como la
// red. Los de sesión no llegan a verse: redirigen (withQueryClient, E-12).
const LOAD_ERROR = 'No hemos podido cargar tus tareas. Revisa tu conexión e inténtalo de nuevo.';
const SAVE_ERROR = 'No hemos podido guardar la tarea. Revisa tu conexión e inténtalo de nuevo.';
const DELETE_ERROR = 'No hemos podido borrar la tarea. Revisa tu conexión e inténtalo de nuevo.';
const TASK_NOT_FOUND = 'Esta tarea ya no existe.';

// RF-030: la tarea ya no existe o no es del usuario (C-13).
export function isTaskNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.code === 'TASK_NOT_FOUND';
}

// RF-008: el mismo texto para la red y para cualquier error inesperado.
export const loadErrorText = LOAD_ERROR;

// RF-028, RF-030.
export function saveErrorText(error: unknown): string {
  return isTaskNotFound(error) ? TASK_NOT_FOUND : SAVE_ERROR;
}

// RF-029, RF-030.
export function deleteErrorText(error: unknown): string {
  return isTaskNotFound(error) ? TASK_NOT_FOUND : DELETE_ERROR;
}
