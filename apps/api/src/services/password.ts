const notImplemented = (): never => {
  throw new Error('not implemented');
};

// PHC argon2id m=19456,t=2,p=1, sal de 16 bytes (D-4).
export const hashPassword: (plain: string) => Promise<string> = notImplemented;
// Comparación en tiempo constante (timingSafeEqual).
export const verifyPassword: (plain: string, phc: string) => Promise<boolean> = notImplemented;
