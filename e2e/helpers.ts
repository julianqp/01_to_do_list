import { randomUUID } from 'node:crypto';
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
