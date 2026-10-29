import { randomUUID } from 'node:crypto';
import AxeBuilder from '@axe-core/playwright';
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

// Como en tabTo: WebKit en macOS necesita Option+Tab para pasar de un botón al siguiente.
const tabKey = (browserName: string) => (browserName === 'webkit' ? 'Alt+Tab' : 'Tab');

const WIDTHS = [320, 375, 768, 1024, 1280, 1600];
// Lo que se puede pulsar o enfocar. La barra de herramientas de Astro vive en un shadow root y no
// aparece.
const INTERACTIVE = 'a[href], button, input, [tabindex="0"]';

type Rect = { name: string; left: number; right: number; top: number; bottom: number };

// El título y los elementos interactivos que se ven, en el orden del DOM.
async function visibleRects(page: Page, selector: string): Promise<Rect[]> {
  return page.evaluate(
    (selector) =>
      [...document.querySelectorAll<HTMLElement>(selector)]
        .filter(
          (element) =>
            element.getClientRects().length > 0 &&
            getComputedStyle(element).visibility !== 'hidden',
        )
        .map((element) => {
          const { left, right, top, bottom } = element.getBoundingClientRect();
          const name =
            element.getAttribute('aria-label') ||
            element.id ||
            element.textContent?.trim() ||
            element.tagName;
          return { name, left, right, top, bottom };
        }),
    selector,
  );
}

// RNF-002: sin scroll horizontal y con el título y los controles dentro de la ventana.
async function expectFitsViewport(page: Page) {
  await expectNoHorizontalScroll(page);
  const innerWidth = await page.evaluate(() => window.innerWidth);
  for (const rect of await visibleRects(page, `h1, ${INTERACTIVE}`)) {
    expect(rect.left, `${rect.name} se sale por la izquierda`).toBeGreaterThanOrEqual(0);
    expect(rect.right, `${rect.name} se sale por la derecha`).toBeLessThanOrEqual(innerWidth + 0.5);
  }
}

// RF-012: zona de pulsación ≥ 44 × 44 y ≥ 8 px hasta el siguiente elemento interactivo.
async function expectTouchTargets(page: Page) {
  const rects = await visibleRects(page, INTERACTIVE);
  expect(rects.length).toBeGreaterThan(0);
  for (const rect of rects) {
    expect(rect.right - rect.left, `ancho de ${rect.name}`).toBeGreaterThanOrEqual(44);
    expect(rect.bottom - rect.top, `alto de ${rect.name}`).toBeGreaterThanOrEqual(44);
  }
  for (let i = 1; i < rects.length; i++) {
    const current = rects[i - 1]!;
    const next = rects[i]!;
    const gapX = Math.max(0, next.left - current.right, current.left - next.right);
    const gapY = Math.max(0, next.top - current.bottom, current.top - next.bottom);
    expect(Math.max(gapX, gapY), `${current.name} → ${next.name}`).toBeGreaterThanOrEqual(8);
  }
}

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
  // `signup` comprueba que se ve el email, que por debajo de 768 px va en el menú de cuenta.
  await page.setViewportSize({ width: 1280, height: 900 });
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

    await page.keyboard.press(tabKey(browserName));

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

    // El tooltip es el elemento visible de la cabecera que muestra el email entero como texto
    // propio, sin recortar. Texto propio: un contenedor de la píldora recortada tiene el mismo
    // textContent y no se desborda, aunque el email esté cortado dentro.
    const fullEmailShown = () =>
      header.evaluate(
        (element, text) =>
          [...element.querySelectorAll<HTMLElement>('*')].some(
            (node) =>
              [...node.childNodes].some(
                (child) => child.nodeType === Node.TEXT_NODE && child.textContent === text,
              ) &&
              node.getClientRects().length > 0 &&
              getComputedStyle(node).visibility !== 'hidden' &&
              node.scrollWidth <= node.clientWidth,
          ),
        email,
      );

    expect(await fullEmailShown()).toBe(false);
    await pill.hover();
    await expect.poll(fullEmailShown).toBe(true);
    await page.keyboard.press('Escape');
    await expect.poll(fullEmailShown).toBe(false);
    await page.mouse.move(0, 800);

    await tabTo(page, pill);
    await expect.poll(fullEmailShown).toBe(true);
  });
});

test.describe('responsive, objetivos táctiles y foco', () => {
  for (const path of ['/login', '/signup'] as const) {
    test(`RNF-002 RNF-004 E-2 ${path} sin scroll horizontal ni contenido cortado de 320 a 1600`, async ({
      page,
    }) => {
      for (const width of WIDTHS) {
        await test.step(`${width} px`, async () => {
          await open(page, path, width);
          await expectFitsViewport(page);
        });
      }
    });
  }

  test('RNF-002 RNF-004 E-2 zona privada sin scroll horizontal ni contenido cortado de 320 a 1600', async ({
    page,
  }) => {
    await openPrivateArea(page, 1280);
    for (const width of WIDTHS) {
      await test.step(`${width} px`, async () => {
        await page.setViewportSize({ width, height: 900 });
        await expectFitsViewport(page);
      });
    }
  });

  test('CA-3.4 RNF-002 registro con zoom al 200 % a 1280 (ventana de 640 px CSS): sin scroll horizontal', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 640, height: 450 });
    await page.goto('/signup');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expectFitsViewport(page);
  });

  for (const width of [375, 1023]) {
    test(`CA-3.3 RF-012 a ${width}: botones, campos, enlaces y menú de 44 × 44 y a 8 px del siguiente`, async ({
      page,
    }) => {
      for (const path of ['/login', '/signup'] as const) {
        await test.step(path, async () => {
          await open(page, path, width);
          await expectTouchTargets(page);
        });
      }
      await openPrivateArea(page, width);
      await test.step('zona privada', () => expectTouchTargets(page));
      if (width < 768) {
        await test.step('zona privada con el menú de cuenta abierto', async () => {
          await accountButton(page).click();
          await expect(logoutMenuItem(page)).toBeVisible();
          await expectTouchTargets(page);
        });
      }
    });
  }

  test('CA-3.2 RF-011 inicio de sesión con Tab: foco visible de 2 px en el orden en que se ven', async ({
    page,
    browserName,
  }) => {
    await open(page, '/login', 1280);
    const expected = await page
      .locator('main')
      .evaluate((main, selector) => main.querySelectorAll(selector).length, INTERACTIVE);

    const focused: { top: number; outlineStyle: string; outlineWidth: string }[] = [];
    for (let i = 0; i <= expected; i++) {
      await page.keyboard.press(tabKey(browserName));
      const state = await page.evaluate(() => {
        const element = document.activeElement;
        if (!(element instanceof HTMLElement) || !element.closest('main')) return null;
        const { outlineStyle, outlineWidth } = getComputedStyle(element);
        return { top: element.getBoundingClientRect().top, outlineStyle, outlineWidth };
      });
      if (!state) break;
      focused.push(state);
    }

    expect(focused).toHaveLength(expected);
    for (const [i, state] of focused.entries()) {
      expect(state.outlineStyle, `elemento ${i + 1}`).toBe('solid');
      expect(state.outlineWidth, `elemento ${i + 1}`).toBe('2px');
      if (i > 0) expect(state.top).toBeGreaterThan(focused[i - 1]!.top);
    }
  });

  test('E-6 RF-004 a 320, sesión caducada y credenciales incorrectas: dos alertas en varias líneas, sin desbordarse', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto('/login?expired=1');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await fillCredentials(page, uniqueEmail());
    await submitButton(page).click();

    const alerts = page.locator('[data-tone]');
    await expect(alerts).toHaveCount(2);
    for (const alert of await alerts.all()) {
      const layout = await alert.evaluate((element) => {
        // Líneas = alturas distintas a las que empiezan los trozos de texto.
        const tops = new Set<number>();
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          const range = document.createRange();
          range.selectNodeContents(node);
          for (const rect of range.getClientRects()) {
            if (rect.width > 0) tops.add(Math.round(rect.top));
          }
        }
        return { lines: tops.size, overflows: element.scrollWidth > element.clientWidth };
      });
      expect(layout.lines).toBeGreaterThan(1);
      expect(layout.overflows).toBe(false);
    }
    await expectNoHorizontalScroll(page);
  });

  test('E-9 las tres pantallas están en español (html[lang=es])', async ({ page }) => {
    for (const path of ['/login', '/signup'] as const) {
      await open(page, path, 1280);
      await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    }
    await openPrivateArea(page, 1280);
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  });
});

// Colores calculados de DESIGN.md §1: ink‑950 (lienzo oscuro), ink‑100 (lienzo claro) e ink‑600.
const CANVAS = { dark: 'rgb(6, 20, 27)', light: 'rgb(227, 230, 230)' } as const;
const INK_600 = 'rgb(74, 92, 106)';
const ORIGIN = 'https://localhost:4321';

const bodyBackground = (page: Page) =>
  page.evaluate(() => getComputedStyle(document.body).backgroundColor);

// Alfa de un color calculado: `rgba(r, g, b, a)`, `oklch(l c h / a)`, `transparent` o, si no lleva
// alfa, 1.
function alphaOf(color: string) {
  if (color === 'transparent') return 0;
  const slash = color.match(/\/\s*([\d.]+)(%?)\s*\)$/);
  if (slash) return Number(slash[1]) / (slash[2] ? 100 : 1);
  const rgba = color.match(/^rgba\((?:[^,]+,){3}\s*([\d.]+)\)$/);
  return rgba ? Number(rgba[1]) : 1;
}

async function expectOpaqueWithContrastBorder(locator: Locator, name: string) {
  const style = await locator.evaluate((element) => {
    const computed = getComputedStyle(element);
    return {
      background: computed.backgroundColor,
      width: computed.borderTopWidth,
      borderStyle: computed.borderTopStyle,
      color: computed.borderTopColor,
    };
  });
  expect(alphaOf(style.background), `fondo de ${name}: ${style.background}`).toBe(1);
  expect(style, `borde de ${name}`).toMatchObject({
    width: '1px',
    borderStyle: 'solid',
    color: INK_600,
  });
}

// RNF-001: WCAG 2.2 AA más el contraste AAA del texto (C-26). `color-contrast-enhanced` no lleva
// ninguna de esas etiquetas, así que va en una pasada aparte. La barra de Astro no es de la app.
async function expectNoAxeViolations(page: Page) {
  const run = (builder: AxeBuilder) => builder.exclude('astro-dev-toolbar').analyze();
  // Una pasada detrás de otra: axe no admite dos a la vez en la misma página.
  const aa = await run(
    new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']),
  );
  const aaa = await run(new AxeBuilder({ page }).withRules(['color-contrast-enhanced']));
  const violations = [...aa.violations, ...aaa.violations].map(
    ({ id, nodes }) => `${id}: ${nodes.map((node) => node.target.join(' ')).join(', ')}`,
  );
  expect(violations).toEqual([]);
}

test.describe('preferencias del sistema, peticiones y accesibilidad', () => {
  for (const colorScheme of ['dark', 'light'] as const) {
    test(`${colorScheme === 'dark' ? 'CA-5.3' : 'CA-5.4'} RF-016 tema ${colorScheme === 'dark' ? 'oscuro' : 'claro'} del sistema → data-theme y lienzo`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme });
      for (const path of ['/login', '/signup'] as const) {
        await test.step(path, async () => {
          await open(page, path, 1280);
          await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme);
          expect(await bodyBackground(page)).toBe(CANVAS[colorScheme]);
        });
      }
      await openPrivateArea(page, 1280);
      await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme);
      expect(await bodyBackground(page)).toBe(CANVAS[colorScheme]);
    });
  }

  test('E-13 RF-016 con el tema oscuro, data-theme="dark" se pone antes de que exista <body>', async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.addInitScript(() => {
      const record = window as unknown as { themeBeforeBody?: boolean };
      new MutationObserver(() => {
        if (record.themeBeforeBody === undefined && document.documentElement?.dataset.theme) {
          record.themeBeforeBody =
            document.documentElement.dataset.theme === 'dark' && document.body === null;
        }
      }).observe(document, { subtree: true, childList: true, attributes: true });
    });

    await open(page, '/login', 1280);

    expect(
      await page.evaluate(
        () => (window as unknown as { themeBeforeBody?: boolean }).themeBeforeBody,
      ),
    ).toBe(true);
  });

  test('E-8 RF-015 RF-016 cambiar tema y contraste con la pantalla abierta cambia los estilos sin navegar', async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: 'light', contrast: 'no-preference' });
    await open(page, '/login', 1280);
    // Si la pantalla se recargara, la marca desaparecería.
    await page.evaluate(() => {
      (window as unknown as { stillHere?: boolean }).stillHere = true;
    });
    expect(await bodyBackground(page)).toBe(CANVAS.light);

    await page.emulateMedia({ colorScheme: 'dark' });
    await expect.poll(() => bodyBackground(page)).toBe(CANVAS.dark);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await page.emulateMedia({ colorScheme: 'light', contrast: 'more' });
    await expect
      .poll(() => authCard(page).evaluate((card) => getComputedStyle(card).borderTopColor))
      .toBe(INK_600);

    expect(
      await page.evaluate(() => (window as unknown as { stillHere?: boolean }).stillHere),
    ).toBe(true);
  });

  test('CA-5.2 RF-015 con «aumentar contraste»: tarjeta, campos y alertas opacos con borde de 1 px ink‑600', async ({
    page,
  }) => {
    await page.emulateMedia({ contrast: 'more' });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/login?expired=1');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await fillCredentials(page, uniqueEmail());
    await submitButton(page).click();
    await expect(page.locator('[data-tone]')).toHaveCount(2);

    await expectOpaqueWithContrastBorder(authCard(page), 'la tarjeta');
    await expectOpaqueWithContrastBorder(emailField(page), 'el campo Email');
    await expectOpaqueWithContrastBorder(passwordField(page), 'el campo Contraseña');
    for (const alert of await page.locator('[data-tone]').all()) {
      const tone = await alert.getAttribute('data-tone');
      await expectOpaqueWithContrastBorder(alert, `la alerta ${tone}`);
    }
  });

  test('CA-5.1 RF-014 con «reducir movimiento», pulsar un botón no lo escala', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, '/login', 1280);
    const button = submitButton(page);
    const { x, y, width, height } = await box(button);

    await page.mouse.move(x + width / 2, y + height / 2);
    await page.mouse.down();
    const style = await button.evaluate((element) => {
      const { scale, transform } = getComputedStyle(element);
      return { scale, transform };
    });
    await page.mouse.up();

    expect(style).toEqual({ scale: 'none', transform: 'none' });
  });

  test('RNF-003 C-16 abrir las tres pantallas no hace peticiones fuera de la app', async ({
    page,
  }) => {
    const urls: string[] = [];
    page.on('request', (request) => urls.push(request.url()));

    for (const path of ['/login', '/signup'] as const) await open(page, path, 1280);
    await openPrivateArea(page, 1280);
    await page.waitForLoadState('networkidle');

    // Las URL `data:` no salen de la página.
    const external = urls.filter(
      (url) => !url.startsWith('data:') && new URL(url).origin !== ORIGIN,
    );
    expect(external).toEqual([]);
  });

  test('E-4 si la fuente no llega, el título y los campos se ven con la de respaldo', async ({
    page,
  }) => {
    await page.route('**/*.woff2', (route) => route.abort());
    await open(page, '/login', 1280);

    await expect(page.getByRole('heading', { level: 1, name: 'Iniciar sesión' })).toBeVisible();
    await expect(emailField(page)).toBeVisible();
    await expect(passwordField(page)).toBeVisible();
  });

  for (const colorScheme of ['light', 'dark'] as const) {
    test(`RNF-001 RF-009 axe sin infracciones en las tres pantallas y el menú de cuenta, tema ${colorScheme === 'dark' ? 'oscuro' : 'claro'}`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme });
      for (const path of ['/login', '/signup'] as const) {
        await test.step(path, async () => {
          await open(page, path, 1280);
          await expectNoAxeViolations(page);
        });
      }
      await openPrivateArea(page, 1280);
      await test.step('zona privada', () => expectNoAxeViolations(page));
      await test.step('menú de cuenta abierto a 375', async () => {
        await page.setViewportSize({ width: 375, height: 900 });
        await accountButton(page).click();
        await expect(logoutMenuItem(page)).toBeVisible();
        await expectNoAxeViolations(page);
      });
    });
  }
});
