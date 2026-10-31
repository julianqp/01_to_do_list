import type { IsoDate, Task, TaskStatus } from '@todo/shared';
import { Circle, CircleCheck, CircleDashed, CircleDot, type LucideIcon } from 'lucide-react';
import { tasksCount } from '../lib/dates';
import { Icon } from './Icon';
import { TaskCard } from './TaskCard';

// Glosario de la spec: los nombres de los estados no se traducen.
export const STATUS_NAMES: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
};

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
};

// DESIGN.md §14 BoardColumn: glass de radio 34, padding 20–24 y tarjetas con gap 10. D-11: región
// con nombre «In progress, 3 tareas» (RF-009) y cabecera h2 con el estilo h3.
export function BoardColumn({ status, tasks, today, hiddenOnMobile, onOpen }: BoardColumnProps) {
  const name = STATUS_NAMES[status];
  return (
    <section
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
              <TaskCard task={task} today={today} onOpen={() => onOpen(task)} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
