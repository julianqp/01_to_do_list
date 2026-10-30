// C-9: catálogo único de códigos de error de la API. El front decide el texto a partir de `code`.
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  EMAIL_ALREADY_REGISTERED: 'EMAIL_ALREADY_REGISTERED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  UNSUPPORTED_MEDIA_TYPE: 'UNSUPPORTED_MEDIA_TYPE',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  NOT_FOUND: 'NOT_FOUND',
  // Spec 002: tarea inexistente, ajena o con id mal formado, siempre igual (C-13).
  TASK_NOT_FOUND: 'TASK_NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

export type ApiErrorBody = { error: { code: ErrorCode; message: string } };
