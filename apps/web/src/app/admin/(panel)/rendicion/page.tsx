import { accionRetirarDocumento } from '@/app/admin/acciones';
import { BotonConfirmar } from '@/components/admin/boton-confirmar';
import { FormularioDocumento } from '@/components/admin/formulario-documento';
import { formatearFecha } from '@/lib/convenios';
import { listarDocumentos } from '@/server/rendicion';

export default async function PaginaRendicionAdmin() {
  const documentos = await listarDocumentos();
  return (
    <div className="grid gap-12 lg:grid-cols-2">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Publicar documento</h1>
        <p className="mt-2 mb-6 text-sm text-slate-600">
          Queda visible de inmediato para los socios con sesión.
        </p>
        <FormularioDocumento />
      </div>
      <div>
        <h2 className="text-lg font-bold text-navy-900">Publicados</h2>
        {documentos.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Ninguno todavía.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200">
            {documentos.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                <div>
                  <p className="font-semibold">{d.titulo}</p>
                  <p className="text-xs text-slate-500">
                    {d.categoria} · {formatearFecha(d.fecha.toISOString().slice(0, 10))} ·{' '}
                    {(d.tamano / 1024).toFixed(0)} KB
                  </p>
                </div>
                <form action={accionRetirarDocumento}>
                  <input type="hidden" name="id" value={d.id} />
                  <BotonConfirmar
                    mensaje={`¿Retirar «${d.titulo}»? Se borra el archivo.`}
                    className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                  >
                    Retirar
                  </BotonConfirmar>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
