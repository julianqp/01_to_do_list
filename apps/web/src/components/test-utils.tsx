import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, expect, vi } from 'vitest';

// Utilidades compartidas por los tests de componentes (plan §7: fetch simulado y location espiado).

type Handler = () => Promise<Response>;

export const json = (status: number, body: unknown) =>
  Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );

export const apiError = (status: number, code: string) =>
  json(status, { error: { code, message: code } });

// Sustituye fetch (respuestas por "MÉTODO /ruta"; sin sesión por defecto) y location en cada test.
export function mockBrowser() {
  const routes: Record<string, Handler> = {};
  const fetchMock = vi.fn<typeof fetch>((input, init) => {
    const key = `${init?.method ?? 'GET'} ${String(input)}`;
    const handler = routes[key];
    if (!handler) throw new Error(`fetch inesperado en el test: ${key}`);
    return handler();
  });
  const replace = vi.fn();
  const reload = vi.fn();
  const setSearch = (search: string) => {
    vi.stubGlobal('location', { ...window.location, search, replace, reload });
  };
  const callsTo = (method: string, path: string) =>
    fetchMock.mock.calls.filter(
      ([input, init]) => (init?.method ?? 'GET') === method && input === path,
    );

  beforeEach(() => {
    for (const key of Object.keys(routes)) delete routes[key];
    routes['GET /api/auth/me'] = () => apiError(401, 'UNAUTHENTICATED');
    vi.stubGlobal('fetch', fetchMock);
    setSearch('');
  });

  afterEach(() => {
    fetchMock.mockClear();
    replace.mockReset();
    reload.mockReset();
    vi.unstubAllGlobals();
  });

  return { routes, fetch: fetchMock, replace, reload, setSearch, callsTo };
}

export function renderWithClient(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

// Texto de los elementos a los que apunta aria-describedby.
export function descriptionOf(element: HTMLElement) {
  return (element.getAttribute('aria-describedby') ?? '')
    .split(' ')
    .filter(Boolean)
    .map((id) => document.getElementById(id)?.textContent ?? '')
    .join(' ');
}

export function expectFieldError(element: HTMLElement, message: string) {
  expect(element.getAttribute('aria-invalid')).toBe('true');
  expect(descriptionOf(element)).toContain(message);
}
