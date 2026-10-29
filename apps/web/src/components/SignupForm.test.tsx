import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { SignupForm } from './SignupForm';
import {
  apiError,
  emptyAlert,
  expectFieldError,
  json,
  mockBrowser,
  renderWithClient,
} from './test-utils';

const REQUIRED = 'Este campo es obligatorio';
const INVALID_EMAIL = 'Introduce un email válido';
const PASSWORD_LENGTH = 'La contraseña debe tener entre 8 y 128 caracteres';
const EMAIL_TAKEN = 'Ya existe una cuenta con ese email';
const CONNECTION = 'No se ha podido conectar. Inténtalo de nuevo';

const browser = mockBrowser();
const { replace } = browser;
const signupCalls = () => browser.callsTo('POST', '/api/auth/signup');

async function renderForm() {
  renderWithClient(<SignupForm />);
  const user = userEvent.setup();
  const email = await screen.findByLabelText(/email/i);
  const password = screen.getByLabelText(/contraseña/i);
  const submit = screen.getByRole('button', { name: 'Crear cuenta' });
  return { user, email, password, submit };
}

describe('SignupForm', () => {
  it('RNF-001 tiene etiquetas visibles para email y contraseña y el botón "Crear cuenta"', async () => {
    const { email, password, submit } = await renderForm();

    expect(email).toHaveProperty('labels.length', 1);
    expect(password).toHaveProperty('labels.length', 1);
    expect(submit).toBeDefined();
  });

  it('CA-1.1 RF-002 al crear la cuenta (201) lleva a la zona privada', async () => {
    browser.routes['POST /api/auth/signup'] = () =>
      json(201, { user: { id: 'u1', email: 'ana@example.com' } });
    const { user, email, password, submit } = await renderForm();

    await user.type(email, 'ana@example.com');
    await user.type(password, 'correcta-horse-1');
    await user.click(submit);

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/'));
    expect(JSON.parse(String(signupCalls()[0]?.[1]?.body))).toEqual({
      email: 'ana@example.com',
      password: 'correcta-horse-1',
    });
  });

  it('CA-1.2 RF-004 E-8 con un 409 muestra "Ya existe una cuenta con ese email" junto al email', async () => {
    browser.routes['POST /api/auth/signup'] = () => apiError(409, 'EMAIL_ALREADY_REGISTERED');
    const { user, email, password, submit } = await renderForm();

    await user.type(email, 'ana@example.com');
    await user.type(password, 'correcta-horse-1');
    await user.click(submit);

    await waitFor(() => expectFieldError(email, EMAIL_TAKEN));
    expect(replace).not.toHaveBeenCalled();
  });

  it('CA-1.3 RF-005 E-1 con "ana@" indica el formato junto al email y no envía nada', async () => {
    const { user, email, password, submit } = await renderForm();

    await user.type(email, 'ana@');
    await user.type(password, 'correcta-horse-1');
    await user.click(submit);

    expectFieldError(email, INVALID_EMAIL);
    expect(signupCalls()).toHaveLength(0);
  });

  it('CA-1.6 RF-005 RF-010 D-15 con «ana@» el campo Email lleva el anillo, un icono y el mensaje de la 001', async () => {
    const { user, email, password, submit } = await renderForm();

    await user.type(email, 'ana@');
    await user.type(password, 'correcta-horse-1');
    await user.click(submit);

    expectFieldError(email, INVALID_EMAIL);
    const icon = email.parentElement?.querySelector('svg');
    expect(icon?.getAttribute('aria-hidden')).toBe('true');
    expect(icon?.getAttribute('class')).toContain('text-ring-error');
    for (const name of [
      'h-13',
      'rounded-pill',
      'bg-raised',
      'border-contrast',
      'focus:bg-raised-hover',
      'focus:shadow-(--focus-halo)',
      'aria-invalid:inset-ring-ring-error',
      'aria-invalid:pe-12',
    ]) {
      expect(email.classList).toContain(name);
    }
    const label = (email as HTMLInputElement).labels?.[0];
    expect(label?.className).toContain('text-sm');
    expect(label?.classList).toContain('text-2');
    expect(label?.classList).toContain('ps-5');
  });

  it('CA-1.4 RF-006 con una contraseña de 7 caracteres indica la longitud junto a la contraseña', async () => {
    const { user, email, password, submit } = await renderForm();

    await user.type(email, 'ana@example.com');
    await user.type(password, '1234567');
    await user.click(submit);

    expectFieldError(password, PASSWORD_LENGTH);
    expect(email.getAttribute('aria-invalid')).not.toBe('true');
    expect(signupCalls()).toHaveLength(0);
  });

  it('CA-1.5 RF-007 E-1 con los dos campos vacíos indica en cada uno que es obligatorio', async () => {
    const { user, email, password, submit } = await renderForm();

    await user.click(submit);

    expectFieldError(email, REQUIRED);
    expectFieldError(password, REQUIRED);
    expect(signupCalls()).toHaveLength(0);
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
      browser.routes['POST /api/auth/signup'] = handler;
      const { user, email, password, submit } = await renderForm();

      await user.type(email, 'ana@example.com');
      await user.type(password, 'correcta-horse-1');
      await user.click(submit);

      expect(await screen.findByText(CONNECTION)).toBeDefined();
      expect((email as HTMLInputElement).value).toBe('ana@example.com');
      expect((password as HTMLInputElement).value).toBe('');
      expect(replace).not.toHaveBeenCalled();
    },
  );

  it('RNF-001 RF-010 el error de conexión se escribe en la zona de alerta que ya estaba en la página', async () => {
    browser.routes['POST /api/auth/signup'] = () => apiError(500, 'INTERNAL_ERROR');
    const { user, email, password, submit } = await renderForm();
    const alert = emptyAlert();

    await user.type(email, 'ana@example.com');
    await user.type(password, 'correcta-horse-1');
    await user.click(submit);

    await waitFor(() => expect(alert.textContent).toBe(CONNECTION));
    expect(alert.isConnected).toBe(true);
  });

  // Spec 004 D-9 (plan §7): el botón ya no lleva `disabled`, sino `aria-disabled` (no pierde el
  // foco). Lo que se comprueba no cambia: un solo envío a la vez.
  it('E-8 el botón "Crear cuenta" queda desactivado mientras se envía', async () => {
    let respond: (res: Response) => void = () => {};
    browser.routes['POST /api/auth/signup'] = () =>
      new Promise<Response>((resolve) => {
        respond = resolve;
      });
    const { user, email, password, submit } = await renderForm();

    await user.type(email, 'ana@example.com');
    await user.type(password, 'correcta-horse-1');
    await user.click(submit);

    await waitFor(() => expect(submit.getAttribute('aria-disabled')).toBe('true'));
    await user.click(submit);
    expect(signupCalls()).toHaveLength(1);
    respond(await apiError(409, 'EMAIL_ALREADY_REGISTERED'));
    await waitFor(() => expect(submit.getAttribute('aria-disabled')).toBeNull());
  });

  it('CA-2.6 RF-019 ofrece ir al inicio de sesión con "¿Ya tienes cuenta? Iniciar sesión"', async () => {
    await renderForm();

    const link = screen.getByRole('link', { name: 'Iniciar sesión' });
    expect(link.getAttribute('href')).toBe('/login');
    expect(link.parentElement?.textContent).toBe('¿Ya tienes cuenta? Iniciar sesión');
  });

  it('RF-019 D-19 mientras se comprueba la sesión no hay enlace al inicio de sesión', async () => {
    browser.routes['GET /api/auth/me'] = () => new Promise<Response>(() => {});

    renderWithClient(<SignupForm />);

    expect(await screen.findByText('Cargando…')).toBeDefined();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('CA-4.3 RF-014 con sesión (me 200) lleva a la zona privada', async () => {
    browser.routes['GET /api/auth/me'] = () =>
      json(200, { user: { id: 'u1', email: 'ana@example.com' } });

    renderWithClient(<SignupForm />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/'));
  });
});

// Spec 004: tarjeta, orden y avisos con tono (RF-002, RF-003, RF-004, RF-013).
describe('SignupForm · sistema de diseño', () => {
  const precedes = (a: Node, b: Node) =>
    (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;

  it('RF-003 CA-1.2 X-1 orden: título, avisos, Email, Contraseña, botón y enlace, todo en la tarjeta', async () => {
    const { email, password, submit } = await renderForm();
    const title = screen.getByRole('heading', { level: 1, name: 'Crear cuenta' });
    const card = title.parentElement!;
    const order = [
      title,
      screen.getByRole('alert'),
      email,
      password,
      submit,
      screen.getByRole('link', { name: 'Iniciar sesión' }),
    ];

    for (const element of order) expect(card.contains(element)).toBe(true);
    for (let i = 1; i < order.length; i++) expect(precedes(order[i - 1]!, order[i]!)).toBe(true);
  });

  it('CA-1.4 RF-004 sin conexión la alerta es de tipo offline, con icono y encima del campo Email', async () => {
    browser.routes['POST /api/auth/signup'] = () =>
      Promise.reject(new TypeError('Failed to fetch'));
    const { user, email, password, submit } = await renderForm();

    await user.type(email, 'ana@example.com');
    await user.type(password, 'correcta-horse-1');
    await user.click(submit);

    const alert = await waitFor(() => {
      const found = screen.getByRole('alert').querySelector<HTMLElement>('[data-tone]');
      expect(found).not.toBeNull();
      return found!;
    });
    expect(alert.dataset.tone).toBe('offline');
    expect(alert.textContent).toBe(CONNECTION);
    expect(alert.querySelector('svg')).not.toBeNull();
    expect(precedes(alert, email)).toBe(true);
  });

  it('CA-4.2 RF-013 mientras espera: «Creando cuenta…» con el anillo de carga', async () => {
    browser.routes['POST /api/auth/signup'] = () => new Promise<Response>(() => {});
    const { user, email, password, submit } = await renderForm();

    await user.type(email, 'ana@example.com');
    await user.type(password, 'correcta-horse-1');
    await user.click(submit);

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Creando cuenta…' })).toBe(submit),
    );
    expect(submit.querySelector('svg.lucide-loader-circle')).not.toBeNull();
  });
});
