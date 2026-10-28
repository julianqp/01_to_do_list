import { describe, expect, it } from 'vitest';
import { parseEnv } from './env';

const valid = {
  DATABASE_URL: 'postgresql://todo:secret@localhost:5432/todo',
  PORT: '3000',
  NODE_ENV: 'development',
};

describe('parseEnv', () => {
  it('C-15 devuelve el entorno tipado si es válido', () => {
    expect(parseEnv(valid)).toEqual({
      DATABASE_URL: 'postgresql://todo:secret@localhost:5432/todo',
      PORT: 3000,
      NODE_ENV: 'development',
    });
  });

  it('C-15 usa el puerto 3000 y el modo development si no se indican', () => {
    expect(parseEnv({ DATABASE_URL: valid.DATABASE_URL })).toMatchObject({
      PORT: 3000,
      NODE_ENV: 'development',
    });
  });

  it('C-15 falla si falta DATABASE_URL', () => {
    expect(() => parseEnv({ PORT: '3000' })).toThrow(/DATABASE_URL/);
  });

  it('C-15 falla si PORT no es numérico', () => {
    expect(() => parseEnv({ ...valid, PORT: 'abc' })).toThrow(/PORT/);
  });

  it('C-15 falla si NODE_ENV no es un valor conocido', () => {
    expect(() => parseEnv({ ...valid, NODE_ENV: 'staging' })).toThrow(/NODE_ENV/);
  });
});
