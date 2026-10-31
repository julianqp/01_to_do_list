import type { Task } from '@todo/shared';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TaskFormMode } from '../lib/task-form';
import { useTasks } from '../lib/task-queries';
import { Board } from './Board';
import { TaskDialog } from './TaskDialog';
import { withQueryClient } from './withQueryClient';
import {
  apiError,
  descriptionOf,
  expectFieldError,
  json,
  mockBrowser,
  renderWithClient,
  taskFixture,
} from './test-utils';

const browser = mockBrowser();

const DISCARD_QUESTION = '¿Descartar los cambios?';

function renderDialog(mode: TaskFormMode = { kind: 'create' }) {
  const onClose = vi.fn();
  renderWithClient(<TaskDialog mode={mode} onClose={onClose} />);
  const dialog = screen.getByRole('dialog');
  return { onClose, dialog, user: userEvent.setup() };
}

const titleField = () => screen.getByLabelText('Título') as HTMLInputElement;

// D-12 (T-030): un pointerdown sobre el propio <dialog> solo es un «clic fuera» si el punto cae fuera
// de su rectángulo (en el velo). jsdom no calcula la disposición: el rectángulo se simula.
function pointerDownOnDialog(dialog: HTMLElement, at: 'outside' | 'inside') {
  vi.spyOn(dialog, 'getBoundingClientRect').mockReturnValue({
    x: 100,
    y: 100,
    left: 100,
    top: 100,
    right: 560,
    bottom: 700,
    width: 460,
    height: 600,
    toJSON: () => ({}),
  });
  const [clientX, clientY] = at === 'outside' ? [20, 20] : [140, 108];
  fireEvent.pointerDown(dialog, { clientX, clientY });
}

describe('TaskDialog · cerrar y descartar', () => {
  it('D-12 es un <dialog> abierto con showModal, con su título como nombre', () => {
    const { dialog } = renderDialog();

    expect(dialog.tagName).toBe('DIALOG');
    expect((dialog as HTMLDialogElement).open).toBe(true);
    expect(dialog.getAttribute('aria-labelledby')).toBe(
      within(dialog).getByRole('heading', { level: 2 }).id,
    );
  });

  it('RF-035 D-16 en escritorio, 460 px como máximo; por debajo de 768 px, panel inferior con asa y al 92 % de alto', () => {
    const { dialog } = renderDialog();

    expect(dialog.classList).toContain('max-w-115');
    expect(dialog.classList).toContain('max-md:max-w-none');
    expect(dialog.classList).toContain('max-md:mb-0');
    expect(dialog.classList).toContain('max-md:sheet-max-height');
    expect(dialog.querySelector('[data-sheet-handle]')?.classList).toContain('md:hidden');
  });

  it('CA-3.4 RF-021 sin cambios, Esc cierra sin preguntar', async () => {
    const { onClose, user } = renderDialog({ kind: 'edit', task: taskFixture() });

    await user.click(titleField());
    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledWith({ kind: 'cancelled' });
    expect(screen.queryByText(DISCARD_QUESTION)).toBeNull();
  });

  it('RF-021 sin cambios, «Cancelar» cierra sin preguntar', async () => {
    const { onClose, user } = renderDialog();

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onClose).toHaveBeenCalledWith({ kind: 'cancelled' });
  });

  it('RF-021 D-12 sin cambios, un clic fuera (en el velo, sobre el propio <dialog>) cierra', () => {
    const { dialog, onClose } = renderDialog();

    pointerDownOnDialog(dialog, 'outside');

    expect(onClose).toHaveBeenCalledWith({ kind: 'cancelled' });
  });

  it.each([
    ['sin cambios', false],
    ['con cambios', true],
  ])(
    'RF-021 RF-035 D-12 %s, un pointerdown sobre el <dialog> dentro de su rectángulo (junto al asa) no cierra ni pregunta',
    async (_name, edited) => {
      const { dialog, onClose, user } = renderDialog();
      if (edited) await user.type(titleField(), 'Preparar la demo');

      pointerDownOnDialog(dialog, 'inside');

      expect(onClose).not.toHaveBeenCalled();
      expect(screen.queryByText(DISCARD_QUESTION)).toBeNull();
    },
  );

  it('D-12 un clic dentro del contenido no cierra', () => {
    const { onClose } = renderDialog();

    fireEvent.pointerDown(titleField());

    expect(onClose).not.toHaveBeenCalled();
  });

  it.each([
    ['Esc', async (user: ReturnType<typeof userEvent.setup>) => user.keyboard('{Escape}')],
    [
      '«Cancelar»',
      async (user: ReturnType<typeof userEvent.setup>) =>
        user.click(screen.getByRole('button', { name: 'Cancelar' })),
    ],
    [
      'clic fuera',
      async () => {
        pointerDownOnDialog(screen.getByRole('dialog'), 'outside');
      },
    ],
  ])(
    'CA-3.3 RF-021 D-19 con cambios, %s pregunta «¿Descartar los cambios?» con «Descartar cambios» (glass) y «Seguir editando» (primario)',
    async (_name, close) => {
      const { onClose, user } = renderDialog();
      await user.type(titleField(), 'Preparar la demo');

      await close(user);

      expect(onClose).not.toHaveBeenCalled();
      expect(screen.getByRole('heading', { level: 2, name: DISCARD_QUESTION })).toBeDefined();
      const discard = screen.getByRole('button', { name: 'Descartar cambios' });
      const keep = screen.getByRole('button', { name: 'Seguir editando' });
      expect(discard.classList).toContain('bg-glass');
      expect(keep.className).toContain('--grad-primary');
      expect(document.activeElement).toBe(keep);
    },
  );

  it('CA-3.3 «Seguir editando» vuelve al formulario con lo escrito', async () => {
    const { user } = renderDialog();
    await user.type(titleField(), 'Preparar la demo');
    await user.keyboard('{Escape}');

    await user.click(screen.getByRole('button', { name: 'Seguir editando' }));

    expect(screen.queryByText(DISCARD_QUESTION)).toBeNull();
    expect(titleField().value).toBe('Preparar la demo');
    expect(document.activeElement).toBe(titleField());
  });

  it('D-12 D-24 Esc en la pregunta vuelve al formulario con lo escrito; dos Esc seguidos no cierran', async () => {
    const { onClose, user } = renderDialog();
    await user.type(titleField(), 'Preparar la demo');

    await user.keyboard('{Escape}{Escape}');

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.queryByText(DISCARD_QUESTION)).toBeNull();
    expect(titleField().value).toBe('Preparar la demo');
  });

  it('CA-3.3 «Descartar cambios» cierra sin guardar', async () => {
    const { onClose, user } = renderDialog({ kind: 'edit', task: taskFixture() });
    await user.type(titleField(), ' final');
    await user.keyboard('{Escape}');

    await user.click(screen.getByRole('button', { name: 'Descartar cambios' }));

    expect(onClose).toHaveBeenCalledWith({ kind: 'cancelled' });
  });

  it('D-12 el evento cancel del <dialog> se cancela (segunda red bajo el Esc)', () => {
    const { dialog } = renderDialog();
    const cancel = new Event('cancel', { cancelable: true });

    dialog.dispatchEvent(cancel);

    expect(cancel.defaultPrevented).toBe(true);
  });

  it('X-7 D-12 la pregunta sustituye el contenido del mismo diálogo: nunca hay dos', async () => {
    const { user } = renderDialog();
    await user.type(titleField(), 'Preparar la demo');

    await user.keyboard('{Escape}');

    expect(screen.getAllByRole('dialog')).toHaveLength(1);
  });
});

describe('Board · abrir y cerrar el diálogo', () => {
  const tasks: Task[] = [taskFixture({ title: 'Preparar la demo' })];

  it('RF-010 RF-022 D-14 «Crear tarea» abre el diálogo y, al cerrarlo sin crear, el foco vuelve al botón', async () => {
    renderWithClient(<Board tasks={tasks} />);
    const user = userEvent.setup();
    const create = screen.getByRole('button', { name: 'Crear tarea' });

    await user.click(create);
    expect(screen.getByRole('dialog', { name: 'Nueva tarea' })).toBeDefined();
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(create);
  });

  it('CA-3.1 CA-3.4 RF-012 RF-022 D-14 la tarjeta abre su detalle y, al cerrarlo sin cambios, el foco vuelve a la tarjeta', async () => {
    renderWithClient(<Board tasks={tasks} />);
    const user = userEvent.setup();
    const card = screen.getByRole('button', { name: 'Preparar la demo' });

    await user.click(card);
    const dialog = screen.getByRole('dialog', { name: 'Detalle de la tarea' });
    expect((within(dialog).getByLabelText('Título') as HTMLInputElement).value).toBe(
      'Preparar la demo',
    );
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(card);
  });

  it('RF-022 D-14 desde el estado vacío, al cerrar sin crear, el foco vuelve a su «Crear tarea»', async () => {
    renderWithClient(<Board tasks={[]} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Crear tarea' }));
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Crear tarea' }));
  });
});

// --- T-020: crear ---

const SAVE_ERROR = 'No hemos podido guardar la tarea. Revisa tu conexión e inténtalo de nuevo.';

// El tablero con la lista de verdad: la consulta de PrivateArea, sin la isla.
function LiveBoard() {
  const tasks = useTasks({ enabled: true });
  return tasks.isSuccess ? <Board tasks={tasks.data} /> : null;
}

// GET /api/tasks devuelve `tasks`; un POST con éxito añade la tarea nueva al principio (RF-002).
function serveTasks(initial: Task[]) {
  let tasks = [...initial];
  browser.routes['GET /api/tasks'] = () => json(200, { tasks });
  browser.routes['POST /api/tasks'] = () => {
    const [, init] = browser.fetch.mock.calls.at(-1)!;
    const created = taskFixture({
      ...(JSON.parse(String(init?.body)) as object),
      status: 'backlog',
    });
    tasks = [created, ...tasks];
    return json(201, { task: created });
  };
}

async function openCreate() {
  renderWithClient(<LiveBoard />);
  const user = userEvent.setup();
  await user.click(await screen.findByRole('button', { name: 'Crear tarea' }));
  const dialog = screen.getByRole('dialog', { name: 'Nueva tarea' });
  return { user, dialog };
}

const field = (dialog: HTMLElement, label: string) =>
  within(dialog).getByLabelText(label) as HTMLInputElement;
const submitCreate = (dialog: HTMLElement) =>
  within(dialog).getByRole('button', { name: 'Crear tarea' });
const postBodies = () =>
  browser.callsTo('POST', '/api/tasks').map(([, init]) => JSON.parse(String(init?.body)));

describe('TaskDialog · crear', () => {
  it('RF-010 D-9 campos Título, Descripción (opcional) y las dos fechas estimadas (opcional), en las carpetas «Datos» y «Fechas»; sin estado ni fin real', async () => {
    serveTasks([]);
    const { dialog } = await openCreate();

    const datos = within(dialog).getByRole('group', { name: 'Datos' });
    const fechas = within(dialog).getByRole('group', { name: 'Fechas' });
    expect(within(datos).getByLabelText('Título')).toBeDefined();
    expect(within(datos).getByLabelText('Descripción (opcional)').tagName).toBe('TEXTAREA');
    const start = within(fechas).getByLabelText('Fecha estimada de inicio (opcional)');
    expect(within(fechas).getByLabelText('Fecha estimada de fin (opcional)')).toBeDefined();
    expect(start.getAttribute('inputmode')).toBe('numeric');
    expect(descriptionOf(start)).toBe('Ejemplo: 14/11/2026');
    expect(within(dialog).queryByRole('radio')).toBeNull();
    expect(within(dialog).queryByLabelText(/Fecha real de fin/)).toBeNull();
  });

  it('CA-2.1 CA-2.2 RF-011 RF-022 POST con las fechas en ISO; al tener la lista nueva, se cierra, la tarjeta sale la primera de Backlog y tiene el foco', async () => {
    serveTasks([taskFixture({ title: 'Comprar pan' })]);
    const { user, dialog } = await openCreate();

    await user.type(field(dialog, 'Título'), 'Preparar la demo');
    await user.type(field(dialog, 'Descripción (opcional)'), 'Revisar con el equipo');
    await user.type(field(dialog, 'Fecha estimada de inicio (opcional)'), '14/11/2026');
    await user.type(field(dialog, 'Fecha estimada de fin (opcional)'), '28/11/2026');
    await user.click(submitCreate(dialog));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(postBodies()).toEqual([
      {
        title: 'Preparar la demo',
        description: 'Revisar con el equipo',
        estimatedStartDate: '2026-11-14',
        estimatedEndDate: '2026-11-28',
      },
    ]);
    const backlog = screen.getByRole('region', { name: 'Backlog, 2 tareas' });
    const cards = within(backlog).getAllByRole('button');
    expect(cards[0]!.textContent).toContain('Preparar la demo');
    expect(document.activeElement).toBe(cards[0]);
    expect(screen.getByText('2 tareas')).toBeDefined();
  });

  it('CA-2.1 RF-011 desde el estado vacío, la tarea nueva aparece en Backlog', async () => {
    serveTasks([]);
    const { user, dialog } = await openCreate();

    await user.type(field(dialog, 'Título'), 'Preparar la demo');
    await user.keyboard('{Enter}');

    expect(await screen.findByRole('region', { name: 'Backlog, 1 tarea' })).toBeDefined();
  });

  it('D-7 el diálogo no se cierra hasta tener la lista nueva', async () => {
    serveTasks([]);
    const { user, dialog } = await openCreate();
    let release!: () => void;
    browser.routes['GET /api/tasks'] = () =>
      new Promise<Response>((resolve) => {
        release = () => resolve(new Response(JSON.stringify({ tasks: [] }), { status: 200 }));
      });

    await user.type(field(dialog, 'Título'), 'Preparar la demo');
    await user.click(submitCreate(dialog));

    await waitFor(() => expect(browser.callsTo('GET', '/api/tasks')).toHaveLength(2));
    expect(screen.getByRole('dialog')).toBe(dialog);
    expect(screen.getByRole('button', { name: 'Creando tarea…' })).toBeDefined();
    release();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it.each([
    ['CA-2.3 RF-014 título vacío', { title: '   ' }, 'Título', 'Escribe un título para la tarea.'],
    [
      'CA-2.4 RF-015 título de 201 caracteres',
      { title: 'a'.repeat(201) },
      'Título',
      'El título puede tener hasta 200 caracteres. Acórtalo un poco.',
    ],
    [
      'CA-2.5 RF-018 fin anterior al inicio',
      { title: 'Preparar la demo', start: '28/11/2026', end: '14/11/2026' },
      'Fecha estimada de fin (opcional)',
      'La fecha de fin no puede ser anterior a la de inicio. Cambia una de las dos.',
    ],
    [
      'CA-2.6 RF-017 fecha que no existe',
      { title: 'Preparar la demo', start: '31/02/2026' },
      'Fecha estimada de inicio (opcional)',
      'Esa fecha no existe. Escríbela como 14/11/2026.',
    ],
    [
      'RF-016 E-6 descripción de 5001 caracteres',
      { title: 'Preparar la demo', description: 'a'.repeat(5001) },
      'Descripción (opcional)',
      'La descripción puede tener hasta 5000 caracteres. Acórtala un poco.',
    ],
  ])(
    '%s → no se crea, error bajo el campo y foco en él (RF-019)',
    async (_name, values, label, message) => {
      serveTasks([]);
      const { user, dialog } = await openCreate();

      // fireEvent: escribir 201 (o 5001) caracteres uno a uno con user-event es lento.
      fireEvent.change(field(dialog, 'Título'), { target: { value: values.title } });
      if ('description' in values)
        fireEvent.change(field(dialog, 'Descripción (opcional)'), {
          target: { value: values.description },
        });
      if ('start' in values)
        await user.type(field(dialog, 'Fecha estimada de inicio (opcional)'), values.start);
      if ('end' in values)
        await user.type(field(dialog, 'Fecha estimada de fin (opcional)'), values.end);
      await user.click(submitCreate(dialog));

      expect(browser.callsTo('POST', '/api/tasks')).toHaveLength(0);
      expectFieldError(field(dialog, label), message);
      expect(document.activeElement).toBe(field(dialog, label));
    },
  );

  it('CA-2.7 RF-028 D-20 con NetworkError el diálogo sigue abierto con lo escrito y la alerta de RF-028, en la zona que ya estaba', async () => {
    serveTasks([]);
    browser.routes['POST /api/tasks'] = () => Promise.reject(new TypeError('Failed to fetch'));
    const { user, dialog } = await openCreate();
    const alert = within(dialog).getByRole('alert');
    expect(alert.textContent).toBe('');

    await user.type(field(dialog, 'Título'), 'Preparar la demo');
    await user.click(submitCreate(dialog));

    await waitFor(() => expect(alert.textContent).toBe(SAVE_ERROR));
    expect(screen.getByRole('dialog')).toBe(dialog);
    expect(field(dialog, 'Título').value).toBe('Preparar la demo');
    expect(screen.queryByRole('region')).toBeNull();
  });

  it('RF-028 un error inesperado (500) da el mismo aviso', async () => {
    serveTasks([]);
    browser.routes['POST /api/tasks'] = () => apiError(500, 'INTERNAL_ERROR');
    const { user, dialog } = await openCreate();

    await user.type(field(dialog, 'Título'), 'Preparar la demo');
    await user.click(submitCreate(dialog));

    await waitFor(() => expect(within(dialog).getByRole('alert').textContent).toBe(SAVE_ERROR));
  });

  it('E-15 RF-031 «Creando tarea…» y un doble clic hacen un solo POST', async () => {
    serveTasks([]);
    browser.routes['POST /api/tasks'] = () => new Promise<Response>(() => {});
    const { user, dialog } = await openCreate();

    await user.type(field(dialog, 'Título'), 'Preparar la demo');
    await user.dblClick(submitCreate(dialog));

    const button = within(dialog).getByRole('button', { name: 'Creando tarea…' });
    expect(button.getAttribute('aria-disabled')).toBe('true');
    await user.click(button);
    expect(browser.callsTo('POST', '/api/tasks')).toHaveLength(1);
  });
});

// --- T-021: editar ---

const NOT_FOUND = 'Esta tarea ya no existe.';

// PUT sustituye la tarea en la lista (D-2) y la devuelve.
function servePut(id: string) {
  browser.routes[`PUT /api/tasks/${id}`] = () => {
    const [, init] = browser.fetch.mock.calls.at(-1)!;
    const input = JSON.parse(String(init?.body)) as Omit<Task, 'id'>;
    const updated: Task = { id, ...input };
    const current = browser.routes['GET /api/tasks'];
    return current!().then(async (response) => {
      const { tasks } = (await response.json()) as { tasks: Task[] };
      const next = tasks.map((task) => (task.id === id ? updated : task));
      browser.routes['GET /api/tasks'] = () => json(200, { tasks: next });
      return json(200, { task: updated });
    });
  };
}

const DEMO = taskFixture({
  title: 'Preparar la demo',
  description: 'Revisar con el equipo',
  status: 'todo',
  estimatedStartDate: '2026-11-14',
  estimatedEndDate: '2026-11-28',
});

async function openDetail(tasks: Task[] = [DEMO], title = 'Preparar la demo') {
  browser.routes['GET /api/tasks'] = () => json(200, { tasks });
  renderWithClient(<LiveBoard />);
  const user = userEvent.setup();
  const card = await screen.findByRole('button', { name: new RegExp(`^${title}`) });
  await user.click(card);
  const dialog = screen.getByRole('dialog', { name: 'Detalle de la tarea' });
  return { user, dialog, card };
}

const save = (dialog: HTMLElement) =>
  within(dialog).getByRole('button', { name: 'Guardar cambios' });
const cardOf = (title: string) =>
  screen.queryAllByRole('button').find((button) => button.textContent?.startsWith(title));

describe('TaskDialog · editar', () => {
  it('CA-3.1 RF-012 clic o Enter en la tarjeta abren el detalle con sus datos', async () => {
    const { user, dialog, card } = await openDetail();

    expect(field(dialog, 'Título').value).toBe('Preparar la demo');
    expect(field(dialog, 'Descripción (opcional)').value).toBe('Revisar con el equipo');
    expect(field(dialog, 'Fecha estimada de inicio (opcional)').value).toBe('14/11/2026');
    expect(field(dialog, 'Fecha estimada de fin (opcional)').value).toBe('28/11/2026');

    await user.keyboard('{Escape}');
    card.focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('dialog', { name: 'Detalle de la tarea' })).toBeDefined();
  });

  it('CA-3.2 RF-013 RF-022 guardar un título nuevo cierra el diálogo, actualiza la tarjeta y le devuelve el foco', async () => {
    servePut(DEMO.id);
    const { user, dialog } = await openDetail();

    await user.clear(field(dialog, 'Título'));
    await user.type(field(dialog, 'Título'), 'Preparar la demo final');
    await user.click(save(dialog));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    const [, init] = browser.callsTo('PUT', `/api/tasks/${DEMO.id}`)[0]!;
    expect(JSON.parse(String(init?.body))).toEqual({
      title: 'Preparar la demo final',
      description: 'Revisar con el equipo',
      estimatedStartDate: '2026-11-14',
      estimatedEndDate: '2026-11-28',
      status: 'todo',
      actualEndDate: null,
    });
    const card = cardOf('Preparar la demo final')!;
    expect(document.activeElement).toBe(card);
  });

  it('CA-3.5 RF-014 borrar el título y guardar: la tarea no cambia y sale el error de CA-2.3', async () => {
    const { user, dialog } = await openDetail();

    await user.clear(field(dialog, 'Título'));
    await user.click(save(dialog));

    expect(browser.callsTo('PUT', `/api/tasks/${DEMO.id}`)).toHaveLength(0);
    expectFieldError(field(dialog, 'Título'), 'Escribe un título para la tarea.');
    expect(document.activeElement).toBe(field(dialog, 'Título'));
  });

  it('CA-4.4 RF-028 PUT con NetworkError: alerta en el diálogo, que sigue abierto, y la tarjeta sin cambios', async () => {
    browser.routes[`PUT /api/tasks/${DEMO.id}`] = () =>
      Promise.reject(new TypeError('Failed to fetch'));
    const { user, dialog } = await openDetail();

    await user.type(field(dialog, 'Título'), ' final');
    await user.click(save(dialog));

    await waitFor(() => expect(within(dialog).getByRole('alert').textContent).toBe(SAVE_ERROR));
    expect(field(dialog, 'Título').value).toBe('Preparar la demo final');
    expect(cardOf('Preparar la demo')!.textContent).not.toContain('final');
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeDefined();
  });

  it('CA-3.6 RF-030 E-14 D-14 D-20 PUT con 404 TASK_NOT_FOUND: el diálogo se cierra, «Esta tarea ya no existe.» en el tablero, la tarjeta desaparece y el foco va a «Crear tarea»', async () => {
    const other = taskFixture({ title: 'Comprar pan' });
    const { user, dialog } = await openDetail([DEMO, other]);
    const boardAlert = screen.getAllByRole('alert').find((alert) => !dialog.contains(alert))!;
    expect(boardAlert.textContent).toBe('');
    browser.routes[`PUT /api/tasks/${DEMO.id}`] = () => apiError(404, 'TASK_NOT_FOUND');
    browser.routes['GET /api/tasks'] = () => json(200, { tasks: [other] });

    await user.type(field(dialog, 'Título'), ' final');
    await user.click(save(dialog));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(boardAlert.textContent).toBe(NOT_FOUND);
    expect(cardOf('Preparar la demo')).toBeUndefined();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Crear tarea' }));
  });

  it('D-20 el aviso del tablero se vacía al abrir otro diálogo', async () => {
    const other = taskFixture({ title: 'Comprar pan' });
    const { user, dialog } = await openDetail([DEMO, other]);
    browser.routes[`PUT /api/tasks/${DEMO.id}`] = () => apiError(404, 'TASK_NOT_FOUND');
    browser.routes['GET /api/tasks'] = () => json(200, { tasks: [other] });
    await user.type(field(dialog, 'Título'), ' final');
    await user.click(save(dialog));
    await waitFor(() => expect(screen.getByText(NOT_FOUND)).toBeDefined());

    await user.click(cardOf('Comprar pan')!);

    expect(screen.queryByText(NOT_FOUND)).toBeNull();
  });

  it('E-12 PUT con 401 SESSION_EXPIRED → location.replace("/login?expired=1")', async () => {
    const Island = withQueryClient(LiveBoard, { requireSession: true });
    browser.routes['GET /api/tasks'] = () => json(200, { tasks: [DEMO] });
    browser.routes[`PUT /api/tasks/${DEMO.id}`] = () => apiError(401, 'SESSION_EXPIRED');
    render(<Island />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: /^Preparar la demo/ }));
    const dialog = screen.getByRole('dialog');

    await user.type(field(dialog, 'Título'), ' final');
    await user.click(save(dialog));

    await waitFor(() => expect(browser.replace).toHaveBeenCalledWith('/login?expired=1'));
  });

  it('RF-031 «Guardando…» mientras se guarda', async () => {
    browser.routes[`PUT /api/tasks/${DEMO.id}`] = () => new Promise<Response>(() => {});
    const { user, dialog } = await openDetail();

    await user.type(field(dialog, 'Título'), ' final');
    await user.dblClick(save(dialog));

    expect(within(dialog).getByRole('button', { name: 'Guardando…' })).toBeDefined();
    expect(browser.callsTo('PUT', `/api/tasks/${DEMO.id}`)).toHaveLength(1);
  });
});

// --- T-022: estado, fecha real de fin y retrasada ---

describe('TaskDialog · estado y fecha real de fin', () => {
  // Hoy es el 29/10/2026 en el navegador (spec §4). Solo Date: React usa los temporizadores.
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 29, 10, 0));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const statusRadio = (dialog: HTMLElement, name: string) =>
    within(dialog).getByRole('radio', { name }) as HTMLInputElement;
  const actualEnd = (dialog: HTMLElement) =>
    within(dialog).queryByLabelText('Fecha real de fin') as HTMLInputElement | null;
  const columnOf = (title: string) =>
    screen.getAllByRole('region').find((region) => within(region).queryByText(title));

  it('RF-023 D-15 el detalle tiene el selector de estado «Estado» con los cuatro estados y el de la tarea elegido', async () => {
    const { dialog } = await openDetail();

    const group = within(dialog).getByRole('group', { name: 'Estado' });
    expect(
      within(group)
        .getAllByRole('radio')
        .map((radio) => radio.closest('label')?.textContent),
    ).toEqual(['Backlog', 'To do', 'In progress', 'Done']);
    expect(statusRadio(dialog, 'To do').checked).toBe(true);
  });

  it('D-15 §1.3 la opción elegida lleva el tono de su estado', async () => {
    const { user, dialog } = await openDetail();
    const option = (name: string) => statusRadio(dialog, name).closest('label')!;

    expect(option('To do').className).toContain('--pill-lilac');
    await user.click(statusRadio(dialog, 'In progress'));
    expect(option('In progress').className).toContain('--pill-ink');
    await user.click(statusRadio(dialog, 'Done'));
    expect(option('Done').className).toContain('--pill-sage');
    await user.click(statusRadio(dialog, 'Backlog'));
    expect(option('Backlog').classList).toContain('bg-raised-hover');
  });

  it('CA-4.1 RF-024 pasar de To do a In progress y guardar mueve la tarjeta y cambia los recuentos', async () => {
    servePut(DEMO.id);
    const { user, dialog } = await openDetail();

    await user.click(statusRadio(dialog, 'In progress'));
    await user.click(save(dialog));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(columnOf('Preparar la demo')?.getAttribute('aria-label')).toBe('In progress, 1 tarea');
    expect(screen.getByRole('region', { name: 'To do, 0 tareas' })).toBeDefined();
    expect(document.activeElement).toBe(cardOf('Preparar la demo'));
  });

  it('CA-4.3 RF-025 RF-038 elegir Done rellena «29/10/2026»; al guardar, la tarjeta pasa a Done con «29 oct»', async () => {
    servePut(DEMO.id);
    const { user, dialog } = await openDetail();
    expect(actualEnd(dialog)).toBeNull();

    await user.click(statusRadio(dialog, 'Done'));
    expect(actualEnd(dialog)?.value).toBe('29/10/2026');
    expect(descriptionOf(actualEnd(dialog)!)).toBe('Ejemplo: 14/11/2026');
    await user.click(save(dialog));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(columnOf('Preparar la demo')?.getAttribute('aria-label')).toBe('Done, 1 tarea');
    expect(cardOf('Preparar la demo')?.textContent).toContain('Fecha real de fin: 29 oct');
  });

  it('CA-4.5 RF-039 cambiar la fecha real de fin a «27/10/2026» y guardar → «27 oct»', async () => {
    servePut(DEMO.id);
    const { user, dialog } = await openDetail();

    await user.click(statusRadio(dialog, 'Done'));
    await user.clear(actualEnd(dialog)!);
    await user.type(actualEnd(dialog)!, '27/10/2026');
    await user.click(save(dialog));

    await waitFor(() => expect(cardOf('Preparar la demo')?.textContent).toContain('27 oct'));
  });

  it.each([
    [
      'CA-4.6 RF-039 «30/10/2026»',
      '30/10/2026',
      'La fecha real de fin no puede ser posterior a hoy. Cambia la fecha.',
    ],
    ['CA-4.7 RF-040 vacía', '', 'Escribe el día en que terminaste la tarea.'],
  ])('%s: la tarea no cambia y el error sale bajo el campo', async (_name, value, message) => {
    const { user, dialog } = await openDetail();

    await user.click(statusRadio(dialog, 'Done'));
    await user.clear(actualEnd(dialog)!);
    if (value) await user.type(actualEnd(dialog)!, value);
    await user.click(save(dialog));

    expect(browser.callsTo('PUT', `/api/tasks/${DEMO.id}`)).toHaveLength(0);
    expectFieldError(actualEnd(dialog)!, message);
    expect(document.activeElement).toBe(actualEnd(dialog));
  });

  it('CA-4.8 RF-041 una tarea en Done pasada a In progress se guarda sin fecha real; al volver a Done sale hoy, no la de antes', async () => {
    const done = taskFixture({
      title: 'Preparar la demo',
      status: 'done',
      actualEndDate: '2026-10-27',
    });
    servePut(done.id);
    const { user, dialog } = await openDetail([done]);
    expect(actualEnd(dialog)?.value).toBe('27/10/2026');

    await user.click(statusRadio(dialog, 'In progress'));
    await user.click(save(dialog));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    const [, init] = browser.callsTo('PUT', `/api/tasks/${done.id}`)[0]!;
    expect(JSON.parse(String(init?.body))).toMatchObject({
      status: 'in_progress',
      actualEndDate: null,
    });
    expect(cardOf('Preparar la demo')?.textContent).not.toContain('Fecha real de fin');

    await user.click(cardOf('Preparar la demo')!);
    const reopened = screen.getByRole('dialog');
    await user.click(statusRadio(reopened, 'Done'));
    expect(actualEnd(reopened)?.value).toBe('29/10/2026');
  });

  it('CA-4.9 RF-038 en To do no hay campo de fecha real de fin', async () => {
    const { dialog } = await openDetail();

    expect(actualEnd(dialog)).toBeNull();
  });

  it('E-23 RF-041 elegir Done, después In progress, y guardar → sin fecha real de fin', async () => {
    servePut(DEMO.id);
    const { user, dialog } = await openDetail();

    await user.click(statusRadio(dialog, 'Done'));
    await user.click(statusRadio(dialog, 'In progress'));
    expect(actualEnd(dialog)).toBeNull();
    await user.click(save(dialog));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    const [, init] = browser.callsTo('PUT', `/api/tasks/${DEMO.id}`)[0]!;
    expect(JSON.parse(String(init?.body))).toMatchObject({
      status: 'in_progress',
      actualEndDate: null,
    });
  });

  it('E-21 editar el título de una tarea en Done conserva su fecha real de fin', async () => {
    const done = taskFixture({
      title: 'Preparar la demo',
      status: 'done',
      actualEndDate: '2026-10-27',
    });
    servePut(done.id);
    const { user, dialog } = await openDetail([done]);

    await user.type(field(dialog, 'Título'), ' final');
    await user.click(save(dialog));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    const [, init] = browser.callsTo('PUT', `/api/tasks/${done.id}`)[0]!;
    expect(JSON.parse(String(init?.body))).toMatchObject({
      status: 'done',
      actualEndDate: '2026-10-27',
    });
  });

  it('CA-6.2 RF-033 el detalle de una tarea retrasada avisa «Esta tarea tenía que terminar el 28 oct.»', async () => {
    const late = taskFixture({
      title: 'Preparar la demo',
      status: 'in_progress',
      estimatedEndDate: '2026-10-28',
    });
    const { dialog } = await openDetail([late]);

    expect(within(dialog).getByText('Esta tarea tenía que terminar el 28 oct.')).toBeDefined();
  });

  it('CA-6.3 RF-033 sin retraso no hay aviso', async () => {
    const { dialog } = await openDetail();

    expect(within(dialog).queryByText(/tenía que terminar/)).toBeNull();
  });
});

// --- T-023: borrar ---

const DELETE_ERROR = 'No hemos podido borrar la tarea. Revisa tu conexión e inténtalo de nuevo.';
const QUESTION = '¿Borrar «Preparar la demo»? No se puede deshacer.';

// DELETE quita la tarea de la lista (D-7: la lista se vuelve a pedir después).
function serveDelete(id: string) {
  browser.routes[`DELETE /api/tasks/${id}`] = () =>
    browser.routes['GET /api/tasks']!().then(async (response) => {
      const { tasks } = (await response.json()) as { tasks: Task[] };
      const next = tasks.filter((task) => task.id !== id);
      browser.routes['GET /api/tasks'] = () => json(200, { tasks: next });
      return new Response(null, { status: 204 });
    });
}

async function askToDelete(tasks: Task[] = [DEMO, taskFixture({ title: 'Comprar pan' })]) {
  const opened = await openDetail(tasks);
  await opened.user.click(within(opened.dialog).getByRole('button', { name: 'Borrar tarea' }));
  return opened;
}

describe('TaskDialog · borrar', () => {
  it('RF-026 D-15 D-19 al crear no hay «Borrar tarea»; en el detalle sí, en glass (el único acento es el estado elegido)', async () => {
    serveTasks([]);
    const created = await openCreate();
    expect(within(created.dialog).queryByRole('button', { name: 'Borrar tarea' })).toBeNull();
    await created.user.keyboard('{Escape}');

    const { dialog } = await openDetail();
    const remove = within(dialog).getByRole('button', { name: 'Borrar tarea' });
    expect(remove.classList).toContain('bg-glass');
    expect(remove.className).not.toContain('--pill-rose');
  });

  it('CA-5.1 RF-026 X-7 la pregunta «¿Borrar «Preparar la demo»? No se puede deshacer.» con «Borrar tarea» y «Cancelar», en el mismo diálogo', async () => {
    const { dialog } = await askToDelete();

    expect(screen.getAllByRole('dialog')).toEqual([dialog]);
    expect(within(dialog).getByRole('heading', { level: 2, name: QUESTION })).toBeDefined();
    const confirm = within(dialog).getByRole('button', { name: 'Borrar tarea' });
    const cancel = within(dialog).getByRole('button', { name: 'Cancelar' });
    expect(confirm.className).toContain('--pill-rose');
    expect(cancel.classList).toContain('bg-glass');
    expect(document.activeElement).toBe(cancel);
    expect(browser.callsTo('DELETE', `/api/tasks/${DEMO.id}`)).toHaveLength(0);
  });

  it.each([
    [
      '«Cancelar»',
      (user: ReturnType<typeof userEvent.setup>) =>
        user.click(screen.getByRole('button', { name: 'Cancelar' })),
    ],
    ['Esc', (user: ReturnType<typeof userEvent.setup>) => user.keyboard('{Escape}')],
  ])('CA-5.3 RF-026 %s vuelve al detalle y la tarea sigue', async (_name, back) => {
    const { user, dialog } = await askToDelete();

    await back(user);

    expect(screen.getByRole('dialog')).toBe(dialog);
    expect(within(dialog).queryByText(QUESTION)).toBeNull();
    expect(field(dialog, 'Título').value).toBe('Preparar la demo');
    expect(document.activeElement).toBe(
      within(dialog).getByRole('button', { name: 'Borrar tarea' }),
    );
    expect(browser.callsTo('DELETE', `/api/tasks/${DEMO.id}`)).toHaveLength(0);
  });

  it('CA-5.2 RF-027 RF-031 al confirmar, «Borrando…»; después, la tarjeta desaparece, los recuentos bajan y el foco va a «Crear tarea»', async () => {
    serveDelete(DEMO.id);
    let release!: () => void;
    const original = browser.routes[`DELETE /api/tasks/${DEMO.id}`]!;
    browser.routes[`DELETE /api/tasks/${DEMO.id}`] = () =>
      new Promise<Response>((resolve) => {
        release = () => void original().then(resolve);
      });
    const { user, dialog } = await askToDelete();

    await user.dblClick(within(dialog).getByRole('button', { name: 'Borrar tarea' }));

    expect(within(dialog).getByRole('button', { name: 'Borrando…' })).toBeDefined();
    expect(browser.callsTo('DELETE', `/api/tasks/${DEMO.id}`)).toHaveLength(1);
    const [, init] = browser.callsTo('DELETE', `/api/tasks/${DEMO.id}`)[0]!;
    expect(init?.body).toBe('{}');
    release();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(cardOf('Preparar la demo')).toBeUndefined();
    expect(screen.getByText('1 tarea')).toBeDefined();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Crear tarea' }));
  });

  it('CA-5.4 RF-029 con NetworkError la tarea sigue y el detalle muestra la alerta de RF-029', async () => {
    browser.routes[`DELETE /api/tasks/${DEMO.id}`] = () =>
      Promise.reject(new TypeError('Failed to fetch'));
    const { user, dialog } = await askToDelete();

    await user.click(within(dialog).getByRole('button', { name: 'Borrar tarea' }));

    await waitFor(() => expect(within(dialog).getByRole('alert').textContent).toBe(DELETE_ERROR));
    expect(field(dialog, 'Título').value).toBe('Preparar la demo');
    expect(cardOf('Preparar la demo')).toBeDefined();
  });

  it('RF-030 E-14 DELETE con 404 TASK_NOT_FOUND: se cierra y el tablero avisa «Esta tarea ya no existe.»', async () => {
    const other = taskFixture({ title: 'Comprar pan' });
    const { user, dialog } = await askToDelete([DEMO, other]);
    browser.routes[`DELETE /api/tasks/${DEMO.id}`] = () => apiError(404, 'TASK_NOT_FOUND');
    browser.routes['GET /api/tasks'] = () => json(200, { tasks: [other] });

    await user.click(within(dialog).getByRole('button', { name: 'Borrar tarea' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.getByText(NOT_FOUND)).toBeDefined();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Crear tarea' }));
  });

  it('CA-5.5 RF-006 al borrar la última, el estado vacío, con el foco en su «Crear tarea»', async () => {
    serveDelete(DEMO.id);
    const { user, dialog } = await askToDelete([DEMO]);

    await user.click(within(dialog).getByRole('button', { name: 'Borrar tarea' }));

    expect(
      await screen.findByText('Todavía no tienes tareas. Crea la primera y empieza a organizarte.'),
    ).toBeDefined();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Crear tarea' }));
  });
});
