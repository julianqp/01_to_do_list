import { expect, test, type Locator, type Page } from '@playwright/test';
import { emailField, PASSWORD, passwordField, uniqueEmail } from './helpers';

// Spec 004 (plan §7): aspecto, responsive, preferencias del sistema, teclado y accesibilidad, en cada
// proyecto de playwright.config.ts (RNF-004). Las medidas son las de getBoundingClientRect, en px CSS.

const SLOW_RESPONSE_MS = 2000;

// La tarjeta es el contenedor directo del título (AuthCard, plan §4.1).
const authCard = (page: Page) => page.getByRole('heading', { level: 1 }).locator('xpath=..');
// El botón principal es el único del formulario; su nombre cambia mientras espera (RF-013).
const submitButton = (page: Page) => page.locator('form').getByRole('button');

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
