import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { BotonSalir } from '@/components/socios/salir';
import { Pestanas } from '@/components/socios/pestanas';
import { Container } from '@/components/ui/container';
import { exigirSocio } from '@/server/auth';
import { descifrar } from '@/server/cifrado';
import { datosDelSocio } from '@/server/descuentos';

export const metadata: Metadata = { robots: { index: false } };

const PESTANAS = [
  { href: '/socios/descuentos', texto: 'Mis descuentos' },
  { href: '/socios/rendicion', texto: 'Rendición de cuentas' },
  { href: '/socios/datos', texto: 'Mis datos' },
] as const;

export default async function LayoutPrivado({ children }: { children: ReactNode }) {
  const { socioId } = await exigirSocio();
  const socio = await datosDelSocio(socioId);
  const nombre = descifrar(socio.nombreCifrado);

  return (
    <>
      <section className="border-b border-slate-200 bg-navy-50 py-8">
        <Container>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="eyebrow text-navy-600">Área de socios</p>
              <p className="mt-1 text-xl font-bold text-navy-900">{nombre}</p>
            </div>
            <BotonSalir destino="/socios" />
          </div>
          <div className="mt-6">
            <Pestanas enlaces={PESTANAS} etiqueta="Secciones del área de socios" />
          </div>
        </Container>
      </section>
      <section className="py-10 lg:py-14">
        <Container>{children}</Container>
      </section>
    </>
  );
}
