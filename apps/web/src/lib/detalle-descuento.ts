import { z } from 'zod';

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
