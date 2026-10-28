import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SignupForm } from './SignupForm';

const REQUIRED = 'Este campo es obligatorio';
const INVALID_EMAIL = 'Introduce un email válido';
const PASSWORD_LENGTH = 'La contraseña debe tener entre 8 y 128 caracteres';
const EMAIL_TAKEN = 'Ya existe una cuenta con ese email';
const CONNECTION = 'No se ha podido conectar. Inténtalo de nuevo';

type Handler = () => Promise<Response>;

const json = (status: number, body: unknown) =>
  Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
const apiError = (status: number, code: string) => json(status, { error: { code, message: code } });

let routes: Record<string, Handler>;
const fetchMock = vi.fn<typeof fetch>((input, init) => {
  const key = `${init?.method ?? 'GET'} ${String(input)}`;
  const handler = routes[key];
  if (!handler) throw new Error(`fetch inesperado en el test: ${key}`);
  return handler();
});
const replace = vi.fn();

const signupCalls = () =>
  fetchMock.mock.calls.filter(
    ([input, init]) => init?.method === 'POST' && input === '/api/auth/signup',
  );

beforeEach(() => {
  routes = { 'GET /api/auth/me': () => apiError(401, 'UNAUTHENTICATED') };
  vi.stubGlobal('fetch', fetchMock);
  vi.stubGlobal('location', { ...window.location, replace });
});

afterEach(() => {
  fetchMock.mockClear();
  replace.mockReset();
  vi.unstubAllGlobals();
});

async function renderForm() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <SignupForm />
    </QueryClientProvider>,
  );
  const user = userEvent.setup();
  const email = await screen.findByLabelText(/email/i);
  const password = screen.getByLabelText(/contraseña/i);
  const submit = screen.getByRole('button', { name: 'Crear cuenta' });
  return { user, email, password, submit };
}

// Texto de los elementos a los que apunta aria-describedby.
function descriptionOf(element: HTMLElement) {
  return (element.getAttribute('aria-describedby') ?? '')
    .split(' ')
    .filter(Boolean)
    .map((id) => document.getElementById(id)?.textContent ?? '')
    .join(' ');
}

function expectFieldError(element: HTMLElement, message: string) {
  expect(element.getAttribute('aria-invalid')).toBe('true');
  expect(descriptionOf(element)).toContain(message);
}

describe('SignupForm', () => {
  it('RNF-001 tiene etiquetas visibles para email y contraseña y el botón "Crear cuenta"', async () => {
    const { email, password, submit } = await renderForm();

    expect(email).toHaveProperty('labels.length', 1);
    expect(password).toHaveProperty('labels.length', 1);
    expect(submit).toBeDefined();
  });

  it('CA-1.1 RF-002 al crear la cuenta (201) lleva a la zona privada', async () => {
    routes['POST /api/auth/signup'] = () =>
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
    routes['POST /api/auth/signup'] = () => apiError(409, 'EMAIL_ALREADY_REGISTERED');
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
      routes['POST /api/auth/signup'] = handler;
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

  it('E-8 el botón "Crear cuenta" queda desactivado mientras se envía', async () => {
    let respond: (res: Response) => void = () => {};
    routes['POST /api/auth/signup'] = () =>
      new Promise<Response>((resolve) => {
        respond = resolve;
      });
    const { user, email, password, submit } = await renderForm();

    await user.type(email, 'ana@example.com');
    await user.type(password, 'correcta-horse-1');
    await user.click(submit);

    await waitFor(() => expect((submit as HTMLButtonElement).disabled).toBe(true));
    respond(await apiError(409, 'EMAIL_ALREADY_REGISTERED'));
    await waitFor(() => expect((submit as HTMLButtonElement).disabled).toBe(false));
  });

  it('CA-4.3 RF-014 con sesión (me 200) lleva a la zona privada', async () => {
    routes['GET /api/auth/me'] = () => json(200, { user: { id: 'u1', email: 'ana@example.com' } });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={client}>
        <SignupForm />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/'));
  });
});
