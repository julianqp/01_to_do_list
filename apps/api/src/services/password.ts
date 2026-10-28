import { argon2, randomBytes, timingSafeEqual, type Argon2Parameters } from 'node:crypto';
import { promisify } from 'node:util';

const argon2Async = promisify(argon2);

// D-4: parámetros mínimos de OWASP (R-2).
const MEMORY_KIB = 19456;
const PASSES = 2;
const PARALLELISM = 1;
const SALT_BYTES = 16;
const TAG_BYTES = 32;

// PHC: $argon2id$v=19$m=…,t=…,p=…$<sal>$<hash>, en base64 sin relleno.
const PHC = /^\$argon2id\$v=19\$m=(\d+),t=(\d+),p=(\d+)\$([A-Za-z0-9+/]+)\$([A-Za-z0-9+/]+)$/;

const toBase64 = (bytes: Buffer) => bytes.toString('base64').replace(/=+$/, '');

function derive(
  plain: string,
  salt: Buffer,
  params: Pick<Argon2Parameters, 'memory' | 'passes' | 'parallelism' | 'tagLength'>,
) {
  return argon2Async('argon2id', { message: plain, nonce: salt, ...params });
}

// PHC argon2id m=19456,t=2,p=1, sal de 16 bytes (D-4).
export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const hash = await derive(plain, salt, {
    memory: MEMORY_KIB,
    passes: PASSES,
    parallelism: PARALLELISM,
    tagLength: TAG_BYTES,
  });
  return `$argon2id$v=19$m=${MEMORY_KIB},t=${PASSES},p=${PARALLELISM}$${toBase64(salt)}$${toBase64(hash)}`;
}

// Comparación en tiempo constante (timingSafeEqual). Usa los parámetros guardados en el propio hash.
export async function verifyPassword(plain: string, phc: string): Promise<boolean> {
  const match = PHC.exec(phc);
  if (!match) throw new Error('El hash de la contraseña no tiene formato PHC de argon2id');
  // La expresión regular garantiza los cinco grupos.
  const [memory, passes, parallelism, salt, hash] = match.slice(1) as [
    string,
    string,
    string,
    string,
    string,
  ];
  const expected = Buffer.from(hash, 'base64');
  const actual = await derive(plain, Buffer.from(salt, 'base64'), {
    memory: Number(memory),
    passes: Number(passes),
    parallelism: Number(parallelism),
    tagLength: expected.length,
  });
  return timingSafeEqual(actual, expected);
}
