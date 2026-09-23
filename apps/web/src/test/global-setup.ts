import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { URL_BASE_TEST } from './entorno';

/**
 * Aplica las migraciones pendientes a la base de tests (no borra nada). Cada
 * test vacía las tablas con `limpiarBase`.
 */
export default function setup() {
  execSync('pnpm exec prisma migrate deploy', {
    cwd: fileURLToPath(new URL('../../../../packages/db', import.meta.url)),
    env: { ...process.env, DATABASE_URL: URL_BASE_TEST },
    stdio: 'pipe',
  });
}
