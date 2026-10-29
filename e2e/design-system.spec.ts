import { randomUUID } from 'node:crypto';
import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  emailField,
  logoutButton,
  PASSWORD,
  passwordField,
  signup,
  tabTo,
  uniqueEmail,
} from './helpers';

// Spec 004 (plan §7): aspecto, responsive, preferencias del sistema, teclado y accesibilidad, en cada
// proyecto de playwright.config.ts (RNF-004). Las medidas son las de getBoundingClientRect, en px CSS.

const SLOW_RESPONSE_MS = 2000;

// La tarjeta es el contenedor directo del título (AuthCard, plan §4.1).
const authCard = (page: Page) => page.getByRole('heading', { level: 1 }).locator('xpath=..');
// El botón principal es el único del formulario; su nombre cambia mientras espera (RF-013).
const submitButton = (page: Page) => page.locator('form').getByRole('button');
const banner = (page: Page) => page.getByRole('banner');
const accountButton = (page: Page) => page.getByRole('button', { name: /^Cuenta de / });
const logoutMenuItem = (page: Page) => page.getByRole('menuitem', { name: 'Cerrar sesión' });
const viewTitle = (page: Page) => page.getByRole('heading', { level: 1, name: 'Mis tareas' });
// Los textos de la cabecera pueden estar también en el menú cerrado o en el tooltip: solo cuenta lo
// que se ve.
const visible = (locator: Locator) => locator.filter({ visible: true });

// Empieza por «a», como `ana@example.com` en la spec, para que la inicial sea «A» (CA-2.2).
const anaEmail = () => `ana-${uniqueEmail()}`;
// E-1: 64 + «@» + 189 = 254 caracteres, el máximo válido (001, research R-4).
const longEmail = () =>
  `${`e2e-${randomUUID()}`.padEnd(64, 'a')}@${'b'.repeat(63)}.${'c'.repeat(63)}.${'d'.repeat(58)}.es`;

async function box(locator: Locator) {
  const rect = await locator.boundingBox();
  if (!rect) throw new Error(`${locator} no tiene caja: no se ve`);
  return rect;
}

async function open(page: Page, path: '/login' | '/signup', width: number) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(path);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

async function expectNoHorizontalScroll(page: Page) {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
}

async function fillCredentials(page: Page, email: string) {
  await emailField(page).fill(email);
  await passwordField(page).fill(PASSWORD);
}

// La respuesta llega a los 2 s. Si el test acaba antes, la página ya está cerrada y no hay a quién
// responder.
// Registra una cuenta nueva (la 001 lo hace a 1280) y deja la zona privada al ancho pedido.
async function openPrivateArea(page: Page, width: number, email = anaEmail()) {
  await signup(page, email);
  await page.setViewportSize({ width, height: 900 });
  await expect(viewTitle(page)).toBeVisible();
  return email;
}

async function fontSize(locator: Locator) {
  return locator.evaluate((element) => getComputedStyle(element).fontSize);
}

async function slowDown(page: Page, url: string) {
  await page.route(url, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, SLOW_RESPONSE_MS));
    await route.continue().catch(() => {});
  });
}

test.describe('pantallas de acceso', () => {
  test('CA-1.1 RF-001 RF-003 inicio de sesión a 1280: tarjeta de vidrio de 420 px, centrada y en orden', async ({
    page,
  }) => {
    await open(page, '/login', 1280);
    const card = authCard(page);

    const cardBox = await box(card);
    expect(cardBox.width).toBeCloseTo(420, 0);
    const rightGap = 1280 - (cardBox.x + cardBox.width);
    expect(Math.abs(cardBox.x - rightGap)).toBeLessThanOrEqual(1);
    const backdrop = await card.evaluate((element) => {
      const style = getComputedStyle(element);
      return (
        style.getPropertyValue('backdrop-filter') ||
        style.getPropertyValue('-webkit-backdrop-filter')
      );
    });
    expect(backdrop).not.toMatch(/^(none)?$/);

    const title = await box(page.getByRole('heading', { level: 1, name: 'Iniciar sesión' }));
    const email = await box(emailField(page));
    const password = await box(passwordField(page));
    const button = await box(submitButton(page));
    const footer = page.getByText('¿No tienes cuenta?');
    await expect(footer).toHaveText('¿No tienes cuenta? Crear cuenta');
    const footerBox = await box(footer);
    expect(title.y).toBeLessThan(email.y);
    expect(email.y).toBeLessThan(password.y);
    expect(password.y).toBeLessThan(button.y);
    expect(button.y).toBeLessThan(footerBox.y);
    expect(footerBox.y + footerBox.height).toBeLessThanOrEqual(cardBox.y + cardBox.height);

    const contentWidth = await card.evaluate((element) => {
      const style = getComputedStyle(element);
      return element.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    });
    expect(button.width).toBeCloseTo(contentWidth, 0);
  });

  for (const [width, cardWidth] of [
    [375, 343],
    [320, 288],
  ] as const) {
    test(`CA-1.2 RF-002 registro a ${width}: la tarjeta mide ${cardWidth} px, sin scroll horizontal`, async ({
      page,
    }) => {
      await open(page, '/signup', width);

      const cardBox = await box(authCard(page));
      expect(cardBox.width).toBeCloseTo(cardWidth, 0);
      expect(cardBox.x).toBeCloseTo(16, 0);
      await expectNoHorizontalScroll(page);

      const button = await box(submitButton(page));
      expect(button.x).toBeGreaterThanOrEqual(cardBox.x);
      expect(button.x + button.width).toBeLessThanOrEqual(cardBox.x + cardBox.width);
    });
  }

  test('CA-1.6 RF-005 registro con «ana@»: el campo Email lleva el anillo de --ring-error', async ({
    page,
  }) => {
    await open(page, '/signup', 1280);
    await fillCredentials(page, 'ana@');
    await submitButton(page).click();
    await expect(emailField(page)).toHaveAttribute('aria-invalid', 'true');

    // El color calculado del token, con la misma notación que usa el navegador en box-shadow.
    const ring = await page.evaluate(() => {
      if (!getComputedStyle(document.documentElement).getPropertyValue('--ring-error').trim()) {
        return '';
      }
      const probe = document.createElement('span');
      probe.style.color = 'var(--ring-error)';
      document.body.append(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    });
    expect(ring, '--ring-error no está definido').not.toBe('');
    await expect
      .poll(() => emailField(page).evaluate((input) => getComputedStyle(input).boxShadow))
      .toContain(ring);
  });

  test('CA-1.4 RF-004 registro sin conexión: alerta offline encima del campo Email', async ({
    page,
  }) => {
    await page.route('**/api/auth/signup', (route) => route.abort());
    await open(page, '/signup', 1280);
    await fillCredentials(page, uniqueEmail());
    await submitButton(page).click();

    const alert = authCard(page).locator('[data-tone="offline"]');
    await expect(alert).toHaveText('No se ha podido conectar. Inténtalo de nuevo');
    const alertBox = await box(alert);
    const label = await box(page.getByText('Email', { exact: true }));
    expect(alertBox.y + alertBox.height).toBeLessThanOrEqual(label.y);
  });

  for (const { ca, path, url, loadingLabel } of [
    {
      ca: 'CA-4.1',
      path: '/login',
      url: '**/api/auth/login',
      loadingLabel: 'Iniciando sesión…',
    },
    {
      ca: 'CA-4.2',
      path: '/signup',
      url: '**/api/auth/signup',
      loadingLabel: 'Creando cuenta…',
    },
  ] as const) {
    test(`${ca} RF-013 ${path} con el servidor lento: «${loadingLabel}», mismo ancho y aria-disabled`, async ({
      page,
    }) => {
      await slowDown(page, url);
      await open(page, path, 1280);
      const button = submitButton(page);
      const before = await box(button);

      await fillCredentials(page, uniqueEmail());
      await button.click();

      await expect(button.getByText(loadingLabel)).toBeVisible();
      await expect(button).toHaveAttribute('aria-disabled', 'true');
      expect((await box(button)).width).toBeCloseTo(before.width, 0);
    });
  }
});

test.describe('zona privada y menú de cuenta', () => {
  test('CA-2.1 RF-006 RF-024 a 1280: cabecera fija con nombre, email y «Cerrar sesión»; título display', async ({
    page,
  }) => {
    const email = await openPrivateArea(page, 1280);

    await expect(banner(page).getByText('Mis tareas', { exact: true })).toBeVisible();
    await expect(visible(banner(page).getByText(email)).first()).toBeVisible();
    await expect(banner(page).getByRole('button', { name: 'Cerrar sesión' })).toBeVisible();
    expect(await banner(page).evaluate((header) => getComputedStyle(header).position)).toBe(
      'sticky',
    );
    expect(await fontSize(viewTitle(page))).toBe('56px');
    await expect(page).toHaveTitle('Mis tareas');
  });

  for (const width of [375, 767]) {
    test(`CA-2.2 RF-007 RF-023 a ${width}: solo el nombre y el botón de cuenta con «A»`, async ({
      page,
    }) => {
      const email = await openPrivateArea(page, width);

      await expect(banner(page).getByText('Mis tareas', { exact: true })).toBeVisible();
      await expect(accountButton(page)).toHaveText('A');
      await expect(accountButton(page)).toHaveAccessibleName(`Cuenta de ${email}`);
      await expect(visible(banner(page).getByText(email))).toHaveCount(0);
      await expect(visible(logoutButton(page))).toHaveCount(0);
      await expectNoHorizontalScroll(page);
    });
  }

  test('CA-2.2 RF-006 RF-007 a 768: email y «Cerrar sesión» a la vista, sin botón de cuenta', async ({
    page,
  }) => {
    const email = await openPrivateArea(page, 768);

    await expect(visible(banner(page).getByText(email)).first()).toBeVisible();
    await expect(banner(page).getByRole('button', { name: 'Cerrar sesión' })).toBeVisible();
    await expect(visible(accountButton(page))).toHaveCount(0);
  });

  test('CA-2.4 CA-2.6 RF-020 RF-022 RF-024 a 375 con teclado: abrir, recorrer, Esc y cerrar sesión', async ({
    page,
  }) => {
    const email = await openPrivateArea(page, 375);
    expect(await fontSize(viewTitle(page))).toBe('40px');

    await tabTo(page, accountButton(page));
    await page.keyboard.press('Enter');
    await expect(page.getByRole('menu', { name: email })).toBeVisible();
    await expect(logoutMenuItem(page)).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(logoutMenuItem(page)).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await expect(logoutMenuItem(page)).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu')).toBeHidden();
    await expect(accountButton(page)).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(logoutMenuItem(page)).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/login');
  });

  test('E-14 RF-022 a 375: Tab con el menú abierto lo cierra y el foco sale del menú', async ({
    page,
    browserName,
  }) => {
    await openPrivateArea(page, 375);
    await tabTo(page, accountButton(page));
    await page.keyboard.press('Enter');
    await expect(logoutMenuItem(page)).toBeFocused();

    // Como en tabTo: WebKit en macOS necesita Option+Tab para pasar de un botón al siguiente.
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');

    await expect(page.getByRole('menu')).toBeHidden();
    await expect(accountButton(page)).not.toBeFocused();
    await expect(logoutMenuItem(page)).toHaveCount(0);
  });

  test('E-10 RF-007 con el menú abierto a 375, pasar a 768 lo cierra y muestra email y «Cerrar sesión»', async ({
    page,
  }) => {
    const email = await openPrivateArea(page, 375);
    await accountButton(page).click();
    await expect(page.getByRole('menu')).toBeVisible();

    await page.setViewportSize({ width: 768, height: 900 });

    await expect(page.getByRole('menu')).toBeHidden();
    await expect(visible(banner(page).getByText(email)).first()).toBeVisible();
    await expect(banner(page).getByRole('button', { name: 'Cerrar sesión' })).toBeVisible();
  });

  test('CA-2.3 RF-008 cerrar sesión sin conexión: sigue en / con una alerta offline entre la cabecera y el título', async ({
    page,
  }) => {
    await openPrivateArea(page, 1280);
    await page.route('**/api/auth/logout', (route) => route.abort());

    await banner(page).getByRole('button', { name: 'Cerrar sesión' }).click();

    const alert = page.locator('[data-tone="offline"]');
    await expect(alert).toHaveText('No se ha podido conectar. Inténtalo de nuevo');
    await expect(page).toHaveURL('/');
    const header = await box(banner(page));
    const alertBox = await box(alert);
    const title = await box(viewTitle(page));
    expect(header.y + header.height).toBeLessThanOrEqual(alertBox.y);
    expect(alertBox.y + alertBox.height).toBeLessThanOrEqual(title.y);
  });

  test('CA-4.3 RF-013 cerrar sesión con el servidor lento: «Cerrando sesión…», mismo ancho y aria-disabled', async ({
    page,
  }) => {
    await openPrivateArea(page, 1280);
    await slowDown(page, '**/api/auth/logout');
    // A 1280, el único botón de la cabecera; su nombre cambia mientras espera.
    const button = banner(page).getByRole('button');
    const before = await box(button);

    await button.click();

    await expect(button.getByText('Cerrando sesión…')).toBeVisible();
    await expect(button).toHaveAttribute('aria-disabled', 'true');
    expect((await box(button)).width).toBeCloseTo(before.width, 0);
  });

  test('E-1 RF-006 email de 254 caracteres a 1280: recortado dentro de la cabecera y completo en el tooltip', async ({
    page,
  }) => {
    const email = await openPrivateArea(page, 1280, longEmail());
    expect(email).toHaveLength(254);
    const header = banner(page);
    const logout = header.getByRole('button', { name: 'Cerrar sesión' });

    const pill = header.locator('[tabindex="0"]', { hasText: email });
    const pillBox = await box(pill);
    const headerBox = await box(header);
    const logoutBox = await box(logout);
    expect(await header.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
      true,
    );
    expect(pillBox.x).toBeGreaterThanOrEqual(headerBox.x);
    expect(pillBox.x + pillBox.width).toBeLessThanOrEqual(logoutBox.x);
    expect(
      await pill.evaluate(
        (element) =>
          element.scrollWidth > element.clientWidth &&
          getComputedStyle(element).textOverflow === 'ellipsis',
      ),
    ).toBe(true);

    // El tooltip es el elemento visible de la cabecera que muestra el email entero, sin recortar.
    const fullEmailShown = () =>
      header.evaluate(
        (element, text) =>
          [...element.querySelectorAll<HTMLElement>('*')].some(
            (node) =>
              node.textContent === text &&
              node.getClientRects().length > 0 &&
              getComputedStyle(node).visibility !== 'hidden' &&
              node.scrollWidth <= node.clientWidth,
          ),
        email,
      );

    await pill.hover();
    await expect.poll(fullEmailShown).toBe(true);
    await page.keyboard.press('Escape');
    await expect.poll(fullEmailShown).toBe(false);
    await page.mouse.move(0, 800);

    await tabTo(page, pill);
    await expect.poll(fullEmailShown).toBe(true);
  });
});
