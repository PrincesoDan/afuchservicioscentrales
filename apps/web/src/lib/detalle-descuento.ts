import { z } from 'zod';
import { formatearClp } from './convenios';

/**
 * Desglose de una línea de descuento, guardado en `LineaDescuento.detalle` (JSON).
 * Se valida al leer porque la columna es JSON libre y conserva datos de meses
 * importados con el formato antiguo de la planilla (agosto y septiembre de 2026).
 * Spec: docs/superpowers/specs/2026-11-18-planilla-nuevo-formato-design.md.
 */

const pesos = z.number().int();

const prestamoDetalleSchema = z.object({
  fecha: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  montoPrestado: pesos,
  cuota: z.number().int().positive().nullable(),
  totalCuotas: z.number().int().positive().nullable(),
  montoCuota: pesos,
});

export const detalleDescuentoSchema = z.discriminatedUnion('tipo', [
  z.object({ tipo: z.literal('cuotaSocial'), afuchscen: pesos, fenafuch: pesos }),
  z.object({ tipo: z.literal('prestamosAfuch'), prestamos: z.array(prestamoDetalleSchema) }),
  z.object({
    tipo: z.literal('gas'),
    porTipo: z.array(
      z.object({
        kilos: z.union([z.literal(5), z.literal(11), z.literal(15), z.literal(45)]),
        monto: pesos,
      }),
    ),
    vales: z.number().int().nonnegative().nullable(),
  }),
]);

/** Forma antigua: solo el préstamo AFUCH, con «cuota n de m» por préstamo. */
const cuotasAntiguasSchema = z.array(
  z.object({ cuota: z.number().int(), total: z.number().int() }),
);

export type PrestamoDetalle = z.infer<typeof prestamoDetalleSchema>;
export type DetalleDescuento = z.infer<typeof detalleDescuentoSchema>;
export type DetalleInterpretado =
  DetalleDescuento | { tipo: 'cuotasAntiguas'; cuotas: z.infer<typeof cuotasAntiguasSchema> };

/** Devuelve `null` si el JSON no calza: la línea se muestra sin detalle en vez de fallar. */
export function interpretarDetalle(valor: unknown): DetalleInterpretado | null {
  const antiguo = cuotasAntiguasSchema.safeParse(valor);
  if (antiguo.success) return { tipo: 'cuotasAntiguas', cuotas: antiguo.data };
  const nuevo = detalleDescuentoSchema.safeParse(valor);
  return nuevo.success ? nuevo.data : null;
}

type Reparto = readonly { destino: string; parte: string }[];

function fechaLegible(fecha: string): string {
  const [anio, mes, dia] = fecha.split('-');
  return `${dia}-${mes}-${anio}`;
}

function textoPrestamo(p: PrestamoDetalle): string {
  const origen = p.fecha ? `Préstamo del ${fechaLegible(p.fecha)}` : 'Préstamo';
  const cuota =
    p.cuota !== null && p.totalCuotas !== null ? `cuota ${p.cuota} de ${p.totalCuotas}, ` : '';
  return `${origen} por ${formatearClp(p.montoPrestado)}: ${cuota}${formatearClp(p.montoCuota)}`;
}

/** Textos que se muestran bajo el concepto en «Mis descuentos», uno por renglón. */
export function lineasDeDetalle(detalle: DetalleInterpretado, reparto: Reparto): string[] {
  switch (detalle.tipo) {
    case 'cuotaSocial': {
      const [afuchscen, fenafuch] = reparto;
      return [
        `${afuchscen?.destino} (${afuchscen?.parte}) ${formatearClp(detalle.afuchscen)} · ${fenafuch?.destino} (${fenafuch?.parte}) ${formatearClp(detalle.fenafuch)}`,
      ];
    }
    case 'prestamosAfuch':
      return detalle.prestamos.map(textoPrestamo);
    case 'gas': {
      const tipos = detalle.porTipo
        .map((t) => `${t.kilos} kg: ${formatearClp(t.monto)}`)
        .join(' · ');
      if (detalle.vales === null) return [tipos];
      return [`${tipos} (${detalle.vales} ${detalle.vales === 1 ? 'vale' : 'vales'} en total)`];
    }
    case 'cuotasAntiguas':
      return [
        detalle.cuotas
          .map(
            (c, i) =>
              `${detalle.cuotas.length > 1 ? `Préstamo ${i + 1}: ` : ''}cuota ${c.cuota} de ${c.total}`,
          )
          .join(' · '),
      ];
  }
}
