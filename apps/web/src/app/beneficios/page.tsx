import type { Metadata } from 'next';
import { CatalogoConvenios } from '@/components/catalogo-convenios';
import { Container } from '@/components/ui/container';
import { CONVENIOS } from '@/content/convenios';
import { FENAFUCH } from '@/content/sede';

export const metadata: Metadata = {
  title: 'Convenios y beneficios',
  description:
    'Todos los convenios vigentes de AFUCH Servicios Centrales: salud, ahorro y crédito, gas, funeraria, educación y el Fondo Solidario.',
};

export default function PaginaBeneficios() {
  return (
    <>
      <section className="bg-navy-800 py-16 text-white lg:py-20">
        <Container>
          <p className="eyebrow mb-4 text-gold-500">Convenios y beneficios</p>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            {CONVENIOS.length} convenios negociados para ti
          </h1>
          <p className="mt-5 max-w-2xl text-lg/8 text-navy-100">
            Casi todos se pagan por descuento de planilla, sin gestión mensual de tu parte. Filtra
            por categoría o busca lo que necesitas.
          </p>
        </Container>
      </section>

      <section className="py-14 lg:py-20">
        <Container>
          <div className="mb-12 rounded-xl border border-slate-200 bg-navy-50 p-6 sm:p-7">
            <h2 className="text-lg font-bold text-navy-900">{FENAFUCH.resumen}</h2>
            <p className="mt-2 max-w-3xl text-base/7 text-slate-700">{FENAFUCH.detalle}</p>
          </div>
          <CatalogoConvenios convenios={CONVENIOS} />
        </Container>
      </section>
    </>
  );
}
