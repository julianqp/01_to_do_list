import type { ErrorCode } from '@todo/shared';
import { ApiError } from './api';

// Texto que ve el usuario y, si aplica, el campo al que se asocia (RF-004).
export type FormMessage = { text: string; field?: 'email' };

// RF-010: también para los códigos que el usuario no puede provocar desde los formularios
// (el front ya valida con el mismo esquema, D-7): para él son un error inesperado.
const UNEXPECTED: FormMessage = { text: 'No se ha podido conectar. Inténtalo de nuevo' };

const MESSAGES: Record<ErrorCode | 'NETWORK_ERROR', FormMessage> = {
  EMAIL_ALREADY_REGISTERED: { text: 'Ya existe una cuenta con ese email', field: 'email' },
  INVALID_CREDENTIALS: { text: 'Email o contraseña incorrectos' },
  SESSION_EXPIRED: { text: 'Tu sesión ha caducado. Vuelve a iniciar sesión' },
  NETWORK_ERROR: UNEXPECTED,
  VALIDATION_ERROR: UNEXPECTED,
  UNSUPPORTED_MEDIA_TYPE: UNEXPECTED,
  UNAUTHENTICATED: UNEXPECTED,
  NOT_FOUND: UNEXPECTED,
  INTERNAL_ERROR: UNEXPECTED,
};

// C-9: el front decide el texto a partir del `code`; 'NETWORK_ERROR' cubre RF-010.
export function messageFor(code: ErrorCode | 'NETWORK_ERROR'): FormMessage {
  return MESSAGES[code];
}

// Texto para el error de una petición: el de su `code` o, si no es un ApiError, el de RF-010.
export function messageForError(error: unknown): FormMessage {
  return messageFor(error instanceof ApiError ? error.code : 'NETWORK_ERROR');
}
