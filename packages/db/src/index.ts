import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client';

export * from './generated/prisma/client';

function crearCliente(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL no está configurada.');
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
}

/**
 * Una sola instancia por proceso. En desarrollo, el hot reload de Next vuelve a
 * evaluar los módulos; guardarla en `globalThis` evita abrir un pool por recarga.
 */
const globalConPrisma = globalThis as typeof globalThis & { __afuchPrisma?: PrismaClient };

export function db(): PrismaClient {
  globalConPrisma.__afuchPrisma ??= crearCliente();
  return globalConPrisma.__afuchPrisma;
}
