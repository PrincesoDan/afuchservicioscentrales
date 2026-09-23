import 'server-only';
import { db } from '@afuch/db';
import { RateLimiterPrisma, RateLimiterRes } from 'rate-limiter-flexible';

type Limitador = { puntos: number; segundos: number };

/** Límites por clave (IP, o IP + RUT). Guardados en Postgres: sobreviven reinicios. */
export const LIMITES = {
  contacto: { puntos: 5, segundos: 60 * 60 },
  registro: { puntos: 5, segundos: 60 * 60 },
  recuperacion: { puntos: 5, segundos: 60 * 60 },
  ingresoSocio: { puntos: 10, segundos: 15 * 60 },
  ingresoAdmin: { puntos: 5, segundos: 15 * 60 },
} as const satisfies Record<string, Limitador>;

export type NombreLimite = keyof typeof LIMITES;

const instancias = new Map<NombreLimite, RateLimiterPrisma>();

function limitador(nombre: NombreLimite): RateLimiterPrisma {
  let instancia = instancias.get(nombre);
  if (!instancia) {
    instancia = new RateLimiterPrisma({
      storeClient: db(),
      tableName: 'rateLimiterFlexible',
      keyPrefix: nombre,
      points: LIMITES[nombre].puntos,
      duration: LIMITES[nombre].segundos,
    });
    instancias.set(nombre, instancia);
  }
  return instancia;
}

/** Consume un punto. Devuelve `false` si la clave superó el límite. */
export async function permitir(nombre: NombreLimite, clave: string): Promise<boolean> {
  try {
    await limitador(nombre).consume(clave);
    return true;
  } catch (error) {
    if (error instanceof RateLimiterRes) return false;
    throw error;
  }
}
