import type { Task } from '@todo/shared';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TASK_FIELD_IDS, useTaskForm, type TaskFormMode } from './task-form';

const TITLE_REQUIRED = 'Escribe un título para la tarea.';
const TITLE_TOO_LONG = 'El título puede tener hasta 200 caracteres. Acórtalo un poco.';
const INVALID_DATE = 'Esa fecha no existe. Escríbela como 14/11/2026.';
const END_BEFORE_START =
  'La fecha de fin no puede ser anterior a la de inicio. Cambia una de las dos.';
const ACTUAL_END_REQUIRED = 'Escribe el día en que terminaste la tarea.';
const ACTUAL_END_IN_FUTURE = 'La fecha real de fin no puede ser posterior a hoy. Cambia la fecha.';

const TASK: Task = {
  id: '3f2c1a9e-8b7d-4c6e-9f1a-2b3c4d5e6f70',
  title: 'Preparar la demo',
  description: 'Revisar con el equipo',
  status: 'in_progress',
  estimatedStartDate: '2026-11-14',
  estimatedEndDate: '2026-11-28',
  actualEndDate: null,
};
const DONE_TASK: Task = { ...TASK, status: 'done', actualEndDate: '2026-10-27' };

const CREATE: TaskFormMode = { kind: 'create' };
const edit = (task: Task): TaskFormMode => ({ kind: 'edit', task });

// El formulario donde se busca el campo al que llevar el foco (RF-019), con los campos en el orden
// del diálogo.
function renderForm() {
  const form = document.createElement('form');
  for (const id of Object.values(TASK_FIELD_IDS)) {
    const input = document.createElement('input');
    input.id = id;
    input.name = id;
    form.append(input);
  }
  document.body.append(form);
  return form;
}

beforeEach(() => {
  // Hoy es el 29/10/2026 en el navegador (spec §4). Solo se simula Date: React usa los temporizadores.
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 29, 10, 0));
});

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('useTaskForm · borrador', () => {
  it('RF-010 en creación, el borrador está vacío y en Backlog, sin campo de fin real', () => {
    const { result } = renderHook(() => useTaskForm(CREATE));

    expect(result.current.draft).toEqual({
      title: '',
      description: '',
      estimatedStartDate: '',
      estimatedEndDate: '',
      status: 'backlog',
      actualEndDate: '',
    });
    expect(result.current.showActualEndDate).toBe(false);
    expect(result.current.unchanged).toBe(true);
  });

  it('RF-012 en edición, el borrador sale de la tarea, con las fechas como «dd/mm/aaaa»', () => {
    const { result } = renderHook(() => useTaskForm(edit(DONE_TASK)));

    expect(result.current.draft).toEqual({
      title: 'Preparar la demo',
      description: 'Revisar con el equipo',
      estimatedStartDate: '14/11/2026',
      estimatedEndDate: '28/11/2026',
      status: 'done',
      actualEndDate: '27/10/2026',
    });
    expect(result.current.showActualEndDate).toBe(true);
  });

  it('RF-021 CA-3.4 «sin cambios» al abrir y otra vez al volver al valor inicial', () => {
    const { result } = renderHook(() => useTaskForm(edit(TASK)));
    expect(result.current.unchanged).toBe(true);

    act(() => result.current.setField('title', 'Preparar la demo final'));
    expect(result.current.unchanged).toBe(false);

    act(() => result.current.setField('title', 'Preparar la demo'));
    expect(result.current.unchanged).toBe(true);

    act(() => result.current.setStatus('done'));
    expect(result.current.unchanged).toBe(false);
    act(() => result.current.setStatus('in_progress'));
    expect(result.current.unchanged).toBe(true);
  });
});

describe('useTaskForm · estado Done', () => {
  it('CA-4.3 RF-025 RF-038 elegir Done desde otro estado rellena hoy y muestra el campo', () => {
    const { result } = renderHook(() => useTaskForm(edit(TASK)));

    act(() => result.current.setStatus('done'));

    expect(result.current.draft.actualEndDate).toBe('29/10/2026');
    expect(result.current.showActualEndDate).toBe(true);
  });

  it('RF-025 si la tarea guardada ya estaba en Done, volver a elegir Done restaura su fecha', () => {
    const { result } = renderHook(() => useTaskForm(edit(DONE_TASK)));

    act(() => result.current.setStatus('todo'));
    act(() => result.current.setStatus('done'));

    expect(result.current.draft.actualEndDate).toBe('27/10/2026');
    expect(result.current.unchanged).toBe(true);
  });

  it('CA-4.9 RF-038 RF-041 con otro estado el campo desaparece y se envía null', () => {
    const { result } = renderHook(() => useTaskForm(edit(DONE_TASK)));

    act(() => result.current.setStatus('in_progress'));
    expect(result.current.showActualEndDate).toBe(false);

    let submitted: ReturnType<typeof result.current.submit> = null;
    act(() => {
      submitted = result.current.submit(renderForm());
    });
    expect(submitted).toEqual({
      kind: 'edit',
      id: TASK.id,
      input: {
        title: 'Preparar la demo',
        description: 'Revisar con el equipo',
        estimatedStartDate: '2026-11-14',
        estimatedEndDate: '2026-11-28',
        status: 'in_progress',
        actualEndDate: null,
      },
    });
  });

  it('E-23 RF-041 elegir Done, después In progress, y guardar → null', () => {
    const { result } = renderHook(() => useTaskForm(edit(TASK)));

    act(() => result.current.setStatus('done'));
    act(() => result.current.setStatus('in_progress'));

    let submitted: ReturnType<typeof result.current.submit> = null;
    act(() => {
      submitted = result.current.submit(renderForm());
    });
    expect(submitted).toMatchObject({ input: { status: 'in_progress', actualEndDate: null } });
  });

  it('E-21 editar el título de una tarea en Done conserva su fecha real de fin', () => {
    const { result } = renderHook(() => useTaskForm(edit(DONE_TASK)));

    act(() => result.current.setField('title', 'Preparar la demo final'));

    let submitted: ReturnType<typeof result.current.submit> = null;
    act(() => {
      submitted = result.current.submit(renderForm());
    });
    expect(submitted).toMatchObject({
      input: { title: 'Preparar la demo final', status: 'done', actualEndDate: '2026-10-27' },
    });
  });
});

describe('useTaskForm · validación al enviar', () => {
  it('RF-011 RF-020 en creación devuelve los datos del esquema, con el título recortado y las fechas en ISO', () => {
    const { result } = renderHook(() => useTaskForm(CREATE));
    act(() => {
      result.current.setField('title', '  Preparar la demo  ');
      result.current.setField('description', 'Revisar\ncon el equipo');
      result.current.setField('estimatedStartDate', '14/11/2026');
      result.current.setField('estimatedEndDate', '28/11/2026');
    });

    let submitted: ReturnType<typeof result.current.submit> = null;
    act(() => {
      submitted = result.current.submit(renderForm());
    });

    expect(submitted).toEqual({
      kind: 'create',
      input: {
        title: 'Preparar la demo',
        description: 'Revisar\ncon el equipo',
        estimatedStartDate: '2026-11-14',
        estimatedEndDate: '2026-11-28',
      },
    });
    expect(result.current.errors).toEqual({});
  });

  it('CA-2.3 RF-014 RF-019 título vacío → su error y el foco en el campo', () => {
    const form = renderForm();
    const { result } = renderHook(() => useTaskForm(CREATE));

    let submitted: ReturnType<typeof result.current.submit> = null;
    act(() => {
      submitted = result.current.submit(form);
    });

    expect(submitted).toBeNull();
    expect(result.current.errors).toEqual({ title: TITLE_REQUIRED });
    expect(document.activeElement?.id).toBe(TASK_FIELD_IDS.title);
  });

  it('RF-019 un error por campo y el foco en el primero, en el orden del formulario', () => {
    const form = renderForm();
    const { result } = renderHook(() => useTaskForm(CREATE));
    act(() => {
      result.current.setField('estimatedStartDate', '28/11/2026');
      result.current.setField('estimatedEndDate', '14/11/2026');
      result.current.setField('title', 'a'.repeat(201));
    });

    act(() => {
      result.current.submit(form);
    });

    expect(result.current.errors).toEqual({
      title: TITLE_TOO_LONG,
      estimatedEndDate: END_BEFORE_START,
    });
    expect(document.activeElement?.id).toBe(TASK_FIELD_IDS.title);
  });

  it('CA-2.5 RF-018 RF-019 con solo el error de la fecha de fin, el foco va a ese campo', () => {
    const form = renderForm();
    const { result } = renderHook(() => useTaskForm(CREATE));
    act(() => {
      result.current.setField('title', 'Preparar la demo');
      result.current.setField('estimatedStartDate', '28/11/2026');
      result.current.setField('estimatedEndDate', '14/11/2026');
    });

    act(() => {
      result.current.submit(form);
    });

    expect(result.current.errors).toEqual({ estimatedEndDate: END_BEFORE_START });
    expect(document.activeElement?.id).toBe(TASK_FIELD_IDS.estimatedEndDate);
  });

  it.each(['31/02/2026', '2026-11-14', '14/11/26'])(
    'CA-2.6 E-7 RF-017 la fecha «%s» → «Esa fecha no existe…»',
    (text) => {
      const form = renderForm();
      const { result } = renderHook(() => useTaskForm(CREATE));
      act(() => {
        result.current.setField('title', 'Preparar la demo');
        result.current.setField('estimatedStartDate', text);
      });

      act(() => {
        result.current.submit(form);
      });

      expect(result.current.errors).toEqual({ estimatedStartDate: INVALID_DATE });
      expect(document.activeElement?.id).toBe(TASK_FIELD_IDS.estimatedStartDate);
    },
  );

  it('CA-4.6 RF-039 un fin real posterior a hoy (local) → su mensaje', () => {
    const form = renderForm();
    const { result } = renderHook(() => useTaskForm(edit(TASK)));
    act(() => result.current.setStatus('done'));
    act(() => result.current.setField('actualEndDate', '30/10/2026'));

    let submitted: ReturnType<typeof result.current.submit> = null;
    act(() => {
      submitted = result.current.submit(form);
    });

    expect(submitted).toBeNull();
    expect(result.current.errors).toEqual({ actualEndDate: ACTUAL_END_IN_FUTURE });
    expect(document.activeElement?.id).toBe(TASK_FIELD_IDS.actualEndDate);
  });

  it('CA-4.5 RF-039 un fin real de hoy o anterior se acepta', () => {
    const { result } = renderHook(() => useTaskForm(edit(TASK)));
    act(() => result.current.setStatus('done'));
    act(() => result.current.setField('actualEndDate', '27/10/2026'));

    let submitted: ReturnType<typeof result.current.submit> = null;
    act(() => {
      submitted = result.current.submit(renderForm());
    });

    expect(submitted).toMatchObject({ input: { status: 'done', actualEndDate: '2026-10-27' } });
  });

  it('CA-4.7 RF-040 en Done con el fin real vacío → «Escribe el día…»', () => {
    const { result } = renderHook(() => useTaskForm(edit(TASK)));
    act(() => result.current.setStatus('done'));
    act(() => result.current.setField('actualEndDate', ''));

    act(() => {
      result.current.submit(renderForm());
    });

    expect(result.current.errors).toEqual({ actualEndDate: ACTUAL_END_REQUIRED });
  });

  it('RF-017 en Done, un fin real que no existe → «Esa fecha no existe…», no «Escribe el día…»', () => {
    const { result } = renderHook(() => useTaskForm(edit(TASK)));
    act(() => result.current.setStatus('done'));
    act(() => result.current.setField('actualEndDate', '31/02/2026'));

    act(() => {
      result.current.submit(renderForm());
    });

    expect(result.current.errors).toEqual({ actualEndDate: INVALID_DATE });
  });

  it('RF-019 al volver a enviar sin errores, los errores anteriores desaparecen', () => {
    const { result } = renderHook(() => useTaskForm(CREATE));
    act(() => {
      result.current.submit(renderForm());
    });
    expect(result.current.errors).toEqual({ title: TITLE_REQUIRED });

    act(() => result.current.setField('title', 'Preparar la demo'));
    act(() => {
      result.current.submit(renderForm());
    });

    expect(result.current.errors).toEqual({});
  });
});
