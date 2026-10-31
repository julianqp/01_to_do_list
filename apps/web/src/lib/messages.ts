import type { ErrorCode } from '@todo/shared';
import type { AlertTone } from '../components/Alert';
import { ApiError } from './api';

// Texto que ve el usuario y, si aplica, el campo al que se asocia (RF-004). `tone` es el de su
// alerta (spec 004, RF-004); un mensaje de campo se muestra junto al campo y su tono no se usa.
export type FormMessage = { text: string; tone: AlertTone; field?: 'email' };

// RF-010: también para los códigos que el usuario no puede provocar desde los formularios
// (el front ya valida con el mismo esquema, D-7): para él son un error inesperado.
const UNEXPECTED: FormMessage = {
  text: 'No se ha podido conectar. Inténtalo de nuevo',
  tone: 'offline',
};

const MESSAGES: Record<ErrorCode | 'NETWORK_ERROR', FormMessage> = {
  EMAIL_ALREADY_REGISTERED: {
    text: 'Ya existe una cuenta con ese email',
    tone: 'error',
    field: 'email',
  },
  INVALID_CREDENTIALS: { text: 'Email o contraseña incorrectos', tone: 'error' },
  SESSION_EXPIRED: { text: 'Tu sesión ha caducado. Vuelve a iniciar sesión', tone: 'info' },
  NETWORK_ERROR: UNEXPECTED,
  VALIDATION_ERROR: UNEXPECTED,
  UNSUPPORTED_MEDIA_TYPE: UNEXPECTED,
  UNAUTHENTICATED: UNEXPECTED,
  NOT_FOUND: UNEXPECTED,
  // Spec 002 D-19: no puede darse en los formularios de acceso; el tablero tiene sus textos.
  TASK_NOT_FOUND: UNEXPECTED,
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
