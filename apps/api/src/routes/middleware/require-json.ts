import type { RequestHandler } from 'express';
import { AppError } from '../../errors';

const MODIFYING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// D-13: un formulario de otro sitio no puede enviar application/json sin preflight, y no hay CORS (C-7).
// Mira la cabecera y no `req.is()`, que devuelve null sin cuerpo: también se rechaza la petición que no la lleva.
export const requireJson: RequestHandler = (req, _res, next) => {
  const mediaType = req.get('Content-Type')?.split(';')[0]?.trim().toLowerCase();
  if (MODIFYING_METHODS.has(req.method) && mediaType !== 'application/json') {
    next(new AppError('UNSUPPORTED_MEDIA_TYPE', 415));
    return;
  }
  next();
};
