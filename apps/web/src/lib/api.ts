import { ERROR_CODES, type ApiErrorBody, type ErrorCode } from '@todo/shared';

// Respuesta de error de la API con el formato de C-9.
export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly status: number;

  constructor(code: ErrorCode, status: number, message: string = code) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

// No se pudo contactar con el servidor (RF-010).
export class NetworkError extends Error {
  constructor(message = 'Network error') {
    super(message);
    this.name = 'NetworkError';
  }
}

// El `{ error }` de C-9, si la respuesta lo trae con un `code` del catálogo.
async function readApiError(response: Response): Promise<ApiErrorBody['error'] | undefined> {
  const body: unknown = await response.json().catch(() => undefined);
  if (typeof body !== 'object' || body === null || !('error' in body)) return undefined;
  const { error } = body as { error: { code?: unknown; message?: unknown } };
  if (typeof error.code !== 'string' || !(error.code in ERROR_CODES)) return undefined;
  return { code: error.code as ErrorCode, message: String(error.message ?? error.code) };
}

// C-7: solo rutas relativas `/api/...`.
// RF-010: fetch rechazado o cualquier respuesta inesperada (5xx, 4xx sin `{ error }`) → NetworkError;
// con la API caída, el proxy de Vite responde 5xx en vez de rechazar.
export async function apiFetch<T>(
  path: `/api/${string}`,
  init: { method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; body?: unknown } = {},
): Promise<T> {
  const method = init.method ?? 'GET';
  // D-13: toda petición que modifica va como JSON, con `{}` si no hay datos (spec 002 D-21).
  const request: RequestInit =
    method !== 'GET'
      ? {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(init.body ?? {}),
        }
      : { method };

  let response: Response;
  try {
    response = await fetch(path, request);
  } catch {
    throw new NetworkError();
  }

  if (response.status === 204) return undefined as T;
  if (response.ok) {
    return (await response.json().catch(() => {
      throw new NetworkError('Invalid JSON response');
    })) as T;
  }
  const error = response.status < 500 ? await readApiError(response) : undefined;
  if (error) throw new ApiError(error.code, response.status, error.message);
  throw new NetworkError(`Unexpected response ${response.status}`);
}
