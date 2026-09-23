import type { ReactNode } from 'react';
import { Container } from '../ui/container';

/** Marco común de las pantallas de acceso: ingreso, registro y contraseñas. */
export function TarjetaAcceso({
  eyebrow = 'Área de socios',
  titulo,
  descripcion,
  children,
  pie,
}: {
  eyebrow?: string;
  titulo: string;
  descripcion?: ReactNode;
  children: ReactNode;
  pie?: ReactNode;
}) {
  return (
    <section className="bg-navy-50 py-14 lg:py-20">
      <Container>
        <div className="mx-auto max-w-md">
          <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="eyebrow mb-3 text-navy-600">{eyebrow}</p>
            <h1 className="text-2xl font-bold text-navy-900">{titulo}</h1>
            {descripcion ? (
              <div className="mt-3 text-sm/6 text-slate-600">{descripcion}</div>
            ) : null}
            <div className="mt-8">{children}</div>
          </div>
          {pie ? <div className="mt-6 text-center text-sm text-slate-600">{pie}</div> : null}
        </div>
      </Container>
    </section>
  );
}

export function Aviso({
  tipo,
  children,
}: {
  tipo: 'exito' | 'error' | 'info';
  children: ReactNode;
}) {
  const estilos = {
    exito: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    error: 'border-red-200 bg-red-50 text-red-800',
    info: 'border-navy-200 bg-navy-50 text-navy-900',
  }[tipo];
  return (
    <p
      role={tipo === 'error' ? 'alert' : 'status'}
      className={`rounded-md border p-4 text-sm/6 ${estilos}`}
    >
      {children}
    </p>
  );
}
