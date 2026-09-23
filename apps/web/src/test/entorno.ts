/** Base de datos exclusiva de tests. En CI la define el servicio de Postgres. */
export const URL_BASE_TEST =
  process.env.DATABASE_URL_TEST ?? 'postgresql://afuch:afuch@localhost:5433/afuch_test';

/** Claves fijas, solo para tests. */
export const ENTORNO_TEST = {
  DATABASE_URL: URL_BASE_TEST,
  CLAVE_CIFRADO: Buffer.alloc(32, 1).toString('base64'),
  CLAVE_HMAC: Buffer.alloc(32, 2).toString('base64'),
  NEXTAUTH_SECRET: 'secreto-de-tests-con-mas-de-32-caracteres',
  NEXTAUTH_URL: 'http://localhost:3000',
  STORAGE_DIR: '.storage-test',
};
