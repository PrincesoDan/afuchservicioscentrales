import 'server-only';
import { db, type ConceptoDescuento } from '@afuch/db';
import type { CuotaPrestamo } from './planilla';

/** Nombre visible de cada concepto. Decisiones en el plan §3.2 (P5). */
export const NOMBRE_CONCEPTO: Record<ConceptoDescuento, string> = {
  CUOTA_SOCIAL: 'Cuota social',
  FONDO_SOLIDARIO: 'Fondo Solidario',
  ACCIONES_COOPEUCH: 'Acciones Coopeuch',
  PRESTAMO_COOPEUCH: 'Préstamo Coopeuch',
  LIBRETA_AHORRO: 'Libreta de ahorro',
  SEGURO_ONCOLOGICO_FALP: 'Seguro oncológico FALP',
  OPTICA_GO_OPTIC: 'Convenio óptica Go Optic',
  REINTEGRO_BONO_INVIERNO: 'Reintegro bono de invierno',
  GAS_ABASTIBLE: 'Vales de gas Abastible',
  PRESTAMO_AFUCH: 'Préstamo AFUCH',
};

const ORDEN = Object.keys(NOMBRE_CONCEPTO) as ConceptoDescuento[];

export type ResumenPeriodo = { id: string; anio: number; mes: number; total: number };

export type LineaVisible = {
  concepto: ConceptoDescuento;
  nombre: string;
  monto: number;
  cuotas: CuotaPrestamo[];
};

/** Periodos con descuentos del socio, del más reciente al más antiguo. */
export async function periodosDelSocio(socioId: string): Promise<ResumenPeriodo[]> {
  const grupos = await db().lineaDescuento.groupBy({
    by: ['periodoId'],
    where: { socioId },
    _sum: { monto: true },
  });
  if (grupos.length === 0) return [];
  const periodos = await db().periodo.findMany({
    where: { id: { in: grupos.map((g) => g.periodoId) } },
    orderBy: [{ anio: 'desc' }, { mes: 'desc' }],
  });
  const totalPorPeriodo = new Map(grupos.map((g) => [g.periodoId, g._sum.monto ?? 0]));
  return periodos.map((p) => ({
    id: p.id,
    anio: p.anio,
    mes: p.mes,
    total: totalPorPeriodo.get(p.id) ?? 0,
  }));
}

export async function detallePeriodo(socioId: string, periodoId: string): Promise<LineaVisible[]> {
  const lineas = await db().lineaDescuento.findMany({ where: { socioId, periodoId } });
  return lineas
    .map((l) => ({
      concepto: l.concepto,
      nombre: NOMBRE_CONCEPTO[l.concepto],
      monto: l.monto,
      cuotas: Array.isArray(l.detalleCuotas) ? (l.detalleCuotas as CuotaPrestamo[]) : [],
    }))
    .sort((a, b) => ORDEN.indexOf(a.concepto) - ORDEN.indexOf(b.concepto));
}

export async function datosDelSocio(socioId: string) {
  return db().socio.findUniqueOrThrow({ where: { id: socioId }, include: { cuenta: true } });
}
