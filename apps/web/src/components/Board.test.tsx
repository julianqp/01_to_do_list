import {
  actualEndDateAfterMove,
  type MoveTaskInput,
  type Task,
  type TaskStatus,
} from '@todo/shared';
import { onlineManager } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { placeTask } from '../lib/board-order';
import { useTasks } from '../lib/task-queries';
import { Board } from './Board';
import { apiError, json, mockBrowser, renderWithClient, taskFixture } from './test-utils';
import { withQueryClient } from './withQueryClient';

const browser = mockBrowser();

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
// 003/D-16: cada tarjeta tiene dos botones; aquí, los de abrir.
const titlesIn = (region: HTMLElement) =>
  within(region)
    .queryAllByRole('button')
    .filter((button) => button.dataset.taskId)
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

// --- Spec 003: mover con teclado (plan §7). jsdom no calcula posiciones: el arrastre va en E2E. ---

// El tablero con la lista de verdad: la actualización optimista va en la caché (D-12).
function LiveBoard() {
  const tasks = useTasks({ enabled: true });
  return tasks.data ? <Board tasks={tasks.data} /> : null;
}

// Un servidor de mentira: la lista y `POST …/move` sobre ella, como la API (D-3, D-4).
function serve(initial: Task[]) {
  let server = initial;
  browser.routes['GET /api/tasks'] = () => json(200, { tasks: server });
  for (const { id } of initial) {
    browser.routes[`POST /api/tasks/${id}/move`] = () => {
      const { status, index, today } = JSON.parse(
        String(browser.fetch.mock.lastCall![1]!.body),
      ) as MoveTaskInput;
      const task = server.find((candidate) => candidate.id === id)!;
      const moved = { ...task, actualEndDate: actualEndDateAfterMove(task, status, today) };
      server = placeTask(server, moved, { status, index });
      return json(200, { task: { ...moved, status } });
    };
  }
}

const boardTasks = () =>
  tasksIn([
    ['Primera de Backlog', 'backlog'],
    ['Comprar pan', 'todo'],
    ['Preparar la demo', 'todo'],
    ['Llamar al banco', 'todo'],
    ['Revisar el correo', 'in_progress'],
    ['Escribir el informe', 'in_progress'],
    ['Pagar el alquiler', 'in_progress'],
  ]);

const live = () => document.querySelector('p[aria-live="assertive"]')!.textContent;
const column = (name: string) => screen.getByRole('region', { name: new RegExp(`^${name},`) });
const titles = (name: string) => titlesIn(column(name));
const handleOf = (title: string) => screen.getByRole('button', { name: `Mover «${title}»` });
const movesOf = (tasks: Task[]) =>
  tasks.flatMap(({ id }) => browser.callsTo('POST', `/api/tasks/${id}/move`));

const PICKED =
  'Has cogido «Preparar la demo». To do, posición 2 de 3. Usa las flechas para moverla, Espacio para soltarla y Esc para cancelar.';
const CANCELLED = 'Movimiento cancelado. «Preparar la demo» sigue en To do, posición 2 de 3.';

// Tablero listo, con «Preparar la demo» (u otra) con el foco en el asa.
async function renderLive(tasks = boardTasks(), title = 'Preparar la demo') {
  serve(tasks);
  renderWithClient(<LiveBoard />);
  const handle = await screen.findByRole('button', { name: `Mover «${title}»` });
  handle.focus();
  return { handle, tasks, user: userEvent.setup() };
}

describe('Board · mover con teclado', () => {
  it('003 RF-013 la región viva está siempre presente, vacía y con aria-atomic', async () => {
    await renderLive();

    const region = document.querySelector('p[aria-live="assertive"]')!;
    expect(region.classList).toContain('sr-only');
    expect(region.getAttribute('aria-atomic')).toBe('true');
    expect(region.textContent).toBe('');
  });

  it.each([
    ['Espacio', ' '],
    ['Enter', '{Enter}'],
  ])(
    '003 CA-3.2 RF-013 %s en el asa coge la tarjeta, que se levanta, y lo anuncia',
    async (_name, key) => {
      const { handle, user } = await renderLive();

      await user.keyboard(key);

      expect(live()).toBe(PICKED);
      expect(handle.parentElement!.className).toContain('shadow-(--shadow-float)');
      expect(document.activeElement).toBe(handle);
    },
  );

  it('003 CA-3.3 RF-014 Flecha arriba la sube una posición y lo anuncia', async () => {
    const { handle, user } = await renderLive();

    await user.keyboard(' {ArrowUp}');

    expect(titles('To do')).toEqual(['Preparar la demo', 'Comprar pan', 'Llamar al banco']);
    expect(live()).toBe('To do, posición 1 de 3.');
    expect(document.activeElement).toBe(handle);
  });

  it('003 RF-014 Flecha abajo la baja una posición', async () => {
    const { user } = await renderLive();

    await user.keyboard(' {ArrowDown}');

    expect(titles('To do')).toEqual(['Comprar pan', 'Llamar al banco', 'Preparar la demo']);
    expect(live()).toBe('To do, posición 3 de 3.');
  });

  it('003 CA-3.4 RF-014 Flecha derecha la pasa a la primera de In progress y lo anuncia, con el foco en su asa', async () => {
    const { user } = await renderLive();

    await user.keyboard(' {ArrowRight}');

    expect(titles('In progress')[0]).toBe('Preparar la demo');
    expect(titles('To do')).toEqual(['Comprar pan', 'Llamar al banco']);
    expect(live()).toBe('In progress, posición 1 de 4.');
    expect(document.activeElement).toBe(handleOf('Preparar la demo'));
    expect(column('In progress').getAttribute('aria-label')).toBe('In progress, 4 tareas');
  });

  it('003 RF-014 Flecha izquierda la pasa a la primera de Backlog', async () => {
    const { user } = await renderLive();

    await user.keyboard(' {ArrowLeft}');

    expect(titles('Backlog')).toEqual(['Preparar la demo', 'Primera de Backlog']);
    expect(live()).toBe('Backlog, posición 1 de 2.');
  });

  it('003 RF-014 las flechas no hacen scroll de la página (preventDefault), solo con la tarjeta cogida', async () => {
    const { handle, user } = await renderLive();

    // fireEvent devuelve false si se llamó a preventDefault.
    expect(fireEvent.keyDown(handle, { key: 'ArrowDown' })).toBe(true);
    await user.keyboard(' ');
    expect(fireEvent.keyDown(handleOf('Preparar la demo'), { key: 'ArrowDown' })).toBe(false);
  });

  it('003 CA-3.7 RF-015 en el borde no se mueve ni se anuncia', async () => {
    const { user } = await renderLive(boardTasks(), 'Primera de Backlog');

    await user.keyboard(' ');
    const picked = live();
    await user.keyboard('{ArrowUp}{ArrowLeft}');

    expect(titles('Backlog')).toEqual(['Primera de Backlog']);
    expect(live()).toBe(picked);
  });

  it('003 CA-3.5 RF-016 RF-001 Espacio la suelta: guarda, deja el foco en su asa, lo anuncia y cambian los recuentos', async () => {
    const { tasks, user } = await renderLive();

    await user.keyboard(' {ArrowRight} ');

    expect(live()).toBe('Has soltado «Preparar la demo» en In progress, posición 1 de 4.');
    const demo = tasks[2]!;
    await waitFor(() => expect(movesOf(tasks)).toHaveLength(1));
    const [, init] = browser.callsTo('POST', `/api/tasks/${demo.id}/move`)[0]!;
    expect(JSON.parse(String(init!.body))).toEqual({
      status: 'in_progress',
      index: 0,
      today: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    });
    await waitFor(() => expect(browser.callsTo('GET', '/api/tasks')).toHaveLength(2));
    await waitFor(() =>
      expect(column('In progress').getAttribute('aria-label')).toBe('In progress, 4 tareas'),
    );
    expect(column('To do').getAttribute('aria-label')).toBe('To do, 2 tareas');
    expect(titles('In progress')[0]).toBe('Preparar la demo');
    expect(document.activeElement).toBe(handleOf('Preparar la demo'));
    expect(handleOf('Preparar la demo').parentElement!.className).not.toContain('--shadow-float');
  });

  it('003 RF-016 Enter también la suelta', async () => {
    const { tasks, user } = await renderLive();

    await user.keyboard('{Enter}{ArrowUp}{Enter}');

    await waitFor(() => expect(movesOf(tasks)).toHaveLength(1));
    expect(live()).toBe('Has soltado «Preparar la demo» en To do, posición 1 de 3.');
  });

  it('003 RF-007 soltar en otra posición de la misma columna guarda ese sitio', async () => {
    const { tasks, user } = await renderLive();

    await user.keyboard(' {ArrowDown} ');

    await waitFor(() => expect(movesOf(tasks)).toHaveLength(1));
    const [, init] = movesOf(tasks)[0]!;
    expect(JSON.parse(String(init!.body))).toMatchObject({ status: 'todo', index: 2 });
    await waitFor(() => expect(browser.callsTo('GET', '/api/tasks')).toHaveLength(2));
    expect(titles('To do')).toEqual(['Comprar pan', 'Llamar al banco', 'Preparar la demo']);
  });

  it('003 CA-3.6 RF-017 Esc la devuelve, sin petición, con el foco en el asa y el anuncio', async () => {
    const { tasks, user } = await renderLive();

    await user.keyboard(' {ArrowRight}{Escape}');

    expect(live()).toBe(CANCELLED);
    expect(titles('To do')).toEqual(['Comprar pan', 'Preparar la demo', 'Llamar al banco']);
    expect(titles('In progress')).not.toContain('Preparar la demo');
    expect(document.activeElement).toBe(handleOf('Preparar la demo'));
    expect(movesOf(tasks)).toEqual([]);
  });

  it('003 RF-017 D-24 con la tarjeta cogida, un clic de puntero en su asa abre el detalle con la tarea real, sin guardar, y cancela', async () => {
    const { tasks, user } = await renderLive();

    await user.keyboard(' {ArrowRight}');
    expect(titles('In progress')[0]).toBe('Preparar la demo');
    fireEvent.click(handleOf('Preparar la demo'), { detail: 1 });

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole<HTMLInputElement>('radio', { name: 'To do' }).checked).toBe(
      true,
    );
    await waitFor(() => expect(live()).toBe(CANCELLED));
    expect(titles('To do')).toEqual(['Comprar pan', 'Preparar la demo', 'Llamar al banco']);
    expect(movesOf(tasks)).toHaveLength(0);
  });

  // fireEvent devuelve false si se llamó a preventDefault.
  it('003 RF-017 D-24 pulsar el ratón en el asa solo se impide con esa tarjeta cogida con teclado: WebKit le quitaría el foco y dnd-kit no arrancaría con las demás', async () => {
    const { handle, user } = await renderLive();

    expect(fireEvent.mouseDown(handle)).toBe(true);
    await user.keyboard(' ');
    expect(fireEvent.mouseDown(handle)).toBe(false);
    expect(fireEvent.mouseDown(handleOf('Comprar pan'))).toBe(true);
    await user.keyboard('{Escape}');
    expect(fireEvent.mouseDown(handle)).toBe(true);
  });

  it('003 RF-017 que el foco salga del asa también cancela', async () => {
    const { tasks, user } = await renderLive();

    await user.keyboard(' {ArrowRight}');
    expect(titles('In progress')[0]).toBe('Preparar la demo');
    await user.tab();

    await waitFor(() => expect(live()).toBe(CANCELLED));
    expect(titles('To do')).toEqual(['Comprar pan', 'Preparar la demo', 'Llamar al banco']);
    expect(document.activeElement).not.toBe(handleOf('Preparar la demo'));
    expect(movesOf(tasks)).toEqual([]);
  });

  it('003 CA-2.5 RF-011 E-3 coger y soltar sin mover: ninguna petición', async () => {
    const { tasks, user } = await renderLive();

    await user.keyboard('  ');

    expect(live()).toBe('Has soltado «Preparar la demo» en To do, posición 2 de 3.');
    expect(movesOf(tasks)).toEqual([]);
  });

  it('003 E-2 mover la única tarjeta de To do: aparece «Nada por hacer»', async () => {
    const tasks = tasksIn([['Preparar la demo', 'todo']]);
    const { user } = await renderLive(tasks);
    expect(column('To do').textContent).not.toContain('Nada por hacer');

    await user.keyboard(' {ArrowRight}');

    expect(column('To do').textContent).toContain('Nada por hacer');
    expect(titles('In progress')).toEqual(['Preparar la demo']);
  });

  it('003 D-7 si la tarea desaparece de la lista estando cogida, se suelta sin anuncio', async () => {
    const tasks = boardTasks();
    function Host() {
      const [list, setList] = useState(tasks);
      return (
        <>
          <button
            onClick={() => setList(tasks.filter(({ title }) => title !== 'Preparar la demo'))}
          >
            Quitar
          </button>
          <button onClick={() => setList([...tasks])}>Reponer</button>
          <Board tasks={list} />
        </>
      );
    }
    renderWithClient(<Host />);
    const user = userEvent.setup();
    handleOf('Preparar la demo').focus();
    await user.keyboard(' ');
    expect(live()).toBe(PICKED);

    fireEvent.click(screen.getByRole('button', { name: 'Quitar' }));
    expect(screen.queryByRole('button', { name: 'Mover «Preparar la demo»' })).toBeNull();
    expect(live()).toBe(PICKED);

    fireEvent.click(screen.getByRole('button', { name: 'Reponer' }));
    expect(handleOf('Preparar la demo').parentElement!.className).not.toContain('--shadow-float');
  });

  it('003 C-4 D-8 en pleno movimiento, la vista previa y el anuncio de soltar usan el título que llega en la lista', async () => {
    const tasks = boardTasks();
    const renamed = tasks.map((task) =>
      task.title === 'Preparar la demo' ? { ...task, title: 'Demo renombrada' } : task,
    );
    function Host() {
      const [list, setList] = useState(tasks);
      return (
        <>
          <button onClick={() => setList(renamed)}>Renombrar</button>
          <Board tasks={list} />
        </>
      );
    }
    serve(tasks);
    renderWithClient(<Host />);
    const user = userEvent.setup();
    handleOf('Preparar la demo').focus();
    await user.keyboard(' {ArrowRight}');

    fireEvent.click(screen.getByRole('button', { name: 'Renombrar' }));
    expect(titles('In progress')[0]).toBe('Demo renombrada');

    await user.keyboard(' ');
    expect(live()).toBe('Has soltado «Demo renombrada» en In progress, posición 1 de 4.');
    await waitFor(() => expect(movesOf(tasks)).toHaveLength(1));
  });
});

const MOVE_ERROR = 'No hemos podido mover la tarea. Revisa tu conexión e inténtalo de nuevo.';
const TODO_ORDER = ['Comprar pan', 'Preparar la demo', 'Llamar al banco'];

const notice = () => screen.getByRole('alert').querySelector('[data-tone]');
const failWith = (tasks: Task[], title: string, handler: () => Promise<Response>) => {
  browser.routes[`POST /api/tasks/${tasks.find((task) => task.title === title)!.id}/move`] =
    handler;
};

describe('Board · guardar el movimiento', () => {
  const originalTz = process.env.TZ;

  afterEach(() => {
    vi.useRealTimers();
    process.env.TZ = originalTz;
    onlineManager.setOnline(true);
  });

  // Solo se finge la fecha: con los temporizadores falsos, user-event y waitFor se quedarían esperando.
  const atDate = (iso: string) => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(iso));
  };

  it('003 CA-1.4 RF-003 E-13 una retrasada de In progress soltada en Done pierde «Retrasada» y muestra la fecha de hoy, sin abrir el detalle', async () => {
    atDate('2026-10-31T10:00:00.000Z');
    const tasks = [
      taskFixture({
        title: 'Preparar la demo',
        status: 'in_progress',
        estimatedEndDate: '2026-10-28',
      }),
    ];
    const { user } = await renderLive(tasks);
    expect(column('In progress').textContent).toContain('Retrasada');

    await user.keyboard(' {ArrowRight} ');

    await waitFor(() => expect(column('Done').textContent).toContain('31 oct'));
    expect(column('Done').textContent).not.toContain('Retrasada');
    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => expect(browser.callsTo('GET', '/api/tasks')).toHaveLength(2));
    expect(column('Done').textContent).toContain('31 oct');
  });

  it('003 CA-1.5 RF-004 de Done a To do se queda sin fecha real de fin', async () => {
    atDate('2026-10-31T10:00:00.000Z');
    const tasks = [
      taskFixture({ title: 'Preparar la demo', status: 'done', actualEndDate: '2026-10-27' }),
    ];
    const { user } = await renderLive(tasks);
    expect(column('Done').textContent).toContain('27 oct');

    await user.keyboard(' {ArrowLeft}{ArrowLeft}{Enter}');

    await waitFor(() => expect(titles('To do')).toEqual(['Preparar la demo']));
    expect(column('To do').textContent).not.toContain('27 oct');
    expect(column('To do').textContent).not.toContain('Fecha real de fin');
  });

  it('003 E-14 sacar de Done una tarea con el fin estimado pasado: vuelve «Retrasada»', async () => {
    atDate('2026-10-31T10:00:00.000Z');
    const tasks = [
      taskFixture({
        title: 'Preparar la demo',
        status: 'done',
        estimatedEndDate: '2026-10-28',
        actualEndDate: '2026-10-27',
      }),
    ];
    const { user } = await renderLive(tasks);
    expect(column('Done').textContent).not.toContain('Retrasada');

    await user.keyboard(' {ArrowLeft} ');

    await waitFor(() => expect(column('In progress').textContent).toContain('Retrasada'));
  });

  it('003 E-16 con TZ=Europe/Madrid a las 00:30 del 01/11/2026, la petición lleva hoy 2026-11-01', async () => {
    process.env.TZ = 'Europe/Madrid';
    atDate('2026-10-31T23:30:00.000Z');
    const tasks = [taskFixture({ title: 'Preparar la demo', status: 'in_progress' })];
    const { user } = await renderLive(tasks);

    await user.keyboard(' {ArrowRight} ');

    await waitFor(() => expect(movesOf(tasks)).toHaveLength(1));
    expect(JSON.parse(String(movesOf(tasks)[0]![1]!.body))).toMatchObject({
      status: 'done',
      today: '2026-11-01',
    });
  });

  it.each([
    ['NetworkError', () => Promise.reject(new TypeError('Failed to fetch'))],
    ['un 500', () => Promise.resolve(new Response('', { status: 500 }))],
  ])(
    '003 CA-1.9 RF-021 E-7 con %s, la tarjeta vuelve a su posición con los recuentos de antes y sale el aviso',
    async (_name, handler) => {
      const tasks = boardTasks();
      const { user } = await renderLive(tasks);
      failWith(tasks, 'Preparar la demo', handler);

      await user.keyboard(' {ArrowRight} ');

      await waitFor(() => expect(notice()?.textContent).toBe(MOVE_ERROR));
      expect(notice()?.getAttribute('data-tone')).toBe('offline');
      expect(titles('To do')).toEqual(TODO_ORDER);
      expect(titles('In progress')).not.toContain('Preparar la demo');
      expect(column('To do').getAttribute('aria-label')).toBe('To do, 3 tareas');
      expect(column('In progress').getAttribute('aria-label')).toBe('In progress, 3 tareas');
      // RF-016: el foco sigue en su asa también cuando vuelve a su sitio.
      expect(document.activeElement).toBe(handleOf('Preparar la demo'));
    },
  );

  it('003 RF-021 D-18 al fallar, vuelve a su sitio sin esperar a que se vuelva a pedir la lista', async () => {
    const tasks = boardTasks();
    const { user } = await renderLive(tasks);
    let failMove!: (error: Error) => void;
    failWith(
      tasks,
      'Preparar la demo',
      () =>
        new Promise<Response>((_resolve, reject) => {
          failMove = reject;
        }),
    );

    await user.keyboard(' {ArrowRight} ');
    await waitFor(() => expect(movesOf(tasks)).toHaveLength(1));
    // Ya ha llegado la actualización optimista, y la lista no vuelve hasta que el test lo diga.
    await waitFor(() => expect(column('In progress').getAttribute('aria-label')).toContain('4'));
    let serveList!: (response: Response) => void;
    browser.routes['GET /api/tasks'] = () =>
      new Promise<Response>((resolve) => {
        serveList = resolve;
      });

    failMove(new TypeError('Failed to fetch'));

    await waitFor(() => expect(browser.callsTo('GET', '/api/tasks').length).toBeGreaterThan(1));
    await waitFor(() => expect(titles('To do')).toEqual(TODO_ORDER));
    expect(titles('In progress')).not.toContain('Preparar la demo');

    serveList(await json(200, { tasks }));
    await waitFor(() => expect(notice()?.textContent).toBe(MOVE_ERROR));
  });

  it('003 E-7 D-19 sin conexión de verdad (la mutación no se queda en pausa): vuelve y avisa', async () => {
    const tasks = boardTasks();
    const { user } = await renderLive(tasks);
    failWith(tasks, 'Preparar la demo', () => Promise.reject(new TypeError('Failed to fetch')));
    onlineManager.setOnline(false);

    await user.keyboard(' {ArrowRight} ');

    await waitFor(() => expect(notice()?.textContent).toBe(MOVE_ERROR));
    expect(titles('To do')).toEqual(TODO_ORDER);
  });

  it('003 CA-2.6 RF-021 lo mismo al reordenar dentro de una columna', async () => {
    const tasks = boardTasks();
    const { user } = await renderLive(tasks);
    failWith(tasks, 'Preparar la demo', () => Promise.reject(new TypeError('Failed to fetch')));

    await user.keyboard(' {ArrowUp} ');

    await waitFor(() => expect(notice()?.textContent).toBe(MOVE_ERROR));
    expect(titles('To do')).toEqual(TODO_ORDER);
    expect(column('To do').getAttribute('aria-label')).toBe('To do, 3 tareas');
  });

  it('003 CA-1.10 RF-022 E-9 con 404 TASK_NOT_FOUND: «Esta tarea ya no existe.» y la tarjeta desaparece', async () => {
    const tasks = boardTasks();
    const { user } = await renderLive(tasks);
    failWith(tasks, 'Preparar la demo', () => {
      browser.routes['GET /api/tasks'] = () =>
        json(200, { tasks: tasks.filter(({ title }) => title !== 'Preparar la demo') });
      return apiError(404, 'TASK_NOT_FOUND');
    });

    await user.keyboard(' {ArrowRight} ');

    await waitFor(() => expect(notice()?.textContent).toBe('Esta tarea ya no existe.'));
    expect(notice()?.getAttribute('data-tone')).toBe('info');
    expect(titles('To do')).toEqual(['Comprar pan', 'Llamar al banco']);
    expect(titles('In progress')).not.toContain('Preparar la demo');
  });

  const createTask = () => screen.getByRole('button', { name: 'Crear tarea' });

  it('003 CA-3.12 RF-022 con 404 al soltar con teclado, el foco acaba en «Crear tarea»', async () => {
    const tasks = boardTasks();
    const { user } = await renderLive(tasks);
    failWith(tasks, 'Preparar la demo', () => {
      browser.routes['GET /api/tasks'] = () =>
        json(200, { tasks: tasks.filter(({ title }) => title !== 'Preparar la demo') });
      return apiError(404, 'TASK_NOT_FOUND');
    });

    await user.keyboard(' {ArrowRight} ');

    await waitFor(() => expect(notice()?.textContent).toBe('Esta tarea ya no existe.'));
    await waitFor(() => expect(document.activeElement).toBe(createTask()));
  });

  it('003 CA-3.12 RF-022 si era la última tarea, el foco va al «Crear tarea» del estado vacío', async () => {
    const tasks = tasksIn([['Preparar la demo', 'todo']]);
    const { user } = await renderLive(tasks);
    failWith(tasks, 'Preparar la demo', () => {
      browser.routes['GET /api/tasks'] = () => json(200, { tasks: [] });
      return apiError(404, 'TASK_NOT_FOUND');
    });

    await user.keyboard(' {ArrowRight} ');

    await screen.findByText('Todavía no tienes tareas. Crea la primera y empieza a organizarte.');
    await waitFor(() => expect(document.activeElement).toBe(createTask()));
  });

  it('003 RF-022 D-26 si el foco ya salió del asa, no se mueve', async () => {
    const tasks = boardTasks();
    const { user } = await renderLive(tasks);
    let fail!: (response: Response) => void;
    failWith(
      tasks,
      'Preparar la demo',
      () =>
        new Promise<Response>((resolve) => {
          fail = resolve;
        }),
    );

    await user.keyboard(' {ArrowRight} ');
    await waitFor(() =>
      expect(browser.callsTo('POST', `/api/tasks/${tasks[2]!.id}/move`)).toHaveLength(1),
    );
    await user.tab();
    const elsewhere = document.activeElement;
    expect(elsewhere).not.toBe(handleOf('Preparar la demo'));

    fail(await apiError(404, 'TASK_NOT_FOUND'));

    await waitFor(() => expect(notice()?.textContent).toBe('Esta tarea ya no existe.'));
    await waitFor(() => expect(titles('In progress')).not.toContain('Preparar la demo'));
    expect(document.activeElement).toBe(elsewhere);
  });

  it('003 E-8 con 401 SESSION_EXPIRED va al inicio de sesión con el aviso, sin aviso en el tablero', async () => {
    const tasks = boardTasks();
    serve(tasks);
    failWith(tasks, 'Preparar la demo', () => apiError(401, 'SESSION_EXPIRED'));
    const Island = withQueryClient(LiveBoard, { requireSession: true });
    render(<Island />);
    const user = userEvent.setup();
    (await screen.findByRole('button', { name: 'Mover «Preparar la demo»' })).focus();

    await user.keyboard(' {ArrowRight} ');

    await waitFor(() => expect(browser.replace).toHaveBeenCalledWith('/login?expired=1'));
    expect(notice()).toBeNull();
  });

  it('003 E-12 si falla el primero de dos movimientos a la vez, también sale su aviso (no depende del último `mutate`)', async () => {
    const tasks = boardTasks();
    const { user } = await renderLive(tasks);
    let failFirst!: (error: Error) => void;
    failWith(
      tasks,
      'Preparar la demo',
      () =>
        new Promise<Response>((_resolve, reject) => {
          failFirst = reject;
        }),
    );

    await user.keyboard(' {ArrowRight} ');
    await waitFor(() =>
      expect(browser.callsTo('POST', `/api/tasks/${tasks[2]!.id}/move`)).toHaveLength(1),
    );
    handleOf('Comprar pan').focus();
    await user.keyboard(' {ArrowLeft} ');
    await waitFor(() =>
      expect(browser.callsTo('POST', `/api/tasks/${tasks[1]!.id}/move`)).toHaveLength(1),
    );

    failFirst(new TypeError('Failed to fetch'));

    await waitFor(() => expect(notice()?.textContent).toBe(MOVE_ERROR));
    expect(titles('To do')).toContain('Preparar la demo');
    expect(titles('Backlog')).toContain('Comprar pan');
  });
});

describe('Board · mover con teclado en móvil', () => {
  const picker = (name: string) =>
    screen.getByRole('radio', { name: new RegExp(`^${name} · \\d+$`) });
  const hiddenOnMobile = (name: string) => column(name).classList.contains('max-md:hidden');

  async function grabInTodo() {
    const { user, tasks } = await renderLive(boardTasks(), 'Preparar la demo');
    await user.click(picker('To do'));
    handleOf('Preparar la demo').focus();
    await user.keyboard(' ');
    expect(hiddenOnMobile('To do')).toBe(false);
    return { user, tasks };
  }

  it('003 CA-3.9 RF-023 con To do elegida, Flecha derecha marca In progress en el selector y la columna visible pasa a In progress', async () => {
    const { user } = await grabInTodo();

    await user.keyboard('{ArrowRight}');

    expect(picker('In progress')).toHaveProperty('checked', true);
    expect(hiddenOnMobile('In progress')).toBe(false);
    expect(hiddenOnMobile('To do')).toBe(true);
    expect(titles('In progress')[0]).toBe('Preparar la demo');
    expect(live()).toBe('In progress, posición 1 de 4.');
    expect(document.activeElement).toBe(handleOf('Preparar la demo'));
  });

  it('003 RF-023 mover dentro de la misma columna no cambia la columna visible', async () => {
    const { user } = await grabInTodo();

    await user.keyboard('{ArrowUp}');

    expect(picker('To do')).toHaveProperty('checked', true);
    expect(hiddenOnMobile('To do')).toBe(false);
  });

  it('003 CA-3.10 RF-023 Esc vuelve a To do en el selector y en la columna visible, con el anuncio de CA-3.6', async () => {
    const { user } = await grabInTodo();

    await user.keyboard('{ArrowRight}{Escape}');

    expect(picker('To do')).toHaveProperty('checked', true);
    expect(hiddenOnMobile('To do')).toBe(false);
    expect(hiddenOnMobile('In progress')).toBe(true);
    expect(live()).toBe(CANCELLED);
    expect(titles('To do')).toEqual(TODO_ORDER);
  });

  it('003 CA-3.13 RF-023 con NetworkError tras pasar a In progress y soltar, el selector y la columna visible vuelven a To do', async () => {
    const { user, tasks } = await grabInTodo();
    failWith(tasks, 'Preparar la demo', () => Promise.reject(new TypeError('Failed to fetch')));

    await user.keyboard('{ArrowRight}');
    expect(picker('In progress')).toHaveProperty('checked', true);
    await user.keyboard(' ');

    await waitFor(() => expect(notice()?.textContent).toBe(MOVE_ERROR));
    await waitFor(() => expect(picker('To do')).toHaveProperty('checked', true));
    expect(hiddenOnMobile('To do')).toBe(false);
    expect(hiddenOnMobile('In progress')).toBe(true);
    expect(document.activeElement).toBe(handleOf('Preparar la demo'));
  });

  it('003 RF-023 D-26 si el foco ya salió del asa, la columna visible no cambia', async () => {
    const { user, tasks } = await grabInTodo();
    let fail!: (error: Error) => void;
    failWith(
      tasks,
      'Preparar la demo',
      () =>
        new Promise<Response>((_resolve, reject) => {
          fail = reject;
        }),
    );

    await user.keyboard('{ArrowRight} ');
    await waitFor(() =>
      expect(browser.callsTo('POST', `/api/tasks/${tasks[2]!.id}/move`)).toHaveLength(1),
    );
    await user.tab();
    expect(document.activeElement).not.toBe(handleOf('Preparar la demo'));

    fail(new TypeError('Failed to fetch'));

    await waitFor(() => expect(notice()?.textContent).toBe(MOVE_ERROR));
    expect(picker('In progress')).toHaveProperty('checked', true);
    expect(hiddenOnMobile('In progress')).toBe(false);
  });

  it('003 RF-023 RF-017 que el foco salga del asa también vuelve a la columna de partida', async () => {
    const { user } = await grabInTodo();

    await user.keyboard('{ArrowRight}');
    expect(picker('In progress')).toHaveProperty('checked', true);
    await user.tab();

    await waitFor(() => expect(picker('To do')).toHaveProperty('checked', true));
    expect(hiddenOnMobile('To do')).toBe(false);
  });
});
