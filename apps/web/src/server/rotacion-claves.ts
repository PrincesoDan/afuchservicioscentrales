import 'server-only';
import { db } from '@afuch/db';
import { auditar } from './auditoria';
import { cifrarCon, descifrarCon, hashRutCon } from './cifrado';

/**
 * Rotación de CLAVE_CIFRADO y/o CLAVE_HMAC. Procedimiento completo en
 * docs/operacion/runbook.md §10: la app debe estar detenida mientras corre,
 * porque en cuanto se confirma la transacción solo las claves nuevas leen la base.
 */

export type ClavesRotacion = {
  cifradoActual: Buffer;
  cifradoNueva: Buffer;
  hmacActual: Buffer;
  hmacNueva: Buffer;
};

export type ResultadoRotacion = {
  socios: number;
  cuentas: number;
  administradores: number;
  rotaCifrado: boolean;
  rotaHmac: boolean;
  aplicado: boolean;
};

/** Decodifica una clave base64 de 32 bytes o explica por qué no sirve. */
export function leerClave(nombre: string, valor: string | undefined): Buffer {
  if (!valor) throw new Error(`Falta ${nombre}.`);
  const clave = Buffer.from(valor, 'base64');
  if (clave.length !== 32)
    throw new Error(`${nombre} debe ser 32 bytes en base64 (openssl rand -base64 32).`);
  return clave;
}

/**
 * Arma las claves de la rotación. Una clave nueva ausente significa "no rotar
 * esa". Al menos una debe cambiar, y la nueva de cifrado no puede ser igual a
 * la de HMAC (se usan para cosas distintas).
 */
export function prepararClaves(valores: {
  cifradoActual?: string;
  hmacActual?: string;
  cifradoNueva?: string;
  hmacNueva?: string;
}): ClavesRotacion {
  const cifradoActual = leerClave('CLAVE_CIFRADO', valores.cifradoActual);
  const hmacActual = leerClave('CLAVE_HMAC', valores.hmacActual);
  const cifradoNueva = valores.cifradoNueva
    ? leerClave('CLAVE_CIFRADO_NUEVA', valores.cifradoNueva)
    : cifradoActual;
  const hmacNueva = valores.hmacNueva
    ? leerClave('CLAVE_HMAC_NUEVA', valores.hmacNueva)
    : hmacActual;

  if (cifradoNueva.equals(cifradoActual) && hmacNueva.equals(hmacActual)) {
    throw new Error(
      'Define CLAVE_CIFRADO_NUEVA y/o CLAVE_HMAC_NUEVA con valores distintos de los actuales.',
    );
  }
  if (cifradoNueva.equals(hmacNueva)) {
    throw new Error('CLAVE_CIFRADO_NUEVA y CLAVE_HMAC_NUEVA deben ser distintas.');
  }
  return { cifradoActual, cifradoNueva, hmacActual, hmacNueva };
}

type Plano = {
  socios: { id: string; rut: string; nombre: string }[];
  cuentas: { id: string; correo: string }[];
  administradores: { id: string; totp: string }[];
};

/**
 * Lee todo con las claves actuales. Si un solo registro no se puede descifrar
 * o su índice de RUT no corresponde, no se toca nada: significa que las claves
 * "actuales" no son las que cifraron la base.
 */
async function leerTodo(claves: ClavesRotacion): Promise<Plano> {
  const [socios, cuentas, administradores] = await Promise.all([
    db().socio.findMany({
      select: { id: true, rutHash: true, rutCifrado: true, nombreCifrado: true },
    }),
    db().cuenta.findMany({ select: { id: true, correoCifrado: true } }),
    db().administrador.findMany({ select: { id: true, totpSecretCifrado: true } }),
  ]);

  let fallidos = 0;
  let indicesInconsistentes = 0;
  const intentar = <T>(fn: () => T): T | null => {
    try {
      return fn();
    } catch {
      fallidos += 1;
      return null;
    }
  };

  const plano: Plano = { socios: [], cuentas: [], administradores: [] };
  for (const s of socios) {
    const rut = intentar(() => descifrarCon(claves.cifradoActual, s.rutCifrado));
    const nombre = intentar(() => descifrarCon(claves.cifradoActual, s.nombreCifrado));
    if (rut === null || nombre === null) continue;
    if (hashRutCon(claves.hmacActual, rut) !== s.rutHash) indicesInconsistentes += 1;
    plano.socios.push({ id: s.id, rut, nombre });
  }
  for (const c of cuentas) {
    const correo = intentar(() => descifrarCon(claves.cifradoActual, c.correoCifrado));
    if (correo !== null) plano.cuentas.push({ id: c.id, correo });
  }
  for (const a of administradores) {
    const totp = intentar(() => descifrarCon(claves.cifradoActual, a.totpSecretCifrado));
    if (totp !== null) plano.administradores.push({ id: a.id, totp });
  }

  if (fallidos > 0) {
    throw new Error(
      `${fallidos} valores no se pudieron descifrar con CLAVE_CIFRADO actual. No se modificó nada.`,
    );
  }
  if (indicesInconsistentes > 0) {
    throw new Error(
      `${indicesInconsistentes} socios tienen un índice de RUT que no corresponde a CLAVE_HMAC actual. No se modificó nada.`,
    );
  }
  return plano;
}

export async function rotarClaves(
  claves: ClavesRotacion,
  { aplicar, actorId }: { aplicar: boolean; actorId: string },
): Promise<ResultadoRotacion> {
  const plano = await leerTodo(claves);
  const resultado: ResultadoRotacion = {
    socios: plano.socios.length,
    cuentas: plano.cuentas.length,
    administradores: plano.administradores.length,
    rotaCifrado: !claves.cifradoNueva.equals(claves.cifradoActual),
    rotaHmac: !claves.hmacNueva.equals(claves.hmacActual),
    aplicado: false,
  };
  if (!aplicar) return resultado;

  await db().$transaction(
    async (tx) => {
      for (const s of plano.socios) {
        await tx.socio.update({
          where: { id: s.id },
          data: {
            rutHash: hashRutCon(claves.hmacNueva, s.rut),
            rutCifrado: cifrarCon(claves.cifradoNueva, s.rut),
            nombreCifrado: cifrarCon(claves.cifradoNueva, s.nombre),
          },
        });
      }
      for (const c of plano.cuentas) {
        await tx.cuenta.update({
          where: { id: c.id },
          data: { correoCifrado: cifrarCon(claves.cifradoNueva, c.correo) },
        });
      }
      for (const a of plano.administradores) {
        await tx.administrador.update({
          where: { id: a.id },
          data: { totpSecretCifrado: cifrarCon(claves.cifradoNueva, a.totp) },
        });
      }

      // Comprobación antes de confirmar: todo debe leerse con las claves nuevas
      // y dar exactamente lo mismo. Si no, la transacción se revierte entera.
      const [socios, cuentas, administradores] = await Promise.all([
        tx.socio.findMany({
          select: { id: true, rutHash: true, rutCifrado: true, nombreCifrado: true },
        }),
        tx.cuenta.findMany({ select: { id: true, correoCifrado: true } }),
        tx.administrador.findMany({ select: { id: true, totpSecretCifrado: true } }),
      ]);
      const esperadoSocio = new Map(plano.socios.map((s) => [s.id, s]));
      const esperadoCuenta = new Map(plano.cuentas.map((c) => [c.id, c.correo]));
      const esperadoAdmin = new Map(plano.administradores.map((a) => [a.id, a.totp]));
      const coincide =
        socios.every((s) => {
          const e = esperadoSocio.get(s.id);
          return (
            e &&
            descifrarCon(claves.cifradoNueva, s.rutCifrado) === e.rut &&
            descifrarCon(claves.cifradoNueva, s.nombreCifrado) === e.nombre &&
            s.rutHash === hashRutCon(claves.hmacNueva, e.rut)
          );
        }) &&
        cuentas.every(
          (c) => descifrarCon(claves.cifradoNueva, c.correoCifrado) === esperadoCuenta.get(c.id),
        ) &&
        administradores.every(
          (a) => descifrarCon(claves.cifradoNueva, a.totpSecretCifrado) === esperadoAdmin.get(a.id),
        );
      if (!coincide)
        throw new Error('La verificación con las claves nuevas falló. Se revirtió todo.');
    },
    { timeout: 300_000 },
  );

  await auditar({
    actorTipo: 'SISTEMA',
    actorId,
    accion: 'claves.rotadas',
    detalle: {
      socios: resultado.socios,
      cuentas: resultado.cuentas,
      administradores: resultado.administradores,
      rotaCifrado: resultado.rotaCifrado,
      rotaHmac: resultado.rotaHmac,
    },
  });
  return { ...resultado, aplicado: true };
}
