import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import { TASK_STATUSES, type Task, type TaskStatus } from '@todo/shared';
import { ClockAlert } from 'lucide-react';
import { formatShortDate, isOverdue, todayLocal } from '../lib/dates';
import { TASK_FIELD_IDS, useTaskForm, type TaskFormMode } from '../lib/task-form';
import { deleteErrorText, isTaskNotFound, saveErrorText } from '../lib/task-messages';
import { useCreateTask, useDeleteTask, useUpdateTask } from '../lib/task-queries';
import { Alert } from './Alert';
import { STATUS_NAMES } from './BoardColumn';
import { Button } from './Button';
import { FolderCard } from './FolderCard';
import { FormField } from './FormField';
import { Icon } from './Icon';
import { SegmentedControl, type StatusTone } from './SegmentedControl';

// Cómo se cerró el diálogo: decide adónde va el foco (D-14).
export type DialogResult =
  | { kind: 'cancelled' }
  | { kind: 'created'; task: Task }
  | { kind: 'saved'; task: Task }
  | { kind: 'deleted' }
  // RF-030: la tarea ya no existe; el aviso sale en el tablero (D-20).
  | { kind: 'notFound'; message: string };

export type TaskDialogProps = { mode: TaskFormMode; onClose: (result: DialogResult) => void };

// X-7, D-12: las confirmaciones sustituyen el contenido del mismo diálogo.
type View = 'form' | 'discard' | 'confirmDelete';

const PANEL = 'flex flex-col gap-6 p-6 md:p-7';
const DATE_HELP = 'Ejemplo: 14/11/2026';

// D-15, §1.3: el tono de la opción elegida (Backlog, neutra).
const STATUS_TONES: Partial<Record<TaskStatus, StatusTone>> = {
  todo: 'lilac',
  in_progress: 'ink',
  done: 'sage',
};
const STATUS_OPTIONS = TASK_STATUSES.map((status) => ({
  value: status,
  label: STATUS_NAMES[status],
  selectedTone: STATUS_TONES[status],
}));
const ACTIONS = 'flex flex-wrap justify-end gap-3';

// DESIGN.md §14 Dialog, D-12, D-22: <dialog> nativo con showModal (capa superior, fondo inerte, foco
// atrapado y ::backdrop). Lo pinta Board con `key` = id de la tarea o 'new' (D-13).
export function TaskDialog({ mode, onClose }: TaskDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  // El formulario no se desmonta durante una confirmación: al volver, el foco vuelve a donde estaba.
  const lastFocused = useRef<HTMLElement | null>(null);
  const [view, setView] = useState<View>('form');
  const form = useTaskForm(mode);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const saving = createTask.isPending || updateTask.isPending;
  // D-20: errores al guardar (RF-028) o al borrar (RF-029), dentro del diálogo. Al volver a enviar, la
  // mutación se reinicia. TASK_NOT_FOUND no se queda aquí: cierra el diálogo (RF-030).
  const failedSave = [createTask, updateTask].find(
    (mutation) => mutation.isError && !isTaskNotFound(mutation.error),
  );
  const actionError = failedSave
    ? saveErrorText(failedSave.error)
    : deleteTask.isError && !isTaskNotFound(deleteTask.error)
      ? deleteErrorText(deleteTask.error)
      : undefined;
  const formTitleId = useId();
  const confirmTitleId = useId();

  // Sincroniza con el DOM: el diálogo se abre como modal al montarse (C-4).
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  useEffect(() => {
    if (view === 'form') lastFocused.current?.focus();
  }, [view]);

  function showConfirmation(next: Exclude<View, 'form'>) {
    lastFocused.current = document.activeElement as HTMLElement | null;
    setView(next);
  }

  // RF-021: sin cambios se cierra; con cambios se pregunta; en una confirmación, se vuelve al formulario.
  function requestClose() {
    if (view !== 'form') setView('form');
    else if (form.unchanged) onClose({ kind: 'cancelled' });
    else showConfirmation('discard');
  }

  // D-12, D-24: Esc se intercepta en el keydown, antes de la petición de cierre del navegador.
  function handleKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    requestClose();
  }

  // D-12: el contenido llena el diálogo, así que un clic en el propio <dialog> es un clic en el velo.
  function handlePointerDown(event: PointerEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) requestClose();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // RF-031, E-15: con una petición en curso no se envía otra.
    if (saving) return;
    const result = form.submit(event.currentTarget);
    if (!result) return;
    // Solo se ve el error de la última acción.
    deleteTask.reset();
    // D-7: la mutación termina cuando ya está la lista nueva; entonces se cierra (RF-011, RF-013).
    if (result.kind === 'create') {
      createTask.mutate(result.input, { onSuccess: (task) => onClose({ kind: 'created', task }) });
      return;
    }
    updateTask.mutate(
      { id: result.id, input: result.input },
      {
        onSuccess: (task) => onClose({ kind: 'saved', task }),
        onError: (error) => {
          if (isTaskNotFound(error)) onClose({ kind: 'notFound', message: saveErrorText(error) });
        },
      },
    );
  }

  // RF-027: al confirmar, se borra y, con la lista nueva, se cierra. Si falla, se vuelve al detalle
  // con la alerta de RF-029.
  function confirmDelete(task: Task) {
    if (deleteTask.isPending) return;
    updateTask.reset();
    deleteTask.mutate(task.id, {
      onSuccess: () => onClose({ kind: 'deleted' }),
      onError: (error) => {
        if (isTaskNotFound(error)) onClose({ kind: 'notFound', message: deleteErrorText(error) });
        else setView('form');
      },
    });
  }

  const creating = mode.kind === 'create';
  // RF-033, D-18: con la tarea guardada y la fecha local de hoy.
  const today = todayLocal();
  const late = mode.kind === 'edit' && isOverdue(mode.task, today) ? mode.task : undefined;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={view === 'form' ? formTitleId : confirmTitleId}
      onKeyDown={handleKeyDown}
      // Segunda red: si el navegador lanza `cancel` igualmente, no se cierra.
      onCancel={(event) => event.preventDefault()}
      onPointerDown={handlePointerDown}
      // D-16: en escritorio, 460 px como máximo y radio 34. Por debajo de 768 px, panel inferior a todo
      // el ancho, con radio arriba, asa y el 92 % del alto como máximo (RF-035).
      className="m-auto w-full max-w-115 overflow-y-auto rounded-xl border border-contrast bg-raised p-0 text-1 shadow-(--shadow-float) backdrop-glass max-md:mb-0 max-md:max-w-none max-md:rounded-b-none max-md:sheet-max-height"
    >
      <span
        data-sheet-handle
        aria-hidden="true"
        className="mx-auto mt-3 block h-1 w-9 rounded-pill bg-3 md:hidden"
      />
      <div hidden={view !== 'form'}>
        <form ref={formRef} noValidate onSubmit={handleSubmit} className={PANEL}>
          {/* X-6: --text-h2. D-9: sobre el diálogo, solo --text-1. */}
          <h2 id={formTitleId} className="text-h2 text-1">
            {creating ? 'Nueva tarea' : 'Detalle de la tarea'}
          </h2>
          {late?.estimatedEndDate && (
            // RF-033: amber-soft sobre el diálogo, como las alertas (R-1), con el icono de §9.
            <p className="flex items-start gap-3 rounded-md border border-contrast bg-amber-soft px-5 py-3.5 text-1">
              <Icon icon={ClockAlert} className="mt-0.5 shrink-0" />
              Esta tarea tenía que terminar el {formatShortDate(late.estimatedEndDate, today)}.
            </p>
          )}
          {/* D-20: siempre presente y vacía hasta que hay un error al guardar. */}
          <div role="alert" className="empty:sr-only">
            {actionError && <Alert tone="offline">{actionError}</Alert>}
          </div>
          {/* §11.4: los campos agrupados en dos carpetas. */}
          <FolderCard title="Datos">
            <FormField
              id={TASK_FIELD_IDS.title}
              label="Título"
              autoComplete="off"
              value={form.draft.title}
              onChange={(value) => form.setField('title', value)}
              error={form.errors.title}
            />
            <FormField
              id={TASK_FIELD_IDS.description}
              label="Descripción"
              optional
              multiline
              autoComplete="off"
              value={form.draft.description}
              onChange={(value) => form.setField('description', value)}
              error={form.errors.description}
            />
            {/* RF-011: al crear no hay estado (siempre Backlog). RF-023, D-15: radios nativos. */}
            {!creating && (
              <SegmentedControl
                name="task-status"
                legend="Estado"
                options={STATUS_OPTIONS}
                value={form.draft.status}
                onChange={(value) => form.setStatus(value as TaskStatus)}
              />
            )}
          </FolderCard>
          {/* D-17: se escriben a mano, «14/11/2026», con el ejemplo en la ayuda. */}
          <FolderCard title="Fechas">
            <FormField
              id={TASK_FIELD_IDS.estimatedStartDate}
              label="Fecha estimada de inicio"
              optional
              inputMode="numeric"
              autoComplete="off"
              help={DATE_HELP}
              value={form.draft.estimatedStartDate}
              onChange={(value) => form.setField('estimatedStartDate', value)}
              error={form.errors.estimatedStartDate}
            />
            <FormField
              id={TASK_FIELD_IDS.estimatedEndDate}
              label="Fecha estimada de fin"
              optional
              inputMode="numeric"
              autoComplete="off"
              help={DATE_HELP}
              value={form.draft.estimatedEndDate}
              onChange={(value) => form.setField('estimatedEndDate', value)}
              error={form.errors.estimatedEndDate}
            />
            {/* RF-038: solo mientras el estado elegido es Done. */}
            {form.showActualEndDate && (
              <FormField
                id={TASK_FIELD_IDS.actualEndDate}
                label="Fecha real de fin"
                inputMode="numeric"
                autoComplete="off"
                help={DATE_HELP}
                value={form.draft.actualEndDate}
                onChange={(value) => form.setField('actualEndDate', value)}
                error={form.errors.actualEndDate}
              />
            )}
          </FolderCard>
          <div className={ACTIONS}>
            {/* §11.4: «Borrar tarea» va aparte, en destructive y con confirmación (RF-026). */}
            {!creating && (
              <span className="me-auto">
                <Button variant="destructive" onClick={() => showConfirmation('confirmDelete')}>
                  Borrar tarea
                </Button>
              </span>
            )}
            <Button variant="glass" onClick={requestClose}>
              Cancelar
            </Button>
            {/* RF-031: anillo y gerundio, mismo ancho y sin más pulsaciones. */}
            <Button
              variant="primary"
              type="submit"
              loading={saving}
              loadingLabel={creating ? 'Creando tarea…' : 'Guardando…'}
            >
              {creating ? 'Crear tarea' : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      </div>
      {view === 'confirmDelete' && mode.kind === 'edit' && (
        <div className={PANEL}>
          <h2 id={confirmTitleId} className="text-h2 text-balance text-1 wrap-anywhere">
            ¿Borrar «{mode.task.title}»? No se puede deshacer.
          </h2>
          {/* D-19: «Cancelar» es la opción segura y recibe el foco. */}
          <div className={ACTIONS}>
            <Button variant="glass" autoFocus onClick={() => setView('form')}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              loading={deleteTask.isPending}
              loadingLabel="Borrando…"
              onClick={() => confirmDelete(mode.task)}
            >
              Borrar tarea
            </Button>
          </div>
        </div>
      )}
      {view === 'discard' && (
        <div className={PANEL}>
          <h2 id={confirmTitleId} className="text-h2 text-1">
            ¿Descartar los cambios?
          </h2>
          {/* D-19: «Seguir editando» es la opción segura (primario, con el foco). */}
          <div className={ACTIONS}>
            <Button variant="glass" onClick={() => onClose({ kind: 'cancelled' })}>
              Descartar cambios
            </Button>
            <Button variant="primary" autoFocus onClick={() => setView('form')}>
              Seguir editando
            </Button>
          </div>
        </div>
      )}
    </dialog>
  );
}
