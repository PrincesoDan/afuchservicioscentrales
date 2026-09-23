'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Container } from './ui/container';

const NAVEGACION = [
  { href: '/', etiqueta: 'Inicio' },
  { href: '/quienes-somos', etiqueta: 'Quiénes somos' },
  { href: '/beneficios', etiqueta: 'Convenios y beneficios' },
  { href: '/noticias', etiqueta: 'Noticias' },
  { href: '/contacto', etiqueta: 'Contacto' },
] as const;

function esRutaActiva(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

export function SiteHeader() {
  const pathname = usePathname();

  // En celular y tablet la navegación vive en la barra inferior (BarraInferior).
  return (
    <header className="sticky top-0 z-50 bg-navy-800 text-white shadow-sm">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-navy-800"
      >
        Saltar al contenido
      </a>

      <Container>
        <div className="flex h-16 items-center lg:h-20 justify-between gap-6">
          <Link
            href="/"
            className="flex shrink-0 items-center"
            aria-label="AFUCH Servicios Centrales, ir al inicio"
          >
            <Image
              src="/logos/banner-blanco.webp"
              alt="AFUCH Servicios Centrales"
              width={998}
              height={128}
              priority
              className="h-9 w-auto sm:h-10"
            />
          </Link>

          <nav aria-label="Navegación principal" className="hidden items-center gap-1 lg:flex">
            {NAVEGACION.map(({ href, etiqueta }) => {
              const activa = esRutaActiva(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={activa ? 'page' : undefined}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    activa
                      ? 'bg-white/15 text-white'
                      : 'text-navy-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {etiqueta}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/socios"
              className="hidden rounded-md border border-gold-500 px-4 py-2.5 text-sm font-semibold text-gold-500 transition-colors hover:bg-gold-500 hover:text-navy-900 lg:inline-flex"
            >
              Acceso socios
            </Link>
          </div>
        </div>
      </Container>
    </header>
  );
}
