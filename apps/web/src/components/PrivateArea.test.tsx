import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PrivateArea } from './PrivateArea';
import { apiError, json, mockBrowser, taskFixture } from './test-utils';

const CONNECTION = 'No se ha podido conectar. Inténtalo de nuevo';
const USER = { id: 'u1', email: 'ana@example.com' };

const browser = mockBrowser();
const { replace, reload } = browser;

// Spec 002: el tablero tiene su propia zona de alerta (D-20); la de la zona privada es la primera,
// justo debajo de la cabecera.
const pageAlert = () => screen.getAllByRole('alert')[0]!;
function emptyPageAlert() {
  const alert = pageAlert();
  expect(alert.textContent).toBe('');
  return alert;
}

// Sin QueryClientProvider externo: la isla trae su propio QueryClient con la redirección de D-10.
function renderPrivateArea() {
  return render(<PrivateArea />);
}

async function renderLoggedIn() {
  browser.routes['GET /api/auth/me'] = () => json(200, { user: USER });
  renderPrivateArea();
  const logout = await screen.findByRole('button', { name: 'Cerrar sesión' });
  return { user: userEvent.setup(), logout };
}

describe('PrivateArea', () => {
  it('RF-015 con sesión (me 200) muestra el email y el botón "Cerrar sesión"', async () => {
    await renderLoggedIn();

    expect(screen.getByText(USER.email)).toBeDefined();
  });

  it('CA-4.1 RF-012 sin sesión (me 401 UNAUTHENTICATED) lleva al inicio de sesión', async () => {
    browser.routes['GET /api/auth/me'] = () => apiError(401, 'UNAUTHENTICATED');

    renderPrivateArea();

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/login'));
  });

  it('CA-4.2 RF-013 E-5 D-10 con la sesión caducada (me 401 SESSION_EXPIRED) lleva al inicio de sesión con el aviso', async () => {
    browser.routes['GET /api/auth/me'] = () => apiError(401, 'SESSION_EXPIRED');

    renderPrivateArea();

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/login?expired=1'));
  });

  it('CA-3.1 RF-011 "Cerrar sesión" con un 204 lleva al inicio de sesión', async () => {
    browser.routes['POST /api/auth/logout'] = () =>
      Promise.resolve(new Response(null, { status: 204 }));
    const { user, logout } = await renderLoggedIn();

    await user.click(logout);

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/login'));
    expect(browser.callsTo('POST', '/api/auth/logout')).toHaveLength(1);
  });

  it.each([
    ['la red falla', () => Promise.reject(new TypeError('Failed to fetch'))],
    ['el servidor responde 500', () => apiError(500, 'INTERNAL_ERROR')],
  ])(
    'D-11 RF-010 si al cerrar sesión %s muestra el error de conexión y no sale',
    async (_name, handler) => {
      browser.routes['POST /api/auth/logout'] = handler;
      const { user, logout } = await renderLoggedIn();

      await user.click(logout);

      expect(await screen.findByText(CONNECTION)).toBeDefined();
      expect(replace).not.toHaveBeenCalled();
      expect(screen.getByText(USER.email)).toBeDefined();
    },
  );

  it('RNF-001 D-11 el error al cerrar sesión se escribe en la zona de alerta que ya estaba en la página', async () => {
    browser.routes['POST /api/auth/logout'] = () => apiError(500, 'INTERNAL_ERROR');
    const { user, logout } = await renderLoggedIn();
    const alert = emptyPageAlert();

    await user.click(logout);

    await waitFor(() => expect(alert.textContent).toBe(CONNECTION));
    expect(alert.isConnected).toBe(true);
  });

  it('CA-3.2 D-10 al volver con "atrás" desde la caché del navegador (pageshow persisted) recarga la página', async () => {
    await renderLoggedIn();

    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('CA-3.2 un pageshow normal (persisted false) no recarga', async () => {
    await renderLoggedIn();

    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: false }));

    expect(reload).not.toHaveBeenCalled();
  });

  it('RF-012 mientras me está pendiente solo hay "Cargando…" para lectores de pantalla', async () => {
    browser.routes['GET /api/auth/me'] = () => new Promise<Response>(() => {});

    const { container } = renderPrivateArea();

    const loading = await screen.findByText('Cargando…');
    expect(loading.classList.contains('sr-only')).toBe(true);
    expect(container.textContent).toBe('Cargando…');
    expect(screen.queryByRole('button')).toBeNull();
  });
});

// Spec 004: cabecera, título de vista y avisos con tono (RF-006, RF-008, RF-013, RF-024).
describe('PrivateArea · sistema de diseño', () => {
  const precedes = (a: Node, b: Node) =>
    (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
  const offlineAlert = () => pageAlert().querySelector<HTMLElement>('[data-tone]');

  it('CA-2.1 RF-006 RF-024 (002 RF-037, D-23) la cabecera va fuera de <main> y el único h1 es «Tablero», en display', async () => {
    await renderLoggedIn();
    const main = screen.getByRole('main');
    const banner = screen.getByRole('banner');
    const headings = await screen.findAllByRole('heading', { level: 1 });

    expect(main.contains(banner)).toBe(false);
    expect(headings).toHaveLength(1);
    expect(headings[0]!.textContent).toBe('Tablero');
    expect(main.contains(headings[0]!)).toBe(true);
    expect(headings[0]!.classList).toContain('text-display');
  });

  it('CA-2.3 RF-008 si falla el cierre de sesión, la alerta offline va entre la cabecera y el título', async () => {
    browser.routes['POST /api/auth/logout'] = () => apiError(500, 'INTERNAL_ERROR');
    const { user, logout } = await renderLoggedIn();

    await user.click(logout);

    await waitFor(() => expect(offlineAlert()?.dataset.tone).toBe('offline'));
    const alert = pageAlert();
    expect(precedes(screen.getByRole('banner'), alert)).toBe(true);
    expect(precedes(alert, screen.getByRole('heading', { level: 1 }))).toBe(true);
  });

  it('CA-4.3 RF-013 E-7 mientras se cierra la sesión: «Cerrando sesión…» y un doble clic hace una sola petición', async () => {
    browser.routes['POST /api/auth/logout'] = () => new Promise<Response>(() => {});
    const { user, logout } = await renderLoggedIn();

    await user.dblClick(logout);

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Cerrando sesión…' })).toBe(logout),
    );
    await user.click(logout);
    expect(browser.callsTo('POST', '/api/auth/logout')).toHaveLength(1);
  });

  it('E-12 si falla el cierre de sesión desde el menú de cuenta, el menú se cierra y aparece la alerta', async () => {
    browser.routes['POST /api/auth/logout'] = () => apiError(500, 'INTERNAL_ERROR');
    const { user } = await renderLoggedIn();
    const account = screen.getByRole('button', { name: `Cuenta de ${USER.email}` });

    await user.click(account);
    await user.click(screen.getByRole('menuitem', { name: 'Cerrar sesión' }));

    await waitFor(() => expect(offlineAlert()?.dataset.tone).toBe('offline'));
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(account);
  });
});

// Spec 002: el tablero en la zona privada y el error de carga (RF-004, RF-008, RF-037, D-8, D-23).
describe('PrivateArea · tablero', () => {
  const LOAD_ERROR = 'No hemos podido cargar tus tareas. Revisa tu conexión e inténtalo de nuevo.';
  const offline = () => Promise.reject(new TypeError('Failed to fetch'));

  afterEach(() => {
    vi.useRealTimers();
  });

  // withQueryClient reintenta 3 veces los errores de red (1 + 2 + 4 s): se adelanta el reloj.
  async function exhaustRetries() {
    for (let i = 0; i < 4; i++) {
      await act(() => vi.advanceTimersByTimeAsync(5000));
    }
  }

  it('RF-004 RF-037 D-23 con sesión se ve el tablero con sus tareas; el único h1 es «Tablero» y la cabecera sigue diciendo «Mis tareas»', async () => {
    browser.routes['GET /api/tasks'] = () =>
      json(200, { tasks: [taskFixture({ title: 'Preparar la demo', status: 'todo' })] });
    await renderLoggedIn();

    expect(await screen.findByRole('region', { name: 'To do, 1 tarea' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Preparar la demo' })).toBeDefined();
    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings.map((heading) => heading.textContent)).toEqual(['Tablero']);
    expect(within(screen.getByRole('banner')).getByText('Mis tareas')).toBeDefined();
  });

  it('RF-012 mientras se piden las tareas solo hay «Cargando…»', async () => {
    browser.routes['GET /api/auth/me'] = () => json(200, { user: USER });
    browser.routes['GET /api/tasks'] = () => new Promise<Response>(() => {});

    const { container } = renderPrivateArea();

    await waitFor(() => expect(browser.callsTo('GET', '/api/tasks')).toHaveLength(1));
    expect(container.textContent).toBe('Cargando…');
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('CA-1.6 RF-008 D-8 tasks con NetworkError → el mensaje en la zona de alerta que ya estaba, con «Reintentar»; al reintentar con éxito, el tablero', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    browser.routes['GET /api/auth/me'] = () => json(200, { user: USER });
    browser.routes['GET /api/tasks'] = offline;
    renderPrivateArea();
    await waitFor(() => expect(browser.callsTo('GET', '/api/tasks')).toHaveLength(1));
    const alert = emptyPageAlert();

    await exhaustRetries();

    await waitFor(() => expect(alert.textContent).toContain(LOAD_ERROR));
    expect(alert.isConnected).toBe(true);
    expect(screen.getByText(USER.email)).toBeDefined();
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
    const retry = within(alert).getByRole('button', { name: 'Reintentar' });

    browser.routes['GET /api/tasks'] = () => json(200, { tasks: [] });
    await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).click(retry);

    expect(await screen.findByRole('heading', { level: 1, name: 'Tablero' })).toBeDefined();
    expect(alert.textContent).toBe('');
  });

  it('RF-008 D-8 tasks con un error inesperado (500) → el mismo mensaje', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    browser.routes['GET /api/auth/me'] = () => json(200, { user: USER });
    browser.routes['GET /api/tasks'] = () => apiError(500, 'INTERNAL_ERROR');
    renderPrivateArea();

    await exhaustRetries();

    await waitFor(() => expect(pageAlert().textContent).toContain(LOAD_ERROR));
  });

  it('CA-1.6 RF-008 D-8 me con NetworkError → la cabecera sin email ni «Cerrar sesión» y el mismo error; «Reintentar» vuelve a pedir me', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    browser.routes['GET /api/auth/me'] = offline;
    renderPrivateArea();

    await exhaustRetries();

    await waitFor(() => expect(pageAlert().textContent).toContain(LOAD_ERROR));
    const banner = screen.getByRole('banner');
    expect(within(banner).getByText('Mis tareas')).toBeDefined();
    expect(within(banner).queryAllByRole('button')).toEqual([]);
    expect(browser.callsTo('GET', '/api/tasks')).toHaveLength(0);

    browser.routes['GET /api/auth/me'] = () => json(200, { user: USER });
    await userEvent
      .setup({ advanceTimers: vi.advanceTimersByTime })
      .click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Tablero' })).toBeDefined();
    expect(screen.getByText(USER.email)).toBeDefined();
  });

  it('E-12 tasks con 401 SESSION_EXPIRED lleva al inicio de sesión con el aviso, sin el error de carga', async () => {
    browser.routes['GET /api/auth/me'] = () => json(200, { user: USER });
    browser.routes['GET /api/tasks'] = () => apiError(401, 'SESSION_EXPIRED');

    renderPrivateArea();

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/login?expired=1'));
    expect(screen.queryByText(LOAD_ERROR)).toBeNull();
  });
});
