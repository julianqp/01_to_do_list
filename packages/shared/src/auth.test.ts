import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { emailSchema, loginInputSchema, passwordSchema, signupInputSchema } from './auth';

const REQUIRED = 'Este campo es obligatorio';
const INVALID_EMAIL = 'Introduce un email válido';
const EMAIL_TOO_LONG = 'El email no puede tener más de 254 caracteres';
const PASSWORD_LENGTH = 'La contraseña debe tener entre 8 y 128 caracteres';

// Parte local de 64 + "@" + dominio de 189 (etiquetas ≤ 63) = 254 (research R-4).
const EMAIL_254 = `${'a'.repeat(64)}@${'b'.repeat(63)}.${'c'.repeat(63)}.${'d'.repeat(58)}.es`;
const EMAIL_255 = `${'a'.repeat(64)}@${'b'.repeat(63)}.${'c'.repeat(63)}.${'d'.repeat(59)}.es`;

function messagesOf(schema: z.ZodType, input: unknown): string[] {
  const result = schema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

function fieldErrorsOf(schema: z.ZodType<object>, input: unknown) {
  const result = schema.safeParse(input);
  return result.success ? {} : z.flattenError(result.error).fieldErrors;
}

describe('emailSchema', () => {
  it('RF-003 quita los espacios iniciales y finales y pasa a minúsculas', () => {
    expect(emailSchema.parse('  ANA@Example.com ')).toBe('ana@example.com');
  });

  it('CA-1.3 RF-005 rechaza un email sin dominio', () => {
    expect(messagesOf(emailSchema, 'ana@')).toEqual([INVALID_EMAIL]);
  });

  it('E-10 RF-005 rechaza un email con caracteres fuera de ASCII', () => {
    expect(messagesOf(emailSchema, 'ñandú@correo.es')).toEqual([INVALID_EMAIL]);
  });

  it('E-2 RF-005 acepta un email de 254 caracteres', () => {
    expect(EMAIL_254).toHaveLength(254);
    expect(emailSchema.parse(EMAIL_254)).toBe(EMAIL_254);
  });

  it('E-2 RF-005 rechaza un email de 255 caracteres', () => {
    expect(EMAIL_255).toHaveLength(255);
    expect(messagesOf(emailSchema, EMAIL_255)).toEqual([EMAIL_TOO_LONG]);
  });

  it.each(['', '   '])('E-1 RF-007 el email %j es obligatorio', (email) => {
    expect(messagesOf(emailSchema, email)).toEqual([REQUIRED]);
  });
});

describe('passwordSchema', () => {
  it.each([7, 129])('CA-1.4 E-3 RF-006 rechaza una contraseña de %i caracteres', (length) => {
    expect(messagesOf(passwordSchema, 'a'.repeat(length))).toEqual([PASSWORD_LENGTH]);
  });

  it.each([8, 128])('E-3 RF-006 acepta una contraseña de %i caracteres', (length) => {
    const password = 'a'.repeat(length);
    expect(passwordSchema.parse(password)).toBe(password);
  });

  it('E-4 acepta espacios, tildes y emoji tal cual, sin recortar', () => {
    const password = '  a ñ 😀 b  ';
    expect(passwordSchema.parse(password)).toBe(password);
  });

  it('E-4 cuenta el emoji como un carácter, no por su longitud en UTF-16', () => {
    // 7 caracteres (length 8): por debajo del mínimo.
    expect(messagesOf(passwordSchema, 'abcdef😀')).toEqual([PASSWORD_LENGTH]);
    // 128 caracteres (length 129): dentro del máximo.
    const password = `${'a'.repeat(127)}😀`;
    expect(passwordSchema.parse(password)).toBe(password);
  });

  it.each(['', '   '])('E-1 RF-007 la contraseña %j es obligatoria', (password) => {
    expect(messagesOf(passwordSchema, password)).toEqual([REQUIRED]);
  });
});

describe.each([
  ['signupInputSchema', signupInputSchema],
  ['loginInputSchema', loginInputSchema],
] as const)('%s', (_name, schema) => {
  it.each(['', '   '])('CA-1.5 E-1 RF-007 marca los dos campos %j como obligatorios', (value) => {
    expect(fieldErrorsOf(schema, { email: value, password: value })).toEqual({
      email: [REQUIRED],
      password: [REQUIRED],
    });
  });
});

describe('loginInputSchema', () => {
  it('RF-007 no aplica límites de longitud ni de formato', () => {
    for (const input of [
      { email: 'ana@', password: 'abc' },
      { email: EMAIL_255, password: 'a'.repeat(129) },
    ]) {
      expect(loginInputSchema.safeParse(input).success).toBe(true);
    }
  });
});
