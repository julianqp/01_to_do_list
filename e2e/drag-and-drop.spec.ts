import { expect, test, type Page, type Request } from '@playwright/test';
import {
  boardColumn,
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
// D-7: la región viva del tablero.
const liveRegion = (page: Page) => page.locator('[aria-live="assertive"]');
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

const isMove = (request: Request) =>
  request.method() === 'POST' &&
  /^\/api\/tasks\/[^/]+\/move$/.test(new URL(request.url()).pathname);

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
      await expect(dragOverlay(page, 'Preparar la demo')).toBeVisible();
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
      await expect(dragOverlay(page, 'Preparar la demo')).toBeVisible();
      await page.keyboard.press('Escape');
      await page.mouse.up();
      await expectOrder(page, 'To do', TODO);
      await expectOrder(page, 'In progress', IN_PROGRESS);
    });

    await expectNoNotice(page);
    expect(moves).toHaveLength(0);
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
    await page.mouse.up();

    await expect(dragOverlay(page, 'Preparar la demo')).toHaveCount(0);
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
    const { x, y } = await pointIn(card);

    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x, y + 15, { steps: 5 });
    await expect(dragOverlay(page, 'Preparar la demo')).toBeVisible();
    await page.mouse.move(x, y, { steps: 5 });
    await page.mouse.up();

    await expect(dragOverlay(page, 'Preparar la demo')).toHaveCount(0);
    await expectOrder(page, 'To do', TODO);
    await expectNoNotice(page);
    expect(moves).toHaveLength(0);
  });
});

test.describe('dedo', () => {
  // R-6: CDP en los proyectos Chromium y `TouchEvent` sintéticos en WebKit.
  test.use({ hasTouch: true });

  test('003 CA-4.1 RF-018 a 1280, mantener el dedo sobre «Preparar la demo» y soltarla en In progress: como con el ratón', async ({
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

    await expect(columnPicker(page, 'In progress')).toHaveAccessibleName('In progress · 0');
    await expectNoNotice(page);
    expect(moves).toHaveLength(0);
  });
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
    // Desde el `pointerup` hasta el primer frame con la tarjeta la primera de In progress, visible
    // (sin hueco) y sin la capa.
    await page.evaluate((title) => {
      const state = window as Window & { e2eDropTime?: Promise<number> };
      state.e2eDropTime = new Promise<number>((resolve) => {
        let upAt = 0;
        const inPlace = () => {
          const column = document.querySelector('section[aria-label^="In progress,"]');
          const first = column?.querySelector('li [data-task-id]');
          return (
            first?.textContent?.startsWith(title) === true &&
            first.checkVisibility({ visibilityProperty: true }) &&
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
    }, 'Preparar la demo');
    await page.mouse.up();

    const elapsed = await page.evaluate(
      () => (window as Window & { e2eDropTime?: Promise<number> }).e2eDropTime,
    );
    test.info().annotations.push({ type: 'RNF-002', description: `en su sitio en ${elapsed} ms` });
    expect(elapsed).toBeLessThanOrEqual(100);
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
