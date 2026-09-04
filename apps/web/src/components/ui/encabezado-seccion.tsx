import type { ReactNode } from 'react';

export function EncabezadoSeccion({
  eyebrow,
  titulo,
  descripcion,
  claro = false,
  children,
}: {
  eyebrow?: string;
  titulo: string;
  descripcion?: string;
  claro?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="mb-10 flex flex-col gap-4 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className={`eyebrow mb-3 ${claro ? 'text-gold-500' : 'text-navy-600'}`}>{eyebrow}</p>
        ) : null}
        <h2
          className={`text-3xl font-bold tracking-tight text-balance sm:text-4xl ${
            claro ? 'text-white' : 'text-navy-900'
          }`}
        >
          {titulo}
        </h2>
        {descripcion ? (
          <p className={`mt-4 text-base/7 ${claro ? 'text-navy-100' : 'text-slate-600'}`}>
            {descripcion}
          </p>
        ) : null}
      </div>
      {children ? <div className="shrink-0">{children}</div> : null}
    </div>
  );
}
