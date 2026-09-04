'use client';

import { CATEGORIAS_CONVENIO, type CategoriaConvenio, type Convenio } from '@afuch/contracts';
import { useMemo, useState } from 'react';
import { categoriasConContenido, filtrarConvenios } from '@/lib/convenios';
import { TarjetaConvenio } from './tarjeta-convenio';

export function CatalogoConvenios({ convenios }: { convenios: readonly Convenio[] }) {
  const [categoria, setCategoria] = useState<CategoriaConvenio | undefined>(undefined);
  const [busqueda, setBusqueda] = useState('');
  const [soloGrupoFamiliar, setSoloGrupoFamiliar] = useState(false);

  const categorias = useMemo(() => categoriasConContenido(convenios), [convenios]);
  const resultados = useMemo(
    () => filtrarConvenios(convenios, { categoria, busqueda, soloGrupoFamiliar }),
    [convenios, categoria, busqueda, soloGrupoFamiliar],
  );

  const hayFiltros = Boolean(categoria || busqueda || soloGrupoFamiliar);

  function limpiarFiltros() {
    setCategoria(undefined);
    setBusqueda('');
    setSoloGrupoFamiliar(false);
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-5 rounded-xl border border-slate-200 bg-slate-50/70 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <label htmlFor="buscar-convenio" className="sr-only">
              Buscar convenio por nombre
            </label>
            <input
              id="buscar-convenio"
              type="search"
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
              placeholder="Buscar por nombre, por ejemplo: óptica, gas, dental…"
              className="w-full rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-navy-600 focus:outline-none"
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={soloGrupoFamiliar}
              onChange={(evento) => setSoloGrupoFamiliar(evento.target.checked)}
              className="h-4 w-4 rounded border-slate-300 accent-navy-800"
            />
            Solo con cobertura familiar
          </label>
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoría">
          <button
            type="button"
            onClick={() => setCategoria(undefined)}
            aria-pressed={categoria === undefined}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              categoria === undefined
                ? 'bg-navy-800 text-white'
                : 'border border-slate-300 bg-white text-slate-700 hover:border-navy-400'
            }`}
          >
            Todas
          </button>
          {categorias.map((slug) => (
            <button
              key={slug}
              type="button"
              onClick={() => setCategoria(slug)}
              aria-pressed={categoria === slug}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                categoria === slug
                  ? 'bg-navy-800 text-white'
                  : 'border border-slate-300 bg-white text-slate-700 hover:border-navy-400'
              }`}
            >
              {CATEGORIAS_CONVENIO[slug]}
            </button>
          ))}
        </div>
      </div>

      {/* aria-live para que quien navega con lector de pantalla se entere de que
          el listado cambió al aplicar un filtro. */}
      <p className="mb-6 text-sm text-slate-600" aria-live="polite">
        {resultados.length === 0
          ? 'No hay convenios que coincidan con tu búsqueda.'
          : `${resultados.length} ${resultados.length === 1 ? 'convenio' : 'convenios'}`}
        {hayFiltros ? (
          <button
            type="button"
            onClick={limpiarFiltros}
            className="ml-3 font-semibold text-navy-600 underline underline-offset-2 hover:text-navy-800"
          >
            Limpiar filtros
          </button>
        ) : null}
      </p>

      {resultados.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {resultados.map((convenio) => (
            <TarjetaConvenio key={convenio.slug} convenio={convenio} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center">
          <p className="text-slate-600">Prueba con otra palabra o quita algún filtro.</p>
        </div>
      )}
    </div>
  );
}
