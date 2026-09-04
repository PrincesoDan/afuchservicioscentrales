import type { Metadata } from 'next';
import { BotonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';

export const metadata: Metadata = {
  title: 'Acceso socios',
  description: 'El área privada de socios de AFUCH Servicios Centrales estará disponible pronto.',
};

const VISTAS = [
  {
    titulo: 'Mis descuentos',
    detalle: 'El detalle mensual de lo que se te descuenta por planilla, con historial y descarga.',
  },
  {
    titulo: 'Rendición de cuentas',
    detalle: 'Estados financieros, balances y documentos publicados por la asociación.',
  },
  {
    titulo: 'Mis datos',
    detalle: 'Tus datos de contacto, editables por ti mismo cuando cambien.',
  },
] as const;

export default function PaginaSocios() {
  return (
    <section className="bg-navy-800 py-20 text-white lg:py-28">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow mb-4 text-gold-500">Área privada</p>
          <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            El acceso de socios llega pronto
          </h1>
          <p className="mt-6 text-lg/8 text-navy-100">
            Estamos construyendo un espacio privado y seguro donde cada socio podrá revisar su
            información individual. El ingreso será con tu RUT, validado contra la nómina de socios
            habilitados.
          </p>
        </div>

        <ul className="mx-auto mt-16 grid max-w-4xl gap-6 sm:grid-cols-3">
          {VISTAS.map(({ titulo, detalle }) => (
            <li key={titulo} className="rounded-xl border border-white/15 bg-white/5 p-6">
              <h2 className="text-lg font-bold text-white">{titulo}</h2>
              <p className="mt-2.5 text-sm/6 text-navy-100">{detalle}</p>
            </li>
          ))}
        </ul>

        <div className="mt-14 text-center">
          <BotonLink href="/contacto" variante="sobreOscuro">
            Consultar por mi afiliación
          </BotonLink>
        </div>
      </Container>
    </section>
  );
}
