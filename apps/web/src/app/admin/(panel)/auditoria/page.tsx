import Link from 'next/link';
import { listarAuditoria } from '@/server/administracion';

type Props = { searchParams: Promise<{ pagina?: string }> };

export default async function PaginaAuditoria({ searchParams }: Props) {
  const pagina = Math.max(1, Number((await searchParams).pagina) || 1);
  const { registros, paginas, total } = await listarAuditoria({ pagina });

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-900">Registro de auditoría</h1>
      <p className="mt-2 text-sm text-slate-600">{total} eventos. Los más recientes primero.</p>
      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="px-3 py-2">
                Fecha
              </th>
              <th scope="col" className="px-3 py-2">
                Actor
              </th>
              <th scope="col" className="px-3 py-2">
                Acción
              </th>
              <th scope="col" className="px-3 py-2">
                Entidad
              </th>
              <th scope="col" className="px-3 py-2">
                IP
              </th>
              <th scope="col" className="px-3 py-2">
                Detalle
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-mono">
            {registros.map((r) => (
              <tr key={r.id}>
                <td className="px-3 py-2 whitespace-nowrap">
                  {r.fecha.toLocaleString('es-CL', { timeZone: 'America/Santiago' })}
                </td>
                <td className="px-3 py-2">
                  {r.actorTipo}
                  {r.actorId ? `:${r.actorId.slice(0, 8)}` : ''}
                </td>
                <td className="px-3 py-2">{r.accion}</td>
                <td className="px-3 py-2">
                  {r.entidad ? `${r.entidad}:${(r.entidadId ?? '').slice(0, 10)}` : ''}
                </td>
                <td className="px-3 py-2">{r.ip}</td>
                <td className="max-w-xs truncate px-3 py-2">
                  {r.detalle ? JSON.stringify(r.detalle) : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <nav aria-label="Paginación" className="mt-4 flex gap-4 text-sm">
        {pagina > 1 ? (
          <Link
            href={`/admin/auditoria?pagina=${pagina - 1}`}
            className="font-semibold text-navy-600"
          >
            ← Más recientes
          </Link>
        ) : null}
        {pagina < paginas ? (
          <Link
            href={`/admin/auditoria?pagina=${pagina + 1}`}
            className="font-semibold text-navy-600"
          >
            Más antiguos →
          </Link>
        ) : null}
      </nav>
    </div>
  );
}
