import type { IsoDate, Task } from '@todo/shared';
import { CalendarCheck, CalendarDays, ClockAlert } from 'lucide-react';
import { formatShortDate, isOverdue } from '../lib/dates';
import { Icon } from './Icon';

export type TaskCardProps = { task: Task; today: IsoDate; onOpen: () => void };

// D-10, D-18: las dos fechas con flecha; una sola, con «Etiqueta: valor» (§2.3, E-8).
function estimatedDates(
  { estimatedStartDate: start, estimatedEndDate: end }: Task,
  today: IsoDate,
) {
  if (start && end) return `${formatShortDate(start, today)} → ${formatShortDate(end, today)}`;
  if (end) return `Fin estimado: ${formatShortDate(end, today)}`;
  if (start) return `Inicio estimado: ${formatShortDate(start, today)}`;
  return undefined;
}

// DESIGN.md §14 TaskCard, §11.3. D-10: un botón que abre el detalle. Superficie raised, radio 30 y
// padding 16–20. X-2: con hover no sube de superficie (el --text-2 de las fechas bajaría de 7:1).
export function TaskCard({ task, today, onOpen }: TaskCardProps) {
  const dates = estimatedDates(task, today);
  const actualEnd = task.status === 'done' ? task.actualEndDate : null;
  return (
    <button
      type="button"
      data-task-id={task.id}
      onClick={onOpen}
      className="flex w-full flex-col items-start gap-2 rounded-lg border border-contrast bg-raised p-4 text-start shadow-(--shadow-pill) transition duration-(--dur-fast) ease-out hover:shadow-(--shadow-glass) motion-safe:hover:-translate-y-px md:p-5"
    >
      {/* E-4: una palabra de 200 caracteres se parte en varias líneas. */}
      <span className="text-body text-1 wrap-anywhere">{task.title}</span>
      {dates && (
        <span className="inline-flex items-center gap-1.5 text-xs text-2 tabular-nums">
          <Icon icon={CalendarDays} size={16} className="shrink-0" />
          {dates}
        </span>
      )}
      {actualEnd && (
        <span className="inline-flex items-center gap-1.5 text-xs text-2 tabular-nums">
          <Icon icon={CalendarCheck} size={16} className="shrink-0" />
          <span className="sr-only">Fecha real de fin:</span> {formatShortDate(actualEnd, today)}
        </span>
      )}
      {/* RF-032: el aviso no depende solo del color (icono y texto). */}
      {isOverdue(task, today) && (
        <span className="inline-flex h-7 items-center gap-1.5 rounded-pill bg-amber-soft px-3 text-xs text-1">
          <span aria-hidden="true" className="size-1.75 shrink-0 rounded-pill bg-(--amber)" />
          <Icon icon={ClockAlert} size={16} className="shrink-0" />
          Retrasada
        </span>
      )}
    </button>
  );
}
