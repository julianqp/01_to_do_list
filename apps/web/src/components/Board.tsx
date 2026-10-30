import { TASK_STATUSES, type Task, type TaskStatus } from '@todo/shared';
import { ListTodo } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { tasksCount, todayLocal } from '../lib/dates';
import type { TaskFormMode } from '../lib/task-form';
import { Alert } from './Alert';
import { BoardColumn, STATUS_NAMES } from './BoardColumn';
import { Button } from './Button';
import { Icon } from './Icon';
import { SegmentedControl } from './SegmentedControl';
import { TaskDialog, type DialogResult } from './TaskDialog';

export type BoardProps = { tasks: Task[] };

// `removedId`: la tarea que ya no está (borrada o inexistente); con la última, «Crear tarea» pasa a ser
// el del estado vacío.
type FocusTarget =
  { kind: 'card'; id: string; status: TaskStatus } | { kind: 'create'; removedId?: string };

// D-7: el orden lo da el servidor (RF-002); aquí solo se reparte por estado, sin reordenar.
function groupByStatus(tasks: Task[]) {
  const groups = Object.fromEntries(TASK_STATUSES.map((status) => [status, [] as Task[]]));
  for (const task of tasks) groups[task.status]!.push(task);
  return groups as Record<TaskStatus, Task[]>;
}

// §12 «Vacío (primera vez)»: círculo glass de 72 px con icono 26, el mensaje y un primario.
function EmptyBoard({ createButton }: { createButton: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-5 py-12 text-center">
      <span className="flex size-18 items-center justify-center rounded-pill border border-contrast bg-glass text-1 shadow-(--shadow-pill) backdrop-glass">
        <Icon icon={ListTodo} size={26} />
      </span>
      {/* RF-006: el mensaje de la spec, en una sola frase. */}
      <p className="max-w-md text-h3 text-balance text-1">
        Todavía no tienes tareas. Crea la primera y empieza a organizarte.
      </p>
      {createButton}
    </div>
  );
}

// D-11: título, recuento, «Crear tarea», columnas o estado vacío, selector de columna en móvil y
// zona de alerta del tablero (D-20).
export function Board({ tasks }: BoardProps) {
  // E-10, D-18: «hoy» se calcula en cada render; sin temporizador a medianoche (E-11).
  const today = todayLocal();
  // RF-034: en móvil se empieza por Backlog.
  const [mobileColumn, setMobileColumn] = useState<TaskStatus>('backlog');
  const groups = groupByStatus(tasks);
  const empty = tasks.length === 0;
  // D-12: un solo diálogo, el de crear o el detalle de una tarea.
  const [dialog, setDialog] = useState<TaskFormMode | null>(null);
  // D-20: aviso del tablero (RF-030). Se vacía al abrir otro diálogo.
  const [notice, setNotice] = useState<string>();
  const createRef = useRef<HTMLButtonElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  // D-14: adónde va el foco al cerrar el diálogo: una tarjeta (en el estado en que tiene que estar)
  // o «Crear tarea».
  const focusTarget = useRef<FocusTarget | null>(null);

  // D-14: se aplica después de pintar; la restauración nativa del <dialog> volvería a un elemento que
  // puede haber desaparecido (R-2). El diálogo se cierra antes de que llegue el render con la lista
  // nueva: si la tarjeta aún no está en su estado, se espera al render siguiente (al cambiar de
  // columna es otro elemento).
  useEffect(() => {
    const target = focusTarget.current;
    if (!target) return;
    if (target.kind === 'card') {
      const task = tasks.find(({ id }) => id === target.id);
      if (task?.status !== target.status) return;
    } else if (tasks.some(({ id }) => id === target.removedId)) {
      return;
    }
    const element =
      target.kind === 'create'
        ? createRef.current
        : boardRef.current?.querySelector<HTMLElement>(`[data-task-id="${target.id}"]`);
    if (!element) return;
    element.focus();
    focusTarget.current = null;
  });

  function openDialog(mode: TaskFormMode) {
    setNotice(undefined);
    setDialog(mode);
  }

  // D-14: adónde va el foco según cómo se cerró el diálogo.
  function handleClose(result: DialogResult) {
    switch (result.kind) {
      case 'created':
      case 'saved':
        // A su tarjeta, que puede estar en otra columna; en móvil, esa columna pasa a verse.
        focusTarget.current = { kind: 'card', id: result.task.id, status: result.task.status };
        setMobileColumn(result.task.status);
        break;
      case 'deleted':
      case 'notFound':
        // RF-027, RF-030: a «Crear tarea», que puede ser el del estado vacío (CA-5.5), cuando la
        // tarjeta ya no está (la lista se volvió a pedir, D-7).
        if (result.kind === 'notFound') setNotice(result.message);
        focusTarget.current = {
          kind: 'create',
          removedId: dialog?.kind === 'edit' ? dialog.task.id : undefined,
        };
        break;
      case 'cancelled':
        // RF-022: a la tarjeta de la tarea o a «Crear tarea».
        focusTarget.current =
          dialog?.kind === 'edit'
            ? { kind: 'card', id: dialog.task.id, status: dialog.task.status }
            : { kind: 'create' };
    }
    setDialog(null);
  }

  // X-8: un solo primario por vista; sin tareas, va dentro del estado vacío.
  // RF-036, D-16: por debajo de 768 px, fijo abajo y a todo el ancho (en la rejilla, el botón se estira).
  const createButton = (
    <span className="max-md:fixed max-md:inset-x-4 max-md:bottom-4 max-md:z-(--z-sticky) max-md:grid">
      <Button ref={createRef} variant="primary" onClick={() => openDialog({ kind: 'create' })}>
        Crear tarea
      </Button>
    </span>
  );

  return (
    <div ref={boardRef} className="flex flex-col gap-6 md:min-h-0 md:flex-1">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          {/* RF-037: el título de la vista; «Mis tareas» sigue en la cabecera y la pestaña. */}
          <h1 className="text-display text-balance">Tablero</h1>
          {/* X-1: --text-2, no --text-3, sobre el lienzo con punto. */}
          <p className="text-2">{tasksCount(tasks.length)}</p>
        </div>
        {!empty && createButton}
      </div>
      {/* D-20: siempre presente y vacía hasta que hay un aviso (004 D-14). */}
      <div role="alert" className="empty:sr-only">
        {notice && <Alert tone="info">{notice}</Alert>}
      </div>
      {empty ? (
        <EmptyBoard createButton={createButton} />
      ) : (
        <>
          <div className="md:hidden">
            <SegmentedControl
              name="board-column"
              legend="Columna"
              hideLegend
              options={TASK_STATUSES.map((status) => ({
                value: status,
                label: `${STATUS_NAMES[status]} · ${groups[status].length}`,
              }))}
              value={mobileColumn}
              onChange={(value) => setMobileColumn(value as TaskStatus)}
            />
          </div>
          {/* D-16: dos columnas visibles de 768 a 1023 px y cuatro desde 1024; si no caben, el scroll
              horizontal es del tablero, no de la página (RNF-002). */}
          <div className="grid gap-4 md:min-h-0 md:flex-1 md:grid-rows-1 md:overflow-x-auto md:board-columns-two lg:board-columns">
            {TASK_STATUSES.map((status) => (
              <BoardColumn
                key={status}
                status={status}
                tasks={groups[status]}
                today={today}
                hiddenOnMobile={status !== mobileColumn}
                onOpen={(task) => openDialog({ kind: 'edit', task })}
              />
            ))}
          </div>
        </>
      )}
      {dialog && (
        <TaskDialog
          key={dialog.kind === 'edit' ? dialog.task.id : 'new'}
          mode={dialog}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
