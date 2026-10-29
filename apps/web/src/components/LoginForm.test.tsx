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

// Spec 004: tarjeta, orden y avisos con tono (RF-001, RF-003, RF-004, RF-013).
describe('LoginForm · sistema de diseño', () => {
  const precedes = (a: Node, b: Node) =>
    (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
  const alerts = () => [...document.querySelectorAll<HTMLElement>('[data-tone]')];
  const loginPending = () => {
    let respond: (response: Response) => void = () => {};
    browser.routes['POST /api/auth/login'] = () =>
      new Promise<Response>((resolve) => {
        respond = resolve;
      });
    return (response: Response) => respond(response);
  };

  it('RF-003 CA-1.1 X-1 orden: título, sesión caducada, avisos, Email, Contraseña, botón y enlace, todo en la tarjeta', async () => {
    browser.setSearch('?expired=1');
    const { email, password, submit } = await renderForm();
    const title = screen.getByRole('heading', { level: 1, name: 'Iniciar sesión' });
    const card = title.parentElement!;
    const order = [
      title,
      screen.getByRole('status'),
      screen.getByRole('alert'),
      email,
      password,
      submit,
      screen.getByRole('link', { name: 'Crear cuenta' }),
    ];

    for (const element of order) expect(card.contains(element)).toBe(true);
    for (let i = 1; i < order.length; i++) expect(precedes(order[i - 1]!, order[i]!)).toBe(true);
  });

  it('CA-1.3 RF-004 con un 401 la alerta es de error y va antes del campo Email', async () => {
    browser.routes['POST /api/auth/login'] = () => apiError(401, 'INVALID_CREDENTIALS');

    const { email } = await submitWith('ana@example.com', 'otra-contrasena');

    await waitFor(() => expect(alerts()).toHaveLength(1));
    const [alert] = alerts();
    expect(alert!.dataset.tone).toBe('error');
    expect(alert!.textContent).toBe(INVALID_CREDENTIALS);
    expect(alert!.querySelector('svg')).not.toBeNull();
    expect(precedes(alert!, email)).toBe(true);
  });

  it('CA-1.5 RF-004 con ?expired=1 la alerta es informativa', async () => {
    browser.setSearch('?expired=1');

    await renderForm();

    const status = screen.getByRole('status');
    expect(status.querySelector('[data-tone]')?.getAttribute('data-tone')).toBe('info');
    expect(status.textContent).toBe(SESSION_EXPIRED);
  });

  it('E-5 con ?expired=1 y un 401 hay dos alertas, primero la informativa', async () => {
    browser.setSearch('?expired=1');
    browser.routes['POST /api/auth/login'] = () => apiError(401, 'INVALID_CREDENTIALS');

    await submitWith('ana@example.com', 'otra-contrasena');

    await waitFor(() => expect(alerts()).toHaveLength(2));
    expect(alerts().map((alert) => alert.dataset.tone)).toEqual(['info', 'error']);
  });

  it('RF-004 sin conexión la alerta es de tipo offline', async () => {
    browser.routes['POST /api/auth/login'] = () => Promise.reject(new TypeError('Failed to fetch'));

    await submitWith('ana@example.com', 'correcta-horse-1');

    await waitFor(() => expect(alerts().map((alert) => alert.dataset.tone)).toEqual(['offline']));
  });

  it('CA-4.1 RF-013 E-7 mientras espera: «Iniciando sesión…», aria-disabled y un segundo clic no repite la petición', async () => {
    const respond = loginPending();
    const { user, submit } = await submitWith('ana@example.com', 'correcta-horse-1');

    await waitFor(() => expect(submit.getAttribute('aria-disabled')).toBe('true'));
    expect(submit).toBe(screen.getByRole('button', { name: 'Iniciando sesión…' }));
    expect(submit.querySelector('svg.lucide-loader-circle')).not.toBeNull();
    await user.click(submit);
    expect(loginCalls()).toHaveLength(1);

    respond(await apiError(401, 'INVALID_CREDENTIALS'));
  });

  it('CA-4.4 tras el error vuelve «Iniciar sesión» y se puede pulsar', async () => {
    const respond = loginPending();
    const { submit } = await submitWith('ana@example.com', 'correcta-horse-1');
    await waitFor(() => expect(submit.getAttribute('aria-disabled')).toBe('true'));

    respond(await apiError(401, 'INVALID_CREDENTIALS'));

    await waitFor(() => expect(submit.getAttribute('aria-disabled')).toBeNull());
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBe(submit);
  });
});
