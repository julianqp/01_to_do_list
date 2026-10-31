import type { CreateTaskInput, IsoDate, Task, UpdateTaskInput } from '@todo/shared';
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

// RF-002, D-1: de la más reciente a la más antigua; `id` desempata el mismo milisegundo (E-24).
export async function findTasksByUser(userId: string): Promise<Task[]> {
  const rows = await prisma.task.findMany({
    where: { userId },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    select: taskFields,
  });
  return rows.map(toTask);
}

// RF-011: sin `status`, la columna toma su valor por defecto (backlog).
export async function createTask(userId: string, input: CreateTaskInput): Promise<Task> {
  return toTask(
    await prisma.task.create({ data: { userId, ...toData(input) }, select: taskFields }),
  );
}

// D-3: la propiedad se comprueba en la misma sentencia. null si no existe o no es suya (P2025).
export async function updateTaskOfUser(
  userId: string,
  id: string,
  input: UpdateTaskInput,
): Promise<Task | null> {
  try {
    const row = await prisma.task.update({
      where: { id, userId },
      data: {
        ...toData(input),
        status: input.status,
        actualEndDate: toDbDate(input.actualEndDate),
      },
      select: taskFields,
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
