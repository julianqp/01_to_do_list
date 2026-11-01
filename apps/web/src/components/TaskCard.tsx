import type { DraggableSyntheticListeners } from '@dnd-kit/core';
import type { IsoDate, Task } from '@todo/shared';
import { CalendarCheck, CalendarDays, ClockAlert, GripVertical } from 'lucide-react';
import { memo, type FocusEvent, type KeyboardEvent, type MouseEvent } from 'react';
import { formatShortDate, isOverdue } from '../lib/dates';
import { Icon } from './Icon';

// Spec 003, D-10: en reposo; hueco de destino; levantada con teclado; capa que sigue al puntero.
export type TaskCardVariant = 'rest' | 'placeholder' | 'lifted' | 'overlay';

// Spec 003, D-7: coger y soltar con `onClick` (Espacio y Enter en un botón), flechas y Esc con
// `onKeyDown`, y cancelar si el foco sale del asa con `onBlur`.
export type HandleProps = {
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
  onBlur: (event: FocusEvent<HTMLButtonElement>) => void;
};

export type TaskCardProps = {
  task: Task;
  today: IsoDate;
  onOpen: () => void;
  variant?: TaskCardVariant;
  handleProps?: HandleProps;
  // Spec 003, D-6: se arrastra desde cualquier punto de la tarjeta (spec §10).
  dragRef?: (node: HTMLElement | null) => void;
  dragListeners?: DraggableSyntheticListeners;
};

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

// §6.3: flota sobre otras tarjetas; sin blur, su texto se transparentaría a través de este.
const LIFTED =
  'bg-raised backdrop-glass shadow-(--shadow-float) transition duration-(--dur-fast) ease-out motion-safe:scale-102';

const VARIANTS: Record<TaskCardVariant, string> = {
  // X-2 (spec 002): con hover no sube de superficie (el --text-2 de las fechas bajaría de 7:1).
  rest: 'bg-raised shadow-(--shadow-pill) transition duration-(--dur-fast) ease-out hover:shadow-(--shadow-glass) motion-safe:hover:-translate-y-px',
  // E-6: el contenido se oculta sin quitarlo, así que conserva su altura. X-1: el anillo, porque el
  // hueco solo da 1.04–1.16:1 contra la columna.
  placeholder: 'bg-sunken inset-ring-(length:--ring-error-width) inset-ring-ring-drop',
  lifted: `${LIFTED} z-(--z-popover)`,
  overlay: LIFTED,
};

// DESIGN.md §14 TaskCard, §11.3. Spec 003, D-11: un botón dentro de otro no es HTML válido, así que la
// tarjeta es un contenedor con el botón de abrir y el asa. Superficie raised, radio 30 y padding 16–20.
// D-21: `memo`, porque soltar una tarjeta no debe volver a pintar las otras 499 (RNF-002).
export const TaskCard = memo(function TaskCard({
  task,
  today,
  onOpen,
  variant = 'rest',
  handleProps,
  dragRef,
  dragListeners,
}: TaskCardProps) {
  const dates = estimatedDates(task, today);
  const actualEnd = task.status === 'done' ? task.actualEndDate : null;
  const overlay = variant === 'overlay';
  const content = variant === 'placeholder' ? 'invisible' : '';
  return (
    <div
      ref={dragRef}
      {...dragListeners}
      // D-10: la capa repite la tarjeta solo a la vista: sus botones no existen para el teclado ni el lector.
      aria-hidden={overlay || undefined}
      inert={overlay || undefined}
      className={`relative rounded-lg border border-contrast select-none ${VARIANTS[variant]}`}
    >
      {/* D-11: ocupa toda la tarjeta y deja a la derecha el sitio del asa. */}
      <button
        type="button"
        data-task-id={overlay ? undefined : task.id}
        onClick={onOpen}
        className={`flex w-full flex-col items-start gap-2 rounded-lg p-4 pe-11 text-start md:p-5 md:pe-11 lg:pe-10 ${content}`}
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
      {/* RF-012, RNF-001: 44 px por debajo de 1024 y 32 desde ahí; el orden de tabulación es el visual. */}
      <button
        type="button"
        data-task-handle={overlay ? undefined : task.id}
        aria-label={`Mover «${task.title}»`}
        className={`absolute end-0 top-0 flex size-11 cursor-grab items-center justify-center rounded-pill text-2 lg:end-1 lg:top-1 lg:size-8 ${content}`}
        {...handleProps}
      >
        <Icon icon={GripVertical} size={16} className="shrink-0" />
      </button>
    </div>
  );
});
