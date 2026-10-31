import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch, NetworkError } from './api';

const fetchMock = vi.fn<typeof fetch>();

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe('apiFetch', () => {
  it('C-7 llama a la ruta relativa /api/... y devuelve el JSON', async () => {
    const user = { id: 'u1', email: 'ana@example.com' };
    fetchMock.mockResolvedValue(json(200, { user }));

    await expect(apiFetch('/api/auth/me')).resolves.toEqual({ user });
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/auth/me');
  });

  it('RF-010 E-7 si fetch rechaza → NetworkError', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(apiFetch('/api/auth/me')).rejects.toBeInstanceOf(NetworkError);
  });

  it.each([500, 502, 504])(
    'RF-010 E-7 una respuesta %i es un error inesperado: mismo trato que la red (NetworkError)',
    async (status) => {
      fetchMock.mockResolvedValue(
        json(status, { error: { code: 'INTERNAL_ERROR', message: 'x' } }),
      );

      await expect(apiFetch('/api/auth/me')).rejects.toBeInstanceOf(NetworkError);
    },
  );

  it('C-9 un 4xx con { error } → ApiError con su code y status', async () => {
    fetchMock.mockResolvedValue(
      json(401, { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' } }),
    );

    const error = await apiFetch('/api/auth/login', { method: 'POST', body: {} }).catch(
      (e: unknown) => e,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ code: 'INVALID_CREDENTIALS', status: 401 });
  });

  it('D-13 un POST envía Content-Type: application/json y el cuerpo en JSON', async () => {
    fetchMock.mockResolvedValue(json(200, {}));

    await apiFetch('/api/auth/login', {
      method: 'POST',
      body: { email: 'ana@example.com', password: 'x' },
    });

    const init = fetchMock.mock.calls[0]?.[1];
    expect(init?.method).toBe('POST');
    expect(new Headers(init?.headers).get('Content-Type')).toBe('application/json');
    expect(init?.body).toBe(JSON.stringify({ email: 'ana@example.com', password: 'x' }));
  });

  it('D-13 un POST sin datos envía {} como cuerpo', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await apiFetch('/api/auth/logout', { method: 'POST' });

    const init = fetchMock.mock.calls[0]?.[1];
    expect(new Headers(init?.headers).get('Content-Type')).toBe('application/json');
    expect(init?.body).toBe('{}');
  });

  it('D-13 una respuesta 204 se resuelve sin cuerpo', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(apiFetch('/api/auth/logout', { method: 'POST' })).resolves.toBeUndefined();
  });
});

// Spec 002 D-21: PUT y DELETE van como POST (base de RF-013 y RF-027).
describe('apiFetch · PUT y DELETE', () => {
  it('D-21 RF-013 un PUT envía Content-Type: application/json y el cuerpo en JSON', async () => {
    const task = { id: 't1', title: 'Preparar la demo' };
    fetchMock.mockResolvedValue(json(200, { task }));

    await expect(
      apiFetch('/api/tasks/t1', { method: 'PUT', body: { title: 'Preparar la demo' } }),
    ).resolves.toEqual({ task });

    const init = fetchMock.mock.calls[0]?.[1];
    expect(init?.method).toBe('PUT');
    expect(new Headers(init?.headers).get('Content-Type')).toBe('application/json');
    expect(init?.body).toBe(JSON.stringify({ title: 'Preparar la demo' }));
  });

  it('D-21 RF-027 un DELETE sin datos envía {} como JSON y un 204 se resuelve sin cuerpo', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(apiFetch('/api/tasks/t1', { method: 'DELETE' })).resolves.toBeUndefined();

    const init = fetchMock.mock.calls[0]?.[1];
    expect(init?.method).toBe('DELETE');
    expect(new Headers(init?.headers).get('Content-Type')).toBe('application/json');
    expect(init?.body).toBe('{}');
  });

  it.each(['PUT', 'DELETE'] as const)(
    'D-21 C-9 un %s con un 4xx con { error } → ApiError, como un POST',
    async (method) => {
      fetchMock.mockResolvedValue(json(404, { error: { code: 'TASK_NOT_FOUND', message: 'x' } }));

      const error = await apiFetch('/api/tasks/t1', { method }).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ApiError);
      expect(error).toMatchObject({ code: 'TASK_NOT_FOUND', status: 404 });
    },
  );

  it.each(['PUT', 'DELETE'] as const)(
    'D-21 RF-028 un %s con la red caída o un 500 → NetworkError',
    async (method) => {
      fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
      fetchMock.mockResolvedValueOnce(json(500, { error: { code: 'INTERNAL_ERROR' } }));

      await expect(apiFetch('/api/tasks/t1', { method })).rejects.toBeInstanceOf(NetworkError);
      await expect(apiFetch('/api/tasks/t1', { method })).rejects.toBeInstanceOf(NetworkError);
    },
  );
});
