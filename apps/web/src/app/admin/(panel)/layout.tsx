import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { BotonSalir } from '@/components/socios/salir';
import { Pestanas } from '@/components/socios/pestanas';
import { Container } from '@/components/ui/container';
import { exigirAdmin } from '@/server/auth';

export const metadata: Metadata = { title: 'Administración', robots: { index: false } };

const PESTANAS = [
  { href: '/admin/planilla', texto: 'Planilla mensual' },
  { href: '/admin/socios', texto: 'Socios' },
  { href: '/admin/rendicion', texto: 'Rendición de cuentas' },
  { href: '/admin/auditoria', texto: 'Auditoría' },
] as const;

export default async function LayoutAdmin({ children }: { children: ReactNode }) {
  await exigirAdmin();
  return (
    <>
      <section className="border-b border-slate-200 bg-slate-100 py-6">
        <Container>
          <div className="flex items-center justify-between gap-4">
            <p className="eyebrow text-slate-600">Administración interna · La Palanca</p>
            <BotonSalir destino="/admin/ingreso" />
          </div>
          <div className="mt-4">
            <Pestanas enlaces={PESTANAS} etiqueta="Secciones de administración" />
          </div>
        </Container>
      </section>
      <section className="py-10">
        <Container>{children}</Container>
      </section>
    </>
  );
}
