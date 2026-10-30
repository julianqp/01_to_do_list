import { expect, test, type Page } from '@playwright/test';
import {
  boardColumn,
  createTaskButton,
  createTaskViaApi,
  displayDate,
  expectNoAxeViolations,
  isoDaysFromToday,
  signup,
  tabTo,
  taskCard,
  taskDialog,
  uniqueEmail,
  type TaskStatus,
} from './helpers';

// Spec 002 (plan §7): el tablero de punta a punta, en cada proyecto de playwright.config.ts
// (RNF-005) salvo donde se indica. Cada test registra su propia cuenta con un email único.

const COLUMNS = ['Backlog', 'To do', 'In progress', 'Done'] as const;
const WIDTHS = [320, 375, 768, 1024, 1280, 1600];
const EMPTY_BOARD = 'Todavía no tienes tareas. Crea la primera y empieza a organizarte.';
const MOBILE = { width: 375, height: 812 };

const boardTitle = (page: Page) => page.getByRole('heading', { level: 1, name: 'Tablero' });
const titleField = (page: Page) => taskDialog(page).getByLabel('Título');
// Selector de columna en móvil (RF-034): un radio por estado con su recuento («Done · 0»).
const columnPicker = (page: Page, name: (typeof COLUMNS)[number]) =>
  page.getByRole('radio', { name: new RegExp(`^${name} · \\d+$`) });

// Registra una cuenta (la 001 lo hace a 1280: el email se ve en la cabecera) y deja el tablero al
// ancho pedido.
async function openBoard(page: Page, viewport = { width: 1280, height: 900 }) {
  await page.setViewportSize({ width: 1280, height: 900 });
  await signup(page, uniqueEmail());
  await page.setViewportSize(viewport);
  await expect(boardTitle(page)).toBeVisible();
}

async function reloadBoard(page: Page) {
  await page.reload();
  await expect(boardTitle(page)).toBeVisible();
}

async function expectNoHorizontalScroll(page: Page) {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
}

async function box(locator: ReturnType<Page['locator']>) {
  const rect = await locator.boundingBox();
  if (!rect) throw new Error(`${locator} no tiene caja: no se ve`);
  return rect;
}

test.describe('diálogo: descartar cambios', () => {
  // D-24: la primera verificación del diálogo (R-2). Chromium cierra un <dialog> con el segundo Esc si
  // no hay una activación del usuario entre los dos.
  test('RF-021 D-24 CA-3.3 con cambios sin guardar, dos Esc seguidos no cierran el diálogo', async ({
    page,
  }) => {
    await openBoard(page);
    await createTaskButton(page).click();
    const dialog = taskDialog(page);
    await titleField(page).fill('Preparar la demo');

    await page.keyboard.press('Escape');
    await expect(dialog.getByText('¿Descartar los cambios?')).toBeVisible();
    await page.keyboard.press('Escape');

    await expect(dialog).toBeVisible();
    await expect(titleField(page)).toHaveValue('Preparar la demo');

    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');

    await expect(dialog).toBeVisible();
    await expect(titleField(page)).toHaveValue('Preparar la demo');
  });

  test('CA-3.3 RF-021 RF-022 clic fuera con cambios pregunta; «Descartar cambios» cierra sin guardar', async ({
    page,
  }) => {
    await openBoard(page);
    await createTaskViaApi(page, { title: 'Preparar la demo' });
    await reloadBoard(page);
    const card = taskCard(page, 'Preparar la demo');
    const dialog = taskDialog(page);

    await card.click();
    await titleField(page).fill('Preparar la demo final');
    await page.mouse.click(5, 5);
    await expect(dialog.getByText('¿Descartar los cambios?')).toBeVisible();
    await dialog.getByRole('button', { name: 'Seguir editando' }).click();
    await expect(titleField(page)).toHaveValue('Preparar la demo final');

    await dialog.getByRole('button', { name: 'Cancelar' }).click();
    await dialog.getByRole('button', { name: 'Descartar cambios' }).click();

    await expect(dialog).toBeHidden();
    await expect(card).toHaveText(/Preparar la demo$/);
    await expect(card).toBeFocused();
  });

  test('CA-3.4 RF-022 sin cambios, Esc cierra sin preguntar y el foco vuelve a la tarjeta', async ({
    page,
  }) => {
    await openBoard(page);
    await createTaskViaApi(page, { title: 'Preparar la demo' });
    await reloadBoard(page);
    const card = taskCard(page, 'Preparar la demo');

    await card.click();
    await expect(titleField(page)).toHaveValue('Preparar la demo');
    await page.keyboard.press('Escape');

    await expect(taskDialog(page)).toBeHidden();
    await expect(card).toBeFocused();
  });
});

test.describe('flujo principal', () => {
  // RNF-005: como todo este fichero, corre en chromium, chrome y webkit (playwright.config.ts).
  test('CA-1.3 CA-2.1 CA-3.1 CA-3.2 CA-4.2 CA-4.3 CA-5.1 CA-5.2 RF-022 RF-027 RNF-005 solo con teclado: crear, abrir, editar, cambiar de estado y borrar', async ({
    page,
  }) => {
    await openBoard(page);
    const dialog = taskDialog(page);
    await expect(page.getByText(EMPTY_BOARD)).toBeVisible();

    // Crear (CA-2.1)
    await tabTo(page, createTaskButton(page));
    await page.keyboard.press('Enter');
    await expect(dialog).toBeVisible();
    await tabTo(page, titleField(page));
    await page.keyboard.type('Preparar la demo');
    await tabTo(page, dialog.getByRole('button', { name: 'Crear tarea' }));
    await page.keyboard.press('Enter');

    await expect(dialog).toBeHidden();
    const backlog = boardColumn(page, 'Backlog');
    await expect(backlog.locator('button[data-task-id]').first()).toContainText('Preparar la demo');
    await expect(taskCard(page, 'Preparar la demo')).toBeFocused();
    await expect(page.getByText('1 tarea', { exact: true })).toBeVisible();

    // Abrir con Enter y editar el título; cambiar el estado con las flechas (CA-3.1, CA-3.2, CA-4.2)
    await page.keyboard.press('Enter');
    await expect(titleField(page)).toHaveValue('Preparar la demo');
    await tabTo(page, titleField(page));
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.type('Preparar la demo final');
    await tabTo(page, dialog.getByRole('radio', { name: 'Backlog' }));
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect(dialog.getByRole('radio', { name: 'In progress' })).toBeChecked();
    await tabTo(page, dialog.getByRole('button', { name: 'Guardar cambios' }));
    await page.keyboard.press('Enter');

    await expect(dialog).toBeHidden();
    const inProgressCard = taskCard(boardColumn(page, 'In progress'), 'Preparar la demo final');
    await expect(inProgressCard).toBeFocused();
    await expect(boardColumn(page, 'Backlog')).toHaveAccessibleName('Backlog, 0 tareas');

    // Pasar a Done: la fecha real de fin se rellena con hoy (CA-4.3)
    await page.keyboard.press('Enter');
    await tabTo(page, dialog.getByRole('radio', { name: 'In progress' }));
    await page.keyboard.press('ArrowRight');
    const today = isoDaysFromToday(0);
    await expect(dialog.getByLabel('Fecha real de fin')).toHaveValue(displayDate(today));
    await tabTo(page, dialog.getByRole('button', { name: 'Guardar cambios' }));
    await page.keyboard.press('Enter');

    await expect(dialog).toBeHidden();
    const doneCard = taskCard(boardColumn(page, 'Done'), 'Preparar la demo final');
    await expect(doneCard).toBeFocused();
    await expect(doneCard).toContainText('Fecha real de fin');

    // Borrar con confirmación (CA-5.1, CA-5.2, CA-5.5)
    await page.keyboard.press('Enter');
    await tabTo(page, dialog.getByRole('button', { name: 'Borrar tarea' }));
    await page.keyboard.press('Enter');
    await expect(
      dialog.getByText('¿Borrar «Preparar la demo final»? No se puede deshacer.'),
    ).toBeVisible();
    await tabTo(page, dialog.getByRole('button', { name: 'Borrar tarea' }));
    await page.keyboard.press('Enter');

    await expect(dialog).toBeHidden();
    await expect(page.getByText(EMPTY_BOARD)).toBeVisible();
    await expect(createTaskButton(page)).toBeFocused();
  });

  test('CA-1.1 RF-001 RF-003 cuatro columnas en orden con sus recuentos y el total', async ({
    page,
  }) => {
    await openBoard(page);
    const tasks: [string, TaskStatus][] = [
      ['Backlog uno', 'backlog'],
      ['Backlog dos', 'backlog'],
      ['To do uno', 'todo'],
      ['In progress uno', 'in_progress'],
      ['In progress dos', 'in_progress'],
      ['In progress tres', 'in_progress'],
    ];
    for (const [title, status] of tasks) await createTaskViaApi(page, { title }, status);
    await reloadBoard(page);

    await expect(page.getByText('6 tareas', { exact: true })).toBeVisible();
    await expect(createTaskButton(page)).toBeVisible();
    const regions = page.getByRole('region');
    const names = [
      'Backlog, 2 tareas',
      'To do, 1 tarea',
      'In progress, 3 tareas',
      'Done, 0 tareas',
    ];
    await expect(regions).toHaveCount(names.length);
    for (const [index, name] of names.entries()) {
      await expect(regions.nth(index)).toHaveAccessibleName(name);
    }
    const headings = page.getByRole('heading', { level: 2 });
    await expect(headings).toHaveText(['Backlog · 2', 'To do · 1', 'In progress · 3', 'Done · 0']);
    await expect(boardColumn(page, 'Done')).toContainText('Nada terminado todavía');
  });

  test('CA-1.4 RF-004 RNF-003 cada usuario solo ve sus tareas', async ({ page, browser }, info) => {
    const luis = await browser.newContext({
      baseURL: info.project.use.baseURL,
      ignoreHTTPSErrors: true,
    });
    const luisPage = await luis.newPage();
    await luisPage.setViewportSize({ width: 1280, height: 900 });
    await signup(luisPage, uniqueEmail());
    await createTaskViaApi(luisPage, { title: 'Comprar pan' });
    await luis.close();

    await openBoard(page);
    await createTaskViaApi(page, { title: 'Preparar la demo' });
    await reloadBoard(page);

    await expect(taskCard(page, 'Preparar la demo')).toBeVisible();
    await expect(taskCard(page, 'Comprar pan')).toHaveCount(0);
    await expect(page.getByText('1 tarea', { exact: true })).toBeVisible();
  });

  test('CA-6.1 CA-6.2 CA-6.3 RF-032 RF-033 una tarea con el fin estimado de ayer va retrasada; la de hoy no', async ({
    page,
  }) => {
    await openBoard(page);
    await createTaskViaApi(
      page,
      { title: 'Preparar la demo', estimatedEndDate: isoDaysFromToday(-1) },
      'in_progress',
    );
    await createTaskViaApi(
      page,
      { title: 'Comprar pan', estimatedEndDate: isoDaysFromToday(0) },
      'todo',
    );
    await reloadBoard(page);

    const late = taskCard(boardColumn(page, 'In progress'), 'Preparar la demo');
    await expect(late).toContainText('Retrasada');
    await expect(taskCard(page, 'Comprar pan')).not.toContainText('Retrasada');

    await late.click();
    await expect(taskDialog(page)).toContainText('Esta tarea tenía que terminar el');
  });
});

test.describe('móvil y responsive', () => {
  test('CA-7.1 CA-7.2 CA-7.3 RF-034 RF-035 RF-036 a 375: una columna con selector, panel inferior y «Crear tarea» abajo', async ({
    page,
  }) => {
    await openBoard(page, MOBILE);
    await createTaskViaApi(page, { title: 'Preparar la demo' });
    await createTaskViaApi(page, { title: 'Comprar pan' }, 'done');
    await reloadBoard(page);

    // CA-7.1: empieza en Backlog
    await expect(boardColumn(page, 'Backlog')).toBeVisible();
    for (const name of ['To do', 'In progress', 'Done'] as const) {
      await expect(boardColumn(page, name)).toBeHidden();
    }
    await expect(columnPicker(page, 'Done')).toHaveAccessibleName('Done · 1');
    await columnPicker(page, 'Done').check();
    await expect(boardColumn(page, 'Done')).toBeVisible();
    await expect(boardColumn(page, 'Backlog')).toBeHidden();
    await expectNoHorizontalScroll(page);

    // CA-7.3: «Crear tarea» fijo abajo y a la vista sin scroll
    const create = await box(createTaskButton(page));
    expect(create.y + create.height).toBeLessThanOrEqual(MOBILE.height);
    expect(create.y).toBeGreaterThan(MOBILE.height / 2);

    // CA-7.2: el detalle es un panel desde abajo, a todo el ancho, y permite cambiar el estado
    await taskCard(page, 'Comprar pan').click();
    const panel = await box(taskDialog(page));
    expect(panel.x).toBeCloseTo(0, 0);
    expect(panel.width).toBeCloseTo(MOBILE.width, 0);
    expect(panel.y + panel.height).toBeCloseTo(MOBILE.height, 0);
    await taskDialog(page).getByRole('radio', { name: 'To do' }).check();
    await taskDialog(page).getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(taskDialog(page)).toBeHidden();
    await expect(columnPicker(page, 'To do')).toHaveAccessibleName('To do · 1');
  });

  test('RNF-002 sin scroll horizontal de la página de 320 a 1600, con y sin el diálogo abierto', async ({
    page,
  }) => {
    await openBoard(page);
    for (const status of ['backlog', 'todo', 'in_progress', 'done'] as const) {
      await createTaskViaApi(page, { title: `Tarea en ${status}` }, status);
    }
    await reloadBoard(page);
    for (const width of WIDTHS) {
      await test.step(`${width} px`, async () => {
        await page.setViewportSize({ width, height: 900 });
        await expectNoHorizontalScroll(page);
        await taskCard(page, 'Tarea en backlog').click();
        await expect(taskDialog(page)).toBeVisible();
        const dialog = await box(taskDialog(page));
        expect(dialog.x).toBeGreaterThanOrEqual(0);
        expect(dialog.x + dialog.width).toBeLessThanOrEqual(width + 0.5);
        await expectNoHorizontalScroll(page);
        await page.keyboard.press('Escape');
        await expect(taskDialog(page)).toBeHidden();
      });
    }
  });

  test('RNF-002 con zoom al 200 % a 1280 (640 px CSS): tablero y diálogo sin scroll horizontal', async ({
    page,
  }) => {
    await openBoard(page, { width: 640, height: 450 });
    await createTaskViaApi(page, { title: 'Preparar la demo' });
    await reloadBoard(page);
    await expectNoHorizontalScroll(page);

    await taskCard(page, 'Preparar la demo').click();
    await expect(titleField(page)).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test('E-16 con el detalle abierto, pasar de 1280 a 375 y volver lo deja abierto con lo escrito', async ({
    page,
  }) => {
    await openBoard(page);
    await createTaskViaApi(page, { title: 'Preparar la demo' });
    await reloadBoard(page);
    await taskCard(page, 'Preparar la demo').click();
    await titleField(page).fill('Preparar la demo final');
    const desktop = await box(taskDialog(page));
    expect(desktop.width).toBeLessThanOrEqual(460);

    await page.setViewportSize(MOBILE);
    await expect(titleField(page)).toHaveValue('Preparar la demo final');
    const mobile = await box(taskDialog(page));
    expect(mobile.width).toBeCloseTo(MOBILE.width, 0);
    expect(mobile.y + mobile.height).toBeCloseTo(MOBILE.height, 0);

    await page.setViewportSize({ width: 1280, height: 900 });
    await expect(titleField(page)).toHaveValue('Preparar la demo final');
    expect((await box(taskDialog(page))).width).toBeLessThanOrEqual(460);
  });

  test('E-17 con Done elegido a 375, pasar a 1280 muestra las cuatro columnas', async ({
    page,
  }) => {
    await openBoard(page, MOBILE);
    await createTaskViaApi(page, { title: 'Preparar la demo' });
    await reloadBoard(page);
    await columnPicker(page, 'Done').check();

    await page.setViewportSize({ width: 1280, height: 900 });

    for (const name of COLUMNS) await expect(boardColumn(page, name)).toBeVisible();
    await expect(taskCard(page, 'Preparar la demo')).toBeVisible();
  });

  test('E-4 un título de 200 caracteres sin espacios no desborda la columna', async ({ page }) => {
    await openBoard(page);
    await createTaskViaApi(page, { title: 'a'.repeat(200) });
    await reloadBoard(page);
    const card = taskCard(page, 'a'.repeat(200));

    const cardBox = await box(card);
    const columnBox = await box(boardColumn(page, 'Backlog'));
    expect(cardBox.x).toBeGreaterThanOrEqual(columnBox.x);
    expect(cardBox.x + cardBox.width).toBeLessThanOrEqual(columnBox.x + columnBox.width + 0.5);
    expect(await card.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  });
});

test.describe('accesibilidad', () => {
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`RNF-001 axe sin infracciones en el tablero y en el diálogo (${colorScheme})`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme });
      await openBoard(page);
      await createTaskViaApi(
        page,
        { title: 'Preparar la demo', estimatedEndDate: isoDaysFromToday(-1) },
        'in_progress',
      );
      await createTaskViaApi(
        page,
        {
          title: 'Comprar pan',
          estimatedStartDate: isoDaysFromToday(-3),
          estimatedEndDate: isoDaysFromToday(3),
        },
        'done',
      );
      await reloadBoard(page);
      await test.step('tablero', () => expectNoAxeViolations(page));

      await taskCard(page, 'Preparar la demo').click();
      await expect(titleField(page)).toBeVisible();
      await test.step('diálogo', () => expectNoAxeViolations(page));
    });
  }
});

test.describe('rendimiento', () => {
  // Plan §7: solo en chromium, el navegador de desarrollo de RNF-004.
  test('RNF-004 E-2 con 500 tareas (200 en Backlog) las columnas salen en ≤ 2 s y la cabecera de la columna queda fija al hacer scroll', async ({
    page,
  }, info) => {
    test.skip(info.project.name !== 'chromium', 'RNF-004 se mide en chromium');
    test.setTimeout(240_000);
    await openBoard(page);
    const plan: TaskStatus[] = [
      ...Array<TaskStatus>(200).fill('backlog'),
      ...Array<TaskStatus>(100).fill('todo'),
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

    const start = Date.now();
    await page.goto('/');
    for (const [name, count] of [
      ['Backlog', 200],
      ['To do', 100],
      ['In progress', 100],
      ['Done', 100],
    ] as const) {
      await expect(boardColumn(page, name)).toHaveAccessibleName(`${name}, ${count} tareas`);
    }
    const elapsed = Date.now() - start;
    console.log(`RNF-004: columnas a la vista en ${elapsed} ms`);
    expect(elapsed).toBeLessThanOrEqual(2000);

    // E-2: la lista de la columna hace scroll por su cuenta y la cabecera sigue a la vista.
    const backlog = boardColumn(page, 'Backlog');
    const list = backlog.getByRole('list');
    const scrolled = await list.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
      return element.scrollTop;
    });
    expect(scrolled).toBeGreaterThan(0);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    const heading = await box(backlog.getByRole('heading', { level: 2 }));
    expect(heading.y).toBeGreaterThanOrEqual(0);
    await expect(backlog.getByRole('heading', { level: 2 })).toBeInViewport();
  });
});
