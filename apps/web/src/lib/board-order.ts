import { TASK_STATUSES, type Task, type TaskStatus } from '@todo/shared';

// Spec 003, plan §4.3: funciones puras del orden del tablero. La lista de tareas ya viene en el orden
// de cada columna (D-1); aquí se reparte y se recoloca sin pedir nada al servidor.

// `index`, desde 0, es la posición en la columna sin contar la tarea que se mueve (D-3).
export type Placement = { status: TaskStatus; index: number };

export type MoveKey = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight';

export type Over = { kind: 'card'; id: string } | { kind: 'column'; status: TaskStatus };

// 002/D-7: el orden lo da el servidor; aquí solo se reparte por estado, sin reordenar.
export function groupByStatus(tasks: Task[]) {
  const groups = Object.fromEntries(TASK_STATUSES.map((status) => [status, [] as Task[]]));
  for (const task of tasks) groups[task.status]!.push(task);
  return groups as Record<TaskStatus, Task[]>;
}

export function placementOf(tasks: Task[], id: string): Placement | undefined {
  const task = tasks.find((candidate) => candidate.id === id);
  if (!task) return undefined;
  const index = groupByStatus(tasks)[task.status].findIndex((candidate) => candidate.id === id);
  return { status: task.status, index };
}

// D-8, D-12: quita la tarea por id y la pone en `to`, con ese estado. Tres usos: la vista previa, la
// actualización optimista y deshacer. Un `index` mayor que la columna la pone al final.
export function placeTask(tasks: Task[], task: Task, to: Placement): Task[] {
  const rest = tasks.filter(({ id }) => id !== task.id);
  const placed = { ...task, status: to.status };
  const column = rest.filter(({ status }) => status === to.status);
  const anchor = column[to.index];
  if (anchor) {
    const at = rest.indexOf(anchor);
    return [...rest.slice(0, at), placed, ...rest.slice(at)];
  }
  const last = column.at(-1);
  const at = last ? rest.indexOf(last) + 1 : rest.length;
  return [...rest.slice(0, at), placed, ...rest.slice(at)];
}

export function samePlacement(a: Placement, b: Placement): boolean {
  return a.status === b.status && a.index === b.index;
}

// RF-014, RF-015: un paso con el teclado. `groups` incluye la tarjeta en `at`. Arriba y abajo, una
// posición; izquierda y derecha, la primera de la columna vecina. Sin sitio, undefined.
export function stepPlacement(
  groups: Record<TaskStatus, Task[]>,
  at: Placement,
  key: MoveKey,
): Placement | undefined {
  switch (key) {
    case 'ArrowUp':
      return at.index > 0 ? { status: at.status, index: at.index - 1 } : undefined;
    case 'ArrowDown':
      return at.index < groups[at.status].length - 1
        ? { status: at.status, index: at.index + 1 }
        : undefined;
    case 'ArrowLeft':
    case 'ArrowRight': {
      const next = TASK_STATUSES[TASK_STATUSES.indexOf(at.status) + (key === 'ArrowLeft' ? -1 : 1)];
      return next ? { status: next, index: 0 } : undefined;
    }
  }
}

// D-9: el destino con el puntero. `groups` es la vista previa (la tarjeta ya en su sitio actual).
// - En la misma columna, la posición de la tarjeta de debajo, como arrayMove: no oscila.
// - En otra columna, antes o después de la tarjeta de debajo según `below` (el centro de la que se
//   arrastra queda por debajo del de esa tarjeta).
// - Sobre la columna sin tarjeta debajo (vacía, E-1), al final.
export function placementFromOver(
  groups: Record<TaskStatus, Task[]>,
  activeId: string,
  over: Over,
  below: boolean,
): Placement {
  if (over.kind === 'column') {
    const others = groups[over.status].filter(({ id }) => id !== activeId);
    return { status: over.status, index: others.length };
  }
  for (const status of TASK_STATUSES) {
    const column = groups[status];
    const index = column.findIndex(({ id }) => id === over.id);
    if (index === -1) continue;
    const sameColumn = column.some(({ id }) => id === activeId);
    return { status, index: sameColumn || !below ? index : index + 1 };
  }
  throw new Error(`La tarjeta ${over.id} no está en el tablero`);
}
