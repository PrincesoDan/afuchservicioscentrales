import type { Metadata } from 'next';
import Link from 'next/link';
import { formatearClp } from '@/lib/convenios';
import { nombrePeriodo } from '@/lib/periodos';
import { exigirSocio } from '@/server/auth';
import { detallePeriodo, periodosDelSocio } from '@/server/descuentos';

export const metadata: Metadata = { title: 'Mis descuentos' };

type Props = { searchParams: Promise<{ periodo?: string }> };

export default async function PaginaDescuentos({ searchParams }: Props) {
  const { socioId } = await exigirSocio();
  const periodos = await periodosDelSocio(socioId);
  const { periodo: pedido } = await searchParams;
  const actual = periodos.find((p) => p.id === pedido) ?? periodos[0];

  if (!actual) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center">
        <p className="text-slate-600">Todavía no hay descuentos cargados para tu RUT.</p>
      </div>
    );
  }

  const lineas = await detallePeriodo(socioId, actual.id);

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_280px]">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">
          Descuentos de {nombrePeriodo(actual.anio, actual.mes)}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Montos descontados por planilla según la información entregada por AFUCH Servicios
          Centrales.
        </p>

        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Detalle por concepto</caption>
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">
                  Concepto
                </th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">
                  Monto
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {lineas.map((linea) => (
                <tr key={linea.concepto}>
                  <th scope="row" className="px-5 py-4 font-medium text-slate-800">
                    {linea.nombre}
                    {linea.cuotas.length > 0 ? (
                      <span className="mt-1 block text-xs font-normal text-slate-500">
                        {linea.cuotas
                          .map(
                            (c, i) =>
                              `${linea.cuotas.length > 1 ? `Préstamo ${i + 1}: ` : ''}cuota ${c.cuota} de ${c.total}`,
                          )
                          .join(' · ')}
                      </span>
                    ) : null}
                  </th>
                  <td className="px-5 py-4 text-right tabular-nums text-slate-800">
                    {formatearClp(linea.monto)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-navy-50">
              <tr>
                <th scope="row" className="px-5 py-4 font-bold text-navy-900">
                  Total del mes
                </th>
                <td className="px-5 py-4 text-right font-bold tabular-nums text-navy-900">
                  {formatearClp(actual.total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <aside>
        <h2 className="eyebrow mb-4 text-navy-600">Historial</h2>
        <ul className="space-y-1">
          {periodos.map((p) => (
            <li key={p.id}>
              <Link
                href={`/socios/descuentos?periodo=${p.id}`}
                aria-current={p.id === actual.id ? 'page' : undefined}
                className={`flex justify-between rounded-md px-3 py-2 text-sm ${
                  p.id === actual.id ? 'bg-navy-800 text-white' : 'text-slate-700 hover:bg-navy-50'
                }`}
              >
                <span className="capitalize">{nombrePeriodo(p.anio, p.mes)}</span>
                <span className="tabular-nums">{formatearClp(p.total)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
