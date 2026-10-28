import type { ErrorCode } from '@todo/shared';

// Texto que ve el usuario y, si aplica, el campo al que se asocia (RF-004).
export type FormMessage = { text: string; field?: 'email' };

const notImplemented = (): never => {
  throw new Error('not implemented');
};

// C-9: el front decide el texto a partir del `code`; 'NETWORK_ERROR' cubre RF-010.
export const messageFor: (code: ErrorCode | 'NETWORK_ERROR') => FormMessage = notImplemented;
