import { useDraggable, useDroppable } from '@dnd-kit/core';
import type { IsoDate, Task, TaskStatus } from '@todo/shared';
import { Circle, CircleCheck, CircleDashed, CircleDot, type LucideIcon } from 'lucide-react';
import { memo, useCallback } from 'react';
import { columnDropId } from '../lib/board-order';
import { tasksCount } from '../lib/dates';
import { STATUS_NAMES } from '../lib/task-messages';
import { Icon } from './Icon';
import { TaskCard, type HandleProps, type TaskCardVariant } from './TaskCard';

// DESIGN.md §1.3: cada estado con su icono. X-3: en --text-2, no en el color del acento.
export const STATUS_ICONS: Record<TaskStatus, LucideIcon> = {
  backlog: CircleDashed,
  todo: Circle,
  in_progress: CircleDot,
  done: CircleCheck,
};

// RF-005.
const EMPTY_PHRASES: Record<TaskStatus, string> = {
  backlog: 'Nada en el backlog',
  todo: 'Nada por hacer',
  in_progress: 'Nada en curso',
  done: 'Nada terminado todavía',
};

export type BoardColumnProps = {
  status: TaskStatus;
  tasks: Task[];
  today: IsoDate;
  // RF-034, D-16: por debajo de 768 px solo se ve la columna elegida.
  hiddenOnMobile: boolean;
  onOpen: (task: Task) => void;
  // Spec 003, D-7, D-8: el asa de cada tarjeta y la tarjeta que se está moviendo.
  handleProps?: HandleProps;
  dragTaskId?: string;
  dragMode?: 'pointer' | 'keyboard';
};

// Spec 003, D-9: cada tarjeta es draggable y droppable con el id de la tarea (sin @dnd-kit/sortable:
// la vista previa reordena la lista de verdad). `status` dice a qué columna pertenece como destino.
const DraggableCard = memo(function DraggableCard({
  task,
  today,
  onOpen,
  handleProps,
  variant,
}: {
  task: Task;
  today: IsoDate;
  onOpen: (task: Task) => void;
  handleProps?: HandleProps;
  variant: TaskCardVariant;
}) {
  const { setNodeRef: setDragRef, listeners } = useDraggable({ id: task.id });
  const { setNodeRef: setDropRef } = useDroppable({ id: task.id, data: { status: task.status } });
  // D-21: referencias estables, para que el `memo` de TaskCard sirva (RNF-002).
  const dragRef = useCallback(
    (node: HTMLElement | null) => {
      setDragRef(node);
      setDropRef(node);
    },
    [setDragRef, setDropRef],
  );
  const open = useCallback(() => onOpen(task), [onOpen, task]);
  return (
    <TaskCard
      task={task}
      today={today}
      onOpen={open}
      variant={variant}
      handleProps={handleProps}
      dragRef={dragRef}
      dragListeners={listeners}
    />
  );
});

// DESIGN.md §14 BoardColumn: glass de radio 34, padding 20–24 y tarjetas con gap 10. D-11: región
// con nombre «In progress, 3 tareas» (RF-009) y cabecera h2 con el estilo h3.
export function BoardColumn({
  status,
  tasks,
  today,
  hiddenOnMobile,
  onOpen,
  handleProps,
  dragTaskId,
  dragMode,
}: BoardColumnProps) {
  const name = STATUS_NAMES[status];
  // Spec 003, D-13: en móvil, las columnas ocultas miden 0 × 0 y nunca son destino (RF-019).
  const { setNodeRef } = useDroppable({ id: columnDropId(status) });
  return (
    <section
      ref={setNodeRef}
      data-board-column
      aria-label={`${name}, ${tasksCount(tasks.length)}`}
      className={`flex min-w-0 flex-col gap-4 rounded-xl border border-contrast bg-glass p-5 shadow-(--shadow-glass) backdrop-glass md:min-h-0 md:p-6 ${hiddenOnMobile ? 'max-md:hidden' : ''}`}
    >
      <h2 className="flex items-center gap-2 text-h3 text-1">
        <Icon icon={STATUS_ICONS[status]} size={20} className="shrink-0 text-2" />
        {name} <span className="text-2">· {tasks.length}</span>
      </h2>
      {tasks.length === 0 ? (
        // X-1: la frase en --text-2 (el --text-3 de §11.3 no llega a 7:1 en el hueco).
        <p className="rounded-lg bg-sunken px-5 py-6 text-center text-sm text-2">
          {EMPTY_PHRASES[status]}
        </p>
      ) : (
        // E-2, §3.2: desde 768 px la lista hace scroll por su cuenta y la cabecera queda fija.
        <ul className="-m-1 flex flex-col gap-2.5 p-1 md:min-h-0 md:overflow-y-auto">
          {tasks.map((task) => (
            <li key={task.id}>
              <DraggableCard
                task={task}
                today={today}
                onOpen={onOpen}
                variant={
                  task.id !== dragTaskId
                    ? 'rest'
                    : dragMode === 'pointer'
                      ? 'placeholder'
                      : 'lifted'
                }
                handleProps={handleProps}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
