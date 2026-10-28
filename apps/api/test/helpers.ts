import type { Response } from 'supertest';

// Supertest no reenvía cookies `Secure` por HTTP: se saca `sid` de Set-Cookie y se manda en `Cookie` a mano.
export function sidCookie(res: Response): string {
  const setCookie = res.headers['set-cookie'] as unknown as string[] | undefined;
  const sid = setCookie?.map((c) => c.split(';')[0]).find((c) => c?.startsWith('sid='));
  if (!sid) throw new Error('La respuesta no trae la cookie sid');
  return sid;
}
