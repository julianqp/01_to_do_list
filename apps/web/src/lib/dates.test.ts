import type { Task } from '@todo/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  formatDisplayDate,
  formatLongDate,
  formatShortDate,
  isOverdue,
  parseDisplayDate,
  tasksCount,
  todayLocal,
} from './dates';

const TODAY = '2026-10-29';

const task = (overrides: Partial<Task> = {}): Task => ({
  id: 't1',
  title: 'Preparar la demo',
  description: '',
  status: 'in_progress',
  estimatedStartDate: null,
  estimatedEndDate: null,
  actualEndDate: null,
  ...overrides,
});

const originalTz = process.env.TZ;

afterEach(() => {
  vi.useRealTimers();
  process.env.TZ = originalTz;
});

describe('parseDisplayDate', () => {
  it.each([
    ['14/11/2026', '2026-11-14'],
    ['1/2/2026', '2026-02-01'],
    ['29/02/2028', '2028-02-29'],
    [' 14/11/2026 ', '2026-11-14'],
  ])('RF-017 D-17 lee «%s» como %s', (text, iso) => {
    expect(parseDisplayDate(text)).toBe(iso);
  });

  it.each(['', '   '])('RF-017 un campo vacío (%j) es null', (text) => {
    expect(parseDisplayDate(text)).toBeNull();
  });

  it.each([
    '31/02/2026',
    '29/02/2026',
    '2026-11-14',
    '14/11/26',
    '14-11-2026',
    '0/11/2026',
    'mañana',
  ])('CA-2.6 E-7 RF-017 «%s» no es una fecha válida', (text) => {
    expect(parseDisplayDate(text)).toBe('invalid');
  });
});

describe('formatDisplayDate', () => {
  it('D-17 escribe la fecha como en el campo, con dos cifras en el día y el mes', () => {
    expect(formatDisplayDate('2026-02-01')).toBe('01/02/2026');
    expect(formatDisplayDate('2026-11-14')).toBe('14/11/2026');
  });
});

describe('formatShortDate', () => {
  it('CA-1.5 RF-007 D-18 sin año si la fecha es del año en curso', () => {
    expect(formatShortDate('2026-11-14', TODAY)).toBe('14 nov');
    expect(formatShortDate('2026-10-28', TODAY)).toBe('28 oct');
  });

  it('RF-007 D-18 con año si la fecha es de otro año', () => {
    expect(formatShortDate('2027-11-14', TODAY)).toBe('14 nov 2027');
    expect(formatShortDate('2025-01-14', TODAY)).toBe('14 ene 2025');
  });

  it('D-18 R-3 septiembre sale «sept», la salida de Intl', () => {
    expect(formatShortDate('2026-09-14', TODAY)).toBe('14 sept');
  });

  it('C-11 no cambia de día con la zona horaria del navegador', () => {
    process.env.TZ = 'America/Los_Angeles';
    expect(formatShortDate('2026-11-14', TODAY)).toBe('14 nov');
    process.env.TZ = 'Pacific/Kiritimati';
    expect(formatShortDate('2026-11-14', TODAY)).toBe('14 nov');
  });
});

describe('formatLongDate', () => {
  it('D-18 siempre con año (detalle)', () => {
    expect(formatLongDate('2026-10-28')).toBe('28 oct 2026');
  });
});

describe('todayLocal', () => {
  it('E-10 R-3 es la fecha local del navegador, no la UTC', () => {
    // 28/10 a las 10:30 UTC = 29/10 a las 00:30 en Kiritimati (UTC + 14).
    process.env.TZ = 'Pacific/Kiritimati';
    const now = new Date('2026-10-28T10:30:00.000Z');

    expect(now.toISOString().slice(0, 10)).toBe('2026-10-28');
    expect(todayLocal(now)).toBe('2026-10-29');
  });

  it('E-11 usa la hora actual si no se le pasa ninguna', () => {
    process.env.TZ = 'Europe/Madrid';
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-29T10:00:00.000Z'));
    expect(todayLocal()).toBe('2026-10-29');

    vi.setSystemTime(new Date('2026-10-30T10:00:00.000Z'));
    expect(todayLocal()).toBe('2026-10-30');
  });
});

describe('isOverdue', () => {
  it('CA-6.1 RF-032 con el fin estimado de ayer, sí', () => {
    expect(isOverdue(task({ estimatedEndDate: '2026-10-28' }), TODAY)).toBe(true);
  });

  it('CA-6.3 RF-032 con el fin estimado de hoy, no', () => {
    expect(isOverdue(task({ status: 'todo', estimatedEndDate: TODAY }), TODAY)).toBe(false);
  });

  it('CA-6.4 RF-032 en Done, no', () => {
    expect(
      isOverdue(
        task({ status: 'done', estimatedEndDate: '2026-10-01', actualEndDate: '2026-10-29' }),
        TODAY,
      ),
    ).toBe(false);
  });

  it('CA-6.5 RF-032 sin fecha estimada de fin, no', () => {
    expect(isOverdue(task({ estimatedStartDate: '2026-10-01' }), TODAY)).toBe(false);
  });

  it('E-10 E-11 al cambiar la hora simulada, cambia el resultado', () => {
    process.env.TZ = 'Europe/Madrid';
    vi.useFakeTimers();
    const late = task({ estimatedEndDate: '2026-10-28' });

    vi.setSystemTime(new Date('2026-10-28T12:00:00.000Z'));
    expect(isOverdue(late, todayLocal())).toBe(false);

    vi.setSystemTime(new Date('2026-10-28T23:30:00.000Z')); // 00:30 del 29 en Madrid
    expect(isOverdue(late, todayLocal())).toBe(true);
  });
});

describe('tasksCount', () => {
  it.each([
    [0, '0 tareas'],
    [1, '1 tarea'],
    [6, '6 tareas'],
  ])('RF-003 E-19 %i → «%s»', (count, text) => {
    expect(tasksCount(count)).toBe(text);
  });
});
