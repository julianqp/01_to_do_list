import { randomUUID } from 'node:crypto';
import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page } from '@playwright/test';

// Utilidades comunes de los E2E (plan 004 D-17): las usan `auth.spec.ts` y `design-system.spec.ts`.

export const PASSWORD = 'correcta-horse-1';
const MAX_TABS = 20;

export function uniqueEmail() {
  return `e2e-${randomUUID()}@example.com`;
}

export const emailField = (page: Page) => page.getByLabel(/email/i);
export const passwordField = (page: Page) => page.getByLabel(/contraseña/i);
export const logoutButton = (page: Page) => page.getByRole('button', { name: 'Cerrar sesión' });
// Dentro de `main`: en desarrollo, la barra de herramientas de Astro también tiene enlaces.
export const appLink = (page: Page, name: string) =>
  page.locator('main').getByRole('link', { name });

// WebKit en macOS, como Safari, solo recorre los campos de texto con Tab; los botones y los enlaces
// necesitan Option+Tab.
export const tabKey = (page: Page) =>
  page.context().browser()?.browserType().name() === 'webkit' ? 'Alt+Tab' : 'Tab';

// Lleva el foco al elemento solo con el tabulador, sin suponer nada del resto de la página.
export async function tabTo(page: Page, target: Locator) {
  await expect(target).toBeVisible();
  const key = tabKey(page);
  for (let i = 0; i < MAX_TABS; i++) {
    if (await target.evaluate((element) => element === document.activeElement)) return;
    await page.keyboard.press(key);
  }
  await expect(target).toBeFocused();
}

export async function submitCredentials(page: Page, email: string) {
  await tabTo(page, emailField(page));
  await page.keyboard.type(email);
  await page.keyboard.press('Tab');
  await expect(passwordField(page)).toBeFocused();
  await page.keyboard.type(PASSWORD);
  await page.keyboard.press('Enter');
}

export async function expectPrivateArea(page: Page, email: string) {
  await expect(page).toHaveURL('/');
  await expect(page.getByText(email)).toBeVisible();
  await expect(logoutButton(page)).toBeVisible();
}

export async function expectLoginScreen(page: Page) {
  await expect(page).toHaveURL('/login');
  await expect(emailField(page)).toBeVisible();
  await expect(logoutButton(page)).toHaveCount(0);
}

export async function signup(page: Page, email: string) {
  await page.goto('/signup');
  await submitCredentials(page, email);
  await expectPrivateArea(page, email);
}

export async function logout(page: Page) {
  await tabTo(page, logoutButton(page));
  await page.keyboard.press('Enter');
  await expectLoginScreen(page);
}

// --- Spec 002: tablero de tareas (plan §7) ---

export type TaskInput = {
  title: string;
  description?: string;
  estimatedStartDate?: string | null;
  estimatedEndDate?: string | null;
};
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'done';
export type CreatedTask = { id: string; title: string; status: TaskStatus };

// Crea una tarea por la API con la cookie de la sesión de `page` (siempre entra en Backlog, RF-011).
// Con `status` distinto de Backlog, después la pasa a ese estado con un PUT.
export async function createTaskViaApi(
  page: Page,
  input: TaskInput,
  status: TaskStatus = 'backlog',
): Promise<CreatedTask> {
  const body = {
    description: '',
    estimatedStartDate: null,
    estimatedEndDate: null,
    ...input,
  };
  const created = await page.request.post('/api/tasks', { data: body });
  expect(created.status()).toBe(201);
  const { task } = (await created.json()) as { task: CreatedTask };
  if (status === 'backlog') return task;
  const actualEndDate = status === 'done' ? isoDaysFromToday(0) : null;
  const updated = await page.request.put(`/api/tasks/${task.id}`, {
    data: { ...body, status, actualEndDate },
  });
  expect(updated.status()).toBe(200);
  return ((await updated.json()) as { task: CreatedTask }).task;
}

// Fecha local de hoy ± días, en ISO. El navegador de Playwright usa la zona horaria de la máquina.
export function isoDaysFromToday(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// «dd/mm/aaaa» de una fecha ISO, como se escribe en los campos (D-17).
export function displayDate(iso: string) {
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}

// D-11: cada columna es una región con nombre «Estado, n tareas» (RF-009).
export const boardColumn = (page: Page, name: 'Backlog' | 'To do' | 'In progress' | 'Done') =>
  page.getByRole('region', { name: new RegExp(`^${name}, \\d+ tareas?$`) });
// 003/D-11: el botón de abrir de la tarjeta lleva `data-task-id` (el asa, `data-task-handle`).
export const taskCard = (scope: Page | Locator, title: string) =>
  scope.locator('button[data-task-id]').filter({ hasText: title });
// El «Crear tarea» del tablero (o del estado vacío), no el del diálogo de crear.
export const createTaskButton = (page: Page) =>
  page
    .getByRole('button', { name: 'Crear tarea', exact: true })
    .and(page.locator(':not(dialog *)'));
export const taskDialog = (page: Page) => page.getByRole('dialog');

// RNF-001: WCAG 2.2 AA más el contraste AAA del texto (C-26), como en `design-system.spec.ts`.
export async function expectNoAxeViolations(page: Page) {
  const run = (builder: AxeBuilder) => builder.exclude('astro-dev-toolbar').analyze();
  const aa = await run(
    new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']),
  );
  const aaa = await run(new AxeBuilder({ page }).withRules(['color-contrast-enhanced']));
  const violations = [...aa.violations, ...aaa.violations].map(
    ({ id, nodes }) => `${id}: ${nodes.map((node) => node.target.join(' ')).join(', ')}`,
  );
  expect(violations).toEqual([]);
}

// --- Spec 003: arrastrar y soltar (plan §7) ---

export type Point = { x: number; y: number };

// RF-012, D-11: el asa de la tarjeta, por su nombre exacto.
export const moveHandle = (scope: Page | Locator, title: string) =>
  scope.getByRole('button', { name: `Mover «${title}»`, exact: true });

const isLocator = (target: Locator | Point): target is Locator => 'boundingBox' in target;

// Un punto del elemento a media anchura y a `fractionY` de su altura (0.5, el centro).
export async function pointIn(target: Locator | Point, fractionY = 0.5): Promise<Point> {
  if (!isLocator(target)) return target;
  const rect = await target.boundingBox();
  if (!rect) throw new Error(`${target} no tiene caja: no se ve`);
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height * fractionY };
}

// D-6: dnd-kit empieza a arrastrar con el ratón tras 5 px y recalcula el destino en cada `mousemove`,
// así que el puntero se mueve en pasos. Coge la tarjeta por el centro, de modo que el centro de la
// capa es el puntero. Por defecto la lleva al cuarto superior del destino: encima de su centro, antes
// de esa tarjeta (D-9). Con `drop: false` la deja en el aire y devuelve dónde está el puntero.
type DragOptions = { drop?: boolean; fractionY?: number };

export async function dragCard(
  page: Page,
  card: Locator,
  target: Locator | Point,
  { drop = true, fractionY = 0.25 }: DragOptions = {},
): Promise<Point> {
  const from = await pointIn(card);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x, from.y + 10, { steps: 5 });
  const to = await pointIn(target, fractionY);
  await page.mouse.move(to.x, to.y, { steps: 15 });
  // Uno más, con la lista ya pintada con el hueco (MeasuringStrategy.Always, D-9).
  const end = { x: to.x + 1, y: to.y };
  await page.mouse.move(end.x, end.y);
  if (drop) await page.mouse.up();
  return end;
}

// D-6: con el dedo, el arrastre empieza tras mantenerlo 250 ms; se espera algo más.
export const TOUCH_HOLD_MS = 400;

type TouchType = 'touchStart' | 'touchMove' | 'touchEnd';
export type TouchFinger = (type: TouchType, point: Point) => Promise<void>;

// R-6: `page.touchscreen` solo hace `tap`. En `chromium` y `chrome`, CDP da eventos táctiles de
// confianza, que además hacen scroll. En `webkit` no hay CDP: `TouchEvent` sintéticos sobre el
// elemento donde empezó el toque (como los reales), que dnd-kit recibe pero que no hacen scroll.
// D-17: WebKit no deja construir `new Touch` («Illegal constructor»); `document.createTouch`, sí.
// El contexto necesita `hasTouch: true`.
export async function touchFinger(page: Page): Promise<TouchFinger> {
  if (page.context().browser()?.browserType().name() === 'chromium') {
    const cdp = await page.context().newCDPSession(page);
    return async (type, { x, y }) => {
      await cdp.send('Input.dispatchTouchEvent', {
        type,
        touchPoints: type === 'touchEnd' ? [] : [{ x: Math.round(x), y: Math.round(y) }],
      });
    };
  }
  return async (type, point) => {
    await page.evaluate(
      ({ type, x, y }) => {
        const state = window as Window & { e2eTouchTarget?: Element };
        // Fuera de los tipos de TypeScript: es antigua, pero WebKit la mantiene.
        const legacy = document as Document & {
          createTouch(
            view: Window,
            target: EventTarget,
            identifier: number,
            pageX: number,
            pageY: number,
            screenX: number,
            screenY: number,
          ): Touch;
          createTouchList(...touches: Touch[]): TouchList;
        };
        if (type === 'touchStart') state.e2eTouchTarget = document.elementFromPoint(x, y)!;
        const target = state.e2eTouchTarget!;
        const [pageX, pageY] = [x + window.scrollX, y + window.scrollY];
        const touch = legacy.createTouch(window, target, 1, pageX, pageY, x, y);
        // WebKit pide `TouchList`, no arrays.
        const touches =
          type === 'touchEnd' ? legacy.createTouchList() : legacy.createTouchList(touch);
        const init = {
          bubbles: true,
          cancelable: true,
          touches,
          targetTouches: touches,
          changedTouches: legacy.createTouchList(touch),
        };
        target.dispatchEvent(new TouchEvent(type.toLowerCase(), init as unknown as TouchEventInit));
      },
      { type, ...point },
    );
  };
}

// Mueve el dedo en línea recta en `steps` pasos, sin incluir el punto de partida.
async function slide(finger: TouchFinger, from: Point, to: Point, steps: number) {
  for (let i = 1; i <= steps; i++) {
    await finger('touchMove', {
      x: from.x + ((to.x - from.x) * i) / steps,
      y: from.y + ((to.y - from.y) * i) / steps,
    });
  }
}

// RF-018: mantiene el dedo sobre la tarjeta y, sin levantarlo, la lleva al destino, como `dragCard`.
// Con `drop: false`, el test levanta después el mismo dedo (`finger`).
export async function touchDragCard(
  page: Page,
  card: Locator,
  target: Locator | Point,
  { drop = true, fractionY = 0.25, finger: given }: DragOptions & { finger?: TouchFinger } = {},
): Promise<Point> {
  const finger = given ?? (await touchFinger(page));
  const from = await pointIn(card);
  await finger('touchStart', from);
  await page.waitForTimeout(TOUCH_HOLD_MS);
  await slide(finger, from, { x: from.x, y: from.y + 10 }, 3);
  const to = await pointIn(target, fractionY);
  await slide(finger, { x: from.x, y: from.y + 10 }, to, 15);
  const end = { x: to.x + 1, y: to.y };
  await finger('touchMove', end);
  if (drop) await finger('touchEnd', end);
  return end;
}

// CA-4.2: desliza el dedo sin mantenerlo antes.
export async function touchSwipe(page: Page, from: Point, to: Point) {
  const finger = await touchFinger(page);
  await finger('touchStart', from);
  await slide(finger, from, to, 10);
  await finger('touchEnd', to);
}
