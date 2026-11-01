import {
  closestCenter,
  MeasuringStrategy,
  MouseSensor,
  pointerWithin,
  TouchSensor,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DndContextProps,
  type DragMoveEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import type { Task, TaskStatus } from '@todo/shared';
import { useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { AlertTone } from '../components/Alert';
import type { HandleProps } from '../components/TaskCard';
import {
  columnDropStatus,
  groupByStatus,
  placementFromOver,
  placementOf,
  placeTask,
  samePlacement,
  stepPlacement,
  type MoveKey,
  type Over,
  type Placement,
} from './board-order';
import { ApiError } from './api';
import { todayLocal } from './dates';
import {
  cancelledText,
  droppedText,
  isTaskNotFound,
  movedText,
  moveErrorText,
  pickedText,
} from './task-messages';
import { useMoveTask } from './task-queries';

// Spec 003, D-8: el mismo estado para el puntero y el teclado. Estado de interfaz, no datos del
// servidor (C-4): un id y dos posiciones; la tarea y la lista que se pinta salen de `tasks` en cada
// render.
export type DragState = {
  taskId: string;
  origin: Placement;
  current: Placement;
  mode: 'pointer' | 'keyboard';
};

// D-18: al soltar, la vista previa sigue mientras la tarea no se haya movido de `before`.
type Landing = { taskId: string; to: Placement; before: Placement };

const MOVE_KEYS: readonly string[] = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

// D-6: los anuncios de dnd-kit están en inglés (E-20), y la spec solo pide anuncios para el teclado.
const ACCESSIBILITY: DndContextProps['accessibility'] = {
  announcements: {
    onDragStart: () => undefined,
    onDragOver: () => undefined,
    onDragEnd: () => undefined,
    onDragCancel: () => undefined,
  },
  screenReaderInstructions: { draggable: '' },
};

// D-12: el aviso de la zona de alerta del tablero.
export type BoardNotice = { tone: AlertTone; text: string };

// D-6. Constantes: unas opciones nuevas en cada render rehacen los sensores y, con ellos, el contexto
// de dnd-kit, que vuelve a pintar todas las tarjetas (RNF-002).
const MOUSE_OPTIONS = { activationConstraint: { distance: 5 } };
const TOUCH_OPTIONS = { activationConstraint: { delay: 250, tolerance: 5 } };

const MEASURING: DndContextProps['measuring'] = {
  // D-9: la lista cambia durante el arrastre.
  droppable: { strategy: MeasuringStrategy.Always },
};

// D-9: `pointerWithin` da la columna bajo el puntero y, dentro de ella, `closestCenter` la tarjeta.
// Fuera de toda columna (también entre dos, o sobre el selector de móvil), ningún destino: RF-005.
const collisionDetection: CollisionDetection = (args) => {
  const column = pointerWithin(args).find(({ id }) => columnDropStatus(id));
  if (!column) return [];
  const status = columnDropStatus(column.id);
  const cards = args.droppableContainers.filter(({ data }) => data.current?.status === status);
  return cards.length > 0 ? closestCenter({ ...args, droppableContainers: cards }) : [column];
};

const handleOf = (id: string) => document.querySelector<HTMLElement>(`[data-task-handle="${id}"]`);

export function useTaskMove({
  tasks,
  onMobileColumn,
  onNotice,
}: {
  tasks: Task[];
  // D-13, RF-023: con el teclado, la columna visible en móvil sigue a la tarjeta.
  onMobileColumn: (status: TaskStatus) => void;
  onNotice: (notice: BoardNotice) => void;
}) {
  const [drag, setDrag] = useState<DragState | null>(null);
  // D-18: la actualización optimista llega un instante después de soltar: sin esto habría un render
  // con la tarjeta en su sitio de antes.
  const [landing, setLanding] = useState<Landing | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const move = useMoveTask();

  const draggedTask = drag ? tasks.find(({ id }) => id === drag.taskId) : undefined;
  // D-7: la tarea ha desaparecido de la lista (la borró otra mutación): sin anuncio.
  if (drag && !draggedTask) setDrag(null);

  const landingTask = landing ? tasks.find(({ id }) => id === landing.taskId) : undefined;
  const landingAt = landing && placementOf(tasks, landing.taskId);
  const stillBefore = landing && landingAt ? samePlacement(landingAt, landing.before) : false;
  // D-18: ya se ha movido. Si se esperara al final de la mutación, que espera a volver a pedir la
  // lista, al fallar reaparecería en su sitio nuevo durante ese tiempo.
  if (landing && landingAt && !stillBefore) setLanding(null);

  const preview =
    drag && draggedTask
      ? { task: draggedTask, to: drag.current }
      : landing && landingTask && stillBefore
        ? { task: landingTask, to: landing.to }
        : null;
  const displayTasks = preview ? placeTask(tasks, preview.task, preview.to) : tasks;
  const groups = groupByStatus(displayTasks);
  const totalAt = (at: Placement) =>
    groups[at.status].length + (drag && drag.current.status !== at.status ? 1 : 0);

  // D-7: el asa que tiene que conservar el foco, aunque la tarjeta cambie de columna (y de elemento).
  const focusedHandle = useRef<string | null>(null);
  useLayoutEffect(() => {
    const id = focusedHandle.current;
    if (!id) return;
    const handle = handleOf(id);
    if (handle !== document.activeElement) handle?.focus();
    // D-23, RF-024: las flechas llevan `preventDefault` y el asa conserva el foco, así que nadie más
    // la haría scroll. La tarjeta entera, no solo el asa. Con el puntero, el scroll es de dnd-kit.
    if (drag?.mode === 'keyboard' && drag.taskId === id) {
      handle?.parentElement?.scrollIntoView({
        block: 'nearest',
        inline: 'nearest',
        behavior: 'instant',
      });
    }
  });

  function commit({ taskId, origin, current }: DragState) {
    if (samePlacement(origin, current)) return; // RF-011, E-3
    const task = tasks.find(({ id }) => id === taskId);
    const before = placementOf(tasks, taskId);
    if (!task || !before) return;
    const next = { taskId, to: current, before };
    setLanding(next);
    // E-16: «hoy» es la fecha local del navegador. Con la promesa de cada llamada, porque el `onError`
    // de `mutate` solo se dispara para la última (E-12).
    move
      .mutateAsync({ task, from: origin, to: current, today: todayLocal() })
      .catch((error) => {
        // E-8: con la sesión caducada, redirige withQueryClient; no hay nada que avisar aquí.
        if (error instanceof ApiError && error.status === 401) return;
        onNotice({
          tone: isTaskNotFound(error) ? 'info' : 'offline',
          text: moveErrorText(error),
        });
      })
      // D-18: por si la lista no llegó a cambiar. Sin tocar el `landing` de un movimiento posterior.
      .finally(() => setLanding((latest) => (latest === next ? null : latest)));
  }

  function cancel({ origin }: DragState) {
    setDrag(null);
    onMobileColumn(origin.status);
    if (!draggedTask) return;
    setAnnouncement(
      cancelledText(draggedTask.title, origin, groupByStatus(tasks)[origin.status].length),
    );
  }

  // D-7: Espacio y Enter en un botón son un `click`, y la activación de VoiceOver también.
  function clickHandle(id: string) {
    if (drag?.mode === 'keyboard' && draggedTask?.id === id) {
      setDrag(null);
      setAnnouncement(droppedText(draggedTask.title, drag.current, totalAt(drag.current)));
      commit(drag);
      return;
    }
    const task = tasks.find((candidate) => candidate.id === id);
    const origin = drag ? undefined : placementOf(tasks, id);
    if (!task || !origin) return;
    focusedHandle.current = id;
    setDrag({ taskId: id, origin, current: origin, mode: 'keyboard' });
    setAnnouncement(pickedText(task.title, origin, groups[origin.status].length));
  }

  function keyDownOnHandle(id: string, event: KeyboardEvent<HTMLButtonElement>) {
    if (drag?.mode !== 'keyboard' || drag.taskId !== id) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      cancel(drag);
    } else if (MOVE_KEYS.includes(event.key)) {
      event.preventDefault(); // Para que la página no haga scroll.
      const next = stepPlacement(groups, drag.current, event.key as MoveKey);
      if (!next) return; // RF-015
      setDrag({ ...drag, current: next });
      if (next.status !== drag.current.status) onMobileColumn(next.status);
      setAnnouncement(movedText(next, totalAt(next)));
    }
  }

  // RF-017, R-4: se comprueba en diferido porque, al cambiar de columna, el asa pierde el foco un
  // instante.
  function leaveHandle(id: string) {
    if (handleOf(id) === document.activeElement) return;
    // Ha salido de verdad: ya no se le devuelve el foco.
    if (focusedHandle.current === id) focusedHandle.current = null;
    if (drag?.mode === 'keyboard' && drag.taskId === id) cancel(drag);
  }

  const latest = useRef({ clickHandle, keyDownOnHandle, leaveHandle });
  useLayoutEffect(() => {
    latest.current = { clickHandle, keyDownOnHandle, leaveHandle };
  });
  // D-21: el mismo objeto para todas las tarjetas y en todos los renders, para que `memo` las deje
  // en paz (RNF-002). La tarjeta sale del propio botón, y el estado, del último render.
  const [handleProps] = useState<HandleProps>(() => ({
    onClick: ({ currentTarget }) => latest.current.clickHandle(currentTarget.dataset.taskHandle!),
    onKeyDown: (event) =>
      latest.current.keyDownOnHandle(event.currentTarget.dataset.taskHandle!, event),
    onBlur: ({ currentTarget }) => {
      const id = currentTarget.dataset.taskHandle!;
      setTimeout(() => latest.current.leaveHandle(id));
    },
  }));

  // D-6: sin PointerSensor, que con el dedo exigiría `touch-action: none` y no dejaría hacer scroll.
  const sensors = useSensors(
    useSensor(MouseSensor, MOUSE_OPTIONS),
    useSensor(TouchSensor, TOUCH_OPTIONS),
  );

  // RF-005, E-17: Esc y el cambio de tamaño de la ventana cancelan sin anuncio: los anuncios son del
  // teclado (D-6).
  const dragHandlers = {
    onDragStart({ active }: DragStartEvent) {
      const taskId = String(active.id);
      const origin = placementOf(tasks, taskId);
      if (origin) setDrag({ taskId, origin, current: origin, mode: 'pointer' });
    },
    onDragOver({ active, over }: DragOverEvent) {
      if (drag?.mode !== 'pointer') return;
      if (!over) {
        setDrag({ ...drag, current: drag.origin });
        return;
      }
      const status = columnDropStatus(over.id);
      const target: Over = status
        ? { kind: 'column', status }
        : { kind: 'card', id: String(over.id) };
      const moving = active.rect.current.translated;
      const below =
        moving !== null && moving.top + moving.height / 2 > over.rect.top + over.rect.height / 2;
      setDrag({ ...drag, current: placementFromOver(groups, drag.taskId, target, below) });
    },
    // D-20: dentro de la columna donde ya está, se recoloca al cruzar el centro de la de debajo.
    onDragMove({ active, over }: DragMoveEvent) {
      if (drag?.mode !== 'pointer' || !over || over.id === active.id) return;
      const moving = active.rect.current.translated;
      const index = groups[drag.current.status].findIndex(({ id }) => id === over.id);
      if (!moving || index === -1) return;
      const center = moving.top + moving.height / 2;
      const overCenter = over.rect.top + over.rect.height / 2;
      const crossed = index < drag.current.index ? center < overCenter : center > overCenter;
      if (crossed) setDrag({ ...drag, current: { status: drag.current.status, index } });
    },
    onDragEnd() {
      if (drag?.mode !== 'pointer') return;
      setDrag(null);
      commit(drag);
    },
    onDragCancel() {
      setDrag(null);
    },
  };

  return {
    displayTasks,
    drag,
    draggedTask,
    announcement,
    handleProps,
    dndProps: {
      sensors,
      accessibility: ACCESSIBILITY,
      collisionDetection,
      measuring: MEASURING,
      ...dragHandlers,
    },
  };
}
