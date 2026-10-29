import { randomUUID } from 'node:crypto';
import { expect, test, type Locator, type Page } from '@playwright/test';

// Flujo principal de la spec 001 (plan §7). Todo con teclado (RNF-001) y en cada proyecto de
// playwright.config.ts (RNF-004). Cada test registra su propia cuenta con un email único.

const PASSWORD = 'correcta-horse-1';
const MAX_TABS = 20;

function uniqueEmail() {
  return `e2e-${randomUUID()}@example.com`;
}

const emailField = (page: Page) => page.getByLabel(/email/i);
const passwordField = (page: Page) => page.getByLabel(/contraseña/i);
const logoutButton = (page: Page) => page.getByRole('button', { name: 'Cerrar sesión' });

// Lleva el foco al elemento solo con el tabulador, sin suponer nada del resto de la página.
// WebKit en macOS, como Safari, solo recorre los campos de texto con Tab; los botones necesitan
// Option+Tab.
async function tabTo(page: Page, target: Locator) {
  await expect(target).toBeVisible();
  const key = page.context().browser()?.browserType().name() === 'webkit' ? 'Alt+Tab' : 'Tab';
  for (let i = 0; i < MAX_TABS; i++) {
    if (await target.evaluate((element) => element === document.activeElement)) return;
    await page.keyboard.press(key);
  }
  await expect(target).toBeFocused();
}

async function submitCredentials(page: Page, email: string) {
  await tabTo(page, emailField(page));
  await page.keyboard.type(email);
  await page.keyboard.press('Tab');
  await expect(passwordField(page)).toBeFocused();
  await page.keyboard.type(PASSWORD);
  await page.keyboard.press('Enter');
}

async function expectPrivateArea(page: Page, email: string) {
  await expect(page).toHaveURL('/');
  await expect(page.getByText(email)).toBeVisible();
  await expect(logoutButton(page)).toBeVisible();
}

async function expectLoginScreen(page: Page) {
  await expect(page).toHaveURL('/login');
  await expect(emailField(page)).toBeVisible();
  await expect(logoutButton(page)).toHaveCount(0);
}

async function signup(page: Page, email: string) {
  await page.goto('/signup');
  await submitCredentials(page, email);
  await expectPrivateArea(page, email);
}

async function logout(page: Page) {
  await tabTo(page, logoutButton(page));
  await page.keyboard.press('Enter');
  await expectLoginScreen(page);
}

test('CA-1.1 RF-002 RNF-001 registro → zona privada con el email visible', async ({ page }) => {
  await signup(page, uniqueEmail());
});

test('CA-3.1 CA-3.2 CA-2.2 CA-4.3 RF-014 flujo completo: registro, recarga, cierre, "atrás", login con mayúsculas y pantallas públicas con sesión', async ({
  page,
}) => {
  const email = uniqueEmail();
  await signup(page, email);

  await page.reload();
  await expectPrivateArea(page, email);

  // El registro y el cierre de sesión navegan con location.replace: sin una entrada nueva de la
  // zona privada en el historial, "atrás" saldría de la app en vez de volver a ella. Un goto('/')
  // no la crea (ir a la misma URL reemplaza la entrada), así que se abre /login, que con sesión
  // lleva a la zona privada (CA-4.3).
  await page.goto('/login');
  await expectPrivateArea(page, email);

  await logout(page);

  await page.goBack();
  await expectLoginScreen(page);

  await page.goto('/');
  await expectLoginScreen(page);

  await submitCredentials(page, email.toUpperCase());
  await expectPrivateArea(page, email);

  await page.goto('/login');
  await expectPrivateArea(page, email);

  await page.goto('/signup');
  await expectPrivateArea(page, email);
});

test('CA-4.1 RF-012 abrir la zona privada sin sesión lleva al inicio de sesión', async ({
  page,
}) => {
  await page.goto('/');
  await expectLoginScreen(page);
});

test('CA-5.1 RF-016 un contexto nuevo con el estado guardado entra directo en la zona privada', async ({
  browser,
  page,
}) => {
  const email = uniqueEmail();
  await signup(page, email);

  const state = await page.context().storageState();
  // storageState también guarda las cookies de sesión: sin fecha de caducidad, cerrar el navegador
  // la perdería aunque este test pasara.
  const sid = state.cookies.find((cookie) => cookie.name === 'sid');
  expect(sid?.expires).toBeGreaterThan(Date.now() / 1000);
  await page.context().close();

  const reopened = await browser.newContext({ storageState: state });
  const reopenedPage = await reopened.newPage();
  await reopenedPage.goto('/');
  await expectPrivateArea(reopenedPage, email);
  await reopened.close();
});

test('E-6 cerrar sesión en una pestaña lleva al inicio de sesión en la otra al recargar', async ({
  context,
  page,
}) => {
  const email = uniqueEmail();
  await signup(page, email);

  const otherTab = await context.newPage();
  await otherTab.goto('/');
  await expectPrivateArea(otherTab, email);

  await logout(page);

  await otherTab.reload();
  await expectLoginScreen(otherTab);
});
