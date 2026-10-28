import { z } from 'zod';

// Mensajes de validación en castellano: el front los muestra tal cual (plan §4.2, D-7).
const REQUIRED = 'Este campo es obligatorio';
const INVALID_EMAIL = 'Introduce un email válido';
const EMAIL_TOO_LONG = 'El email no puede tener más de 254 caracteres';
const PASSWORD_LENGTH = 'La contraseña debe tener entre 8 y 128 caracteres';

const EMAIL_MAX_LENGTH = 254;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;

// Cada campo inválido da un solo mensaje: `abort` corta las comprobaciones siguientes.
// RF-003: sin espacios en los extremos y en minúsculas, también en el login.
const normalizedEmail = z.string().trim().toLowerCase().min(1, { error: REQUIRED, abort: true });
// E-4: la contraseña no se recorta; solo con espacios cuenta como vacía (E-1).
const nonBlankPassword = z
  .string()
  .refine((value) => value.trim() !== '', { error: REQUIRED, abort: true });

// RF-005, E-2, E-10: z.email() solo acepta ASCII.
export const emailSchema: z.ZodType<string> = normalizedEmail
  .max(EMAIL_MAX_LENGTH, { error: EMAIL_TOO_LONG, abort: true })
  .pipe(z.email({ error: INVALID_EMAIL }));

// RF-006, E-4: la longitud se cuenta en puntos de código, no en unidades UTF-16.
export const passwordSchema: z.ZodType<string> = nonBlankPassword.refine(
  (value) => {
    const length = [...value].length;
    return length >= PASSWORD_MIN_LENGTH && length <= PASSWORD_MAX_LENGTH;
  },
  { error: PASSWORD_LENGTH },
);

// El login solo exige que los campos no estén vacíos: no aplica límites de longitud ni formato.
const requiredEmail: z.ZodType<string> = normalizedEmail;
const requiredPassword: z.ZodType<string> = nonBlankPassword;

export const signupInputSchema = z.object({ email: emailSchema, password: passwordSchema });
export const loginInputSchema = z.object({ email: requiredEmail, password: requiredPassword });

export type SignupInput = z.infer<typeof signupInputSchema>;
export type LoginInput = z.infer<typeof loginInputSchema>;

// RNF-002: lo único que la API devuelve de un usuario.
export type PublicUser = { id: string; email: string };
