import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

type Variante = 'primario' | 'secundario' | 'sobreOscuro' | 'fantasma';

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-md px-5 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60';

const VARIANTES: Record<Variante, string> = {
  primario: 'bg-navy-800 text-white hover:bg-navy-600',
  secundario: 'border border-navy-200 bg-white text-navy-800 hover:bg-navy-50',
  sobreOscuro: 'bg-white text-navy-800 hover:bg-navy-50',
  fantasma: 'border border-white/40 text-white hover:bg-white/10',
};

export function BotonLink({
  href,
  variante = 'primario',
  className = '',
  children,
  ...props
}: { href: string; variante?: Variante; className?: string; children: ReactNode } & Omit<
  ComponentProps<typeof Link>,
  'href' | 'className' | 'children'
>) {
  return (
    <Link href={href} className={`${BASE} ${VARIANTES[variante]} ${className}`} {...props}>
      {children}
    </Link>
  );
}

export function Boton({
  variante = 'primario',
  className = '',
  children,
  ...props
}: { variante?: Variante } & ComponentProps<'button'>) {
  return (
    <button className={`${BASE} ${VARIANTES[variante]} ${className}`} {...props}>
      {children}
    </button>
  );
}
