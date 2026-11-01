import { expect, test, type Page, type Request } from '@playwright/test';
import {
  boardColumn,
  createTaskButton,
  createTaskViaApi,
  dragCard,
  expectNoAxeViolations,
  expectPrivateArea,
  isoDaysFromToday,
  moveHandle,
  pointIn,
  signup,
  submitCredentials,
  tabKey,
  tabTo,
  taskCard,
  taskDialog,
  touchDragCard,
  touchFinger,
  touchSwipe,
  uniqueEmail,
  type TaskStatus,
} from './helpers';

// Spec 003 (plan §7): arrastrar y soltar de punta a punta, en cada proyecto de playwright.config.ts
// (RNF-004) salvo donde se indica. Cada test registra su propia cuenta con un email único.

type ColumnName = 'Backlog' | 'To do' | 'In progress' | 'Done';

const DESKTOP = { width: 1280, height: 900 };
const MOBILE = { width: 375, height: 812 };
const MOVE_ERROR = 'No hemos podido mover la tarea. Revisa tu conexión e inténtalo de nuevo.';
// Por defecto, To do como en CA-2.1 y CA-3.1 («Preparar la demo», la segunda de 3) e In progress
// con 3 tarjetas (CA-1.1, CA-3.4).
const TODO = ['Comprar pan', 'Preparar la demo', 'Llamar al banco'];
const IN_PROGRESS = ['Revisar el correo', 'Escribir el informe', 'Pagar el alquiler'];

const boardTitle = (page: Page) => page.getByRole('heading', { level: 1, name: 'Tablero' });
// D-7: la región viva del tablero (dnd-kit monta la suya, un <div> que siempre está vacío, D-6).
const liveRegion = (page: Page) => page.locator('p[aria-live="assertive"]');
// D-10: la capa que sigue al puntero es la única tarjeta `inert`.
const dragOverlay = (page: Page, title: string) =>
  page.locator('[inert]').filter({ hasText: title });
// Las tarjetas de una columna, por su botón de abrir (D-11).
const cardsIn = (page: Page, column: ColumnName) =>
  boardColumn(page, column).locator('button[data-task-id]');
// Selector de columna en móvil (002/RF-034): un radio por estado con su recuento («Done · 0»).
const columnPicker = (page: Page, name: ColumnName) =>
  page.getByRole('radio', { name: new RegExp(`^${name} · \\d+$`) });

// Registra una cuenta a 1280 (la cabecera muestra el email) y deja el tablero al ancho pedido.
async function openBoard(page: Page, viewport = DESKTOP) {
  const email = uniqueEmail();
  await page.setViewportSize(DESKTOP);
  await signup(page, email);
  await page.setViewportSize(viewport);
  await expect(boardTitle(page)).toBeVisible();
  return email;
}

async function reloadBoard(page: Page) {
  await page.reload();
  await expect(boardTitle(page)).toBeVisible();
}

// Crea las tareas por la API y vuelve a cargar el tablero. Cada columna queda en el orden de la lista:
// la tarea nueva entra la primera (RF-009, RF-010), así que se crean del final al principio.
async function seedBoard(
  page: Page,
  columns: { todo?: string[]; in_progress?: string[] } = { todo: TODO, in_progress: IN_PROGRESS },
) {
  for (const status of ['todo', 'in_progress'] as const) {
    for (const title of [...(columns[status] ?? [])].reverse()) {
      await createTaskViaApi(page, { title }, status);
    }
  }
  await reloadBoard(page);
}

async function expectOrder(page: Page, column: ColumnName, titles: string[]) {
  await expect(cardsIn(page, column)).toHaveText(titles.map((title) => new RegExp(`^${title}`)));
}

async function expectCount(page: Page, column: ColumnName, count: number) {
  await expect(boardColumn(page, column).getByRole('heading', { level: 2 })).toHaveText(
    `${column} · ${count}`,
  );
}

async function expectNoNotice(page: Page) {
  await expect(page.getByText(MOVE_ERROR)).toHaveCount(0);
  await expect(page.locator('[data-tone]')).toHaveCount(0);
}

// La tarea tal como la guarda la API: fuera de Done, la tarjeta no enseña la fecha real de fin.
async function taskViaApi(page: Page, title: string) {
  const listed = await page.request.get('/api/tasks');
  const { tasks } = (await listed.json()) as {
    tasks: { id: string; title: string; actualEndDate: string | null }[];
  };
  return tasks.find((task) => task.title === title)!;
}

// CA-1.10, CA-3.12: «borrada en otra pestaña», de verdad, por la API y sin que esta pestaña se entere.
async function deleteTaskViaApi(page: Page, title: string) {
  const { id } = await taskViaApi(page, title);
  const deleted = await page.request.delete(`/api/tasks/${id}`, { data: {} });
  expect(deleted.ok()).toBe(true);
}

// La fecha corta de la tarjeta, como `formatShortDate` para una fecha de este año.
const shortDate = (iso: string) =>
  new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(
    new Date(`${iso}T00:00:00.000Z`),
  );

const isMove = (request: Request) =>
  request.method() === 'POST' &&
  /^\/api\/tasks\/[^/]+\/move$/.test(new URL(request.url()).pathname);

// La tarjeta cambia de sitio antes de que llegue la respuesta (RF-020): hay que esperarla antes de
// mirar lo guardado o de volver a cargar. Se pide antes de soltar.
const moveResponse = (page: Page) => page.waitForResponse((response) => isMove(response.request()));

// Las peticiones a `…/move` que haga la página desde ahora.
function trackMoves(page: Page) {
  const moves: Request[] = [];
  page.on('request', (request) => {
    if (isMove(request)) moves.push(request);
  });
  return moves;
}

test.describe('teclado', () => {
  // D-15: el primer riesgo. El foco tiene que seguir en el asa al pasar a otra columna, sin que el
  // `blur` cancele el movimiento (R-4). En Chromium y WebKit.
  test.describe('D-15 entre columnas', () => {
    test.skip(({ channel }) => channel === 'chrome', 'D-15: chromium y webkit');

    test('003 D-15 CA-3.2 CA-3.4 CA-3.5 RF-013 RF-014 RF-016 coger, pasar a In progress y soltar: el foco sigue en el asa y se guarda', async ({
      page,
    }) => {
      await openBoard(page);
      await seedBoard(page);
      const moves = trackMoves(page);
      const handle = moveHandle(page, 'Preparar la demo');

      await tabTo(page, handle);
      await page.keyboard.press('Space');
      await expect(liveRegion(page)).toHaveText(
        'Has cogido «Preparar la demo». To do, posición 2 de 3. Usa las flechas para moverla, Espacio para soltarla y Esc para cancelar.',
      );

      await page.keyboard.press('ArrowRight');
      await expect(liveRegion(page)).toHaveText('In progress, posición 1 de 4.');
      await expectOrder(page, 'In progress', ['Preparar la demo', ...IN_PROGRESS]);
      await expect(handle).toBeFocused();

      const saved = page.waitForResponse((response) => isMove(response.request()));
      await page.keyboard.press('Space');
      const response = await saved;
      expect(response.status()).toBe(200);
      expect(response.request().postDataJSON()).toEqual({
        status: 'in_progress',
        index: 0,
        today: isoDaysFromToday(0),
      });
      await expect(liveRegion(page)).toHaveText(
        'Has soltado «Preparar la demo» en In progress, posición 1 de 4.',
      );
      await expect(handle).toBeFocused();
      await expectCount(page, 'To do', 2);
      await expectCount(page, 'In progress', 4);
      expect(moves).toHaveLength(1);

      await reloadBoard(page);
      await expectOrder(page, 'In progress', ['Preparar la demo', ...IN_PROGRESS]);
    });

    test('003 D-15 CA-3.6 RF-017 coger, pasar a In progress y Esc: vuelve a To do sin guardar, con el foco en el asa', async ({
      page,
    }) => {
      await openBoard(page);
      await seedBoard(page);
      const moves = trackMoves(page);
      const handle = moveHandle(page, 'Preparar la demo');

      await tabTo(page, handle);
      await page.keyboard.press('Space');
      await page.keyboard.press('ArrowRight');
      await expect(liveRegion(page)).toHaveText('In progress, posición 1 de 4.');
      await expect(handle).toBeFocused();
      await page.keyboard.press('Escape');

      await expect(liveRegion(page)).toHaveText(
        'Movimiento cancelado. «Preparar la demo» sigue en To do, posición 2 de 3.',
      );
      await expectOrder(page, 'To do', TODO);
      await expectOrder(page, 'In progress', IN_PROGRESS);
      await expect(handle).toBeFocused();
      expect(moves).toHaveLength(0);
    });
  });

  test('003 CA-3.1 RF-012 con Tab, el asa tiene el foco visible y se llama «Mover «Preparar la demo»»', async ({
    page,
  }) => {
    await openBoard(page);
    await seedBoard(page);
    const handle = moveHandle(page, 'Preparar la demo');

    await tabTo(page, handle);

    await expect(handle).toHaveAccessibleName('Mover «Preparar la demo»');
    const ring = await handle.evaluate((element) => {
      const { outlineStyle, outlineWidth } = getComputedStyle(element);
      return { focusVisible: element.matches(':focus-visible'), outlineStyle, outlineWidth };
    });
    expect(ring).toEqual({ focusVisible: true, outlineStyle: 'solid', outlineWidth: '2px' });
  });
});

test.describe('ratón: entre columnas', () => {
  test('003 CA-1.1 CA-1.3 RF-001 RF-008 RF-020 soltar encima de la primera de In progress: queda la primera, con los recuentos, y sigue ahí al volver a cargar', async ({
    page,
  }) => {
    await openBoard(page);
    await seedBoard(page, { todo: ['Preparar la demo', 'Comprar pan'], in_progress: IN_PROGRESS });

    await dragCard(
      page,
      taskCard(page, 'Preparar la demo'),
      taskCard(boardColumn(page, 'In progress'), IN_PROGRESS[0]!),
    );

    await expectOrder(page, 'In progress', ['Preparar la demo', ...IN_PROGRESS]);
    await expectOrder(page, 'To do', ['Comprar pan']);
    await expectCount(page, 'To do', 1);
    await expectCount(page, 'In progress', 4);
    await expect(page.getByText('5 tareas', { exact: true })).toBeVisible();

    // CA-1.3
    await reloadBoard(page);
    await expectOrder(page, 'In progress', ['Preparar la demo', ...IN_PROGRESS]);
    await expectCount(page, 'To do', 1);
  });

  test('003 CA-1.2 RF-002 durante el arrastre, la tarjeta levantada sigue al puntero y el hueco está en In progress', async ({
    page,
  }) => {
    await openBoard(page);
    await seedBoard(page);
    const inProgress = boardColumn(page, 'In progress');

    const pointer = await dragCard(
      page,
      taskCard(page, 'Preparar la demo'),
      taskCard(inProgress, IN_PROGRESS[0]!),
      { drop: false },
    );

    const overlay = dragOverlay(page, 'Preparar la demo');
    await expect(overlay).toBeVisible();
    const expectUnderPointer = async ({ x, y }: { x: number; y: number }) => {
      const rect = await overlay.boundingBox();
      expect(rect).not.toBeNull();
      expect(x).toBeGreaterThanOrEqual(rect!.x);
      expect(x).toBeLessThanOrEqual(rect!.x + rect!.width);
      expect(y).toBeGreaterThanOrEqual(rect!.y);
      expect(y).toBeLessThanOrEqual(rect!.y + rect!.height);
    };
    await expectUnderPointer(pointer);
    // El hueco: la tarjeta en su sitio nuevo, con el contenido oculto (D-10).
    await expect(inProgress.locator('li').first()).toContainText('Preparar la demo');
    await expect(inProgress.getByText('Preparar la demo', { exact: true })).toBeHidden();
    await expect(taskCard(boardColumn(page, 'To do'), 'Preparar la demo')).toHaveCount(0);

    // La capa sigue al puntero.
    const next = { x: pointer.x + 30, y: pointer.y + 20 };
    await page.mouse.move(next.x, next.y, { steps: 5 });
    await expectUnderPointer(next);

    await page.mouse.up();
    await expect(overlay).toHaveCount(0);
  });

  test('003 CA-1.6 E-1 soltar en Done vacía: desaparece la frase de columna vacía y el recuento pasa a 1', async ({
    page,
  }) => {
    await openBoard(page);
    await seedBoard(page);
    const done = boardColumn(page, 'Done');
    await expect(done).toContainText('Nada terminado todavía');

    await dragCard(page, taskCard(page, 'Preparar la demo'), done, { fractionY: 0.5 });

    await expect(done).not.toContainText('Nada terminado todavía');
    await expectOrder(page, 'Done', ['Preparar la demo']);
    await expectCount(page, 'Done', 1);
  });

  test('003 CA-1.7 RF-005 soltar fuera de cualquier columna o pulsar Esc: vuelve a su sitio, sin guardar ni avisar', async ({
    page,
  }) => {
    await openBoard(page);
    await seedBoard(page);
    const moves = trackMoves(page);
    const card = taskCard(page, 'Preparar la demo');

    await test.step('soltar fuera', async () => {
      await dragCard(page, card, taskCard(boardColumn(page, 'In progress'), IN_PROGRESS[0]!), {
        drop: false,
      });
      await expect(boardColumn(page, 'In progress').locator('li').first()).toContainText(
        'Preparar la demo',
      );
      const outside = await pointIn(boardTitle(page));
      await page.mouse.move(outside.x, outside.y, { steps: 10 });
      await page.mouse.up();
      await expectOrder(page, 'To do', TODO);
      await expectOrder(page, 'In progress', IN_PROGRESS);
    });

    await test.step('Esc', async () => {
      await dragCard(page, card, taskCard(boardColumn(page, 'In progress'), IN_PROGRESS[0]!), {
        drop: false,
      });
      await expect(boardColumn(page, 'In progress').locator('li').first()).toContainText(
        'Preparar la demo',
      );
      await page.keyboard.press('Escape');
      await page.mouse.up();
      await expectOrder(page, 'To do', TODO);
      await expectOrder(page, 'In progress', IN_PROGRESS);
    });

    await expectNoNotice(page);
    expect(moves).toHaveLength(0);
  });

  test('003 E-21 RF-005 soltar fuera en el mismo instante en que sale de la columna: vuelve a su sitio, sin guardar', async ({
    page,
    channel,
  }) => {
    test.skip(channel === 'chrome', 'T-029: chromium y webkit');
    await openBoard(page);
    await seedBoard(page);
    const moves = trackMoves(page);
    const card = taskCard(page, 'Preparar la demo');
    const outside = await pointIn(boardTitle(page));

    for (let i = 1; i <= 6; i++) {
      await test.step(`vez ${i}`, async () => {
        await dragCard(page, card, taskCard(boardColumn(page, 'In progress'), IN_PROGRESS[0]!), {
          drop: false,
        });
        await expect(boardColumn(page, 'In progress').locator('li').first()).toContainText(
          'Preparar la demo',
        );

        // Sin esperar entre los dos: se suelta antes de que se pinte el movimiento (D-25).
        await Promise.all([page.mouse.move(outside.x, outside.y), page.mouse.up()]);

        await expect(dragOverlay(page, 'Preparar la demo')).toHaveCount(0);
        await expectOrder(page, 'To do', TODO);
        await expectOrder(page, 'In progress', IN_PROGRESS);
        expect(moves).toHaveLength(0);
      });
    }
  });

  test('003 CA-1.8 RF-006 un clic sin desplazar el puntero abre el detalle; arrastrar no lo abre', async ({
    page,
  }) => {
    await openBoard(page);
    await seedBoard(page);
    const card = taskCard(page, 'Preparar la demo');

    // Un clic con 2 px de temblor sigue siendo un clic (D-6: el arrastre empieza a los 5 px).
    const { x, y } = await pointIn(card);
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 2, y + 1);
    await page.mouse.up();
    await expect(taskDialog(page)).toBeVisible();
    await expect(taskDialog(page).getByLabel('Título')).toHaveValue('Preparar la demo');
    await page.keyboard.press('Escape');
    await expect(taskDialog(page)).toBeHidden();

    await dragCard(page, card, taskCard(boardColumn(page, 'In progress'), IN_PROGRESS[0]!));
    await expectOrder(page, 'In progress', ['Preparar la demo', ...IN_PROGRESS]);
    await expect(taskDialog(page)).toBeHidden();
  });

  test('003 CA-1.11 RF-006 un clic en el asa abre el detalle: la tarjeta no se coge y la región viva sigue vacía', async ({
    page,
  }) => {
    await openBoard(page);
    await seedBoard(page);

    await moveHandle(page, 'Preparar la demo').click();

    await expect(taskDialog(page).getByLabel('Título')).toHaveValue('Preparar la demo');
    await expect(liveRegion(page)).toHaveText('');
    await page.keyboard.press('Escape');
    await expect(taskDialog(page)).toBeHidden();
    await expect(liveRegion(page)).toHaveText('');
    await expectOrder(page, 'To do', TODO);
  });

  test('003 RF-006 arrastrar desde el asa mueve la tarjeta y no abre el detalle', async ({
    page,
  }) => {
    await openBoard(page);
    await seedBoard(page);

    // Se coge por el asa, no por el centro: el centro de la capa queda más abajo que el puntero, y en
    // el cuarto superior de `dragCard` solo faltarían unos 3 px para pasar al otro lado de la tarjeta.
    await dragCard(
      page,
      moveHandle(page, 'Preparar la demo'),
      taskCard(boardColumn(page, 'In progress'), IN_PROGRESS[0]!),
      { fractionY: 0.1 },
    );

    await expectOrder(page, 'In progress', ['Preparar la demo', ...IN_PROGRESS]);
    await expect(taskDialog(page)).toBeHidden();
    await expect(liveRegion(page)).toHaveText('');
  });

  test('003 RF-017 D-24 con la tarjeta cogida con teclado, un clic en su asa abre el detalle, sin guardar, y el movimiento se cancela', async ({
    page,
  }) => {
    await openBoard(page);
    await seedBoard(page);
    const moves = trackMoves(page);
    const cancelled = 'Movimiento cancelado. «Preparar la demo» sigue en To do, posición 2 de 3.';
    const handle = moveHandle(page, 'Preparar la demo');

    await test.step('sin haberla movido', async () => {
      await tabTo(page, handle);
      await page.keyboard.press('Space');
      await expect(liveRegion(page)).toContainText('Has cogido');

      await handle.click();

      await expect(taskDialog(page).getByLabel('Título')).toHaveValue('Preparar la demo');
      await expect(taskDialog(page).getByRole('radio', { name: 'To do' })).toBeChecked();
      await expect(liveRegion(page)).toHaveText(cancelled);
      await page.keyboard.press('Escape');
      await expect(taskDialog(page)).toBeHidden();
    });

    await test.step('después de pasarla a otra columna', async () => {
      await tabTo(page, handle);
      await page.keyboard.press('Space');
      await page.keyboard.press('ArrowRight');
      await expect(liveRegion(page)).toHaveText('In progress, posición 1 de 4.');

      await handle.click();

      // Con el estado real, no el de la vista previa.
      await expect(taskDialog(page).getByLabel('Título')).toHaveValue('Preparar la demo');
      await expect(taskDialog(page).getByRole('radio', { name: 'To do' })).toBeChecked();
      await expect(liveRegion(page)).toHaveText(cancelled);
      await page.keyboard.press('Escape');
      await expect(taskDialog(page)).toBeHidden();
    });

    await expectOrder(page, 'To do', TODO);
    await expectOrder(page, 'In progress', IN_PROGRESS);
    await expect(taskCard(page, 'Preparar la demo')).toBeFocused();
    expect(moves).toHaveLength(0);
  });

  test('003 CA-1.9 E-7 RF-021 sin conexión al soltar: vuelve a To do, a su posición, con los recuentos de antes y el aviso', async ({
    page,
  }) => {
    await openBoard(page);
    await seedBoard(page);
    await page.route('**/api/tasks/*/move', (route) => route.abort('internetdisconnected'));

    await dragCard(
      page,
      taskCard(page, 'Preparar la demo'),
      taskCard(boardColumn(page, 'In progress'), IN_PROGRESS[0]!),
    );

    await expect(page.getByText(MOVE_ERROR)).toBeVisible();
    await expectOrder(page, 'To do', TODO);
    await expectOrder(page, 'In progress', IN_PROGRESS);
    await expectCount(page, 'To do', 3);
    await expectCount(page, 'In progress', 3);
  });

  test('003 CA-1.4 RF-003 con ratón, una retrasada soltada en Done pierde «Retrasada» y muestra la fecha de hoy, sin abrir el detalle', async ({
    page,
  }) => {
    await openBoard(page);
    await createTaskViaApi(
      page,
      { title: 'Preparar la demo', estimatedEndDate: isoDaysFromToday(-3) },
      'in_progress',
    );
    await reloadBoard(page);
    const today = isoDaysFromToday(0);
    await expect(taskCard(page, 'Preparar la demo')).toContainText('Retrasada');
    const saved = moveResponse(page);

    await dragCard(page, taskCard(page, 'Preparar la demo'), boardColumn(page, 'Done'), {
      fractionY: 0.5,
    });

    expect((await saved).status()).toBe(200);
    const inDone = taskCard(boardColumn(page, 'Done'), 'Preparar la demo');
    await expect(inDone).toContainText(`Fecha real de fin: ${shortDate(today)}`);
    await expect(inDone).not.toContainText('Retrasada');
    await expect(taskDialog(page)).toBeHidden();
    expect((await taskViaApi(page, 'Preparar la demo')).actualEndDate).toBe(today);
  });

  test('003 CA-1.5 RF-004 con ratón, de Done a To do se queda sin fecha real de fin', async ({
    page,
  }) => {
    await openBoard(page);
    await createTaskViaApi(page, { title: 'Preparar la demo' }, 'done');
    await seedBoard(page, { todo: ['Comprar pan'] });
    const inDone = taskCard(boardColumn(page, 'Done'), 'Preparar la demo');
    await expect(inDone).toContainText('Fecha real de fin');
    const saved = moveResponse(page);

    await dragCard(page, inDone, taskCard(boardColumn(page, 'To do'), 'Comprar pan'));

    expect((await saved).status()).toBe(200);
    await expectOrder(page, 'To do', ['Preparar la demo', 'Comprar pan']);
    await expect(taskCard(boardColumn(page, 'To do'), 'Preparar la demo')).not.toContainText(
      'Fecha real de fin',
    );
    expect((await taskViaApi(page, 'Preparar la demo')).actualEndDate).toBeNull();
  });

  test('003 CA-1.10 RF-022 borrada en otra pestaña: al arrastrarla con ratón, aviso y la tarjeta desaparece', async ({
    page,
  }) => {
    await openBoard(page);
    await seedBoard(page);
    await deleteTaskViaApi(page, 'Preparar la demo');
    const answered = moveResponse(page);

    await dragCard(
      page,
      taskCard(page, 'Preparar la demo'),
      taskCard(boardColumn(page, 'In progress'), IN_PROGRESS[0]!),
    );

    expect((await answered).status()).toBe(404);
    await expect(page.getByText('Esta tarea ya no existe.')).toBeVisible();
    await expect(taskCard(page, 'Preparar la demo')).toHaveCount(0);
    await expectOrder(page, 'To do', ['Comprar pan', 'Llamar al banco']);
    await expectOrder(page, 'In progress', IN_PROGRESS);
    await expectCount(page, 'To do', 2);
    await expectCount(page, 'In progress', 3);
  });

  test('003 E-17 cambiar el tamaño de la ventana a mitad de arrastre lo cancela, sin guardar', async ({
    page,
  }) => {
    await openBoard(page);
    await seedBoard(page);
    const moves = trackMoves(page);

    await dragCard(
      page,
      taskCard(page, 'Preparar la demo'),
      taskCard(boardColumn(page, 'In progress'), IN_PROGRESS[0]!),
      { drop: false },
    );
    await expect(dragOverlay(page, 'Preparar la demo')).toBeVisible();
    await page.setViewportSize({ width: 1024, height: 900 });

    // Se cancela solo, antes de soltar.
    await expect(dragOverlay(page, 'Preparar la demo')).toHaveCount(0);
    await page.mouse.up();
    await expectOrder(page, 'To do', TODO);
    await expectOrder(page, 'In progress', IN_PROGRESS);
    expect(moves).toHaveLength(0);
  });

  test('003 E-18 con el detalle abierto, ni el ratón ni el Tab llegan a una tarjeta o a un asa', async ({
    page,
  }) => {
    await openBoard(page);
    await seedBoard(page);
    const moves = trackMoves(page);
    await taskCard(page, 'Comprar pan').click();
    // Con un cambio sin guardar, un clic fuera pregunta y el diálogo sigue abierto (002/CA-3.3).
    await taskDialog(page).getByLabel('Título').fill('Comprar pan integral');

    await test.step('Tab', async () => {
      for (let i = 0; i < 15; i++) {
        await page.keyboard.press(tabKey(page));
        const onBoard = await page.evaluate(
          () => document.activeElement?.closest('[data-task-id], [data-task-handle]') != null,
        );
        expect(onBoard, `Tab ${i + 1}`).toBe(false);
      }
    });

    await test.step('ratón', async () => {
      await dragCard(
        page,
        taskCard(page, 'Preparar la demo'),
        taskCard(boardColumn(page, 'In progress'), IN_PROGRESS[0]!),
      );
      await expect(taskDialog(page)).toBeVisible();
      await expectOrder(page, 'To do', TODO);
      await expectOrder(page, 'In progress', IN_PROGRESS);
      expect(moves).toHaveLength(0);
    });
  });
});

test.describe('ratón: dentro de una columna', () => {
  test('003 CA-2.1 CA-2.2 RF-007 RF-008 soltar «Preparar la demo» encima de «Comprar pan»: pasa a la primera y el orden se ve igual desde otro navegador', async ({
    page,
    browser,
  }, info) => {
    const email = await openBoard(page);
    const order = ['Comprar pan', 'Llamar al banco', 'Preparar la demo'];
    await seedBoard(page, { todo: order });
    const reordered = ['Preparar la demo', 'Comprar pan', 'Llamar al banco'];

    await dragCard(page, taskCard(page, 'Preparar la demo'), taskCard(page, 'Comprar pan'));

    await expectOrder(page, 'To do', reordered);
    await expectCount(page, 'To do', 3);

    // CA-2.2: al volver a cargar y desde otro navegador con la misma cuenta.
    await reloadBoard(page);
    await expectOrder(page, 'To do', reordered);
    const other = await browser.newContext({
      baseURL: info.project.use.baseURL,
      ignoreHTTPSErrors: true,
    });
    const otherPage = await other.newPage();
    await otherPage.setViewportSize(DESKTOP);
    await otherPage.goto('/login');
    await submitCredentials(otherPage, email);
    await expectPrivateArea(otherPage, email);
    await expectOrder(otherPage, 'To do', reordered);
    await other.close();
  });

  test('003 CA-2.5 RF-011 soltar en el mismo sitio del que salió: nada cambia, sin petición ni aviso', async ({
    page,
  }) => {
    await openBoard(page);
    await seedBoard(page);
    const moves = trackMoves(page);
    const card = taskCard(page, 'Preparar la demo');
    const origin = await pointIn(card);

    await test.step('sin salir de su hueco', async () => {
      await page.mouse.move(origin.x, origin.y);
      await page.mouse.down();
      await page.mouse.move(origin.x, origin.y + 15, { steps: 5 });
      await expect(dragOverlay(page, 'Preparar la demo')).toBeVisible();
      await page.mouse.move(origin.x, origin.y, { steps: 5 });
      await page.mouse.up();
      await expect(dragOverlay(page, 'Preparar la demo')).toHaveCount(0);
      await expectOrder(page, 'To do', TODO);
    });

    await test.step('saliendo a otra columna y volviendo', async () => {
      await dragCard(page, card, taskCard(boardColumn(page, 'In progress'), IN_PROGRESS[0]!), {
        drop: false,
      });
      await expect(boardColumn(page, 'In progress').locator('li').first()).toContainText(
        'Preparar la demo',
      );
      // Un poco por encima del centro: al volver, «Llamar al banco» ocupa el hueco, y justo en su centro
      // daría igual antes que después (D-9).
      await page.mouse.move(origin.x, origin.y - 8, { steps: 15 });
      await page.mouse.move(origin.x + 1, origin.y - 8);
      await expect(boardColumn(page, 'To do').locator('li')).toHaveCount(3);
      await page.mouse.up();
      await expect(dragOverlay(page, 'Preparar la demo')).toHaveCount(0);
      await expectOrder(page, 'To do', TODO);
    });

    await expectNoNotice(page);
    expect(moves).toHaveLength(0);
  });

  test('003 RF-007 D-9 con un título de 200 caracteres entre tarjetas cortas y el puntero casi quieto sobre otra tarjeta: la vista previa no oscila', async ({
    page,
    channel,
  }) => {
    test.skip(channel === 'chrome', 'T-041: chromium y webkit');
    const long = 'Revisar '.repeat(25).trim().padEnd(200, 'x');
    await openBoard(page);
    await seedBoard(page, { todo: ['Corta uno', long, 'Corta dos'] });

    // Cada fotograma, el orden de To do. Un cambio puede ser cruzar el centro una vez; dos ya son ir y
    // volver.
    const orderChanges = (ms: number) =>
      page.evaluate(
        (ms) =>
          new Promise<number>((resolve) => {
            const start = performance.now();
            const orderNow = () =>
              [...document.querySelectorAll('section[aria-label^="To do,"] li [data-task-id]')]
                .map((card) => card.textContent?.slice(0, 9))
                .join('|');
            let last = orderNow();
            let changes = 0;
            const sample = () => {
              const now = orderNow();
              if (now !== last) changes += 1;
              last = now;
              if (performance.now() - start < ms) requestAnimationFrame(sample);
              else resolve(changes);
            };
            requestAnimationFrame(sample);
          }),
        ms,
      );

    async function holdOver(moving: string, over: string) {
      const rect = (await taskCard(page, over).boundingBox())!;
      await dragCard(page, taskCard(page, moving), taskCard(page, over), { drop: false });
      await expect(dragOverlay(page, moving)).toBeVisible();
      for (const fraction of [0.1, 0.3, 0.5, 0.7, 0.9]) {
        await test.step(`${moving.slice(0, 9)}, a ${fraction} de ${over.slice(0, 9)}`, async () => {
          const x = rect.x + rect.width / 2;
          const y = rect.y + rect.height * fraction;
          await page.mouse.move(x, y, { steps: 5 });
          await page.waitForTimeout(100);
          const changes = orderChanges(500);
          for (let i = 0; i < 30; i++) {
            await page.mouse.move(x + (i % 2 ? 1 : -1), y + (i % 3) - 1);
          }
          expect(await changes).toBeLessThanOrEqual(1);
        });
      }
      await page.keyboard.press('Escape');
      await page.mouse.up();
      await expect(dragOverlay(page, moving)).toHaveCount(0);
    }

    await holdOver('Corta uno', long);
    await holdOver(long, 'Corta dos');
  });

  test('003 RF-007 D-9 el puntero salta varias tarjetas y se queda quieto: el hueco queda al lado de la tarjeta de debajo', async ({
    page,
    channel,
  }) => {
    test.skip(channel === 'chrome', 'T-044: chromium y webkit');
    const titles = ['Uno', 'Dos', 'Tres', 'Cuatro', 'Cinco'];
    await openBoard(page);
    await seedBoard(page, { todo: titles });

    // De un solo salto, sin pasos intermedios, y el puntero sigue moviéndose apenas sobre el mismo sitio.
    async function jump(moving: string, over: string, fractionY: number) {
      const to = await pointIn(taskCard(page, over), fractionY);
      const from = await pointIn(taskCard(page, moving));
      await page.mouse.move(from.x, from.y);
      await page.mouse.down();
      await page.mouse.move(from.x, from.y + (fractionY < 0.5 ? 10 : -10), { steps: 5 });
      await expect(dragOverlay(page, moving)).toBeVisible();
      await page.mouse.move(to.x, to.y);
      await page.waitForTimeout(100);
      await page.mouse.move(to.x + 1, to.y);
    }

    await test.step('hacia abajo, antes del centro de «Cinco»', async () => {
      await jump('Uno', 'Cinco', 0.25);
      await expectOrder(page, 'To do', ['Dos', 'Tres', 'Cuatro', 'Uno', 'Cinco']);
      await page.keyboard.press('Escape');
      await page.mouse.up();
      await expect(dragOverlay(page, 'Uno')).toHaveCount(0);
      await expectOrder(page, 'To do', titles);
    });

    await test.step('hacia arriba, después del centro de «Uno»', async () => {
      await jump('Cinco', 'Uno', 0.75);
      await expectOrder(page, 'To do', ['Uno', 'Cinco', 'Dos', 'Tres', 'Cuatro']);
      await page.keyboard.press('Escape');
      await page.mouse.up();
      await expect(dragOverlay(page, 'Cinco')).toHaveCount(0);
      await expectOrder(page, 'To do', titles);
    });
  });

  test('003 RF-007 D-9 hacia abajo, tocar la siguiente sin llegar a su centro no cambia el orden, y cruzarlo, sí', async ({
    page,
    channel,
  }) => {
    test.skip(channel === 'chrome', 'T-044: chromium y webkit');
    await openBoard(page);
    await seedBoard(page);
    const moves = trackMoves(page);
    const moving = taskCard(page, 'Comprar pan');
    const next = taskCard(page, 'Preparar la demo');

    const before = await pointIn(next, 0.25);
    await dragCard(page, moving, before, { drop: false });
    await expect(dragOverlay(page, 'Comprar pan')).toBeVisible();
    await page.waitForTimeout(100);
    await page.mouse.move(before.x, before.y);
    await expectOrder(page, 'To do', TODO);

    const after = await pointIn(next, 0.75);
    await page.mouse.move(after.x, after.y, { steps: 5 });
    await page.mouse.move(after.x + 1, after.y);
    await expectOrder(page, 'To do', ['Preparar la demo', 'Comprar pan', 'Llamar al banco']);

    await page.mouse.up();
    await expect(dragOverlay(page, 'Comprar pan')).toHaveCount(0);
    await expectOrder(page, 'To do', ['Preparar la demo', 'Comprar pan', 'Llamar al banco']);
    await expect.poll(() => moves.length).toBe(1);
    expect(moves[0]!.postDataJSON()).toMatchObject({ status: 'todo', index: 1 });
  });

  test('003 CA-2.6 RF-021 sin conexión al reordenar con ratón: la columna vuelve al orden de antes, con el aviso', async ({
    page,
  }) => {
    await openBoard(page);
    await seedBoard(page);
    await page.route('**/api/tasks/*/move', (route) => route.abort('internetdisconnected'));
    const moves = trackMoves(page);

    await dragCard(page, taskCard(page, 'Preparar la demo'), taskCard(page, 'Comprar pan'));

    await expect(page.getByText(MOVE_ERROR)).toBeVisible();
    await expectOrder(page, 'To do', TODO);
    await expectCount(page, 'To do', 3);
    expect(moves).toHaveLength(1);
  });
});

test.describe('ratón a 375', () => {
  test('003 RF-019 con ratón, reordena la columna visible, y soltar sobre el selector de estados no guarda', async ({
    page,
  }) => {
    await openBoard(page, MOBILE);
    await seedBoard(page);
    await columnPicker(page, 'To do').check();
    const moves = trackMoves(page);

    await test.step('soltar sobre el selector de estados', async () => {
      await dragCard(page, taskCard(page, 'Preparar la demo'), columnPicker(page, 'In progress'), {
        drop: false,
        fractionY: 0.5,
      });
      await expect(dragOverlay(page, 'Preparar la demo')).toBeVisible();
      await page.mouse.up();

      await expect(dragOverlay(page, 'Preparar la demo')).toHaveCount(0);
      await expectOrder(page, 'To do', TODO);
      await expect(columnPicker(page, 'To do')).toBeChecked();
      await expect(columnPicker(page, 'In progress')).toHaveAccessibleName('In progress · 3');
      await expectNoNotice(page);
      expect(moves).toHaveLength(0);
    });

    await test.step('reordenar la columna visible', async () => {
      const saved = moveResponse(page);

      await dragCard(page, taskCard(page, 'Llamar al banco'), taskCard(page, 'Comprar pan'));

      const response = await saved;
      expect(response.status()).toBe(200);
      expect(response.request().postDataJSON()).toEqual({
        status: 'todo',
        index: 0,
        today: isoDaysFromToday(0),
      });
      await expectOrder(page, 'To do', ['Llamar al banco', 'Comprar pan', 'Preparar la demo']);
      await reloadBoard(page);
      await columnPicker(page, 'To do').check();
      await expectOrder(page, 'To do', ['Llamar al banco', 'Comprar pan', 'Preparar la demo']);
    });
  });
});

test.describe('dedo', () => {
  // R-6: CDP en los proyectos Chromium y `TouchEvent` sintéticos en WebKit.
  test.use({ hasTouch: true });

  test('003 CA-4.1 RF-018 RNF-004 a 1280, mantener el dedo sobre «Preparar la demo» y soltarla en In progress: como con el ratón', async ({
    page,
  }) => {
    await openBoard(page);
    await seedBoard(page, { todo: ['Preparar la demo', 'Comprar pan'], in_progress: IN_PROGRESS });

    await touchDragCard(
      page,
      taskCard(page, 'Preparar la demo'),
      taskCard(boardColumn(page, 'In progress'), IN_PROGRESS[0]!),
    );

    await expectOrder(page, 'In progress', ['Preparar la demo', ...IN_PROGRESS]);
    await expectCount(page, 'To do', 1);
    await expectCount(page, 'In progress', 4);
    await reloadBoard(page);
    await expectOrder(page, 'In progress', ['Preparar la demo', ...IN_PROGRESS]);
  });

  test('003 E-21 RF-005 D-33 con el dedo, ya en otra columna, soltar fuera en el mismo instante en que sale: vuelve a su sitio, sin guardar', async ({
    page,
    channel,
  }) => {
    test.skip(channel === 'chrome', 'T-045: chromium y webkit');
    await openBoard(page);
    await seedBoard(page);
    const moves = trackMoves(page);
    const finger = await touchFinger(page);
    const outside = await pointIn(boardTitle(page));

    await touchDragCard(
      page,
      taskCard(page, 'Preparar la demo'),
      taskCard(boardColumn(page, 'In progress'), IN_PROGRESS[0]!),
      { drop: false, finger },
    );
    await expect(boardColumn(page, 'In progress').locator('li').first()).toContainText(
      'Preparar la demo',
    );

    // Sin esperar entre los dos: se levanta el dedo antes de que se pinte el movimiento (D-25).
    await Promise.all([finger('touchMove', outside), finger('touchEnd', outside)]);

    await expect(dragOverlay(page, 'Preparar la demo')).toHaveCount(0);
    await expectOrder(page, 'To do', TODO);
    await expectOrder(page, 'In progress', IN_PROGRESS);
    await expectNoNotice(page);
    expect(moves).toHaveLength(0);
  });

  test('003 CA-4.1 D-33 con el dedo, soltar dentro de In progress tras cambiar de columna: se guarda', async ({
    page,
    channel,
  }) => {
    test.skip(channel === 'chrome', 'T-045: chromium y webkit');
    await openBoard(page);
    await seedBoard(page);
    const moves = trackMoves(page);
    const finger = await touchFinger(page);

    const end = await touchDragCard(
      page,
      taskCard(page, 'Preparar la demo'),
      taskCard(boardColumn(page, 'In progress'), IN_PROGRESS[0]!),
      { drop: false, finger },
    );
    await expect(boardColumn(page, 'In progress').locator('li').first()).toContainText(
      'Preparar la demo',
    );
    await finger('touchEnd', end);

    await expect(dragOverlay(page, 'Preparar la demo')).toHaveCount(0);
    await expectOrder(page, 'In progress', ['Preparar la demo', ...IN_PROGRESS]);
    await expect.poll(() => moves.length).toBe(1);
    await reloadBoard(page);
    await expectOrder(page, 'In progress', ['Preparar la demo', ...IN_PROGRESS]);
  });

  test('003 CA-4.2 RF-018 a 375, deslizar el dedo sin mantenerlo hace scroll y no arrastra', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === 'webkit', 'R-6: un TouchEvent sintético no hace scroll');
    await openBoard(page, MOBILE);
    const titles = Array.from({ length: 12 }, (_, i) => `Tarea ${String(i + 1).padStart(2, '0')}`);
    await seedBoard(page, { todo: titles });
    await columnPicker(page, 'To do').check();
    const moves = trackMoves(page);

    const start = await pointIn(taskCard(page, 'Tarea 04'));
    await touchSwipe(page, start, { x: start.x, y: start.y - 300 });

    // El scroll es de `main` (002: la cabecera queda fija), no de la ventana.
    await expect
      .poll(() => page.locator('main').evaluate((element) => element.scrollTop))
      .toBeGreaterThan(0);
    await expect(dragOverlay(page, 'Tarea 04')).toHaveCount(0);
    await expectOrder(page, 'To do', titles);
    expect(moves).toHaveLength(0);
  });

  test('003 CA-4.3 RF-019 a 375, mantener el dedo sobre la tercera de To do y soltarla encima de la primera: pasa a ser la primera', async ({
    page,
  }) => {
    await openBoard(page, MOBILE);
    await seedBoard(page);
    await columnPicker(page, 'To do').check();

    await touchDragCard(page, taskCard(page, 'Llamar al banco'), taskCard(page, 'Comprar pan'));

    await expectOrder(page, 'To do', ['Llamar al banco', 'Comprar pan', 'Preparar la demo']);
    await reloadBoard(page);
    await columnPicker(page, 'To do').check();
    await expectOrder(page, 'To do', ['Llamar al banco', 'Comprar pan', 'Preparar la demo']);
  });

  test('003 CA-4.4 RF-006 a 375, tocar una tarjeta sin mantener el dedo abre el detalle como panel inferior', async ({
    page,
  }) => {
    await openBoard(page, MOBILE);
    await seedBoard(page);
    await columnPicker(page, 'To do').check();

    await taskCard(page, 'Preparar la demo').tap();

    const dialog = taskDialog(page);
    await expect(dialog.getByLabel('Título')).toHaveValue('Preparar la demo');
    const panel = await dialog.boundingBox();
    expect(panel!.width).toBeCloseTo(MOBILE.width, 0);
    expect(panel!.y + panel!.height).toBeCloseTo(MOBILE.height, 0);
  });

  test('003 CA-4.6 RF-006 a 375, tocar el asa sin mantener el dedo abre el detalle como panel inferior y no coge la tarjeta', async ({
    page,
  }) => {
    await openBoard(page, MOBILE);
    await seedBoard(page);
    await columnPicker(page, 'To do').check();

    await moveHandle(page, 'Preparar la demo').tap();

    const dialog = taskDialog(page);
    await expect(dialog.getByLabel('Título')).toHaveValue('Preparar la demo');
    const panel = await dialog.boundingBox();
    expect(panel!.width).toBeCloseTo(MOBILE.width, 0);
    expect(panel!.y + panel!.height).toBeCloseTo(MOBILE.height, 0);
    await expect(liveRegion(page)).toHaveText('');
  });

  test('003 CA-4.5 RF-005 RF-019 a 375, soltar con el dedo sobre el selector de estados o fuera de la columna: vuelve, sin guardar ni avisar', async ({
    page,
  }) => {
    await openBoard(page, MOBILE);
    await seedBoard(page);
    await columnPicker(page, 'To do').check();
    const moves = trackMoves(page);
    const card = taskCard(page, 'Preparar la demo');

    for (const [name, target] of [
      ['selector de estados', columnPicker(page, 'In progress')],
      ['fuera de la columna', boardTitle(page)],
    ] as const) {
      await test.step(name, async () => {
        const finger = await touchFinger(page);
        const end = await touchDragCard(page, card, target, {
          drop: false,
          fractionY: 0.5,
          finger,
        });
        await expect(dragOverlay(page, 'Preparar la demo')).toBeVisible();
        await finger('touchEnd', end);
        await expect(dragOverlay(page, 'Preparar la demo')).toHaveCount(0);
        await expectOrder(page, 'To do', TODO);
      });
    }

    await expect(columnPicker(page, 'In progress')).toHaveAccessibleName('In progress · 3');
    await expectNoNotice(page);
    expect(moves).toHaveLength(0);
  });
});

test.describe('a 375, soltar sobre «Crear tarea»', () => {
  test.use({ hasTouch: true });

  // Con dos dígitos: `expectOrder` compara por el principio del título.
  const TWELVE = Array.from({ length: 12 }, (_, i) => `Tarea ${String(i + 1).padStart(2, '0')}`);

  // Lleva la tarjeta y devuelve cómo soltarla.
  const INPUTS = [
    {
      name: 'con ratón',
      async drag(page: Page, title: string) {
        await dragCard(page, taskCard(page, title), createTaskButton(page), {
          drop: false,
          fractionY: 0.5,
        });
        return () => page.mouse.up();
      },
    },
    {
      name: 'con el dedo',
      async drag(page: Page, title: string) {
        const finger = await touchFinger(page);
        const end = await touchDragCard(page, taskCard(page, title), createTaskButton(page), {
          drop: false,
          fractionY: 0.5,
          finger,
        });
        return () => finger('touchEnd', end);
      },
    },
  ];

  // D-35: con la columna debajo, la página hace scroll sola y el hueco se mueve hasta el último momento,
  // así que el orden se lee en la fase de captura del mismo evento de soltar.
  const recordOrderOnRelease = (page: Page) =>
    page.evaluate(() => {
      const state = window as Window & { e2eOrderAtDrop?: string[] };
      const record = () => {
        state.e2eOrderAtDrop = [
          ...document.querySelectorAll('section[aria-label^="To do,"] li [data-task-id]'),
        ].map((card) => card.textContent ?? '');
      };
      window.addEventListener('mouseup', record, { capture: true, once: true });
      window.addEventListener('touchend', record, { capture: true, once: true });
    });
  const orderAtDrop = (page: Page) =>
    page.evaluate(() => (window as Window & { e2eOrderAtDrop?: string[] }).e2eOrderAtDrop ?? []);

  for (const { name, drag } of INPUTS) {
    test(`003 CA-4.7 RF-019 ${name}, con 12 tarjetas y la columna debajo: se guarda donde marcaba el hueco, sin abrir el diálogo de crear`, async ({
      page,
    }) => {
      await openBoard(page, MOBILE);
      await seedBoard(page, { todo: TWELVE });
      await columnPicker(page, 'To do').check();
      const moves = trackMoves(page);

      const release = await drag(page, TWELVE[0]!);
      await expect(dragOverlay(page, TWELVE[0]!)).toBeVisible();
      await recordOrderOnRelease(page);
      await release();
      await expect(dragOverlay(page, TWELVE[0]!)).toHaveCount(0);

      const order = await orderAtDrop(page);
      expect(order).toHaveLength(12);
      expect(order[0]).not.toContain(TWELVE[0]!);
      await expect.poll(() => moves.length).toBe(1);
      await expect(cardsIn(page, 'To do')).toHaveText(order);
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await reloadBoard(page);
      await columnPicker(page, 'To do').check();
      await expect(cardsIn(page, 'To do')).toHaveText(order);
    });

    test(`003 CA-4.7 RF-019 ${name}, con 3 tarjetas y la columna terminada antes del botón: vuelve, sin guardar ni avisar`, async ({
      page,
    }) => {
      await openBoard(page, MOBILE);
      await seedBoard(page);
      await columnPicker(page, 'To do').check();
      const moves = trackMoves(page);

      const release = await drag(page, 'Preparar la demo');
      await expect(dragOverlay(page, 'Preparar la demo')).toBeVisible();
      await release();
      await expect(dragOverlay(page, 'Preparar la demo')).toHaveCount(0);

      await expectOrder(page, 'To do', TODO);
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await expectNoNotice(page);
      expect(moves).toHaveLength(0);
    });
  }
});

test.describe('móvil con teclado', () => {
  test('003 CA-3.9 CA-3.10 RF-023 a 375, Flecha derecha muestra In progress y la marca en el selector; Esc vuelve a To do', async ({
    page,
  }) => {
    await openBoard(page, MOBILE);
    await seedBoard(page);
    await columnPicker(page, 'To do').check();
    const handle = moveHandle(page, 'Preparar la demo');

    await tabTo(page, handle);
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowRight');

    // CA-3.9
    await expect(liveRegion(page)).toHaveText('In progress, posición 1 de 4.');
    await expect(columnPicker(page, 'In progress')).toBeChecked();
    await expect(boardColumn(page, 'In progress')).toBeVisible();
    await expect(boardColumn(page, 'To do')).toBeHidden();
    await expectOrder(page, 'In progress', ['Preparar la demo', ...IN_PROGRESS]);
    await expect(handle).toBeFocused();

    // CA-3.10
    await page.keyboard.press('Escape');
    await expect(liveRegion(page)).toHaveText(
      'Movimiento cancelado. «Preparar la demo» sigue en To do, posición 2 de 3.',
    );
    await expect(columnPicker(page, 'To do')).toBeChecked();
    await expect(boardColumn(page, 'To do')).toBeVisible();
    await expect(boardColumn(page, 'In progress')).toBeHidden();
    await expectOrder(page, 'To do', TODO);
  });
});

test.describe('teclado: la tarea ya no existe', () => {
  test.skip(({ channel }) => channel === 'chrome', 'T-030: chromium y webkit');

  test('003 CA-3.12 RF-022 borrada en otra pestaña: al soltar con teclado, aviso, la tarjeta desaparece y el foco pasa a «Crear tarea»', async ({
    page,
  }) => {
    await openBoard(page);
    await seedBoard(page);
    const handle = moveHandle(page, 'Preparar la demo');
    await tabTo(page, handle);
    await deleteTaskViaApi(page, 'Preparar la demo');

    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowRight');
    await expect(liveRegion(page)).toHaveText('In progress, posición 1 de 4.');
    await page.keyboard.press('Space');

    await expect(page.getByText('Esta tarea ya no existe.')).toBeVisible();
    await expect(taskCard(page, 'Preparar la demo')).toHaveCount(0);
    await expect(createTaskButton(page)).toBeFocused();
  });
});

test.describe('teclado: la tarjeta cogida sigue a la vista', () => {
  test.skip(({ channel }) => channel === 'chrome', 'T-027: chromium y webkit');

  const TWELVE = Array.from({ length: 12 }, (_, i) => `Tarea ${String(i + 1).padStart(2, '0')}`);

  // RF-024: entera dentro de lo que hace scroll (la lista o `main`), con el foco en el asa y sin nada
  // encima. Sin esperas: `instant` ya ha acabado cuando se anuncia el paso.
  async function expectInView(page: Page, title: string, scroller: 'ul' | 'main', step: string) {
    const handle = moveHandle(page, title);
    await expect(handle, step).toBeFocused();
    const seen = await handle.evaluate((element, scrollerSelector) => {
      const card = element.parentElement!.getBoundingClientRect();
      const box = element.closest(scrollerSelector)!.getBoundingClientRect();
      const rect = element.getBoundingClientRect();
      const onTop = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
      return {
        above: box.top - card.top,
        below: card.bottom - Math.min(box.bottom, window.innerHeight),
        left: box.left - card.left,
        right: card.right - Math.min(box.right, window.innerWidth),
        handleOnTop: onTop?.closest('[data-task-handle]') === element,
      };
    }, scroller);
    expect(seen.above, `${step}: por arriba`).toBeLessThanOrEqual(1);
    expect(seen.below, `${step}: por abajo`).toBeLessThanOrEqual(1);
    expect(seen.left, `${step}: por la izquierda`).toBeLessThanOrEqual(1);
    expect(seen.right, `${step}: por la derecha`).toBeLessThanOrEqual(1);
    expect(seen.handleOnTop, `${step}: el asa no está tapada`).toBe(true);
  }

  // C-20: la lista recorta, y el anillo de foco necesita 4 px alrededor del asa (`outline` 2 + `offset` 2).
  // Con la tarjeta ya escalada: a mitad de la transición sobraría sitio.
  async function expectRingRoom(page: Page, title: string, step: string) {
    const room = await moveHandle(page, title).evaluate(async (handle) => {
      await Promise.allSettled(handle.parentElement!.getAnimations().map((a) => a.finished));
      const rect = handle.getBoundingClientRect();
      const list = handle.closest('ul')!.getBoundingClientRect();
      return {
        arriba: rect.top - list.top,
        abajo: list.bottom - rect.bottom,
        izquierda: rect.left - list.left,
        derecha: list.right - rect.right,
      };
    });
    for (const [side, px] of Object.entries(room)) {
      expect(px, `${step}: sitio para el anillo por ${side}`).toBeGreaterThanOrEqual(4);
    }
  }

  async function walkColumn(
    page: Page,
    scroller: 'ul' | 'main',
    afterStep?: (step: string) => Promise<void>,
  ) {
    const title = TWELVE[0]!;
    await tabTo(page, moveHandle(page, title));
    await page.keyboard.press('Space');
    await expect(liveRegion(page)).toContainText(`Has cogido «${title}»`);
    await expectInView(page, title, scroller, 'al cogerla');
    await afterStep?.('al cogerla');

    for (const [key, positions] of [
      ['ArrowDown', [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]],
      ['ArrowUp', [11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]],
    ] as const) {
      for (const [i, position] of positions.entries()) {
        await page.keyboard.press(key);
        await expect(liveRegion(page)).toHaveText(`To do, posición ${position} de 12.`);
        await expectInView(page, title, scroller, `${key} ${i + 1}, posición ${position}`);
        await afterStep?.(`${key} ${i + 1}, posición ${position}`);
      }
    }
    await page.keyboard.press('Escape');
  }

  for (const width of [768, 1023]) {
    test(`003 RNF-001 C-20 a ${width}, con la tarjeta cogida, primera y última: sitio para el anillo de foco del asa dentro de la lista`, async ({
      page,
      channel,
    }) => {
      test.skip(channel === 'chrome', 'T-042: chromium y webkit');
      await openBoard(page, { width, height: 900 });
      await seedBoard(page);

      for (const title of [TODO[0]!, TODO.at(-1)!]) {
        await tabTo(page, moveHandle(page, title));
        await page.keyboard.press('Space');
        await expect(liveRegion(page)).toContainText(`Has cogido «${title}»`);
        await expectRingRoom(page, title, title);
        await page.keyboard.press('Escape');
      }
    });
  }

  test('003 CA-3.11 RNF-001 a 768, con 12 tarjetas: sitio para el anillo de foco en cada flecha', async ({
    page,
    channel,
  }) => {
    test.skip(channel === 'chrome', 'T-042: chromium y webkit');
    await openBoard(page, { width: 768, height: 900 });
    await seedBoard(page, { todo: TWELVE });

    await walkColumn(page, 'ul', (step) => expectRingRoom(page, TWELVE[0]!, step));
  });

  test('003 RNF-001 a 768 y 1023, el asa sigue midiendo 44 × 44', async ({ page, channel }) => {
    test.skip(channel === 'chrome', 'T-042: chromium y webkit');
    await openBoard(page, { width: 768, height: 900 });
    await seedBoard(page);
    const handle = moveHandle(page, TODO[0]!);

    for (const width of [768, 1023]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(handle).toBeVisible();
      const rect = await handle.boundingBox();
      expect(rect!.width).toBeCloseTo(44, 0);
      expect(rect!.height).toBeCloseTo(44, 0);
    }
  });

  test('003 E-6 RNF-001 a 768, con un título de 200 caracteres, el asa no tapa el texto', async ({
    page,
    channel,
  }) => {
    test.skip(channel === 'chrome', 'T-042: chromium y webkit');
    const long = 'Revisar '.repeat(25).trim().padEnd(200, 'x');
    await openBoard(page, { width: 768, height: 900 });
    await seedBoard(page, { todo: [long] });

    const overlap = await moveHandle(page, long).evaluate((handle) => {
      const rect = handle.getBoundingClientRect();
      const title = handle.previousElementSibling!.querySelector('span')!;
      const range = document.createRange();
      range.selectNodeContents(title);
      return [...range.getClientRects()].some(
        (line) => line.right > rect.left + 0.5 && line.top < rect.bottom && line.bottom > rect.top,
      );
    });
    expect(overlap).toBe(false);
  });

  for (const height of [900, 720]) {
    test(`003 CA-3.11 RF-024 a 1280 × ${height}, con 12 tarjetas: en cada flecha, la tarjeta dentro de la lista y el foco en el asa`, async ({
      page,
    }) => {
      await openBoard(page, { width: 1280, height });
      await seedBoard(page, { todo: TWELVE });

      await walkColumn(page, 'ul');
    });
  }

  test('003 CA-3.11 RF-024 a 375 × 812, con 12 tarjetas: en cada flecha, la tarjeta dentro de la ventana y «Crear tarea» no tapa el asa', async ({
    page,
  }) => {
    await openBoard(page, MOBILE);
    await seedBoard(page, { todo: TWELVE });
    await columnPicker(page, 'To do').check();

    await walkColumn(page, 'main');
  });

  test('003 CA-3.11 RF-024 al pasar a otra columna, la tarjeta también queda a la vista', async ({
    page,
  }) => {
    await test.step('a una lista con scroll', async () => {
      await openBoard(page, { width: 1280, height: 720 });
      const inProgress = Array.from({ length: 12 }, (_, i) => `Curso ${i + 1}`);
      await seedBoard(page, { todo: ['Preparar la demo'], in_progress: inProgress });
      await boardColumn(page, 'In progress')
        .getByRole('list')
        .evaluate((list) => list.scrollTo({ top: list.scrollHeight, behavior: 'instant' }));

      await tabTo(page, moveHandle(page, 'Preparar la demo'));
      await page.keyboard.press('Space');
      await page.keyboard.press('ArrowRight');

      await expect(liveRegion(page)).toHaveText('In progress, posición 1 de 13.');
      await expectInView(page, 'Preparar la demo', 'ul', 'Flecha derecha');
      await page.keyboard.press('Escape');
    });

    await test.step('a una columna fuera del tablero visible', async () => {
      await page.setViewportSize({ width: 768, height: 900 });
      const handle = moveHandle(page, 'Preparar la demo');
      await tabTo(page, handle);
      await page.keyboard.press('Space');
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowRight');

      await expect(liveRegion(page)).toHaveText('Done, posición 1 de 1.');
      await expectInView(page, 'Preparar la demo', 'ul', 'dos veces Flecha derecha');
      await page.keyboard.press('Escape');
    });
  });
});

test.describe('móvil con teclado: falla el guardado', () => {
  test.skip(({ channel }) => channel === 'chrome', 'T-031: chromium y webkit');

  test('003 CA-3.13 RF-023 RF-021 a 375, sin conexión al soltar en In progress: se ve To do, con la tarjeta en su sitio, el foco en el asa y el aviso', async ({
    page,
  }) => {
    await openBoard(page, MOBILE);
    await seedBoard(page);
    await columnPicker(page, 'To do').check();
    await page.route('**/api/tasks/*/move', (route) => route.abort('internetdisconnected'));
    const handle = moveHandle(page, 'Preparar la demo');

    await tabTo(page, handle);
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowRight');
    await expect(columnPicker(page, 'In progress')).toBeChecked();
    await page.keyboard.press('Space');

    await expect(page.getByText(MOVE_ERROR)).toBeVisible();
    await expect(columnPicker(page, 'To do')).toBeChecked();
    await expect(boardColumn(page, 'To do')).toBeVisible();
    await expect(boardColumn(page, 'In progress')).toBeHidden();
    await expectOrder(page, 'To do', TODO);
    await expect(handle).toBeVisible();
    await expect(handle).toBeFocused();
  });
});

test.describe('toda la API caída, no solo `…/move`', () => {
  test.skip(({ channel }) => channel === 'chrome', 'T-038: chromium y webkit');

  // D-29: el aviso no espera a volver a pedir la lista, que se reintenta unos 7 s.
  const AT_ONCE = { timeout: 1000 };
  const stopApi = (page: Page) =>
    page.route('**/api/**', (route) => route.abort('connectionrefused'));

  test('003 CA-1.12 RF-021 al soltar con ratón: la tarjeta en su sitio, los recuentos de antes y el aviso, sin esperar', async ({
    page,
  }) => {
    await openBoard(page);
    await seedBoard(page);
    await stopApi(page);

    await dragCard(
      page,
      taskCard(page, 'Preparar la demo'),
      taskCard(boardColumn(page, 'In progress'), IN_PROGRESS[0]!),
    );

    await expect(page.getByText(MOVE_ERROR)).toBeVisible(AT_ONCE);
    await expectOrder(page, 'To do', TODO);
    await expectOrder(page, 'In progress', IN_PROGRESS);
    await expectCount(page, 'To do', 3);
    await expectCount(page, 'In progress', 3);
  });

  test('003 CA-3.13 RF-023 RF-021 a 375, al soltar con teclado: se ve To do, el foco está en el asa y sale el aviso, sin esperar', async ({
    page,
  }) => {
    await openBoard(page, MOBILE);
    await seedBoard(page);
    await columnPicker(page, 'To do').check();
    const handle = moveHandle(page, 'Preparar la demo');
    await tabTo(page, handle);
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowRight');
    await expect(columnPicker(page, 'In progress')).toBeChecked();
    await stopApi(page);

    await page.keyboard.press('Space');

    await expect(page.getByText(MOVE_ERROR)).toBeVisible(AT_ONCE);
    await expect(columnPicker(page, 'To do')).toBeChecked(AT_ONCE);
    await expect(boardColumn(page, 'To do')).toBeVisible(AT_ONCE);
    await expect(handle).toBeFocused(AT_ONCE);
    await expectOrder(page, 'To do', TODO);
  });

  test('003 CA-1.12 RF-025 E-22 pasados los reintentos de la lista, el tablero y el aviso siguen a la vista, sin «Reintentar»', async ({
    page,
  }) => {
    await openBoard(page);
    await seedBoard(page);
    await stopApi(page);
    let failedListRequests = 0;
    page.on('requestfailed', (request) => {
      if (request.method() === 'GET' && new URL(request.url()).pathname === '/api/tasks') {
        failedListRequests++;
      }
    });

    await dragCard(
      page,
      taskCard(page, 'Preparar la demo'),
      taskCard(boardColumn(page, 'In progress'), IN_PROGRESS[0]!),
    );
    await expect(page.getByText(MOVE_ERROR)).toBeVisible(AT_ONCE);

    // withQueryClient: la petición y sus 3 reintentos (1 + 2 + 4 s). Después, margen para pintar.
    await expect.poll(() => failedListRequests, { timeout: 15_000 }).toBe(4);
    await page.waitForTimeout(500);

    await expect(boardTitle(page)).toBeVisible();
    await expect(page.getByText(MOVE_ERROR)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reintentar' })).toHaveCount(0);
    await expectOrder(page, 'To do', TODO);
    await expectCount(page, 'To do', 3);
    await expectCount(page, 'In progress', 3);
  });
});

test.describe('accesibilidad y aspecto', () => {
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`003 RNF-001 axe sin infracciones con una tarjeta cogida con teclado (${colorScheme})`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme });
      await openBoard(page);
      await seedBoard(page);

      await tabTo(page, moveHandle(page, 'Preparar la demo'));
      await page.keyboard.press('Space');
      await expect(liveRegion(page)).toContainText('Has cogido «Preparar la demo»');

      await expectNoAxeViolations(page);
    });

    test(`003 RNF-001 axe sin infracciones en pleno arrastre con puntero, con la capa y el hueco a la vista (${colorScheme})`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme });
      await openBoard(page);
      await seedBoard(page);
      const inProgress = boardColumn(page, 'In progress');

      await dragCard(
        page,
        taskCard(page, 'Preparar la demo'),
        taskCard(inProgress, IN_PROGRESS[0]!),
        { drop: false },
      );
      await expect(dragOverlay(page, 'Preparar la demo')).toBeVisible();
      await expect(inProgress.locator('li').first()).toContainText('Preparar la demo');
      await expect(inProgress.getByText('Preparar la demo', { exact: true })).toBeHidden();

      await expectNoAxeViolations(page);

      // Sigue en el aire: axe ha mirado la capa y el hueco, no el tablero en reposo.
      await expect(dragOverlay(page, 'Preparar la demo')).toBeVisible();
      await page.keyboard.press('Escape');
      await page.mouse.up();
    });
  }

  test('003 RNF-001 el asa mide 44 × 44 a 375 y 32 × 32 a 1280', async ({ page }) => {
    await openBoard(page, MOBILE);
    await createTaskViaApi(page, { title: 'Preparar la demo' });
    await reloadBoard(page);
    const handle = moveHandle(page, 'Preparar la demo');

    for (const [width, size] of [
      [375, 44],
      [1280, 32],
    ] as const) {
      await test.step(`${width} px`, async () => {
        await page.setViewportSize({ width, height: 900 });
        await expect(handle).toBeVisible();
        const rect = await handle.boundingBox();
        expect(rect!.width).toBeCloseTo(size, 0);
        expect(rect!.height).toBeCloseTo(size, 0);
      });
    }
  });

  test('003 RNF-001 con movimiento reducido, la tarjeta levantada no se escala', async ({
    page,
  }) => {
    await openBoard(page);
    await seedBoard(page);
    const card = taskCard(page, 'Preparar la demo');
    const target = taskCard(boardColumn(page, 'In progress'), IN_PROGRESS[0]!);
    const overlayScale = () =>
      dragOverlay(page, 'Preparar la demo').evaluate((element) => getComputedStyle(element).scale);

    // Sin preferencia, la capa sí tiene escala (motion-safe:scale-102): el selector es el bueno.
    await dragCard(page, card, target, { drop: false });
    await expect(dragOverlay(page, 'Preparar la demo')).toBeVisible();
    expect(await overlayScale()).not.toBe('none');
    await page.keyboard.press('Escape');
    await page.mouse.up();

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await dragCard(page, card, target, { drop: false });
    await expect(dragOverlay(page, 'Preparar la demo')).toBeVisible();
    expect(await overlayScale()).toBe('none');
    await page.keyboard.press('Escape');
    await page.mouse.up();
  });

  test('003 E-6 con un título de 200 caracteres, el hueco mide lo mismo que la tarjeta en reposo', async ({
    page,
  }) => {
    const title = 'Revisar '.repeat(25).trim().padEnd(200, 'x');
    await openBoard(page);
    await seedBoard(page, { todo: [title], in_progress: IN_PROGRESS });
    const atRest = await boardColumn(page, 'To do')
      .locator('li')
      .filter({ hasText: title })
      .boundingBox();

    await dragCard(
      page,
      taskCard(page, title),
      taskCard(boardColumn(page, 'In progress'), IN_PROGRESS[0]!),
      { drop: false },
    );

    const placeholder = boardColumn(page, 'In progress').locator('li').filter({ hasText: title });
    await expect(placeholder).toHaveCount(1);
    await expect(placeholder.getByText(title, { exact: true })).toBeHidden();
    const rect = await placeholder.boundingBox();
    expect(rect!.height).toBeCloseTo(atRest!.height, 0);
    await page.keyboard.press('Escape');
    await page.mouse.up();
  });
});

test.describe('margen del tablero', () => {
  test.skip(({ channel }) => channel === 'chrome', 'T-040: chromium y webkit');

  // El tablero es el contenedor con scroll horizontal de las columnas.
  const scrollingBoard = (page: Page) => boardColumn(page, 'Backlog').locator('xpath=..');

  // D-31: un punto del margen de la página, a la altura de las columnas, con `main` debajo: ninguna
  // columna, aunque el rectángulo de una recortada siga llegando hasta ahí.
  async function pointInMargin(page: Page, side: 'left' | 'right') {
    const rect = (await scrollingBoard(page).boundingBox())!;
    const x = side === 'right' ? page.viewportSize()!.width - 8 : 8;
    const y = rect.y + rect.height / 2;
    const under = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.tagName, {
      x,
      y,
    });
    expect(under).toBe('MAIN');
    return { x, y };
  }

  const scrollLeftOf = (page: Page) =>
    scrollingBoard(page).evaluate((element) => element.scrollLeft);
  const clippedOnTheRight = (page: Page) =>
    scrollingBoard(page).evaluate(
      (element) => element.scrollLeft + element.clientWidth < element.scrollWidth - 1,
    );

  for (const width of [768, 1024]) {
    for (const wait of [0, 100]) {
      test(`003 CA-1.7 RF-005 D-31 a ${width}, soltar en el margen derecho con el tablero aún recortado, a los ${wait} ms: vuelve a su sitio, sin guardar ni avisar`, async ({
        page,
      }) => {
        await openBoard(page, { width, height: 900 });
        await seedBoard(page);
        const moves = trackMoves(page);
        const margin = await pointInMargin(page, 'right');

        await dragCard(page, taskCard(page, 'Preparar la demo'), margin, { drop: false });
        if (wait) await page.waitForTimeout(wait);
        // A 1024 solo sobran unos 200 px: a los 100 ms, `chromium` ya puede haber llegado al final.
        if (width === 768 || wait === 0) expect(await clippedOnTheRight(page)).toBe(true);
        await page.mouse.up();

        await expect(dragOverlay(page, 'Preparar la demo')).toHaveCount(0);
        await expectOrder(page, 'To do', TODO);
        await expectOrder(page, 'In progress', IN_PROGRESS);
        await expectCount(page, 'Done', 0);
        // Por si el guardado aún no ha salido.
        await page.waitForTimeout(200);
        expect(moves).toHaveLength(0);
        await expectNoNotice(page);
      });
    }
  }

  test('003 RF-005 D-31 a 768, soltar en el margen izquierdo con el tablero ya desplazado: vuelve a su sitio, sin guardar ni avisar', async ({
    page,
  }) => {
    await openBoard(page, { width: 768, height: 900 });
    await seedBoard(page);
    await createTaskViaApi(page, { title: 'Ordenar el trastero' });
    await reloadBoard(page);
    const moves = trackMoves(page);
    await scrollingBoard(page).evaluate((element) =>
      element.scrollTo({ left: element.scrollWidth, behavior: 'instant' }),
    );
    const margin = await pointInMargin(page, 'left');

    for (const wait of [0, 100]) {
      await test.step(`a los ${wait} ms`, async () => {
        await dragCard(page, taskCard(page, IN_PROGRESS[0]!), margin, { drop: false });
        if (wait) await page.waitForTimeout(wait);
        expect(await scrollLeftOf(page)).toBeGreaterThan(0);
        await page.mouse.up();

        await expect(dragOverlay(page, IN_PROGRESS[0]!)).toHaveCount(0);
        await expectOrder(page, 'In progress', IN_PROGRESS);
        await expectOrder(page, 'To do', TODO);
        await page.waitForTimeout(200);
        expect(moves).toHaveLength(0);
        await expectNoNotice(page);

        // El scroll automático ha podido dejarlo en otro sitio: la siguiente vuelta, otra vez al final.
        await scrollingBoard(page).evaluate((element) =>
          element.scrollTo({ left: element.scrollWidth, behavior: 'instant' }),
        );
      });
    }
  });

  test('003 RF-005 D-31 a 768, con el puntero en el margen, la vista previa vuelve al origen', async ({
    page,
  }) => {
    await openBoard(page, { width: 768, height: 900 });
    await seedBoard(page);
    await createTaskViaApi(page, { title: 'Ordenar el trastero' });
    await reloadBoard(page);
    const margin = await pointInMargin(page, 'right');

    await dragCard(
      page,
      taskCard(page, 'Preparar la demo'),
      taskCard(boardColumn(page, 'Backlog'), 'Ordenar el trastero'),
      { drop: false },
    );
    await expect(boardColumn(page, 'Backlog').locator('li').first()).toContainText(
      'Preparar la demo',
    );

    // Cada fotograma, en qué columna está el hueco: no vale que acabe volviendo cuando termine el
    // scroll automático, porque hasta entonces lo enseñaría en una columna donde no se va a soltar.
    const seen = page.evaluate(
      (title) =>
        new Promise<string[]>((resolve) => {
          const columns = new Set<string>();
          const start = performance.now();
          const sample = () => {
            const hole = [...document.querySelectorAll('[data-board-column] li')].find((item) =>
              item.textContent?.startsWith(title),
            );
            const name = hole?.closest('[data-board-column]')?.getAttribute('aria-label');
            if (name) columns.add(name.split(',')[0]!);
            if (performance.now() - start < 600) requestAnimationFrame(sample);
            else resolve([...columns]);
          };
          sample();
        }),
      'Preparar la demo',
    );
    await page.mouse.move(margin.x, margin.y, { steps: 5 });
    const columns = await seen;

    await expectOrder(page, 'To do', TODO);
    expect(columns.filter((name) => name === 'In progress' || name === 'Done')).toEqual([]);
    await page.keyboard.press('Escape');
    await page.mouse.up();
  });

  for (const width of [768, 1024]) {
    test(`003 E-5 D-31 a ${width}, con el puntero en el margen, el tablero sigue haciendo scroll solo`, async ({
      page,
    }) => {
      await openBoard(page, { width, height: 900 });
      await seedBoard(page);
      const margin = await pointInMargin(page, 'right');
      expect(await scrollLeftOf(page)).toBe(0);

      await dragCard(page, taskCard(page, 'Preparar la demo'), margin, { drop: false });

      await expect(dragOverlay(page, 'Preparar la demo')).toBeVisible();
      await expect.poll(() => scrollLeftOf(page)).toBeGreaterThan(0);
      await page.keyboard.press('Escape');
      await page.mouse.up();
    });
  }

  test('003 RF-001 D-31 a 768, soltar en la parte visible de una columna recortada, dentro del tablero: se guarda en esa columna', async ({
    page,
  }) => {
    await openBoard(page, { width: 768, height: 900 });
    await seedBoard(page);
    const inProgress = boardColumn(page, 'In progress');
    // Media columna de scroll: To do se ve entera, e In progress, recortada por la derecha.
    await scrollingBoard(page).evaluate((element) =>
      element.scrollTo({ left: element.clientWidth / 4, behavior: 'instant' }),
    );
    const board = (await scrollingBoard(page).boundingBox())!;
    const column = (await inProgress.boundingBox())!;
    expect(column.x).toBeLessThan(board.x + board.width);
    expect(column.x + column.width).toBeGreaterThan(board.x + board.width);

    const saved = moveResponse(page);
    await dragCard(page, taskCard(page, 'Preparar la demo'), {
      x: column.x + 20,
      y: board.y + board.height / 2,
    });

    const response = await saved;
    expect(response.status()).toBe(200);
    expect(response.request().postDataJSON()).toMatchObject({ status: 'in_progress' });
    await expect(inProgress.locator('li').filter({ hasText: 'Preparar la demo' })).toHaveCount(1);
    await expectCount(page, 'To do', 2);
    await expectCount(page, 'In progress', 4);
  });
});

test.describe('rendimiento y scroll automático', () => {
  // Plan §7: solo en chromium, el navegador de desarrollo. Las tareas se crean por la API: 500, 200 de
  // ellas en To do, con «Preparar la demo» la primera de To do.
  test.skip(({ browserName, channel }) => browserName !== 'chromium' || channel === 'chrome');
  test.setTimeout(240_000);

  async function seedFiveHundred(page: Page) {
    const plan: TaskStatus[] = [
      ...Array<TaskStatus>(100).fill('backlog'),
      ...Array<TaskStatus>(199).fill('todo'),
      ...Array<TaskStatus>(100).fill('in_progress'),
      ...Array<TaskStatus>(100).fill('done'),
    ];
    const BATCH = 25;
    for (let i = 0; i < plan.length; i += BATCH) {
      await Promise.all(
        plan
          .slice(i, i + BATCH)
          .map((status, j) => createTaskViaApi(page, { title: `Tarea ${i + j + 1}` }, status)),
      );
    }
    await createTaskViaApi(page, { title: 'Preparar la demo' }, 'todo');
    await reloadBoard(page);
    await expect(boardColumn(page, 'To do')).toHaveAccessibleName('To do, 200 tareas');
  }

  // Suelta y mide desde el `pointerup` hasta el primer frame con la tarjeta en `index` de la columna,
  // visible (sin hueco) y sin la capa.
  async function dropTime(page: Page, title: string, column: ColumnName, index: number) {
    await page.evaluate(
      ({ title, column, index }) => {
        const state = window as Window & { e2eDropTime?: Promise<number> };
        state.e2eDropTime = new Promise<number>((resolve) => {
          let upAt = 0;
          const inPlace = () => {
            const section = document.querySelector(`section[aria-label^="${column},"]`);
            const card = section?.querySelectorAll('li [data-task-id]')[index];
            return (
              card?.textContent?.startsWith(title) === true &&
              card.checkVisibility({ visibilityProperty: true }) &&
              document.querySelector('[inert]') === null
            );
          };
          const check = () =>
            requestAnimationFrame(() => {
              if (!upAt || !inPlace()) return;
              observer.disconnect();
              resolve(performance.now() - upAt);
            });
          const observer = new MutationObserver(check);
          observer.observe(document.body, { subtree: true, childList: true, attributes: true });
          window.addEventListener(
            'pointerup',
            () => {
              upAt = performance.now();
              check();
              // Si no llega a estar en su sitio, el test falla con un tiempo en vez de esperar sin fin.
              setTimeout(() => resolve(Number.POSITIVE_INFINITY), 2000);
            },
            { capture: true, once: true },
          );
        });
      },
      { title, column, index },
    );
    await page.mouse.up();
    return page.evaluate(() => (window as Window & { e2eDropTime?: Promise<number> }).e2eDropTime);
  }

  test('003 RNF-002 con 500 tareas, la tarjeta está en su sitio nuevo y sin hueco ≤ 100 ms después de soltarla', async ({
    page,
  }) => {
    await openBoard(page);
    await seedFiveHundred(page);
    const inProgress = boardColumn(page, 'In progress');

    await dragCard(page, taskCard(page, 'Preparar la demo'), inProgress.locator('li').first(), {
      drop: false,
    });
    await expect(dragOverlay(page, 'Preparar la demo')).toBeVisible();

    const elapsed = await dropTime(page, 'Preparar la demo', 'In progress', 0);
    test.info().annotations.push({ type: 'RNF-002', description: `en su sitio en ${elapsed} ms` });
    expect(elapsed).toBeLessThanOrEqual(100);
  });

  test('003 RNF-002 D-9 con 500 tareas, reordenar dentro de la columna de 200: en su sitio y sin hueco ≤ 100 ms después de soltarla', async ({
    page,
  }) => {
    await openBoard(page);
    await seedFiveHundred(page);
    const title = 'Preparar la demo';
    const list = boardColumn(page, 'To do').locator('li');
    const indexOfHole = () =>
      page.evaluate(
        (title) =>
          [
            ...document.querySelectorAll('section[aria-label^="To do,"] li [data-task-id]'),
          ].findIndex((card) => card.textContent?.startsWith(title)),
        title,
      );

    await dragCard(page, taskCard(page, title), list.nth(2), { drop: false });
    await expect(dragOverlay(page, title)).toBeVisible();
    await expect.poll(indexOfHole).toBeGreaterThan(0);

    // La spec no pone límite a un cambio de vista previa; se anota (T-041).
    const before = await indexOfHole();
    const to = await pointIn(list.nth(before + 2));
    await page.evaluate(
      ({ title, before }) => {
        const state = window as Window & { e2ePreviewTime?: Promise<number> };
        state.e2ePreviewTime = new Promise<number>((resolve) => {
          let movedAt = 0;
          const check = () =>
            requestAnimationFrame(() => {
              const index = [
                ...document.querySelectorAll('section[aria-label^="To do,"] li [data-task-id]'),
              ].findIndex((card) => card.textContent?.startsWith(title));
              if (!movedAt || index === before) return;
              observer.disconnect();
              resolve(performance.now() - movedAt);
            });
          const observer = new MutationObserver(check);
          observer.observe(document.body, { subtree: true, childList: true });
          window.addEventListener(
            'mousemove',
            () => {
              movedAt = performance.now();
              setTimeout(() => resolve(Number.POSITIVE_INFINITY), 2000);
            },
            { capture: true, once: true },
          );
        });
      },
      { title, before },
    );
    await page.mouse.move(to.x, to.y);
    const preview = await page.evaluate(
      () => (window as Window & { e2ePreviewTime?: Promise<number> }).e2ePreviewTime,
    );
    test.info().annotations.push({ type: 'D-9', description: `vista previa en ${preview} ms` });

    const index = await indexOfHole();
    expect(index).not.toBe(before);
    const saved = moveResponse(page);
    const elapsed = await dropTime(page, title, 'To do', index);
    test.info().annotations.push({ type: 'RNF-002', description: `en su sitio en ${elapsed} ms` });
    expect(elapsed).toBeLessThanOrEqual(100);
    expect((await saved).request().postDataJSON()).toMatchObject({ status: 'todo', index });
  });

  test('003 E-4 con la tarjeta en el borde inferior de la columna de 200, la lista hace scroll sola', async ({
    page,
  }) => {
    await openBoard(page);
    await seedFiveHundred(page);
    const list = boardColumn(page, 'To do').getByRole('list');
    const bottom = await list.boundingBox();
    expect(await list.evaluate((element) => element.scrollTop)).toBe(0);

    await dragCard(
      page,
      taskCard(page, 'Preparar la demo'),
      { x: bottom!.x + bottom!.width / 2, y: bottom!.y + bottom!.height - 5 },
      { drop: false },
    );

    await expect(dragOverlay(page, 'Preparar la demo')).toBeVisible();
    await expect.poll(() => list.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    await page.keyboard.press('Escape');
    await page.mouse.up();
  });

  test('003 E-5 a 1024, con la tarjeta en el borde derecho del tablero, el tablero hace scroll horizontal solo', async ({
    page,
  }) => {
    await openBoard(page, { width: 1024, height: 900 });
    await seedFiveHundred(page);
    const board = boardColumn(page, 'Backlog').locator('xpath=..');
    const rect = await board.boundingBox();
    expect(await board.evaluate((element) => element.scrollLeft)).toBe(0);

    await dragCard(
      page,
      taskCard(page, 'Preparar la demo'),
      { x: rect!.x + rect!.width - 5, y: rect!.y + rect!.height / 2 },
      { drop: false },
    );

    await expect(dragOverlay(page, 'Preparar la demo')).toBeVisible();
    await expect.poll(() => board.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
    await page.keyboard.press('Escape');
    await page.mouse.up();
  });
});

test.describe('«Subir» y «Bajar» en el detalle', () => {
  const dialogButton = (page: Page, name: 'Subir' | 'Bajar') =>
    taskDialog(page).getByRole('button', { name, exact: true });
  const position = (page: Page) => taskDialog(page).locator('p[aria-live="polite"]');
  const NEEDS_SAVE = 'Guarda el cambio de estado para poder subirla o bajarla.';

  async function openDemoDetail(page: Page) {
    await taskCard(page, 'Preparar la demo').click();
    await expect(taskDialog(page)).toBeVisible();
    await expect(position(page)).toHaveText('To do, posición 2 de 3.');
  }

  test('003 CA-5.2 RF-027 con clic: el texto cambia, sigue abierto y el orden se mantiene al volver a cargar', async ({
    page,
  }) => {
    await openBoard(page);
    await seedBoard(page);
    await openDemoDetail(page);

    const saved = page.waitForResponse((response) => response.url().endsWith('/move'));
    await dialogButton(page, 'Subir').click();

    expect((await saved).status()).toBe(200);
    await expect(position(page)).toHaveText('To do, posición 1 de 3.');
    await expect(taskDialog(page)).toBeVisible();

    await taskDialog(page).getByRole('button', { name: 'Cancelar' }).click();
    await expect(taskDialog(page)).toHaveCount(0);
    const order = ['Preparar la demo', 'Comprar pan', 'Llamar al banco'];
    await expectOrder(page, 'To do', order);
    await reloadBoard(page);
    await expectOrder(page, 'To do', order);
  });

  test('003 CA-5.3 RF-027 con toque a 375 px, en el panel inferior', async ({
    browser,
  }, testInfo) => {
    const context = await browser.newContext({
      ...testInfo.project.use,
      hasTouch: true,
      viewport: MOBILE,
    });
    const page = await context.newPage();
    await openBoard(page, MOBILE);
    await seedBoard(page);
    await columnPicker(page, 'To do').check({ force: true });
    await taskCard(page, 'Preparar la demo').tap();
    await expect(position(page)).toHaveText('To do, posición 2 de 3.');
    const panel = await taskDialog(page).boundingBox();
    expect(panel?.width).toBe(MOBILE.width);

    await dialogButton(page, 'Bajar').tap();

    await expect(position(page)).toHaveText('To do, posición 3 de 3.');
    await taskDialog(page).getByRole('button', { name: 'Cancelar' }).tap();
    await expectOrder(page, 'To do', ['Comprar pan', 'Llamar al banco', 'Preparar la demo']);
    await context.close();
  });

  for (const [name, key] of [
    ['Enter', 'Enter'],
    ['Espacio', 'Space'],
  ] as const) {
    test(`003 CA-5.4 RF-026 solo con teclado, con ${name}: el foco sigue en «Subir» y cambia la región viva`, async ({
      page,
    }) => {
      await openBoard(page);
      await seedBoard(page);
      await tabTo(page, taskCard(page, 'Preparar la demo'));
      await page.keyboard.press('Enter');
      await expect(position(page)).toHaveText('To do, posición 2 de 3.');
      await tabTo(page, dialogButton(page, 'Subir'));

      await page.keyboard.press(key);

      await expect(position(page)).toHaveText('To do, posición 1 de 3.');
      await expect(dialogButton(page, 'Subir')).toBeFocused();
      await expect(dialogButton(page, 'Subir')).toHaveAttribute('aria-disabled', 'true');
    });
  }

  test('003 CA-5.9 RF-029 con `…/move` abortado: vuelve el texto, aviso en el diálogo y sigue abierto', async ({
    page,
  }) => {
    await openBoard(page);
    await seedBoard(page);
    await openDemoDetail(page);
    await page.route('**/api/tasks/*/move', (route) => route.abort());

    await dialogButton(page, 'Subir').click();

    await expect(taskDialog(page).getByText(MOVE_ERROR)).toBeVisible();
    await expect(position(page)).toHaveText('To do, posición 2 de 3.');
    await expect(taskDialog(page)).toBeVisible();
    await expect(dialogButton(page, 'Subir')).toBeFocused();
    await taskDialog(page).getByRole('button', { name: 'Cancelar' }).click();
    await expectOrder(page, 'To do', TODO);
  });

  test('003 CA-5.10 RF-029 con la tarea borrada de verdad: se cierra, avisa el tablero y el foco en «Crear tarea»', async ({
    page,
  }) => {
    await openBoard(page);
    await seedBoard(page);
    await openDemoDetail(page);
    await deleteTaskViaApi(page, 'Preparar la demo');

    await dialogButton(page, 'Subir').click();

    await expect(taskDialog(page)).toHaveCount(0);
    await expect(page.getByText('Esta tarea ya no existe.')).toBeVisible();
    await expectOrder(page, 'To do', ['Comprar pan', 'Llamar al banco']);
    await expect(createTaskButton(page)).toBeFocused();
  });

  test('003 RF-027 D-38 clic en «Bajar»: el foco en el botón y Tab va al campo siguiente, no al primero del formulario', async ({
    page,
    channel,
  }) => {
    test.skip(channel === 'chrome', 'T-052: chromium y webkit');
    await openBoard(page);
    await seedBoard(page);
    await openDemoDetail(page);

    await dialogButton(page, 'Bajar').click();

    await expect(position(page)).toHaveText('To do, posición 3 de 3.');
    await expect(dialogButton(page, 'Bajar')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(taskDialog(page).getByLabel('Fecha estimada de inicio')).toBeFocused();
  });

  test('003 RF-028 D-38 clic hasta llegar al borde y otro clic ya inactivo: el foco sigue en él', async ({
    page,
    channel,
  }) => {
    test.skip(channel === 'chrome', 'T-052: chromium y webkit');
    await openBoard(page);
    await seedBoard(page);
    await openDemoDetail(page);

    await dialogButton(page, 'Subir').click();
    await expect(position(page)).toHaveText('To do, posición 1 de 3.');
    await expect(dialogButton(page, 'Subir')).toHaveAttribute('aria-disabled', 'true');
    await expect(dialogButton(page, 'Subir')).toBeFocused();

    // Sin `force`, Playwright esperaría a que dejara de estar inactivo.
    await dialogButton(page, 'Subir').click({ force: true });

    await expect(position(page)).toHaveText('To do, posición 1 de 3.');
    await expect(dialogButton(page, 'Subir')).toBeFocused();
  });

  test.describe('con «Guardar cambios» en camino', () => {
    // El `PUT` retenido con «Guardando…» a la vista, y «Subir», que no hace nada.
    async function upWhileSaving(page: Page, action: 'continue' | 'abort') {
      await openBoard(page);
      await seedBoard(page);
      await openDemoDetail(page);
      const moves = trackMoves(page);
      let release!: () => void;
      const released = new Promise<void>((resolve) => {
        release = resolve;
      });
      await page.route('**/api/tasks/*', async (route) => {
        if (route.request().method() !== 'PUT') return route.fallback();
        await released;
        return action === 'abort' ? route.abort() : route.continue();
      });
      await taskDialog(page).getByLabel('Título').fill('Preparar la demo final');
      await taskDialog(page).getByRole('button', { name: 'Guardar cambios' }).click();
      await expect(taskDialog(page).getByRole('button', { name: 'Guardando…' })).toBeVisible();

      await expect(dialogButton(page, 'Subir')).toHaveAttribute('aria-disabled', 'true');
      await expect(dialogButton(page, 'Bajar')).toHaveAttribute('aria-disabled', 'true');
      // Sin `force`, Playwright esperaría a que dejara de estar inactivo.
      await dialogButton(page, 'Subir').click({ force: true });

      expect(moves).toHaveLength(0);
      await expect(position(page)).toHaveText('To do, posición 2 de 3.');
      release();
    }

    test('003 CA-5.12 RF-028 «Subir» durante «Guardando…»: si el `PUT` va bien, el diálogo se cierra', async ({
      page,
      channel,
    }) => {
      test.skip(channel === 'chrome', 'T-051: chromium y webkit');
      await upWhileSaving(page, 'continue');

      await expect(taskDialog(page)).toHaveCount(0);
      await expectOrder(page, 'To do', [
        'Comprar pan',
        'Preparar la demo final',
        'Llamar al banco',
      ]);
    });

    test('003 CA-5.12 RF-028 «Subir» durante «Guardando…»: si el `PUT` falla, sale el error de guardar y se activan', async ({
      page,
      channel,
    }) => {
      test.skip(channel === 'chrome', 'T-051: chromium y webkit');
      await upWhileSaving(page, 'abort');

      await expect(
        taskDialog(page).getByText(
          'No hemos podido guardar la tarea. Revisa tu conexión e inténtalo de nuevo.',
        ),
      ).toBeVisible();
      await expect(dialogButton(page, 'Subir')).not.toHaveAttribute('aria-disabled');
      await expect(dialogButton(page, 'Bajar')).not.toHaveAttribute('aria-disabled');
    });
  });

  test.describe('con el diálogo ya cerrado', () => {
    const NOT_FOUND = 'Esta tarea ya no existe.';
    const cancelButton = (page: Page) => taskDialog(page).getByRole('button', { name: 'Cancelar' });
    const notice = (page: Page) =>
      page.getByRole('alert').filter({ has: page.locator('[data-tone]') });

    // Retiene `…/move` hasta llamar a la función que devuelve: «deja pasar» hasta el servidor o aborta.
    async function holdMove(page: Page) {
      let release!: (action: 'continue' | 'abort') => void;
      const released = new Promise<'continue' | 'abort'>((resolve) => {
        release = resolve;
      });
      const reached = new Promise<void>((resolve) => {
        void page.route('**/api/tasks/*/move', async (route) => {
          resolve();
          if ((await released) === 'abort') await route.abort();
          else await route.continue();
        });
      });
      return { reached, release };
    }

    // «Subir» en el detalle de «Preparar la demo» y «Cancelar» antes de la respuesta.
    async function upThenClose(page: Page) {
      await openBoard(page);
      await seedBoard(page);
      await openDemoDetail(page);
      const held = await holdMove(page);
      await dialogButton(page, 'Subir').click();
      await held.reached;
      await cancelButton(page).click();
      await expect(taskDialog(page)).toHaveCount(0);
      await expect(taskCard(page, 'Preparar la demo')).toBeFocused();
      return held;
    }

    test('003 CA-5.13 RF-029 con la red abortada: el orden de antes, el aviso en el tablero y el foco en la tarjeta', async ({
      page,
    }) => {
      const { release } = await upThenClose(page);
      await expectOrder(page, 'To do', ['Preparar la demo', 'Comprar pan', 'Llamar al banco']);

      release('abort');

      await expect(notice(page)).toHaveText(MOVE_ERROR);
      await expectOrder(page, 'To do', TODO);
      await expect(taskCard(page, 'Preparar la demo')).toBeFocused();
    });

    test('003 CA-5.14 RF-029 con la tarea borrada de verdad: aviso, sin tarjeta y el foco en «Crear tarea»', async ({
      page,
    }) => {
      const { release } = await upThenClose(page);
      await deleteTaskViaApi(page, 'Preparar la demo');

      release('continue');

      await expect(notice(page)).toHaveText(NOT_FOUND);
      await expectOrder(page, 'To do', ['Comprar pan', 'Llamar al banco']);
      await expect(createTaskButton(page)).toBeFocused();
    });

    test('003 CA-5.14 RF-029 con la última tarea: el foco en el «Crear tarea» del estado vacío', async ({
      page,
    }) => {
      await openBoard(page);
      await seedBoard(page, { todo: ['Comprar pan', 'Preparar la demo'] });
      await taskCard(page, 'Preparar la demo').click();
      const held = await holdMove(page);
      await dialogButton(page, 'Subir').click();
      await held.reached;
      await cancelButton(page).click();
      // La otra se borra aquí, con la lista nueva: «Preparar la demo» es la última al llegar el fallo.
      await taskCard(page, 'Comprar pan').click();
      await taskDialog(page).getByRole('button', { name: 'Borrar tarea' }).click();
      await taskDialog(page).getByRole('button', { name: 'Borrar tarea' }).last().click();
      await expect(taskDialog(page)).toHaveCount(0);
      await expectOrder(page, 'To do', ['Preparar la demo']);
      await taskCard(page, 'Preparar la demo').focus();
      await deleteTaskViaApi(page, 'Preparar la demo');

      held.release('continue');

      await expect(notice(page)).toHaveText(NOT_FOUND);
      await expect(
        page.getByText('Todavía no tienes tareas. Crea la primera y empieza a organizarte.'),
      ).toBeVisible();
      await expect(createTaskButton(page)).toBeFocused();
    });

    test('003 CA-5.14 RF-029 con el foco ya en otra tarjeta: no se mueve', async ({ page }) => {
      const { release } = await upThenClose(page);
      await taskCard(page, 'Llamar al banco').focus();
      await deleteTaskViaApi(page, 'Preparar la demo');

      release('continue');

      await expect(notice(page)).toHaveText(NOT_FOUND);
      await expectOrder(page, 'To do', ['Comprar pan', 'Llamar al banco']);
      await expect(taskCard(page, 'Llamar al banco')).toBeFocused();
    });

    test('003 E-25 RF-029 con otro detalle abierto: el foco sigue en él y, al cerrarlo, el aviso está en el tablero', async ({
      page,
    }) => {
      const { release } = await upThenClose(page);
      await taskCard(page, 'Llamar al banco').click();
      await expect(taskDialog(page)).toBeVisible();
      await cancelButton(page).focus();
      await deleteTaskViaApi(page, 'Preparar la demo');
      const failed = moveResponse(page);

      release('continue');

      expect((await failed).status()).toBe(404);
      await expect(taskDialog(page)).toBeVisible();
      await expect(cancelButton(page)).toBeFocused();
      await cancelButton(page).click();
      await expect(taskDialog(page)).toHaveCount(0);
      await expect(notice(page)).toHaveText(NOT_FOUND);
      await expect(taskCard(page, 'Llamar al banco')).toBeFocused();
    });

    for (const [name, action] of [
      ['404', 'continue'],
      ['la red abortada', 'abort'],
    ] as const) {
      test(`003 E-26 RF-029 «Subir» y «Borrar tarea», con ${name}: sin aviso y sin la tarjeta`, async ({
        page,
      }) => {
        await openBoard(page);
        await seedBoard(page);
        await openDemoDetail(page);
        const held = await holdMove(page);
        await dialogButton(page, 'Subir').click();
        await held.reached;

        await taskDialog(page).getByRole('button', { name: 'Borrar tarea' }).click();
        await taskDialog(page).getByRole('button', { name: 'Borrar tarea' }).last().click();
        await expect(taskDialog(page)).toHaveCount(0);
        await expectOrder(page, 'To do', ['Comprar pan', 'Llamar al banco']);

        // El fallo se trata antes de volver a pedir la lista, así que su respuesta llega después.
        const list = page.waitForResponse(
          (response) =>
            response.request().method() === 'GET' && response.url().endsWith('/api/tasks'),
        );
        held.release(action);
        await list;
        await expectNoNotice(page);
        await expectOrder(page, 'To do', ['Comprar pan', 'Llamar al banco']);
      });
    }
  });

  for (const colorScheme of ['light', 'dark'] as const) {
    test(`003 RNF-001 axe con el detalle abierto, un botón inactivo y el texto de RF-028 (${colorScheme})`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme });
      await openBoard(page);
      await seedBoard(page, { todo: TODO.slice(0, 2) });
      await taskCard(page, 'Comprar pan').click();
      await expect(dialogButton(page, 'Subir')).toHaveAttribute('aria-disabled', 'true');
      await expectNoAxeViolations(page);

      await taskDialog(page).getByRole('radio', { name: 'In progress' }).check({ force: true });
      await expect(taskDialog(page).getByText(NEEDS_SAVE)).toBeVisible();
      await expect(dialogButton(page, 'Bajar')).toHaveAttribute('aria-disabled', 'true');
      await expectNoAxeViolations(page);
    });
  }

  for (const width of [375, 1280]) {
    test(`003 RNF-001 RF-026 «Subir» y «Bajar» miden 44 px de alto a ${width}`, async ({
      page,
    }) => {
      await openBoard(page, { width, height: 900 });
      await seedBoard(page);
      if (width === 375) await columnPicker(page, 'To do').check({ force: true });
      await openDemoDetail(page);

      for (const name of ['Subir', 'Bajar'] as const) {
        const box = await dialogButton(page, name).boundingBox();
        expect(box?.height).toBe(44);
      }
    });
  }
});
