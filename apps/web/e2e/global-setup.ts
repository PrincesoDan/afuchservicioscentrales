import { execSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import path from 'node:path';
import { BUZON, ENTORNO_E2E, ESTADO, RAIZ } from './entorno';

export default function setup() {
  const env = { ...process.env, ...ENTORNO_E2E };
  execSync('pnpm exec prisma migrate deploy', {
    cwd: path.join(RAIZ, '../../packages/db'),
    env,
    stdio: 'pipe',
  });
  execSync(`pnpm exec tsx --conditions=react-server e2e/semilla.ts ${ESTADO}`, {
    cwd: RAIZ,
    env,
    stdio: 'pipe',
  });
  rmSync(BUZON, { recursive: true, force: true });
  rmSync(ENTORNO_E2E.STORAGE_DIR!, { recursive: true, force: true });
}
