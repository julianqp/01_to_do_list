import {
  createTaskInputSchema,
  isActualEndDateAllowed,
  TASK_MESSAGES,
  updateTaskInputSchema,
  type CreateTaskInput,
  type IsoDate,
  type Task,
  type TaskStatus,
  type UpdateTaskInput,
} from '@todo/shared';
import { useState } from 'react';
import { formatDisplayDate, parseDisplayDate, todayLocal } from './dates';

export type TaskFormMode = { kind: 'create' } | { kind: 'edit'; task: Task };

// D-13: el borrador guarda los textos de los campos tal cual se escriben (fechas «dd/mm/aaaa»).
export type TaskDraft = {
  title: string;
  description: string;
  estimatedStartDate: string;
  estimatedEndDate: string;
  status: TaskStatus;
  actualEndDate: string;
};

type TextField = Exclude<keyof TaskDraft, 'status'>;
// En el orden del formulario (RF-019). El estado nunca tiene error: siempre es una de las opciones.
const FIELDS: TextField[] = [
  'title',
  'description',
  'estimatedStartDate',
  'estimatedEndDate',
  'actualEndDate',
];
const DATE_FIELDS = ['estimatedStartDate', 'estimatedEndDate', 'actualEndDate'] as const;

export type TaskFieldErrors = Partial<Record<TextField, string>>;

// Solo hay un diálogo en la página (D-12): los ids son fijos. `name` = `id`, como en FormField.
export const TASK_FIELD_IDS: Record<TextField, string> = {
  title: 'task-title',
  description: 'task-description',
  estimatedStartDate: 'task-estimated-start',
  estimatedEndDate: 'task-estimated-end',
  actualEndDate: 'task-actual-end',
};

export type TaskFormResult =
  | { kind: 'create'; input: CreateTaskInput }
  | { kind: 'edit'; id: string; input: UpdateTaskInput }
  | null;

type Issue = { path: readonly PropertyKey[]; message: string };

const displayOrEmpty = (date: IsoDate | null) => (date ? formatDisplayDate(date) : '');

function draftFrom(mode: TaskFormMode): TaskDraft {
  if (mode.kind === 'create') {
    return {
      title: '',
      description: '',
      estimatedStartDate: '',
      estimatedEndDate: '',
      status: 'backlog',
      actualEndDate: '',
    };
  }
  const { task } = mode;
  return {
    title: task.title,
    description: task.description,
    estimatedStartDate: displayOrEmpty(task.estimatedStartDate),
    estimatedEndDate: displayOrEmpty(task.estimatedEndDate),
    status: task.status,
    actualEndDate: displayOrEmpty(task.actualEndDate),
  };
}

// RF-038: fuera de Done el fin real no existe, así que no cuenta como cambio (RF-021).
const comparable = (draft: TaskDraft) =>
  JSON.stringify({ ...draft, actualEndDate: draft.status === 'done' ? draft.actualEndDate : '' });

function focusFirstError(form: HTMLFormElement, errors: TaskFieldErrors) {
  const field = FIELDS.find((name) => errors[name]);
  if (field) (form.elements.namedItem(TASK_FIELD_IDS[field]) as HTMLElement | null)?.focus();
}

// Borrador, validación al enviar, foco en el primer error y «sin cambios» del diálogo (D-13).
// Se crea una vez al abrir: TaskDialog lleva `key` con el id de la tarea o 'new'.
export function useTaskForm(mode: TaskFormMode) {
  const [initial] = useState(() => draftFrom(mode));
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState<TaskFieldErrors>({});

  const setField = (field: TextField, value: string) =>
    setDraft((current) => ({ ...current, [field]: value }));

  // RF-025: al elegir Done desde otro estado, hoy; si la tarea guardada ya estaba en Done, su fecha.
  const setStatus = (status: TaskStatus) =>
    setDraft((current) => {
      if (status !== 'done' || current.status === 'done') return { ...current, status };
      const saved = mode.kind === 'edit' ? mode.task.actualEndDate : null;
      return { ...current, status, actualEndDate: formatDisplayDate(saved ?? todayLocal()) };
    });

  // Devuelve los datos ya normalizados por el esquema de `shared`, o null si hay errores.
  function submit(form: HTMLFormElement): TaskFormResult {
    const found: TaskFieldErrors = {};
    const addError = (field: TextField, message: string) => {
      found[field] ??= message;
    };

    // 1. RF-017: lectura de «dd/mm/aaaa». Una fecha ilegible viaja como null y se queda su error.
    const dates = {} as Record<(typeof DATE_FIELDS)[number], IsoDate | null>;
    for (const field of DATE_FIELDS) {
      const parsed = parseDisplayDate(draft[field]);
      if (parsed === 'invalid') addError(field, TASK_MESSAGES.invalidDate);
      dates[field] = parsed === 'invalid' ? null : parsed;
    }
    const done = draft.status === 'done';
    const values = {
      title: draft.title,
      description: draft.description,
      estimatedStartDate: dates.estimatedStartDate,
      estimatedEndDate: dates.estimatedEndDate,
      status: draft.status,
      actualEndDate: done ? dates.actualEndDate : null,
    };

    // 2. El esquema de `shared` (D-4): el primer mensaje de cada campo.
    const result =
      mode.kind === 'create'
        ? createTaskInputSchema.safeParse(values)
        : updateTaskInputSchema.safeParse(values);
    const issues: readonly Issue[] = result.success ? [] : result.error.issues;
    for (const { path, message } of issues) {
      const field = FIELDS.find((name) => name === path[0]);
      if (field) addError(field, message);
    }

    // 3. RF-039, con la fecha local de hoy (R-4).
    if (
      done &&
      dates.actualEndDate !== null &&
      !isActualEndDateAllowed(dates.actualEndDate, todayLocal())
    ) {
      addError('actualEndDate', TASK_MESSAGES.actualEndInFuture);
    }

    setErrors(found);
    // 4. RF-019.
    if (!result.success || Object.keys(found).length > 0) {
      focusFirstError(form, found);
      return null;
    }
    if (mode.kind === 'create') return { kind: 'create', input: result.data as CreateTaskInput };
    return { kind: 'edit', id: mode.task.id, input: result.data as UpdateTaskInput };
  }

  return {
    draft,
    setField,
    setStatus,
    errors,
    unchanged: comparable(draft) === comparable(initial),
    showActualEndDate: draft.status === 'done',
    submit,
  };
}
