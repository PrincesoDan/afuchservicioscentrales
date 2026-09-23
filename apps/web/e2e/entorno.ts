import path from 'node:path';

export const PUERTO = 3100;
export const RAIZ = path.resolve(__dirname, '..');
export const BUZON = path.join(RAIZ, 'e2e/.buzon');
export const ESTADO = path.join(RAIZ, 'e2e/.estado.json');

/** Entorno aislado para e2e: base propia, claves fijas y correos a archivo. */
export const ENTORNO_E2E: Record<string, string> = {
  DATABASE_URL: process.env.DATABASE_URL_E2E ?? 'postgresql://afuch:afuch@localhost:5433/afuch_e2e',
  CLAVE_CIFRADO: Buffer.alloc(32, 3).toString('base64'),
  CLAVE_HMAC: Buffer.alloc(32, 4).toString('base64'),
  NEXTAUTH_SECRET: 'secreto-de-e2e-con-mas-de-32-caracteres',
  NEXTAUTH_URL: `http://localhost:${PUERTO}`,
  STORAGE_DIR: path.join(RAIZ, '.storage-e2e'),
  CORREO_BUZON_DIR: BUZON,
};
