import type { ErrorCode } from '@todo/shared';

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

const notImplemented = (): never => {
  throw new Error('not implemented');
};

// C-7: solo rutas relativas `/api/...`.
export const apiFetch: <T>(
  path: `/api/${string}`,
  init?: { method?: 'GET' | 'POST'; body?: unknown },
) => Promise<T> = notImplemented;
