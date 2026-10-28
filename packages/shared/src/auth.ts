import { z } from 'zod';

// Las reglas (RF-003, RF-005, RF-006, RF-007) se añaden en T-024; aquí solo está la forma.
export const emailSchema: z.ZodType<string> = z.string();
export const passwordSchema: z.ZodType<string> = z.string();

// El login solo exige que los campos no estén vacíos: no aplica límites de longitud ni formato.
const requiredEmail: z.ZodType<string> = z.string();
const requiredPassword: z.ZodType<string> = z.string();

export const signupInputSchema = z.object({ email: emailSchema, password: passwordSchema });
export const loginInputSchema = z.object({ email: requiredEmail, password: requiredPassword });

export type SignupInput = z.infer<typeof signupInputSchema>;
export type LoginInput = z.infer<typeof loginInputSchema>;

// RNF-002: lo único que la API devuelve de un usuario.
export type PublicUser = { id: string; email: string };
