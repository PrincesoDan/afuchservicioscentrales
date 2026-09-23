import 'server-only';
import { db, type Prisma } from '@afuch/db';
import { descripcionActor, type Actor } from './actor';
import { auditar } from './auditoria';
import { cifrar, descifrar, hashRut } from './cifrado';
import type { ResultadoPlanilla } from './planilla';

export type ResumenImportacion = {
  anio: number;
  mes: number;
  socios: number;
  sociosNuevos: number;
  lineas: number;
  total: number;
  reemplazoPeriodoExistente: boolean;
};

/**
 * Guarda un periodo leído con `leerPlanilla`. Reimportar el mismo periodo lo
 * reemplaza completo. Nunca deshabilita socios (decisión D6).
 */
export async function importarPlanilla(
  resultado: ResultadoPlanilla,
  actor: Actor,
): Promise<ResumenImportacion> {
  if (resultado.errores.length > 0 || !resultado.periodo) {
    throw new Error('La planilla tiene errores; corrígelos antes de importar.');
  }
  const { anio, mes } = resultado.periodo;
  const socios = resultado.socios.map((s) => ({ ...s, rutHash: hashRut(s.rut) }));

  const resumen = await db().$transaction(
    async (tx) => {
      const existente = await tx.periodo.findUnique({ where: { anio_mes: { anio, mes } } });
      const periodo = existente
        ? await tx.periodo.update({
            where: { id: existente.id },
            data: { importadoEn: new Date(), importadoPor: descripcionActor(actor) },
          })
        : await tx.periodo.create({ data: { anio, mes, importadoPor: descripcionActor(actor) } });
      await tx.lineaDescuento.deleteMany({ where: { periodoId: periodo.id } });

      const actuales = await tx.socio.findMany({
        where: { rutHash: { in: socios.map((s) => s.rutHash) } },
        select: { id: true, rutHash: true, nombreCifrado: true, facultad: true },
      });
      const porHash = new Map(actuales.map((s) => [s.rutHash, s]));

      const nuevos = socios.filter((s) => !porHash.has(s.rutHash));
      const creados = await tx.socio.createManyAndReturn({
        data: nuevos.map((s) => ({
          rutHash: s.rutHash,
          rutCifrado: cifrar(s.rut),
          nombreCifrado: cifrar(s.nombre),
          facultad: s.facultad,
          ultimoPeriodoId: periodo.id,
        })),
        select: { id: true, rutHash: true },
      });
      const idPorHash = new Map<string, string>(creados.map((s) => [s.rutHash, s.id]));

      for (const socio of socios) {
        const actual = porHash.get(socio.rutHash);
        if (!actual) continue;
        idPorHash.set(socio.rutHash, actual.id);
        const data: Prisma.SocioUpdateInput = { ultimoPeriodoId: periodo.id };
        if (descifrar(actual.nombreCifrado) !== socio.nombre)
          data.nombreCifrado = cifrar(socio.nombre);
        if (actual.facultad !== socio.facultad) data.facultad = socio.facultad;
        await tx.socio.update({ where: { id: actual.id }, data });
      }

      const lineas = socios.flatMap((s) =>
        s.lineas.map((l) => ({
          periodoId: periodo.id,
          socioId: idPorHash.get(s.rutHash)!,
          concepto: l.concepto,
          monto: l.monto,
          detalleCuotas: l.detalleCuotas ?? undefined,
        })),
      );
      await tx.lineaDescuento.createMany({ data: lineas });

      return {
        anio,
        mes,
        socios: socios.length,
        sociosNuevos: creados.length,
        lineas: lineas.length,
        total: resultado.resumen.total,
        reemplazoPeriodoExistente: Boolean(existente),
      };
    },
    { timeout: 120_000 },
  );

  await auditar({
    actorTipo: actor.tipo,
    actorId: actor.id,
    accion: 'planilla.importada',
    entidad: 'Periodo',
    entidadId: `${anio}-${String(mes).padStart(2, '0')}`,
    ip: actor.tipo === 'ADMIN' ? actor.ip : null,
    detalle: { ...resumen, advertencias: resultado.advertencias.length },
  });

  return resumen;
}
