import { CATEGORIAS_NOTICIA, type CategoriaNoticia } from '@afuch/contracts';
import type { Metadata } from 'next';
import Link from 'next/link';
import { TarjetaNoticia } from '@/components/tarjeta-noticia';
import { Container } from '@/components/ui/container';
import { NOTICIAS } from '@/content/noticias';
import { filtrarNoticias, leerParametrosNoticias, paginar } from '@/lib/noticias';

export const metadata: Metadata = {
  title: 'Noticias',
  description:
    'Novedades de AFUCH Servicios Centrales: negociaciones, acuerdos, asambleas y comunicados.',
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function hrefNoticias(filtros: {
  categoria?: CategoriaNoticia;
  busqueda?: string;
  pagina?: number;
}) {
  const parametros = new URLSearchParams();
  if (filtros.categoria) parametros.set('categoria', filtros.categoria);
  if (filtros.busqueda) parametros.set('q', filtros.busqueda);
  if (filtros.pagina && filtros.pagina > 1) parametros.set('pagina', String(filtros.pagina));
  const consulta = parametros.toString();
  return consulta ? `/noticias?${consulta}` : '/noticias';
}

const CLASE_CHIP = 'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors';
const CHIP_ACTIVO = `${CLASE_CHIP} bg-navy-800 text-white`;
const CHIP_INACTIVO = `${CLASE_CHIP} border border-slate-300 bg-white text-slate-700 hover:border-navy-400`;

export default async function PaginaNoticias({ searchParams }: Props) {
  const { categoria, busqueda, pagina } = leerParametrosNoticias(await searchParams);
  const filtradas = filtrarNoticias(NOTICIAS, { categoria, busqueda });
  const resultado = paginar(filtradas, pagina);
  const categorias = (Object.keys(CATEGORIAS_NOTICIA) as CategoriaNoticia[]).filter((c) =>
    NOTICIAS.some((n) => n.categoria === c),
  );

  return (
    <>
      <section className="bg-navy-800 py-16 text-white lg:py-20">
        <Container>
          <p className="eyebrow mb-4 text-gold-500">Noticias</p>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            Lo que está pasando en la asociación
          </h1>
          <p className="mt-5 max-w-2xl text-lg/8 text-navy-100">
            Lo que se está negociando, lo que se acordó y lo que viene.
          </p>
        </Container>
      </section>

      <section className="py-14 lg:py-20">
        <Container>
          <div className="mb-8 flex flex-col gap-5 rounded-xl border border-slate-200 bg-slate-50/70 p-5">
            {/* Formulario GET: el filtro funciona también sin JavaScript y la URL se puede compartir. */}
            <form
              action="/noticias"
              method="get"
              role="search"
              className="flex flex-col gap-3 sm:flex-row"
            >
              {categoria ? <input type="hidden" name="categoria" value={categoria} /> : null}
              <label htmlFor="buscar-noticia" className="sr-only">
                Buscar noticias
              </label>
              <input
                id="buscar-noticia"
                name="q"
                type="search"
                defaultValue={busqueda}
                placeholder="Buscar por título o bajada…"
                className="w-full flex-1 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-navy-600 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-md bg-navy-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-600"
              >
                Buscar
              </button>
            </form>

            <nav className="flex flex-wrap gap-2" aria-label="Filtrar por categoría">
              <Link
                href={hrefNoticias({ busqueda })}
                aria-current={categoria === undefined ? 'page' : undefined}
                className={categoria === undefined ? CHIP_ACTIVO : CHIP_INACTIVO}
              >
                Todas
              </Link>
              {categorias.map((c) => (
                <Link
                  key={c}
                  href={hrefNoticias({ categoria: c, busqueda })}
                  aria-current={categoria === c ? 'page' : undefined}
                  className={categoria === c ? CHIP_ACTIVO : CHIP_INACTIVO}
                >
                  {CATEGORIAS_NOTICIA[c]}
                </Link>
              ))}
            </nav>
          </div>

          <p className="mb-6 text-sm text-slate-600" aria-live="polite">
            {filtradas.length === 0
              ? 'No hay noticias que coincidan con tu búsqueda.'
              : `${filtradas.length} ${filtradas.length === 1 ? 'noticia' : 'noticias'}`}
            {categoria || busqueda ? (
              <Link
                href="/noticias"
                className="ml-3 font-semibold text-navy-600 underline underline-offset-2 hover:text-navy-800"
              >
                Limpiar filtros
              </Link>
            ) : null}
          </p>

          {resultado.elementos.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {resultado.elementos.map((noticia) => (
                <TarjetaNoticia key={noticia.slug} noticia={noticia} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center">
              <p className="text-slate-600">Prueba con otra palabra o quita el filtro.</p>
            </div>
          )}

          {resultado.totalPaginas > 1 ? (
            <nav aria-label="Paginación" className="mt-12 flex items-center justify-center gap-2">
              {Array.from({ length: resultado.totalPaginas }, (_, i) => i + 1).map((n) => (
                <Link
                  key={n}
                  href={hrefNoticias({ categoria, busqueda, pagina: n })}
                  aria-current={n === resultado.pagina ? 'page' : undefined}
                  aria-label={`Página ${n}`}
                  className={`flex h-10 min-w-10 items-center justify-center rounded-md px-3 text-sm font-semibold ${
                    n === resultado.pagina
                      ? 'bg-navy-800 text-white'
                      : 'border border-slate-300 text-slate-700 hover:border-navy-400'
                  }`}
                >
                  {n}
                </Link>
              ))}
            </nav>
          ) : null}
        </Container>
      </section>
    </>
  );
}
