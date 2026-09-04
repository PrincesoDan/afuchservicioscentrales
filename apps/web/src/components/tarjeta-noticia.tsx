import { CATEGORIAS_NOTICIA, type Noticia } from '@afuch/contracts';
import Image from 'next/image';
import Link from 'next/link';
import { formatearFecha } from '@/lib/convenios';

export function TarjetaNoticia({ noticia }: { noticia: Noticia }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-all hover:border-navy-200 hover:shadow-lg hover:shadow-navy-900/5">
      <div className="relative aspect-16/9 overflow-hidden bg-navy-50">
        {noticia.portada ? (
          <Image
            src={noticia.portada.src}
            alt={noticia.portada.alt}
            fill
            sizes="(max-width: 768px) 100vw, 380px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="mb-3 flex items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-navy-600">
            {CATEGORIAS_NOTICIA[noticia.categoria]}
          </span>
          <span aria-hidden="true">·</span>
          <time dateTime={noticia.fecha}>{formatearFecha(noticia.fecha)}</time>
        </div>

        <h3 className="text-lg font-bold text-balance text-navy-900">
          <Link href={`/noticias/${noticia.slug}`} className="after:absolute after:inset-0">
            {noticia.titulo}
          </Link>
        </h3>

        <p className="mt-2.5 line-clamp-3 flex-1 text-sm/6 text-slate-600">{noticia.bajada}</p>
      </div>
    </article>
  );
}
