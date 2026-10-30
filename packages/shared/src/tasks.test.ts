import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  createTaskInputSchema,
  isActualEndDateAllowed,
  TASK_MESSAGES,
  taskIdSchema,
  updateTaskInputSchema,
} from './tasks';

const TITLE_REQUIRED = 'Escribe un título para la tarea.';
const TITLE_TOO_LONG = 'El título puede tener hasta 200 caracteres. Acórtalo un poco.';
const DESCRIPTION_TOO_LONG = 'La descripción puede tener hasta 5000 caracteres. Acórtala un poco.';
const INVALID_DATE = 'Esa fecha no existe. Escríbela como 14/11/2026.';
const END_BEFORE_START =
  'La fecha de fin no puede ser anterior a la de inicio. Cambia una de las dos.';
const ACTUAL_END_REQUIRED = 'Escribe el día en que terminaste la tarea.';
const ACTUAL_END_IN_FUTURE = 'La fecha real de fin no puede ser posterior a hoy. Cambia la fecha.';

const create = {
  title: 'Preparar la demo',
  description: '',
  estimatedStartDate: null,
  estimatedEndDate: null,
};
const update = { ...create, status: 'todo', actualEndDate: null };

function fieldErrorsOf(schema: z.ZodType<object>, input: unknown) {
  const result = schema.safeParse(input);
  return result.success ? {} : z.flattenError(result.error).fieldErrors;
}

describe('createTaskInputSchema', () => {
  it.each(['', '   '])('CA-2.3 RF-014 el título %j es obligatorio', (title) => {
    expect(fieldErrorsOf(createTaskInputSchema, { ...create, title })).toEqual({
      title: [TITLE_REQUIRED],
    });
  });

  it('E-3 RF-015 acepta 200 caracteres y rechaza 201', () => {
    expect(createTaskInputSchema.safeParse({ ...create, title: 'a'.repeat(200) }).success).toBe(
      true,
    );
    expect(fieldErrorsOf(createTaskInputSchema, { ...create, title: 'a'.repeat(201) })).toEqual({
      title: [TITLE_TOO_LONG],
    });
  });

  it('E-3 RF-015 cuenta tildes y emoji como un carácter', () => {
    // 200 caracteres (length 201 en UTF-16).
    const title = `${'á'.repeat(199)}😀`;
    expect(createTaskInputSchema.parse({ ...create, title }).title).toBe(title);
    expect(fieldErrorsOf(createTaskInputSchema, { ...create, title: `${title}😀` })).toEqual({
      title: [TITLE_TOO_LONG],
    });
  });

  it('E-5 RF-020 guarda el título sin los espacios iniciales y finales', () => {
    expect(createTaskInputSchema.parse({ ...create, title: '  Comprar pan  ' }).title).toBe(
      'Comprar pan',
    );
  });

  it('E-3 RF-015 el límite se mide después de recortar', () => {
    const title = ` ${'a'.repeat(200)} `;
    expect(createTaskInputSchema.parse({ ...create, title }).title).toBe('a'.repeat(200));
  });

  it('E-6 RF-016 RF-020 acepta 5000 caracteres con los saltos de línea tal cual y rechaza 5001', () => {
    const description = `\n${'a'.repeat(4998)}\n`;
    expect(createTaskInputSchema.parse({ ...create, description }).description).toBe(description);
    expect(
      fieldErrorsOf(createTaskInputSchema, { ...create, description: 'a'.repeat(5001) }),
    ).toEqual({ description: [DESCRIPTION_TOO_LONG] });
  });

  it.each(['2026-02-31', '2026-13-01', '14/11/2026', '2026-11-14T00:00:00Z', ''])(
    'RF-017 la fecha %j no es una fecha ISO válida',
    (date) => {
      expect(fieldErrorsOf(createTaskInputSchema, { ...create, estimatedStartDate: date })).toEqual(
        { estimatedStartDate: [INVALID_DATE] },
      );
    },
  );

  it('RF-017 acepta el 29 de febrero de un año bisiesto', () => {
    expect(
      createTaskInputSchema.safeParse({ ...create, estimatedEndDate: '2028-02-29' }).success,
    ).toBe(true);
  });

  it('CA-2.5 RF-018 rechaza un fin anterior al inicio, con el error en la fecha de fin', () => {
    expect(
      fieldErrorsOf(createTaskInputSchema, {
        ...create,
        estimatedStartDate: '2026-11-28',
        estimatedEndDate: '2026-11-14',
      }),
    ).toEqual({ estimatedEndDate: [END_BEFORE_START] });
  });

  it('E-9 RF-018 acepta el fin igual al inicio', () => {
    expect(
      createTaskInputSchema.safeParse({
        ...create,
        estimatedStartDate: '2026-11-14',
        estimatedEndDate: '2026-11-14',
      }).success,
    ).toBe(true);
  });

  it.each([
    ['solo el inicio', { estimatedStartDate: '2026-11-14' }],
    ['solo el fin', { estimatedEndDate: '2026-11-28' }],
  ])('E-8 acepta %s', (_name, dates) => {
    expect(createTaskInputSchema.safeParse({ ...create, ...dates }).success).toBe(true);
  });

  it('RF-019 un mensaje por campo con varios campos inválidos a la vez', () => {
    expect(
      fieldErrorsOf(createTaskInputSchema, {
        title: '',
        description: 'a'.repeat(5001),
        estimatedStartDate: '2026-11-28',
        estimatedEndDate: '2026-11-14',
      }),
    ).toEqual({
      title: [TITLE_REQUIRED],
      description: [DESCRIPTION_TOO_LONG],
      estimatedEndDate: [END_BEFORE_START],
    });
  });

  it('RF-011 D-2 descarta el estado que traiga el cuerpo', () => {
    expect(createTaskInputSchema.parse({ ...create, status: 'done' })).toEqual(create);
  });
});

describe('updateTaskInputSchema', () => {
  it('RF-013 acepta una tarea completa', () => {
    const input = {
      ...update,
      description: 'Revisar con el equipo',
      estimatedStartDate: '2026-11-14',
      estimatedEndDate: '2026-11-28',
    };
    expect(updateTaskInputSchema.parse(input)).toEqual(input);
  });

  it('CA-4.7 RF-040 en Done la fecha real de fin es obligatoria', () => {
    expect(fieldErrorsOf(updateTaskInputSchema, { ...update, status: 'done' })).toEqual({
      actualEndDate: [ACTUAL_END_REQUIRED],
    });
  });

  it('RF-017 en Done, una fecha real de fin que no existe', () => {
    expect(
      fieldErrorsOf(updateTaskInputSchema, {
        ...update,
        status: 'done',
        actualEndDate: '2026-02-31',
      }),
    ).toEqual({ actualEndDate: [INVALID_DATE] });
  });

  it.each(['backlog', 'todo', 'in_progress'])(
    'CA-4.8 E-23 RF-041 con el estado %s la fecha real de fin pasa a null',
    (status) => {
      expect(
        updateTaskInputSchema.parse({ ...update, status, actualEndDate: '2026-10-27' })
          .actualEndDate,
      ).toBeNull();
    },
  );

  it('E-20 acepta un fin real anterior al inicio estimado', () => {
    const input = {
      ...update,
      status: 'done',
      estimatedStartDate: '2026-11-14',
      actualEndDate: '2026-10-27',
    };
    expect(updateTaskInputSchema.parse(input)).toEqual(input);
  });

  it('RF-018 también se comprueba al editar', () => {
    expect(
      fieldErrorsOf(updateTaskInputSchema, {
        ...update,
        estimatedStartDate: '2026-11-28',
        estimatedEndDate: '2026-11-14',
      }),
    ).toEqual({ estimatedEndDate: [END_BEFORE_START] });
  });

  it.each(['Done', 'archived', null, undefined])('RF-023 el estado %j no es válido', (status) => {
    expect(Object.keys(fieldErrorsOf(updateTaskInputSchema, { ...update, status }))).toEqual([
      'status',
    ]);
  });
});

describe('isActualEndDateAllowed', () => {
  it('RF-039 acepta hasta el último día permitido, incluido, y rechaza el siguiente', () => {
    expect(isActualEndDateAllowed('2026-10-28', '2026-10-29')).toBe(true);
    expect(isActualEndDateAllowed('2026-10-29', '2026-10-29')).toBe(true);
    expect(isActualEndDateAllowed('2026-10-30', '2026-10-29')).toBe(false);
  });

  it('RF-039 compara bien al cambiar de mes y de año', () => {
    expect(isActualEndDateAllowed('2026-12-31', '2027-01-01')).toBe(true);
    expect(isActualEndDateAllowed('2027-01-01', '2026-12-31')).toBe(false);
  });
});

describe('taskIdSchema', () => {
  it('C-14 acepta un UUID', () => {
    expect(taskIdSchema.safeParse('3f2c1a9e-8b7d-4c6e-9f1a-2b3c4d5e6f70').success).toBe(true);
  });

  it.each(['1', 'no-es-un-uuid', ''])('C-13 D-3 rechaza el id %j', (id) => {
    expect(taskIdSchema.safeParse(id).success).toBe(false);
  });
});

describe('TASK_MESSAGES', () => {
  it('D-4 RF-017 RF-039 expone los textos que el formulario pone por su cuenta', () => {
    expect(TASK_MESSAGES.invalidDate).toBe(INVALID_DATE);
    expect(TASK_MESSAGES.actualEndInFuture).toBe(ACTUAL_END_IN_FUTURE);
  });
});
