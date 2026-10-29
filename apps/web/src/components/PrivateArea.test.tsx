import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { PrivateArea } from './PrivateArea';
import { apiError, emptyAlert, json, mockBrowser } from './test-utils';

const CONNECTION = 'No se ha podido conectar. Inténtalo de nuevo';
const USER = { id: 'u1', email: 'ana@example.com' };

const browser = mockBrowser();
const { replace, reload } = browser;

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
    const alert = emptyAlert();

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
