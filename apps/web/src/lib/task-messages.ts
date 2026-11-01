import type { TaskStatus } from '@todo/shared';
import { ApiError } from './api';
import type { Placement } from './board-order';

// Glosario de la spec: los nombres de los estados no se traducen.
export const STATUS_NAMES: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
};

// D-19: textos del tablero. El `code` decide el texto (C-9); cualquier ApiError que no sea de sesión
// ni TASK_NOT_FOUND (p. ej. VALIDATION_ERROR si el servidor discrepa) es un error inesperado, como la
// red. Los de sesión no llegan a verse: redirigen (withQueryClient, E-12).
const LOAD_ERROR = 'No hemos podido cargar tus tareas. Revisa tu conexión e inténtalo de nuevo.';
const SAVE_ERROR = 'No hemos podido guardar la tarea. Revisa tu conexión e inténtalo de nuevo.';
const DELETE_ERROR = 'No hemos podido borrar la tarea. Revisa tu conexión e inténtalo de nuevo.';
const MOVE_ERROR = 'No hemos podido mover la tarea. Revisa tu conexión e inténtalo de nuevo.';
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

// Spec 003, D-14: RF-021, RF-022.
export function moveErrorText(error: unknown): string {
  return isTaskNotFound(error) ? TASK_NOT_FOUND : MOVE_ERROR;
}

// Spec 003, D-14: anuncios del teclado (RF-013, RF-014, RF-016, RF-017). <n> es `index + 1` y
// <total>, las tarjetas de la columna contando la que se mueve.
const where = ({ status, index }: Placement, total: number) =>
  `${STATUS_NAMES[status]}, posición ${index + 1} de ${total}`;

export function pickedText(title: string, place: Placement, total: number): string {
  return `Has cogido «${title}». ${where(place, total)}. Usa las flechas para moverla, Espacio para soltarla y Esc para cancelar.`;
}

export function movedText(place: Placement, total: number): string {
  return `${where(place, total)}.`;
}

export function droppedText(title: string, place: Placement, total: number): string {
  return `Has soltado «${title}» en ${where(place, total)}.`;
}

export function cancelledText(title: string, place: Placement, total: number): string {
  return `Movimiento cancelado. «${title}» sigue en ${where(place, total)}.`;
}
