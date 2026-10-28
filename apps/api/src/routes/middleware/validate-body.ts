import type { RequestHandler } from 'express';
import type { z } from 'zod';
import { AppError } from '../../errors';

// C-14: valida el cuerpo con un esquema de `shared` y lo sustituye por el resultado ya normalizado.
// D-7: sin detalle por campo; el front ya validó con el mismo esquema.
export function validateBody(schema: z.ZodType): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(new AppError('VALIDATION_ERROR', 400));
      return;
    }
    req.body = result.data;
    next();
  };
}
