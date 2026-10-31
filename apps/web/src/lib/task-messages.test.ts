import { describe, expect, it } from 'vitest';
import { ApiError, NetworkError } from './api';
import {
  cancelledText,
  deleteErrorText,
  droppedText,
  isTaskNotFound,
  loadErrorText,
  movedText,
  moveErrorText,
  pickedText,
  saveErrorText,
} from './task-messages';

const LOAD = 'No hemos podido cargar tus tareas. Revisa tu conexión e inténtalo de nuevo.';
const SAVE = 'No hemos podido guardar la tarea. Revisa tu conexión e inténtalo de nuevo.';
const DELETE = 'No hemos podido borrar la tarea. Revisa tu conexión e inténtalo de nuevo.';
const NOT_FOUND = 'Esta tarea ya no existe.';
const MOVE = 'No hemos podido mover la tarea. Revisa tu conexión e inténtalo de nuevo.';

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

describe('003 mover', () => {
  it('003 RF-022 E-20 al mover, TASK_NOT_FOUND → «Esta tarea ya no existe.»', () => {
    expect(moveErrorText(new ApiError('TASK_NOT_FOUND', 404))).toBe(NOT_FOUND);
  });

  it.each([
    ['un NetworkError', new NetworkError()],
    ['un ApiError 500', new ApiError('INTERNAL_ERROR', 500)],
    ['un ApiError inesperado (VALIDATION_ERROR)', new ApiError('VALIDATION_ERROR', 400)],
  ])('003 RF-021 E-20 al mover, %s → el texto de RF-021', (_name, error) => {
    expect(moveErrorText(error)).toBe(MOVE);
  });

  it('003 CA-3.2 RF-013 E-20 al coger, con la posición desde 1 y el total con la tarjeta', () => {
    expect(pickedText('Preparar la demo', { status: 'todo', index: 1 }, 3)).toBe(
      'Has cogido «Preparar la demo». To do, posición 2 de 3. Usa las flechas para moverla, Espacio para soltarla y Esc para cancelar.',
    );
  });

  it('003 CA-3.3 CA-3.4 RF-014 E-20 en cada paso', () => {
    expect(movedText({ status: 'todo', index: 0 }, 3)).toBe('To do, posición 1 de 3.');
    expect(movedText({ status: 'in_progress', index: 0 }, 4)).toBe('In progress, posición 1 de 4.');
  });

  it('003 CA-3.5 RF-016 E-20 al soltar', () => {
    expect(droppedText('Preparar la demo', { status: 'in_progress', index: 0 }, 4)).toBe(
      'Has soltado «Preparar la demo» en In progress, posición 1 de 4.',
    );
  });

  it('003 CA-3.6 RF-017 E-20 al cancelar', () => {
    expect(cancelledText('Preparar la demo', { status: 'todo', index: 1 }, 3)).toBe(
      'Movimiento cancelado. «Preparar la demo» sigue en To do, posición 2 de 3.',
    );
  });

  it('003 E-20 los nombres de las columnas son los del tablero', () => {
    expect(movedText({ status: 'backlog', index: 4 }, 5)).toBe('Backlog, posición 5 de 5.');
    expect(movedText({ status: 'done', index: 0 }, 1)).toBe('Done, posición 1 de 1.');
  });
});
