import { CUOTAS } from '@/content/asociacion';
import { lineasDeDetalle, type DetalleInterpretado } from '@/lib/detalle-descuento';

export function DetalleDescuento({ detalle }: { detalle: DetalleInterpretado }) {
  return lineasDeDetalle(detalle, CUOTAS.cuotaSocial.reparto).map((texto) => (
    <span key={texto} className="mt-1 block text-xs font-normal text-slate-500">
      {texto}
    </span>
  ));
}
