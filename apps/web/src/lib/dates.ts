import type { IsoDate, Task } from '@todo/shared';

// D-18, R-3: fechas y plurales con Intl en es-ES (DESIGN.md §16: nunca a mano). Las fechas
// 'YYYY-MM-DD' se formatean en UTC para que no cambien de día con la zona horaria (C-11).
const LOCALE = 'es-ES';
const shortDate = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});
const longDate = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});
const plural = new Intl.PluralRules(LOCALE);

const DISPLAY_DATE = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

const pad = (value: number) => String(value).padStart(2, '0');
const toIso = (year: number, month: number, day: number): IsoDate =>
  `${year}-${pad(month)}-${pad(day)}`;
const utcDate = (date: IsoDate) => new Date(`${date}T00:00:00.000Z`);

// E-10: la fecha local del navegador (no la de toISOString, que es UTC).
export function todayLocal(now: Date = new Date()): IsoDate {
  return toIso(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

// D-17: «d/m/aaaa» con uno o dos dígitos en el día y el mes y el año en cuatro cifras. Vacío → null.
export function parseDisplayDate(text: string): IsoDate | null | 'invalid' {
  const trimmed = text.trim();
  if (trimmed === '') return null;
  const match = DISPLAY_DATE.exec(trimmed);
  if (!match) return 'invalid';
  const [day, month, year] = match.slice(1).map(Number) as [number, number, number];
  const date = new Date(Date.UTC(year, month - 1, day));
  // RF-017: 31/02 pasaría a 03/03; si cambia algún campo, el día no existe.
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  )
    return 'invalid';
  return toIso(year, month, day);
}

// D-17: como se escribe en el campo, '14/11/2026'.
export function formatDisplayDate(date: IsoDate): string {
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
}

// D-18: tarjeta y aviso de retrasada, sin año si es del año en curso.
export function formatShortDate(date: IsoDate, today: IsoDate): string {
  const sameYear = date.slice(0, 4) === today.slice(0, 4);
  return (sameYear ? shortDate : longDate).format(utcDate(date));
}

// RF-032: no está en Done y su fin estimado es anterior a hoy (las ISO se comparan como texto).
export function isOverdue(task: Task, today: IsoDate): boolean {
  return task.status !== 'done' && task.estimatedEndDate !== null && task.estimatedEndDate < today;
}

// RF-003, E-19: «1 tarea», «6 tareas».
export function tasksCount(count: number): string {
  return `${count} ${plural.select(count) === 'one' ? 'tarea' : 'tareas'}`;
}
