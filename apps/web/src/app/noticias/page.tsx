import type { Metadata } from 'next';
import { TarjetaNoticia } from '@/components/tarjeta-noticia';
import { Container } from '@/components/ui/container';
import { NOTICIAS } from '@/content/noticias';

export const metadata: Metadata = {
  title: 'Noticias',
  description:
    'Novedades de AFUCH Servicios Centrales: negociaciones, acuerdos, asambleas y comunicados.',
};

const noticias = [...NOTICIAS].sort((a, b) => b.fecha.localeCompare(a.fecha));

export default function PaginaNoticias() {
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
          {noticias.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {noticias.map((noticia) => (
                <TarjetaNoticia key={noticia.slug} noticia={noticia} />
              ))}
            </div>
          ) : (
            <p className="text-slate-600">Todavía no hay noticias publicadas.</p>
          )}
        </Container>
      </section>
    </>
  );
}
