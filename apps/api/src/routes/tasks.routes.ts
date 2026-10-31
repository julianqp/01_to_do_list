import {
  createTaskInputSchema,
  taskIdSchema,
  updateTaskInputSchema,
  type CreateTaskInput,
  type UpdateTaskInput,
} from '@todo/shared';
import { Router, type RequestHandler } from 'express';
import { AppError } from '../errors';
import * as tasksService from '../services/tasks.service';
import { requireAuth } from './middleware/require-auth';
import { validateBody } from './middleware/validate-body';

export const tasksRouter = Router();

// C-13: todas las rutas de tareas necesitan sesión; el usuario sale de `res.locals.user`.
tasksRouter.use(requireAuth);

// C-14, D-3: un id que no es un UUID responde igual que una tarea inexistente. Va antes de validar
// el cuerpo: con un id inventado, la respuesta no depende de lo que se envíe.
const validateTaskId: RequestHandler = (req, _res, next) => {
  if (!taskIdSchema.safeParse(req.params.id).success) {
    next(new AppError('TASK_NOT_FOUND', 404));
    return;
  }
  next();
};

tasksRouter.get('/', async (_req, res) => {
  res.json({ tasks: await tasksService.listTasks(res.locals.user.id) });
});

tasksRouter.post('/', validateBody(createTaskInputSchema), async (req, res) => {
  const task = await tasksService.createTask(res.locals.user.id, req.body as CreateTaskInput);
  res.status(201).json({ task });
});

tasksRouter.put('/:id', validateTaskId, validateBody(updateTaskInputSchema), async (req, res) => {
  const task = await tasksService.updateTask(
    res.locals.user.id,
    req.params.id as string,
    req.body as UpdateTaskInput,
  );
  res.json({ task });
});

// D-13 de la 001: el cuerpo es `{}`; requireJson ya exige application/json.
tasksRouter.delete('/:id', validateTaskId, async (req, res) => {
  await tasksService.deleteTask(res.locals.user.id, req.params.id as string);
  res.status(204).end();
});
