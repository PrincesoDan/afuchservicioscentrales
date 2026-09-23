import type { Metadata } from 'next';
import { formatearFecha } from '@/lib/convenios';
import { exigirSocio } from '@/server/auth';
import { listarDocumentos } from '@/server/rendicion';

export const metadata: Metadata = { title: 'Rendición de cuentas' };

export default async function PaginaRendicion() {
  await exigirSocio();
  const documentos = await listarDocumentos();

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-900">Rendición de cuentas</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        Estados financieros, balances y documentos publicados por AFUCH Servicios Centrales.
      </p>

      {documentos.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 py-16 text-center">
          <p className="text-slate-600">Todavía no hay documentos publicados.</p>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-slate-200 rounded-xl border border-slate-200">
          {documentos.map((d) => (
            <li
              key={d.id}
              className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold text-navy-900">{d.titulo}</p>
                <p className="text-xs text-slate-500">
                  {d.categoria} · {formatearFecha(d.fecha.toISOString().slice(0, 10))}
                </p>
              </div>
              <a
                href={`/api/socios/rendicion/${d.id}`}
                target="_blank"
                rel="noopener"
                className="text-sm font-semibold text-navy-600 hover:text-navy-800"
              >
                Ver documento (PDF)
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
