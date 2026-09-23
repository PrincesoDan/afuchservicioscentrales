'use client';

import { useActionState } from 'react';
import { accionPlanilla, type EstadoPlanilla } from '@/app/admin/acciones';
import { formatearClp } from '@/lib/convenios';
import { nombrePeriodo } from '@/lib/periodos';
import { Aviso } from '../socios/tarjeta-acceso';
import { Boton } from '../ui/button';

const INICIAL: EstadoPlanilla = { etapa: 'inicial' };

export function FormularioPlanilla({
  nombresConcepto,
}: {
  nombresConcepto: Record<string, string>;
}) {
  const [estado, accion, enviando] = useActionState(accionPlanilla, INICIAL);

  return (
    // El botón que envía decide la etapa: solo «Importar» agrega confirmar=si al FormData.
    <form action={accion} className="space-y-6">
      <div>
        <label htmlFor="archivo" className="mb-2 block text-sm font-semibold text-navy-900">
          Planilla (.xlsx)
        </label>
        <input
          id="archivo"
          name="archivo"
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          required
          className="block text-sm"
        />
        <p className="mt-1.5 text-xs text-slate-500">
          Se lee solo la hoja ASOCIACI. El archivo no se guarda en el servidor.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Boton type="submit" variante="secundario" disabled={enviando}>
          {enviando ? 'Leyendo…' : 'Ver vista previa'}
        </Boton>
        {estado.etapa === 'vista_previa' && estado.errores.length === 0 ? (
          <Boton type="submit" name="confirmar" value="si" disabled={enviando}>
            Importar {estado.periodo ? nombrePeriodo(estado.periodo.anio, estado.periodo.mes) : ''}
          </Boton>
        ) : null}
      </div>

      {estado.etapa === 'error' ? <Aviso tipo="error">{estado.mensaje}</Aviso> : null}

      {estado.etapa === 'importada' ? (
        <Aviso tipo="exito">
          Importado {nombrePeriodo(estado.resumen.anio, estado.resumen.mes)}:{' '}
          {estado.resumen.socios} socios ({estado.resumen.sociosNuevos} nuevos),{' '}
          {estado.resumen.lineas} líneas, total {formatearClp(estado.resumen.total)}.
          {estado.resumen.reemplazoPeriodoExistente
            ? ' Reemplazó la importación anterior del mismo mes.'
            : ''}
          {estado.advertencias > 0
            ? ` ${estado.advertencias} advertencias (ver vista previa).`
            : ''}
        </Aviso>
      ) : null}

      {estado.etapa === 'vista_previa' ? (
        <div className="space-y-6">
          {estado.errores.length > 0 ? (
            <Aviso tipo="error">
              La planilla tiene errores y no se puede importar:
              <span className="mt-2 block">{estado.errores.slice(0, 20).join(' · ')}</span>
            </Aviso>
          ) : null}

          <dl className="grid gap-4 sm:grid-cols-4">
            {[
              [
                'Periodo',
                estado.periodo ? nombrePeriodo(estado.periodo.anio, estado.periodo.mes) : '—',
              ],
              ['Socios', String(estado.socios)],
              ['Filas con RUT', String(estado.filas)],
              ['Total', formatearClp(estado.total)],
            ].map(([t, v]) => (
              <div key={t} className="rounded-lg border border-slate-200 p-4">
                <dt className="text-xs text-slate-500">{t}</dt>
                <dd className="mt-1 text-lg font-bold capitalize text-navy-900">{v}</dd>
              </div>
            ))}
          </dl>

          <table className="w-full max-w-lg text-sm">
            <caption className="mb-2 text-left font-semibold text-navy-900">
              Total por concepto
            </caption>
            <tbody className="divide-y divide-slate-200">
              {Object.entries(estado.totalPorConcepto).map(([concepto, monto]) => (
                <tr key={concepto}>
                  <th scope="row" className="py-2 text-left font-normal text-slate-700">
                    {nombresConcepto[concepto] ?? concepto}
                  </th>
                  <td className="py-2 text-right tabular-nums">{formatearClp(monto ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {estado.advertencias.length > 0 ? (
            <details className="rounded-lg border border-gold-500/40 bg-gold-100/40 p-4 text-sm">
              <summary className="cursor-pointer font-semibold text-gold-700">
                {estado.advertencias.length} advertencias (no bloquean la importación)
              </summary>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-slate-700">
                {estado.advertencias.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </details>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
