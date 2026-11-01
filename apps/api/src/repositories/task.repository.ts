import type { CreateTaskInput, IsoDate, Task, TaskStatus, UpdateTaskInput } from '@todo/shared';
import { Prisma } from '../generated/prisma/client';
import { prisma } from './prisma';

// Plan §4.2: lo único que sale de una tarea (sin userId ni createdAt).
const taskFields = {
  id: true,
  title: true,
  description: true,
  status: true,
  estimatedStartDate: true,
  estimatedEndDate: true,
  actualEndDate: true,
} as const;

type TaskRow = Prisma.TaskGetPayload<{ select: typeof taskFields }>;

// D-5: Prisma lee las @db.Date como medianoche UTC. Fuera de este fichero solo viajan 'YYYY-MM-DD'.
const toIsoDate = (date: Date | null): IsoDate | null => date?.toISOString().slice(0, 10) ?? null;
const toDbDate = (date: IsoDate | null): Date | null =>
  date === null ? null : new Date(`${date}T00:00:00.000Z`);

function toTask(row: TaskRow): Task {
  return {
    ...row,
    estimatedStartDate: toIsoDate(row.estimatedStartDate),
    estimatedEndDate: toIsoDate(row.estimatedEndDate),
    actualEndDate: toIsoDate(row.actualEndDate),
  };
}

function toData(input: CreateTaskInput) {
  return {
    title: input.title,
    description: input.description,
    estimatedStartDate: toDbDate(input.estimatedStartDate),
    estimatedEndDate: toDbDate(input.estimatedEndDate),
  };
}

const isNotFound = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025';

// Spec 003, D-1: el orden de una columna; los desempates solo actúan si se repite una posición.
const columnOrder = [
  { position: 'asc' },
  { createdAt: 'desc' },
  { id: 'desc' },
] satisfies Prisma.TaskOrderByWithRelationInput[];

// D-2: serializa las transacciones que colocan tareas de un usuario, para que no se repitan posiciones.
async function lockUser(tx: Prisma.TransactionClient, userId: string): Promise<void> {
  await tx.$queryRaw`SELECT 1 FROM "User" WHERE id = ${userId} FOR UPDATE`;
}

// D-2: hace sitio en `index` (sin contar `excludeId`) y devuelve la `position` que hay que ocupar. La
// tarea que ocupa ese sitio y las de debajo bajan una posición; la columna de origen no se compacta.
async function makeRoom(
  tx: Prisma.TransactionClient,
  userId: string,
  status: TaskStatus,
  index: number,
  excludeId?: string,
): Promise<number> {
  const where = { userId, status, ...(excludeId ? { id: { not: excludeId } } : {}) };
  const anchor = await tx.task.findFirst({
    where,
    orderBy: columnOrder,
    skip: index,
    select: { position: true },
  });
  if (anchor) {
    await tx.task.updateMany({
      where: { ...where, position: { gte: anchor.position } },
      data: { position: { increment: 1 } },
    });
    return anchor.position;
  }
  const last = await tx.task.findFirst({
    where,
    orderBy: { position: 'desc' },
    select: { position: true },
  });
  return last ? last.position + 1 : 0;
}

// Spec 003, RF-008, D-1: el orden que dejó el usuario; cada columna se reparte en el front (002/D-7).
export async function findTasksByUser(userId: string): Promise<Task[]> {
  const rows = await prisma.task.findMany({
    where: { userId },
    orderBy: columnOrder,
    select: taskFields,
  });
  return rows.map(toTask);
}

// Spec 003, D-5: null si no existe o no es suya.
export async function findTaskOfUser(userId: string, id: string): Promise<Task | null> {
  const row = await prisma.task.findFirst({ where: { id, userId }, select: taskFields });
  return row && toTask(row);
}

// RF-011: sin `status`, la columna toma su valor por defecto (backlog). Spec 003, RF-009: la primera.
export async function createTask(userId: string, input: CreateTaskInput): Promise<Task> {
  return prisma.$transaction(async (tx) => {
    await lockUser(tx, userId);
    const position = await makeRoom(tx, userId, 'backlog', 0);
    return toTask(
      await tx.task.create({ data: { userId, position, ...toData(input) }, select: taskFields }),
    );
  });
}

// D-2: en una transacción, hace sitio en la columna de destino y escribe la tarea en ese sitio.
function placeTaskOfUser(
  userId: string,
  id: string,
  { status, index }: { status: TaskStatus; index: number },
  data: Prisma.TaskUpdateInput,
) {
  return prisma.$transaction(async (tx) => {
    await lockUser(tx, userId);
    const position = await makeRoom(tx, userId, status, index, id);
    return tx.task.update({
      where: { id, userId },
      data: { ...data, status, position },
      select: taskFields,
    });
  });
}

// D-3: la propiedad se comprueba en la misma sentencia. null si no existe o no es suya (P2025).
// Spec 003, RF-010: con `toTop`, la tarjeta entra la primera de su columna nueva.
export async function updateTaskOfUser(
  userId: string,
  id: string,
  input: UpdateTaskInput,
  { toTop }: { toTop: boolean },
): Promise<Task | null> {
  const data = {
    ...toData(input),
    status: input.status,
    actualEndDate: toDbDate(input.actualEndDate),
  };
  try {
    const row = toTop
      ? await placeTaskOfUser(userId, id, { status: input.status, index: 0 }, data)
      : await prisma.task.update({ where: { id, userId }, data, select: taskFields });
    return toTask(row);
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

// Spec 003, D-2, D-5: null si no existe o no es suya (P2025). RF-001, RF-007.
export async function moveTaskOfUser(
  userId: string,
  id: string,
  target: { status: TaskStatus; index: number; actualEndDate: IsoDate | null },
): Promise<Task | null> {
  try {
    const row = await placeTaskOfUser(userId, id, target, {
      actualEndDate: toDbDate(target.actualEndDate),
    });
    return toTask(row);
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

// D-3: false si no existe o no es suya (P2025).
export async function deleteTaskOfUser(userId: string, id: string): Promise<boolean> {
  try {
    await prisma.task.delete({ where: { id, userId } });
    return true;
  } catch (error) {
    if (isNotFound(error)) return false;
    throw error;
  }
}
