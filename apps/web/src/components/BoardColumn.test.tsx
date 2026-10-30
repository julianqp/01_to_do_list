import type { TaskStatus } from '@todo/shared';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BoardColumn } from './BoardColumn';
import { taskFixture } from './test-utils';

afterEach(cleanup);

const TODAY = '2026-10-29';

function renderColumn(
  status: TaskStatus,
  titles: string[],
  { hiddenOnMobile = false, onOpen = vi.fn() } = {},
) {
  const tasks = titles.map((title) => taskFixture({ title, status }));
  render(
    <BoardColumn
      status={status}
      tasks={tasks}
      today={TODAY}
      hiddenOnMobile={hiddenOnMobile}
      onOpen={onOpen}
    />,
  );
  return { tasks, onOpen };
}

describe('BoardColumn', () => {
  it('CA-1.7 RF-009 D-11 es una <section> con nombre «In progress, 3 tareas»', () => {
    renderColumn('in_progress', ['Uno', 'Dos', 'Tres']);

    const region = screen.getByRole('region', { name: 'In progress, 3 tareas' });
    expect(region.tagName).toBe('SECTION');
  });

  it('RF-009 E-19 con una tarea, «To do, 1 tarea»', () => {
    renderColumn('todo', ['Uno']);

    expect(screen.getByRole('region', { name: 'To do, 1 tarea' })).toBeDefined();
  });

  it('RF-003 D-11 X-3 la cabecera es un <h2> con el icono del estado en --text-2, el nombre y «· 3»', () => {
    renderColumn('in_progress', ['Uno', 'Dos', 'Tres']);

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading.textContent).toBe('In progress · 3');
    expect(heading.classList).toContain('text-h3');
    const icon = heading.querySelector('svg')!;
    expect(icon.getAttribute('aria-hidden')).toBe('true');
    expect(icon.closest('.text-2')).not.toBeNull();
  });

  it('RF-002 las tarjetas van en una lista <ul>, en el orden recibido', async () => {
    const { tasks, onOpen } = renderColumn('backlog', ['Preparar la demo', 'Comprar pan']);

    const list = screen.getByRole('list');
    const cards = within(list).getAllByRole('button');
    expect(list.tagName).toBe('UL');
    expect(cards.map((card) => card.textContent)).toEqual(['Preparar la demo', 'Comprar pan']);

    await userEvent.setup().click(cards[1]!);
    expect(onOpen).toHaveBeenCalledWith(tasks[1]);
  });

  it.each([
    ['backlog', 'Backlog', 'Nada en el backlog'],
    ['todo', 'To do', 'Nada por hacer'],
    ['in_progress', 'In progress', 'Nada en curso'],
    ['done', 'Done', 'Nada terminado todavía'],
  ] as const)(
    'CA-1.2 RF-005 X-1 vacía (%s): «%s · 0» y un hueco con «%s» en --text-2',
    (status, name, phrase) => {
      renderColumn(status, []);

      expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(`${name} · 0`);
      const slot = screen.getByText(phrase);
      expect(slot.classList).toContain('text-2');
      expect(slot.closest('.bg-sunken')).not.toBeNull();
      expect(screen.queryByRole('list')).toBeNull();
    },
  );

  it('RF-034 D-16 hiddenOnMobile → max-md:hidden', () => {
    renderColumn('done', [], { hiddenOnMobile: true });
    expect(screen.getByRole('region').classList).toContain('max-md:hidden');
    cleanup();

    renderColumn('done', [], { hiddenOnMobile: false });
    expect(screen.getByRole('region').classList).not.toContain('max-md:hidden');
  });

  it('E-2 RF-035 D-16 desde 768 px la lista hace scroll por su cuenta y la cabecera queda fuera de ella', () => {
    renderColumn('backlog', ['Uno']);

    const list = screen.getByRole('list');
    expect(list.classList).toContain('md:overflow-y-auto');
    expect(list.contains(screen.getByRole('heading', { level: 2 }))).toBe(false);
  });
});
