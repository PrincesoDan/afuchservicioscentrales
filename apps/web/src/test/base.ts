import { db } from '@afuch/db';

/** Vacía todas las tablas entre tests. */
export async function limpiarBase(): Promise<void> {
  await db().$executeRawUnsafe(`
    TRUNCATE "Token", "Cuenta", "LineaDescuento", "Periodo", "Socio",
      "DocumentoRendicion", "Administrador", "RegistroAuditoria", "RateLimiterFlexible"
    RESTART IDENTITY CASCADE
  `);
}
