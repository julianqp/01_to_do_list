import { createHash, randomBytes } from 'node:crypto';

const TOKEN_BYTES = 32;

// 32 bytes aleatorios en base64url: va en la cookie y nunca en BD (D-2).
export function generateSessionToken(): string {
  return randomBytes(TOKEN_BYTES).toString('base64url');
}

// SHA-256 en hex: lo único que se guarda en BD (D-2).
export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
