import type { Convenio } from '@afuch/contracts';
import Link from 'next/link';
import { ChipCategoria } from './ui/chip-categoria';

export function TarjetaConvenio({ convenio }: { convenio: Convenio }) {
  return (
    <article className="group relative flex h-full flex-col rounded-xl border border-slate-200 bg-white p-6 transition-all hover:border-navy-200 hover:shadow-lg hover:shadow-navy-900/5">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <ChipCategoria categoria={convenio.categoria} />
        {convenio.extensivoGrupoFamiliar ? (
          <span className="inline-flex items-center rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600">
            Grupo familiar
          </span>
        ) : null}
      </div>

      <h3 className="text-lg font-bold text-navy-900">
        {/* El enlace cubre toda la tarjeta, así el área clicable es la que el
            usuario percibe, sin anidar enlaces ni romper la navegación por teclado. */}
        <Link href={`/beneficios/${convenio.slug}`} className="after:absolute after:inset-0">
          {convenio.nombre}
        </Link>
      </h3>

      <p className="mt-2.5 flex-1 text-sm/6 text-slate-600">{convenio.resumen}</p>

      {convenio.formaDePago ? (
        <p className="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-500">
          {convenio.formaDePago}
        </p>
      ) : null}

      <span className="mt-4 text-sm font-semibold text-navy-600 group-hover:text-navy-800">
        Ver detalle <span aria-hidden="true">→</span>
      </span>
    </article>
  );
}
