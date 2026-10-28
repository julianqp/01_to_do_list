const notImplemented = (): never => {
  throw new Error('not implemented');
};

// 32 bytes aleatorios en base64url: va en la cookie y nunca en BD (D-2).
export const generateSessionToken: () => string = notImplemented;
// SHA-256 en hex: lo único que se guarda en BD (D-2).
export const hashSessionToken: (token: string) => string = notImplemented;
