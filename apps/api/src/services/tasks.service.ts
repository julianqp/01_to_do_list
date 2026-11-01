import {
  actualEndDateAfterMove,
  isActualEndDateAllowed,
  type CreateTaskInput,
  type IsoDate,
  type MoveTaskInput,
  type Task,
  type UpdateTaskInput,
} from '@todo/shared';
import { AppError } from '../errors';
import * as taskRepository from '../repositories/task.repository';

// C-13, D-3: toda llamada al repository lleva el `userId` de la sesión. Una tarea ajena, una
// inexistente y una ya borrada dan el mismo TASK_NOT_FOUND.
const taskNotFound = () => new AppError('TASK_NOT_FOUND', 404);

// D-6, R-4: ningún navegador va más de un día por delante de UTC.
function latestActualEndDate(now: Date): IsoDate {
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  return tomorrow.toISOString().slice(0, 10);
}

export function listTasks(userId: string): Promise<Task[]> {
  return taskRepository.findTasksByUser(userId);
}

export function createTask(userId: string, input: CreateTaskInput): Promise<Task> {
  return taskRepository.createTask(userId, input);
}

// Lanza AppError VALIDATION_ERROR (fin real posterior a «hoy UTC + 1», RF-039) | TASK_NOT_FOUND.
export async function updateTask(
  userId: string,
  id: string,
  input: UpdateTaskInput,
  now: Date = new Date(),
): Promise<Task> {
  if (
    input.actualEndDate !== null &&
    !isActualEndDateAllowed(input.actualEndDate, latestActualEndDate(now))
  ) {
    throw new AppError('VALIDATION_ERROR', 400);
  }
  // Spec 003, D-5: se lee antes para saber si cambia de estado (RF-010).
  const current = await taskRepository.findTaskOfUser(userId, id);
  if (!current) throw taskNotFound();
  const task = await taskRepository.updateTaskOfUser(userId, id, input, {
    toTop: current.status !== input.status,
  });
  if (!task) throw taskNotFound();
  return task;
}

// Spec 003, D-4, D-5. Lanza AppError TASK_NOT_FOUND | VALIDATION_ERROR (`today` posterior a «hoy UTC + 1»
// cuando la fecha real de fin entra nueva, RF-003).
export async function moveTask(
  userId: string,
  id: string,
  { status, index, today }: MoveTaskInput,
  now: Date = new Date(),
): Promise<Task> {
  const current = await taskRepository.findTaskOfUser(userId, id);
  if (!current) throw taskNotFound();
  const entersDone = status === 'done' && current.status !== 'done';
  if (entersDone && !isActualEndDateAllowed(today, latestActualEndDate(now))) {
    throw new AppError('VALIDATION_ERROR', 400);
  }
  const task = await taskRepository.moveTaskOfUser(userId, id, {
    status,
    index,
    actualEndDate: actualEndDateAfterMove(current, status, today),
  });
  if (!task) throw taskNotFound();
  return task;
}

// Lanza AppError TASK_NOT_FOUND.
export async function deleteTask(userId: string, id: string): Promise<void> {
  if (!(await taskRepository.deleteTaskOfUser(userId, id))) throw taskNotFound();
}
