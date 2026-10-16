import type { Metadata } from 'next';
import Link from 'next/link';
import { BotonLink } from '@/components/ui/button';
import { FORMULARIOS } from '@/content/sede';
import { exigirSocio } from '@/server/auth';

export const metadata: Metadata = { title: 'Vale de gas' };

/** AFUCH pidió que el formulario de gas quede solo dentro del área privada (2026-10-15). */
export default async function PaginaGas() {
  await exigirSocio();

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-navy-900">Solicitud de vales de gas</h1>
      <p className="mt-2 text-sm/6 text-slate-600">
        Pide tus vales digitales de Abastible con el formulario de AFUCH Servicios Centrales. El
        valor se descuenta en una cuota por planilla al mes siguiente.{' '}
        <Link
          href="/beneficios/vales-abastible"
          className="font-semibold text-navy-600 underline underline-offset-2 hover:text-navy-800"
        >
          Ver condiciones del convenio
        </Link>
        .
      </p>
      <BotonLink
        href={FORMULARIOS.solicitudGas}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6"
      >
        Ir al formulario de gas
      </BotonLink>
      <p className="mt-3 text-xs/5 text-slate-500">
        Se abre en una pestaña nueva (Formularios de Google).
      </p>
    </div>
  );
}
