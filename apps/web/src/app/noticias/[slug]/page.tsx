import { CATEGORIAS_NOTICIA } from '@afuch/contracts';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TextoEnriquecido } from '@/components/texto-enriquecido';
import { Container } from '@/components/ui/container';
import { NOTICIAS } from '@/content/noticias';
import { formatearFecha } from '@/lib/convenios';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return NOTICIAS.map((noticia) => ({ slug: noticia.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const noticia = NOTICIAS.find((item) => item.slug === slug);
  if (!noticia) return { title: 'Noticia no encontrada' };

  return {
    title: noticia.titulo,
    description: noticia.bajada,
    openGraph: { type: 'article', publishedTime: noticia.fecha },
  };
}

export default async function PaginaNoticia({ params }: Props) {
  const { slug } = await params;
  const noticia = NOTICIAS.find((item) => item.slug === slug);
  if (!noticia) notFound();

  return (
    <article className="py-12 lg:py-16">
      <Container>
        <div className="mx-auto max-w-3xl">
          <Link
            href="/noticias"
            className="mb-8 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-600 hover:text-navy-800"
          >
            <span aria-hidden="true">←</span> Volver a noticias
          </Link>

          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="font-semibold text-navy-600">
              {CATEGORIAS_NOTICIA[noticia.categoria]}
            </span>
            <span aria-hidden="true">·</span>
            <time dateTime={noticia.fecha}>{formatearFecha(noticia.fecha)}</time>
          </div>

          <h1 className="mt-4 text-4xl font-bold tracking-tight text-balance text-navy-900 sm:text-5xl">
            {noticia.titulo}
          </h1>
          <p className="mt-6 text-xl/8 text-slate-600">{noticia.bajada}</p>
        </div>

        {noticia.portada ? (
          <figure className="mx-auto mt-12 max-w-4xl">
            <div className="relative aspect-16/10 overflow-hidden rounded-xl bg-navy-50">
              <Image
                src={noticia.portada.src}
                alt={noticia.portada.alt}
                fill
                sizes="(max-width: 1024px) 100vw, 900px"
                priority
                className="object-cover"
              />
            </div>
            <figcaption className="mt-3 text-sm text-slate-500">
              {noticia.portada.alt}
              {noticia.creditoFoto ? (
                <span className="block text-xs text-slate-400">
                  Fotografía: {noticia.creditoFoto}
                </span>
              ) : null}
            </figcaption>
          </figure>
        ) : null}

        <div className="mx-auto mt-12 max-w-3xl">
          <div className="space-y-6">
            {noticia.cuerpo.map((parrafo, indice) => (
              <p key={indice} className="text-lg/8 text-slate-700">
                <TextoEnriquecido texto={parrafo} />
              </p>
            ))}
          </div>

          <footer className="mt-12 border-t border-slate-200 pt-8 text-sm/6 text-slate-500">
            {noticia.autor ? <p>Texto: {noticia.autor}</p> : null}
            {noticia.creditoFoto ? <p>Fotografías: {noticia.creditoFoto}</p> : null}
            {noticia.fuente ? (
              <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                Publicado originalmente por {noticia.fuente.nombre}.{' '}
                <a
                  href={noticia.fuente.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-navy-600 underline underline-offset-2 hover:text-navy-800"
                >
                  Leer la nota original
                </a>
                .
              </p>
            ) : null}
          </footer>
        </div>
      </Container>
    </article>
  );
}
