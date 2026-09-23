'use client';

import { signOut } from 'next-auth/react';

export function BotonSalir({ destino }: { destino: string }) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: destino })}
      className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-navy-400 hover:text-navy-800"
    >
      Cerrar sesión
    </button>
  );
}
