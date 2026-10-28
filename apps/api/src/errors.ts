import type { ErrorCode } from '@todo/shared';

// Error de negocio con el `code` del catálogo de `shared` (C-9) y su status HTTP.
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;

  constructor(code: ErrorCode, status: number, message: string = code) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
  }
}
