import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { LoginForm } from './LoginForm';
import {
  apiError,
  emptyAlert,
  expectFieldError,
  json,
  mockBrowser,
  renderWithClient,
} from './test-utils';

const REQUIRED = 'Este campo es obligatorio';
const INVALID_CREDENTIALS = 'Email o contraseña incorrectos';
const CONNECTION = 'No se ha podido conectar. Inténtalo de nuevo';
const SESSION_EXPIRED = 'Tu sesión ha caducado. Vuelve a iniciar sesión';

const browser = mockBrowser();
const { replace } = browser;
const loginCalls = () => browser.callsTo('POST', '/api/auth/login');

async function renderForm() {
  renderWithClient(<LoginForm />);
  const user = userEvent.setup();
  const email = await screen.findByLabelText(/email/i);
  const password = screen.getByLabelText(/contraseña/i);
  // La spec no fija el texto del botón: es el único del formulario.
  const submit = screen.getByRole('button');
  return { user, email, password, submit };
}

async function submitWith(email: string, password: string) {
  const form = await renderForm();
  await form.user.type(form.email, email);
  await form.user.type(form.password, password);
  await form.user.click(form.submit);
  return form;
}

describe('LoginForm', () => {
  it('RNF-001 tiene etiquetas visibles para email y contraseña', async () => {
    const { email, password } = await renderForm();

    expect(email).toHaveProperty('labels.length', 1);
    expect(password).toHaveProperty('labels.length', 1);
  });

  it('CA-2.1 RF-008 con credenciales correctas (200) lleva a la zona privada', async () => {
    browser.routes['POST /api/auth/login'] = () =>
      json(200, { user: { id: 'u1', email: 'ana@example.com' } });

    await submitWith('ana@example.com', 'correcta-horse-1');

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/'));
    expect(JSON.parse(String(loginCalls()[0]?.[1]?.body))).toEqual({
      email: 'ana@example.com',
      password: 'correcta-horse-1',
    });
  });

  it('CA-2.3 CA-2.5 RF-009 con un 401 muestra "Email o contraseña incorrectos" como alerta, conserva el email y vacía la contraseña', async () => {
    browser.routes['POST /api/auth/login'] = () => apiError(401, 'INVALID_CREDENTIALS');

    const { email, password } = await submitWith('ana@example.com', 'otra-contrasena');

    expect((await screen.findByRole('alert')).textContent).toContain(INVALID_CREDENTIALS);
    expect((email as HTMLInputElement).value).toBe('ana@example.com');
    expect((password as HTMLInputElement).value).toBe('');
    expect(replace).not.toHaveBeenCalled();
  });

  it('RNF-001 RF-009 el error del formulario se escribe en la zona de alerta que ya estaba en la página', async () => {
    browser.routes['POST /api/auth/login'] = () => apiError(401, 'INVALID_CREDENTIALS');
    const { user, email, password, submit } = await renderForm();
    const alert = emptyAlert();

    await user.type(email, 'ana@example.com');
    await user.type(password, 'otra-contrasena');
    await user.click(submit);

    await waitFor(() => expect(alert.textContent).toBe(INVALID_CREDENTIALS));
    expect(alert.isConnected).toBe(true);
  });

  it('RF-007 con los dos campos vacíos indica en cada uno que es obligatorio y no envía nada', async () => {
    const { user, email, password, submit } = await renderForm();

    await user.click(submit);

    expectFieldError(email, REQUIRED);
    expectFieldError(password, REQUIRED);
    expect(loginCalls()).toHaveLength(0);
  });

  it('RNF-001 tras un envío inválido el foco está en el primer campo con error', async () => {
    const { user, email, password, submit } = await renderForm();

    await user.click(submit);
    expect(document.activeElement).toBe(email);

    await user.type(email, 'ana@example.com');
    await user.click(submit);
    expect(document.activeElement).toBe(password);
  });

  it.each([
    ['fetch rechaza', () => Promise.reject(new TypeError('Failed to fetch'))],
    ['el servidor responde 500', () => apiError(500, 'INTERNAL_ERROR')],
  ])(
    'RF-010 E-7 si %s muestra el error de conexión, conserva el email y vacía la contraseña',
    async (_name, handler) => {
      browser.routes['POST /api/auth/login'] = handler;

      const { email, password } = await submitWith('ana@example.com', 'correcta-horse-1');

      expect(await screen.findByText(CONNECTION)).toBeDefined();
      expect((email as HTMLInputElement).value).toBe('ana@example.com');
      expect((password as HTMLInputElement).value).toBe('');
      expect(replace).not.toHaveBeenCalled();
    },
  );

  it('CA-4.2 RF-013 con ?expired=1 muestra "Tu sesión ha caducado. Vuelve a iniciar sesión"', async () => {
    browser.setSearch('?expired=1');

    await renderForm();

    expect(screen.getByText(SESSION_EXPIRED)).toBeDefined();
  });

  it('RF-013 sin ?expired=1 no muestra el aviso de sesión caducada', async () => {
    await renderForm();

    expect(screen.queryByText(SESSION_EXPIRED)).toBeNull();
  });

  it('CA-1.6 RF-019 ofrece ir al registro con "¿No tienes cuenta? Crear cuenta"', async () => {
    await renderForm();

    const link = screen.getByRole('link', { name: 'Crear cuenta' });
    expect(link.getAttribute('href')).toBe('/signup');
    expect(link.parentElement?.textContent).toBe('¿No tienes cuenta? Crear cuenta');
  });

  it('RF-019 D-19 mientras se comprueba la sesión no hay enlace al registro', async () => {
    browser.routes['GET /api/auth/me'] = () => new Promise<Response>(() => {});

    renderWithClient(<LoginForm />);

    expect(await screen.findByText('Cargando…')).toBeDefined();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('CA-4.3 RF-014 con sesión (me 200) lleva a la zona privada', async () => {
    browser.routes['GET /api/auth/me'] = () =>
      json(200, { user: { id: 'u1', email: 'ana@example.com' } });

    renderWithClient(<LoginForm />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/'));
  });
});
