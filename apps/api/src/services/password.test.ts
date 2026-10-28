import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password';

// PHC: $argon2id$v=19$m=…,t=…,p=…$<sal>$<hash>, en base64 sin relleno. Sal de 16 bytes = 22 caracteres.
const PHC_ARGON2ID = /^\$argon2id\$v=19\$m=19456,t=2,p=1\$[A-Za-z0-9+/]{22}\$[A-Za-z0-9+/]+$/;

describe('hashPassword', () => {
  it('D-4 C-12 devuelve argon2id en formato PHC con m=19456, t=2 y p=1', async () => {
    expect(await hashPassword('correct horse')).toMatch(PHC_ARGON2ID);
  });

  it('RNF-002 el hash no contiene la contraseña', async () => {
    expect(await hashPassword('correct horse')).not.toContain('correct horse');
  });

  it('D-4 da hashes distintos para la misma contraseña (sal aleatoria)', async () => {
    expect(await hashPassword('correct horse')).not.toBe(await hashPassword('correct horse'));
  });
});

describe('verifyPassword', () => {
  it('D-4 acepta la contraseña correcta', async () => {
    const phc = await hashPassword('correct horse');
    expect(await verifyPassword('correct horse', phc)).toBe(true);
  });

  it('D-4 rechaza otra contraseña', async () => {
    const phc = await hashPassword('correct horse');
    expect(await verifyPassword('wrong horse', phc)).toBe(false);
  });
});
