import type { CreateTaskInput, Task } from '@todo/shared';
import request, { type Response } from 'supertest';
import { expect } from 'vitest';
import { createApp } from '../src/app';

// Supertest no reenvía cookies `Secure` por HTTP: se saca `sid` de Set-Cookie y se manda en `Cookie` a mano.
export function sidCookie(res: Response): string {
  const setCookie = res.headers['set-cookie'] as unknown as string[] | undefined;
  const sid = setCookie?.map((c) => c.split(';')[0]).find((c) => c?.startsWith('sid='));
  if (!sid) throw new Error('La respuesta no trae la cookie sid');
  return sid;
}

// --- Spec 002 ---

const app = createApp();
const PASSWORD = 'correcta-horse-1';

export const NEW_TASK: CreateTaskInput = {
  title: 'Preparar la demo',
  description: '',
  estimatedStartDate: null,
  estimatedEndDate: null,
};

// Registra la cuenta y devuelve la cookie `sid` de su sesión.
export async function signupCookie(email: string): Promise<string> {
  const res = await request(app).post('/api/auth/signup').send({ email, password: PASSWORD });
  expect(res.status).toBe(201);
  return sidCookie(res);
}

// Crea una tarea con la sesión de `cookie` y devuelve la tarea de la respuesta.
export async function createTaskFor(
  cookie: string,
  input: Partial<CreateTaskInput> = {},
): Promise<Task> {
  const res = await request(app)
    .post('/api/tasks')
    .set('Cookie', cookie)
    .send({ ...NEW_TASK, ...input });
  expect(res.status).toBe(201);
  return (res.body as { task: Task }).task;
}

// Fecha UTC de hoy ± días, en ISO (D-6 mide el límite del fin real contra UTC).
export function utcIsoDate(daysFromToday: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysFromToday);
  return date.toISOString().slice(0, 10);
}
