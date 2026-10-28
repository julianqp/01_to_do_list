import type { ApiErrorBody, ErrorCode } from '@todo/shared';
import type { ErrorRequestHandler, RequestHandler, Response } from 'express';
import { AppError } from '../../errors';

// C-9: cualquier ruta de /api que no exista.
export const notFound: RequestHandler = (_req, _res, next) => {
  next(new AppError('NOT_FOUND', 404));
};

// Errores de express.json() (JSON mal formado, cuerpo demasiado grande…): llevan `type` y un status 4xx.
function isBodyParserError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const { type, status } = error as { type?: unknown; status?: unknown };
  return typeof type === 'string' && typeof status === 'number' && status >= 400 && status < 500;
}

function send(res: Response, status: number, code: ErrorCode, message: string = code) {
  const body: ApiErrorBody = { error: { code, message } };
  res.status(status).json(body);
}

// C-9: formato único de error. Plan §9: lo no controlado se registra con método, ruta y stack,
// nunca con el cuerpo de la petición (podría llevar la contraseña).
export const errorHandler: ErrorRequestHandler = (error: unknown, req, res, next) => {
  // Con la respuesta ya empezada no se puede cambiar el status: Express cierra la conexión.
  if (res.headersSent) {
    next(error);
    return;
  }
  if (error instanceof AppError) {
    send(res, error.status, error.code, error.message);
    return;
  }
  if (isBodyParserError(error)) {
    send(res, 400, 'VALIDATION_ERROR');
    return;
  }
  console.error(`${req.method} ${req.originalUrl}`, error instanceof Error ? error.stack : error);
  send(res, 500, 'INTERNAL_ERROR');
};
