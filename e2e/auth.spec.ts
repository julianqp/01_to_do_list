import { expect, test } from '@playwright/test';
import {
  appLink,
  expectLoginScreen,
  expectPrivateArea,
  logout,
  signup,
  submitCredentials,
  tabTo,
  uniqueEmail,
} from './helpers';

// Flujo principal de la spec 001 (plan §7). Todo con teclado (RNF-001) y en cada proyecto de
// playwright.config.ts (RNF-004). Cada test registra su propia cuenta con un email único.

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

test('CA-1.6 RF-019 RNF-001 sin cuenta, del inicio de sesión al registro y a la zona privada', async ({
  page,
}) => {
  const email = uniqueEmail();
  await page.goto('/');
  await expectLoginScreen(page);

  await tabTo(page, appLink(page, 'Crear cuenta'));
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/signup');

  await submitCredentials(page, email);
  await expectPrivateArea(page, email);
});

test('CA-2.6 RF-019 RNF-001 del registro al inicio de sesión', async ({ page }) => {
  await page.goto('/signup');

  await tabTo(page, appLink(page, 'Iniciar sesión'));
  await page.keyboard.press('Enter');
  await expectLoginScreen(page);
});
