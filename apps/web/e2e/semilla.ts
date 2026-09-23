/**
 * Deja la base e2e con: planilla ficticia de agosto 2026 importada y un admin
 * de prueba. Se ejecuta con tsx (condición react-server) desde global-setup.
 */
import { db } from '@afuch/db';
import { writeFileSync } from 'node:fs';
import { crearAdministrador } from '../src/server/administradores';
import { crearPlanillaFicticia } from '../src/server/fixtures/planilla-ficticia';
import { importarPlanilla } from '../src/server/importacion';
import { leerPlanilla } from '../src/server/planilla';

async function main() {
  await db().$executeRawUnsafe(`
    TRUNCATE "Token", "Cuenta", "LineaDescuento", "Periodo", "Socio",
      "DocumentoRendicion", "Administrador", "RegistroAuditoria", "RateLimiterFlexible"
    RESTART IDENTITY CASCADE
  `);
  await importarPlanilla(await leerPlanilla(await crearPlanillaFicticia()), {
    tipo: 'SISTEMA',
    id: 'e2e',
  });
  const contrasena = 'contrasena-admin-e2e';
  const { secreto } = await crearAdministrador('admin@e2e.test', contrasena, 'e2e');
  writeFileSync(
    process.argv[2]!,
    JSON.stringify({ admin: { email: 'admin@e2e.test', contrasena, secreto } }),
  );
}

main().finally(() => process.exit());
