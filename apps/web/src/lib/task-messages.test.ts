import { describe, expect, it } from 'vitest';
import { ApiError, NetworkError } from './api';
import { deleteErrorText, isTaskNotFound, loadErrorText, saveErrorText } from './task-messages';

const LOAD = 'No hemos podido cargar tus tareas. Revisa tu conexión e inténtalo de nuevo.';
const SAVE = 'No hemos podido guardar la tarea. Revisa tu conexión e inténtalo de nuevo.';
const DELETE = 'No hemos podido borrar la tarea. Revisa tu conexión e inténtalo de nuevo.';
const NOT_FOUND = 'Esta tarea ya no existe.';

const unexpected = [
  ['un NetworkError', new NetworkError()],
  ['un ApiError inesperado (VALIDATION_ERROR)', new ApiError('VALIDATION_ERROR', 400)],
  ['un ApiError inesperado (NOT_FOUND)', new ApiError('NOT_FOUND', 404)],
] as const;

describe('task-messages', () => {
  it('CA-1.6 RF-008 al cargar, el texto de RF-008', () => {
    expect(loadErrorText).toBe(LOAD);
  });

  it.each(unexpected)('CA-2.7 RF-028 al guardar, %s → el texto de RF-028', (_name, error) => {
    expect(saveErrorText(error)).toBe(SAVE);
  });

  it.each(unexpected)('CA-5.4 RF-029 al borrar, %s → el texto de RF-029', (_name, error) => {
    expect(deleteErrorText(error)).toBe(DELETE);
  });

  it('CA-3.6 RF-030 TASK_NOT_FOUND → «Esta tarea ya no existe.», al guardar y al borrar', () => {
    const error = new ApiError('TASK_NOT_FOUND', 404);

    expect(isTaskNotFound(error)).toBe(true);
    expect(saveErrorText(error)).toBe(NOT_FOUND);
    expect(deleteErrorText(error)).toBe(NOT_FOUND);
  });

  it('RF-030 solo TASK_NOT_FOUND es «ya no existe»', () => {
    expect(isTaskNotFound(new ApiError('NOT_FOUND', 404))).toBe(false);
    expect(isTaskNotFound(new NetworkError())).toBe(false);
  });
});
