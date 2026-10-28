import { describe, expect, it } from 'vitest';
import { generateSessionToken, hashSessionToken } from './session-token';

describe('generateSessionToken', () => {
  it('D-2 C-12 genera 32 bytes aleatorios en base64url', () => {
    const token = generateSessionToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(Buffer.from(token, 'base64url')).toHaveLength(32);
  });

  it('D-2 no repite tokens', () => {
    expect(generateSessionToken()).not.toBe(generateSessionToken());
  });
});

describe('hashSessionToken', () => {
  it('D-2 C-12 devuelve el SHA-256 del token en hex', () => {
    // Vector de prueba de SHA-256 para "abc".
    expect(hashSessionToken('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });
});
