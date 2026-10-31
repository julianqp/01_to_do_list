import {
  isActualEndDateAllowed,
  type CreateTaskInput,
  type IsoDate,
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
  const task = await taskRepository.updateTaskOfUser(userId, id, input);
  if (!task) throw taskNotFound();
  return task;
}

// Lanza AppError TASK_NOT_FOUND.
export async function deleteTask(userId: string, id: string): Promise<void> {
  if (!(await taskRepository.deleteTaskOfUser(userId, id))) throw taskNotFound();
}
