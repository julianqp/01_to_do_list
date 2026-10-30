import type { Task, TaskStatus } from '@todo/shared';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Board } from './Board';
import { mockBrowser, renderWithClient, taskFixture } from './test-utils';

mockBrowser();

const EMPTY = 'Todavía no tienes tareas. Crea la primera y empieza a organizarte.';

const tasksIn = (entries: [string, TaskStatus][]): Task[] =>
  entries.map(([title, status]) => taskFixture({ title, status }));

// CA-1.1: 2 en Backlog, 1 en To do, 3 en In progress y 0 en Done, en el orden en que llegan.
const SIX = tasksIn([
  ['In progress uno', 'in_progress'],
  ['Backlog uno', 'backlog'],
  ['To do uno', 'todo'],
  ['In progress dos', 'in_progress'],
  ['Backlog dos', 'backlog'],
  ['In progress tres', 'in_progress'],
]);

const renderBoard = (tasks: Task[]) => renderWithClient(<Board tasks={tasks} />);
const titlesIn = (region: HTMLElement) =>
  within(region)
    .queryAllByRole('button')
    .map((card) => card.textContent);

describe('Board', () => {
  it('CA-1.1 RF-003 RF-037 D-11 X-1 <h1> «Tablero» en display y el recuento «6 tareas» en --text-2', () => {
    renderBoard(SIX);

    const title = screen.getByRole('heading', { level: 1 });
    expect(title.textContent).toBe('Tablero');
    expect(title.classList).toContain('text-display');
    expect(screen.getByText('6 tareas').classList).toContain('text-2');
    expect(screen.getByRole('button', { name: 'Crear tarea' })).toBeDefined();
  });

  it('E-19 RF-003 con una tarea, «1 tarea»', () => {
    renderBoard(tasksIn([['Preparar la demo', 'todo']]));

    expect(screen.getByText('1 tarea')).toBeDefined();
  });

  it('CA-1.1 RF-001 cuatro columnas en orden, con sus recuentos', () => {
    renderBoard(SIX);

    expect(
      screen.getAllByRole('region').map((region) => region.getAttribute('aria-label')),
    ).toEqual(['Backlog, 2 tareas', 'To do, 1 tarea', 'In progress, 3 tareas', 'Done, 0 tareas']);
  });

  it('CA-1.8 RF-002 cada columna tiene las tareas de su estado, en el orden recibido', () => {
    renderBoard(SIX);
    const [backlog, todo, inProgress, done] = screen.getAllByRole('region');

    expect(titlesIn(backlog!)).toEqual(['Backlog uno', 'Backlog dos']);
    expect(titlesIn(todo!)).toEqual(['To do uno']);
    expect(titlesIn(inProgress!)).toEqual([
      'In progress uno',
      'In progress dos',
      'In progress tres',
    ]);
    expect(titlesIn(done!)).toEqual([]);
  });

  it('CA-1.3 E-1 RF-006 X-8 sin tareas: el estado vacío con su «Crear tarea», sin columnas ni otro primario', () => {
    renderBoard([]);

    expect(screen.getByText(EMPTY)).toBeDefined();
    expect(screen.queryAllByRole('region')).toEqual([]);
    expect(screen.queryByRole('radio')).toBeNull();
    const buttons = screen.getAllByRole('button');
    expect(buttons.map((button) => button.textContent)).toEqual(['Crear tarea']);
    expect(screen.getByText(EMPTY).parentElement?.contains(buttons[0]!)).toBe(true);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Tablero');
  });

  it('CA-7.1 RF-034 D-15 el selector de columna (md:hidden) con «Estado · n»; empieza en Backlog', () => {
    renderBoard(SIX);

    const picker = screen.getByRole('group', { name: 'Columna' });
    expect(picker.closest('.md\\:hidden')).not.toBeNull();
    expect(
      within(picker)
        .getAllByRole('radio')
        .map((radio) => radio.closest('label')?.textContent),
    ).toEqual(['Backlog · 2', 'To do · 1', 'In progress · 3', 'Done · 0']);
    expect(screen.getByRole('radio', { name: 'Backlog · 2' })).toHaveProperty('checked', true);
    const hidden = screen
      .getAllByRole('region')
      .map((region) => region.classList.contains('max-md:hidden'));
    expect(hidden).toEqual([false, true, true, true]);
  });

  it('CA-7.1 RF-034 elegir otra columna cambia cuál se ve en móvil', async () => {
    renderBoard(SIX);

    await userEvent.setup().click(screen.getByRole('radio', { name: 'Done · 0' }));

    const hidden = screen
      .getAllByRole('region')
      .map((region) => region.classList.contains('max-md:hidden'));
    expect(hidden).toEqual([true, true, true, false]);
  });

  it('D-20 la zona de alerta del tablero existe desde el principio y está vacía', () => {
    renderBoard(SIX);

    const alert = screen.getByRole('alert');
    expect(alert.textContent).toBe('');
  });

  it('RNF-002 D-16 columnas por ancho con las utilidades de global.css y scroll horizontal dentro del tablero', () => {
    renderBoard(SIX);

    const grid = screen.getAllByRole('region')[0]!.parentElement!;
    expect(grid.classList).toContain('md:board-columns-two');
    expect(grid.classList).toContain('lg:board-columns');
    expect(grid.classList).toContain('md:overflow-x-auto');
  });

  it('RF-036 D-16 por debajo de 768 px, «Crear tarea» va fijo abajo', () => {
    renderBoard(SIX);

    const wrapper = screen.getByRole('button', { name: 'Crear tarea' }).parentElement!;
    expect(wrapper.classList).toContain('max-md:fixed');
    expect(wrapper.classList).toContain('max-md:bottom-4');
  });
});
