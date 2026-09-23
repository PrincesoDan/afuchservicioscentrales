'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
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
  const [menuAbierto, setMenuAbierto] = useState(false);

  // El menú móvil es un overlay a pantalla completa: dejar el fondo scrolleable
  // hace que al cerrarlo el usuario aparezca en otro punto de la página.
  useEffect(() => {
    document.body.style.overflow = menuAbierto ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuAbierto]);

  useEffect(() => {
    setMenuAbierto(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 bg-navy-800 text-white shadow-sm">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-navy-800"
      >
        Saltar al contenido
      </a>

      <Container>
        <div className="flex h-20 items-center justify-between gap-6">
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
              className="hidden rounded-md border border-gold-500 px-4 py-2.5 text-sm font-semibold text-gold-500 transition-colors hover:bg-gold-500 hover:text-navy-900 sm:inline-flex"
            >
              Acceso socios
            </Link>

            <button
              type="button"
              onClick={() => setMenuAbierto((abierto) => !abierto)}
              aria-expanded={menuAbierto}
              aria-controls="menu-movil"
              className="rounded-md p-2 text-white hover:bg-white/10 lg:hidden"
            >
              <span className="sr-only">{menuAbierto ? 'Cerrar menú' : 'Abrir menú'}</span>
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                {menuAbierto ? (
                  <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                ) : (
                  <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </Container>

      {menuAbierto ? (
        <div id="menu-movil" className="border-t border-white/15 bg-navy-800 lg:hidden">
          <Container>
            <nav aria-label="Navegación principal móvil" className="flex flex-col py-4">
              {NAVEGACION.map(({ href, etiqueta }) => (
                <Link
                  key={href}
                  href={href}
                  aria-current={esRutaActiva(pathname, href) ? 'page' : undefined}
                  className={`rounded-md px-3 py-3 text-base font-medium ${
                    esRutaActiva(pathname, href) ? 'bg-white/15 text-white' : 'text-navy-100'
                  }`}
                >
                  {etiqueta}
                </Link>
              ))}
              <Link
                href="/socios"
                className="mt-3 rounded-md border border-gold-500 px-3 py-3 text-center text-base font-semibold text-gold-500 sm:hidden"
              >
                Acceso socios
              </Link>
            </nav>
          </Container>
        </div>
      ) : null}
    </header>
  );
}
