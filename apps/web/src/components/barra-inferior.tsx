'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

/** Íconos de trazo (24×24), dibujados en línea para no sumar dependencias. */
const ICONOS: Record<string, ReactNode> = {
  inicio: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9.5Z" />,
  nosotros: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 11a3 3 0 1 0 0-6M21 20c0-2.6-1.7-4.9-4-5.7" />
    </>
  ),
  beneficios: (
    <>
      <rect x="3" y="8" width="18" height="13" rx="1.5" />
      <path d="M12 8v13M3 12h18M12 8S10.5 3 7.5 3 5 6 7 7.2 12 8 12 8Zm0 0s1.5-5 4.5-5S19 6 17 7.2 12 8 12 8Z" />
    </>
  ),
  noticias: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="1.5" />
      <path d="M7 8h10M7 12h10M7 16h6" />
    </>
  ),
  contacto: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="m3.5 6 8.5 7 8.5-7" />
    </>
  ),
  socios: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </>
  ),
};

const ENLACES = [
  { href: '/', texto: 'Inicio', icono: 'inicio' },
  { href: '/quienes-somos', texto: 'Nosotros', icono: 'nosotros' },
  { href: '/beneficios', texto: 'Beneficios', icono: 'beneficios' },
  { href: '/noticias', texto: 'Noticias', icono: 'noticias' },
  { href: '/contacto', texto: 'Contacto', icono: 'contacto' },
  { href: '/socios', texto: 'Socios', icono: 'socios' },
] as const;

function esActiva(ruta: string, href: string): boolean {
  return href === '/' ? ruta === '/' : ruta === href || ruta.startsWith(`${href}/`);
}

/**
 * Navegación de celular y tablet, fija abajo como en una app: queda al alcance
 * del pulgar. En escritorio (lg) la reemplaza la navegación del encabezado.
 */
export function BarraInferior() {
  const ruta = usePathname();

  return (
    <nav
      aria-label="Navegación principal móvil"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-6">
        {ENLACES.map(({ href, texto, icono }) => {
          const activa = esActiva(ruta, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={activa ? 'page' : undefined}
                className={`flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
                  activa ? 'text-navy-800' : 'text-slate-500 hover:text-navy-600'
                }`}
              >
                <span
                  className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${
                    activa ? 'bg-navy-50' : ''
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={activa ? 2 : 1.75}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    {ICONOS[icono]}
                  </svg>
                </span>
                {texto}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
