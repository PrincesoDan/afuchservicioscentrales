import 'server-only';
import { formatearRut } from '@afuch/contracts';
import { db } from '@afuch/db';
import { type Actor } from './actor';
import { auditar } from './auditoria';
import { descifrar, enmascararCorreo, hashRut } from './cifrado';

export type EstadoCuenta = 'sin_cuenta' | 'pendiente' | 'activa';

export type FichaSocio = {
  id: string;
  rut: string;
  nombre: string;
  facultad: string | null;
  habilitado: boolean;
  enUltimoPeriodo: boolean;
  cuenta: EstadoCuenta;
  correo: string | null;
  cuentaCreadaEn: Date | null;
};

function ipDe(actor: Actor) {
  return actor.tipo === 'ADMIN' ? actor.ip : null;
}

async function ultimoPeriodoId(): Promise<string | null> {
  const periodo = await db().periodo.findFirst({ orderBy: [{ anio: 'desc' }, { mes: 'desc' }] });
  return periodo?.id ?? null;
}

/**
 * Lista para /admin y el CLI. Nombre y RUT están cifrados, así que la búsqueda
 * por nombre se hace en memoria: son ~900 socios.
 */
export async function listarSocios({
  busqueda,
  filtro = 'todos',
}: {
  busqueda?: string;
  filtro?: 'todos' | 'con_cuenta' | 'deshabilitados' | 'ausentes';
} = {}): Promise<FichaSocio[]> {
  const ultimo = await ultimoPeriodoId();
  const socios = await db().socio.findMany({ include: { cuenta: true } });

  const fichas = socios.map<FichaSocio>((s) => ({
    id: s.id,
    rut: formatearRut(descifrar(s.rutCifrado)),
    nombre: descifrar(s.nombreCifrado),
    facultad: s.facultad,
    habilitado: s.habilitado,
    enUltimoPeriodo: s.ultimoPeriodoId === ultimo,
    cuenta: !s.cuenta ? 'sin_cuenta' : s.cuenta.verificadaEn ? 'activa' : 'pendiente',
    correo: s.cuenta ? enmascararCorreo(descifrar(s.cuenta.correoCifrado)) : null,
    cuentaCreadaEn: s.cuenta?.creadaEn ?? null,
  }));

  const termino = busqueda
    ?.trim()
    .toLowerCase()
    .replace(/[.\-\s]/g, '');
  return fichas
    .filter((f) => {
      if (filtro === 'con_cuenta' && f.cuenta === 'sin_cuenta') return false;
      if (filtro === 'deshabilitados' && f.habilitado) return false;
      if (filtro === 'ausentes' && (f.enUltimoPeriodo || !f.habilitado)) return false;
      if (!termino) return true;
      return (
        f.rut.toLowerCase().replace(/[.\-]/g, '').includes(termino) ||
        f.nombre.toLowerCase().replace(/\s/g, '').includes(termino)
      );
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

export async function buscarSocioPorRut(rutNormalizado: string): Promise<FichaSocio | null> {
  const socio = await db().socio.findUnique({ where: { rutHash: hashRut(rutNormalizado) } });
  if (!socio) return null;
  const [ficha] = (await listarSocios()).filter((f) => f.id === socio.id);
  return ficha ?? null;
}

export async function cambiarHabilitacion(
  socioId: string,
  habilitado: boolean,
  actor: Actor,
): Promise<void> {
  await db().socio.update({ where: { id: socioId }, data: { habilitado } });
  await auditar({
    actorTipo: actor.tipo,
    actorId: actor.id,
    accion: habilitado ? 'socio.habilitado' : 'socio.deshabilitado',
    entidad: 'Socio',
    entidadId: socioId,
    ip: ipDe(actor),
  });
}

/**
 * Borra la cuenta (no el socio ni sus descuentos). Es la salida cuando alguien
 * registró un RUT ajeno: el dueño real puede volver a registrarse.
 */
export async function anularCuenta(socioId: string, actor: Actor): Promise<boolean> {
  const { count } = await db().cuenta.deleteMany({ where: { socioId } });
  if (count > 0) {
    await auditar({
      actorTipo: actor.tipo,
      actorId: actor.id,
      accion: 'cuenta.anulada',
      entidad: 'Socio',
      entidadId: socioId,
      ip: ipDe(actor),
    });
  }
  return count > 0;
}

/** Habilitados que no aparecieron en el último periodo importado (vista previa de la baja en bloque). */
export async function ausentesDelUltimoPeriodo(): Promise<FichaSocio[]> {
  return listarSocios({ filtro: 'ausentes' });
}

/** Baja en bloque (D6): solo ocurre cuando un admin la ejecuta explícitamente. */
export async function deshabilitarAusentes(actor: Actor): Promise<number> {
  const ultimo = await ultimoPeriodoId();
  if (!ultimo) return 0;
  const { count } = await db().socio.updateMany({
    where: {
      habilitado: true,
      OR: [{ ultimoPeriodoId: { not: ultimo } }, { ultimoPeriodoId: null }],
    },
    data: { habilitado: false },
  });
  await auditar({
    actorTipo: actor.tipo,
    actorId: actor.id,
    accion: 'socios.ausentes_deshabilitados',
    entidad: 'Periodo',
    entidadId: ultimo,
    ip: ipDe(actor),
    detalle: { cantidad: count },
  });
  return count;
}

export async function listarAuditoria({
  pagina = 1,
  porPagina = 50,
}: { pagina?: number; porPagina?: number } = {}) {
  const [total, registros] = await Promise.all([
    db().registroAuditoria.count(),
    db().registroAuditoria.findMany({
      orderBy: { fecha: 'desc' },
      skip: (pagina - 1) * porPagina,
      take: porPagina,
    }),
  ]);
  return { total, registros, paginas: Math.max(1, Math.ceil(total / porPagina)) };
}

/** Derecho de acceso/portabilidad: todo lo que la plataforma guarda del socio, descifrado. */
export async function exportarSocio(socioId: string, actor: Actor) {
  const socio = await db().socio.findUniqueOrThrow({
    where: { id: socioId },
    include: { cuenta: true, descuentos: { include: { periodo: true } } },
  });
  const auditoria = await db().registroAuditoria.findMany({
    where: {
      OR: [
        { entidad: 'Socio', entidadId: socioId },
        { actorTipo: 'SOCIO', actorId: socioId },
      ],
    },
    orderBy: { fecha: 'asc' },
  });
  await auditar({
    actorTipo: actor.tipo,
    actorId: actor.id,
    accion: 'socio.exportado',
    entidad: 'Socio',
    entidadId: socioId,
    ip: ipDe(actor),
  });
  return {
    rut: formatearRut(descifrar(socio.rutCifrado)),
    nombre: descifrar(socio.nombreCifrado),
    facultad: socio.facultad,
    habilitado: socio.habilitado,
    cuenta: socio.cuenta
      ? {
          correo: descifrar(socio.cuenta.correoCifrado),
          creadaEn: socio.cuenta.creadaEn,
          verificadaEn: socio.cuenta.verificadaEn,
        }
      : null,
    descuentos: socio.descuentos.map((l) => ({
      periodo: `${l.periodo.anio}-${String(l.periodo.mes).padStart(2, '0')}`,
      concepto: l.concepto,
      monto: l.monto,
      cuotas: l.detalleCuotas,
    })),
    accesos: auditoria.map((r) => ({ fecha: r.fecha, accion: r.accion, ip: r.ip })),
  };
}

/**
 * Derecho de supresión: borra al socio, su cuenta y sus descuentos. Si vuelve a
 * venir en una planilla, se crea de nuevo; por eso debe coordinarse con AFUCH.
 */
export async function eliminarSocio(socioId: string, actor: Actor): Promise<void> {
  await db().socio.delete({ where: { id: socioId } });
  await auditar({
    actorTipo: actor.tipo,
    actorId: actor.id,
    accion: 'socio.eliminado',
    entidad: 'Socio',
    entidadId: socioId,
    ip: ipDe(actor),
  });
}
