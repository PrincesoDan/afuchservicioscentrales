'use client';

import type { ReactNode } from 'react';

/** Botón de envío que pide confirmación antes de una acción irreversible. */
export function BotonConfirmar({
  mensaje,
  children,
  className = '',
}: {
  mensaje: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!window.confirm(mensaje)) e.preventDefault();
      }}
      className={className}
    >
      {children}
    </button>
  );
}
