import { z } from 'zod';

// Spec 002, plan §4.2. Mensajes en castellano: el front los muestra tal cual (D-4).
export const TASK_MESSAGES = {
  titleRequired: 'Escribe un título para la tarea.',
  titleTooLong: 'El título puede tener hasta 200 caracteres. Acórtalo un poco.',
  descriptionTooLong: 'La descripción puede tener hasta 5000 caracteres. Acórtala un poco.',
  invalidDate: 'Esa fecha no existe. Escríbela como 14/11/2026.',
  endBeforeStart: 'La fecha de fin no puede ser anterior a la de inicio. Cambia una de las dos.',
  actualEndRequired: 'Escribe el día en que terminaste la tarea.',
  // RF-039: lo pone el formulario con la fecha del navegador (R-4); la API solo responde 400.
  actualEndInFuture: 'La fecha real de fin no puede ser posterior a hoy. Cambia la fecha.',
} as const;

export const TASK_STATUSES = ['backlog', 'todo', 'in_progress', 'done'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

// E-3, E-6: en puntos de código, no en unidades UTF-16.
export const TASK_TITLE_MAX_LENGTH = 200;
export const TASK_DESCRIPTION_MAX_LENGTH = 5000;

// C-11: día sin hora, 'YYYY-MM-DD'.
export type IsoDate = string;

// Lo único que la API devuelve de una tarea (sin userId ni createdAt).
export type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  estimatedStartDate: IsoDate | null;
  estimatedEndDate: IsoDate | null;
  actualEndDate: IsoDate | null;
};

export type CreateTaskInput = Pick<
  Task,
  'title' | 'description' | 'estimatedStartDate' | 'estimatedEndDate'
>;
export type UpdateTaskInput = CreateTaskInput & Pick<Task, 'status' | 'actualEndDate'>;

const codePoints = (value: string) => [...value].length;

// Cada campo inválido da un solo mensaje: vacío y más de 200 nunca fallan a la vez. Sin `abort`:
// en Zod 4.6 un issue con `abort` impide los `refine` del objeto (RF-018, RF-040), aunque lleven `when`.
const titleSchema = z
  .string()
  .trim()
  .min(1, { error: TASK_MESSAGES.titleRequired })
  .refine((value) => codePoints(value) <= TASK_TITLE_MAX_LENGTH, {
    error: TASK_MESSAGES.titleTooLong,
  });

// RF-020: sin recortar, con los saltos de línea tal cual.
const descriptionSchema = z
  .string()
  .refine((value) => codePoints(value) <= TASK_DESCRIPTION_MAX_LENGTH, {
    error: TASK_MESSAGES.descriptionTooLong,
  });

// RF-017: z.iso.date() también rechaza los días que no existen (2026-02-31).
const dateSchema = z.iso.date({ error: TASK_MESSAGES.invalidDate }).nullable();

export const taskIdSchema: z.ZodType<string> = z.uuid();

const DATE_FIELDS: PropertyKey[] = ['estimatedStartDate', 'estimatedEndDate'];

// RF-018: las dos fechas en ISO se comparan como texto. Se comprueba aunque otros campos fallen
// (un mensaje por campo, RF-019), pero no si alguna de las fechas ya es inválida.
const estimatedDatesInOrder = {
  error: TASK_MESSAGES.endBeforeStart,
  path: ['estimatedEndDate'],
  when: ({ issues }: { issues: readonly { path?: PropertyKey[] }[] }) =>
    !issues.some(({ path }) => DATE_FIELDS.includes(path?.[0] ?? '')),
};
const endNotBeforeStart = ({ estimatedStartDate: start, estimatedEndDate: end }: CreateTaskInput) =>
  start === null || end === null || end >= start;

const createShape = {
  title: titleSchema,
  description: descriptionSchema,
  estimatedStartDate: dateSchema,
  estimatedEndDate: dateSchema,
};

// D-2: si el cuerpo trae `status`, z.object lo descarta; la tarea nueva siempre va a Backlog.
export const createTaskInputSchema: z.ZodType<CreateTaskInput> = z
  .object(createShape)
  .refine(endNotBeforeStart, estimatedDatesInOrder);

export const updateTaskInputSchema: z.ZodType<UpdateTaskInput> = z
  .object({ ...createShape, status: z.enum(TASK_STATUSES), actualEndDate: dateSchema })
  .refine(endNotBeforeStart, estimatedDatesInOrder)
  // RF-040: en Done la fecha real de fin es obligatoria.
  .refine((input) => input.status !== 'done' || input.actualEndDate !== null, {
    error: TASK_MESSAGES.actualEndRequired,
    path: ['actualEndDate'],
    when: ({ issues }) =>
      !issues.some(({ path }) => path?.[0] === 'actualEndDate' || path?.[0] === 'status'),
  })
  // RF-041, E-23: con otro estado, la tarea se queda sin fecha real de fin.
  .transform((input) => (input.status === 'done' ? input : { ...input, actualEndDate: null }));

// RF-039: regla pura. El front la llama con la fecha local de hoy y la API con «hoy UTC + 1» (D-6).
export function isActualEndDateAllowed(actualEndDate: IsoDate, latestAllowed: IsoDate): boolean {
  return actualEndDate <= latestAllowed;
}
