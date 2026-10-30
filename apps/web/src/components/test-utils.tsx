import type { Task } from '@todo/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
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

// jsdom no tiene matchMedia (plan 004 §8). Una lista por consulta, así que todos los que llaman a
// matchMedia con la misma consulta comparten oyentes.
class FakeMediaQueryList extends EventTarget {
  matches = false;
  onchange = null;
  constructor(readonly media: string) {
    super();
  }
}

// Spec 002 §7: jsdom 30 no tiene showModal ni close. Doble mínimo: `open`, el evento `close` y, como
// el navegador al abrirlo, el foco en el primer elemento enfocable. El comportamiento real del diálogo
// (Esc, foco atrapado, ::backdrop) se prueba en E2E.
const FOCUSABLE = 'input, textarea, select, button, [tabindex="0"]';
function installDialogDouble() {
  const proto = HTMLDialogElement.prototype;
  proto.showModal ??= function (this: HTMLDialogElement) {
    this.toggleAttribute('open', true);
    this.querySelector<HTMLElement>(FOCUSABLE)?.focus();
  };
  proto.close ??= function (this: HTMLDialogElement) {
    if (!this.hasAttribute('open')) return;
    this.toggleAttribute('open', false);
    this.dispatchEvent(new Event('close'));
  };
}
installDialogDouble();

let fixtureCount = 0;

// Spec 002: una tarea de ejemplo con un id distinto en cada llamada.
export function taskFixture(overrides: Partial<Task> = {}): Task {
  fixtureCount += 1;
  return {
    id: `00000000-0000-4000-8000-${String(fixtureCount).padStart(12, '0')}`,
    title: 'Preparar la demo',
    description: '',
    status: 'backlog',
    estimatedStartDate: null,
    estimatedEndDate: null,
    actualEndDate: null,
    ...overrides,
  };
}

// Sustituye fetch (respuestas por "MÉTODO /ruta"; sin sesión por defecto), location y matchMedia
// (ninguna consulta coincide por defecto) en cada test.
export function mockBrowser() {
  const routes: Record<string, Handler> = {};
  const mediaLists = new Map<string, FakeMediaQueryList>();
  const mediaList = (query: string) => {
    let list = mediaLists.get(query);
    if (!list) {
      list = new FakeMediaQueryList(query);
      mediaLists.set(query, list);
    }
    return list;
  };
  const setMediaMatches = (query: string, matches: boolean) => {
    const list = mediaList(query);
    list.matches = matches;
    list.dispatchEvent(Object.assign(new Event('change'), { matches, media: query }));
  };
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
    // Spec 002: un tablero vacío por defecto.
    routes['GET /api/tasks'] = () => json(200, { tasks: [] });
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('matchMedia', mediaList);
    setSearch('');
  });

  afterEach(() => {
    // Sin `globals` en Vitest, Testing Library no desmonta solo entre tests.
    cleanup();
    fetchMock.mockClear();
    replace.mockReset();
    reload.mockReset();
    mediaLists.clear();
    vi.unstubAllGlobals();
  });

  return { routes, fetch: fetchMock, replace, reload, setSearch, setMediaMatches, callsTo };
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

// RNF-001 (T-038): VoiceOver no anuncia una zona role="alert" que se inserta ya con el texto. Tiene que
// estar en la página, vacía, antes del error; el test comprueba después que el texto llega a este nodo.
export function emptyAlert() {
  const alert = screen.getByRole('alert');
  expect(alert.textContent).toBe('');
  return alert;
}

export function expectFieldError(element: HTMLElement, message: string) {
  expect(element.getAttribute('aria-invalid')).toBe('true');
  expect(descriptionOf(element)).toContain(message);
}
