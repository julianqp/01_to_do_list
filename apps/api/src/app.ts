import express from 'express';
import { errorHandler, notFound } from './routes/middleware/error-handler';
import { requireJson } from './routes/middleware/require-json';

export function createApp() {
  const app = express();
  // D-13: el 415 va antes de leer el cuerpo.
  app.use('/api', requireJson);
  app.use(express.json());
  // Los routers se montan aquí: el 404 y el manejador de errores van siempre al final.
  app.use('/api', notFound);
  app.use(errorHandler);
  return app;
}
