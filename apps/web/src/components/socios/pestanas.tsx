'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Pestanas({
  enlaces,
  etiqueta,
}: {
  enlaces: ReadonlyArray<{ href: string; texto: string }>;
  etiqueta: string;
}) {
  const ruta = usePathname();
  return (
    <nav aria-label={etiqueta} className="flex flex-wrap gap-1">
      {enlaces.map(({ href, texto }) => {
        const activa = ruta === href || ruta.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={activa ? 'page' : undefined}
            className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
              activa
                ? 'bg-navy-800 text-white'
                : 'text-slate-700 hover:bg-navy-50 hover:text-navy-800'
            }`}
          >
            {texto}
          </Link>
        );
      })}
    </nav>
  );
}
