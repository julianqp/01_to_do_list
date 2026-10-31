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

// Lleva el foco al elemento solo con el tabulador, sin suponer nada del resto de la página.
// WebKit en macOS, como Safari, solo recorre los campos de texto con Tab; los botones y los enlaces
// necesitan Option+Tab.
export async function tabTo(page: Page, target: Locator) {
  await expect(target).toBeVisible();
  const key = page.context().browser()?.browserType().name() === 'webkit' ? 'Alt+Tab' : 'Tab';
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
// D-10: la tarjeta es un botón con `data-task-id`.
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
