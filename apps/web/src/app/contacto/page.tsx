import type { Metadata } from 'next';
import { FormularioContacto } from '@/components/formulario-contacto';
import { Container } from '@/components/ui/container';
import { SEDE } from '@/content/sede';

export const metadata: Metadata = {
  title: 'Contacto',
  description:
    'Escríbenos para consultar por convenios, afiliarte o resolver dudas sobre tus descuentos por planilla.',
};

export default function PaginaContacto() {
  return (
    <>
      <section className="bg-navy-800 py-16 text-white lg:py-20">
        <Container>
          <p className="eyebrow mb-4 text-gold-500">Contacto</p>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            Conversemos
          </h1>
          <p className="mt-5 max-w-2xl text-lg/8 text-navy-100">
            ¿Quieres afiliarte, consultar por un convenio o revisar un descuento? Escríbenos y te
            respondemos.
          </p>
        </Container>
      </section>

      <section className="py-14 lg:py-20">
        <Container>
          <div className="grid gap-14 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <h2 className="text-2xl font-bold text-navy-900">Envíanos un mensaje</h2>
              <p className="mt-3 mb-9 text-base/7 text-slate-600">
                Los campos marcados con <span className="text-red-600">*</span> son obligatorios.
              </p>
              <FormularioContacto />
            </div>

            <aside className="space-y-8">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-6">
                <h2 className="eyebrow mb-4 text-navy-600">La sede</h2>
                <address className="space-y-3 text-sm/6 not-italic text-slate-700">
                  <p>{SEDE.direccion}</p>
                  <p>
                    <a
                      href={`tel:${SEDE.telefono.replace(/\s/g, '')}`}
                      className="font-semibold text-navy-600 hover:text-navy-800"
                    >
                      {SEDE.telefono}
                    </a>
                  </p>
                  <p>
                    <a
                      href={`mailto:${SEDE.email}`}
                      className="font-semibold text-navy-600 hover:text-navy-800"
                    >
                      {SEDE.email}
                    </a>
                  </p>
                </address>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-6">
                <h2 className="eyebrow mb-4 text-navy-600">Horarios de atención</h2>
                <dl className="space-y-3 text-sm/6">
                  {SEDE.horarios.map(({ dias, horario }) => (
                    <div key={dias} className="flex justify-between gap-4">
                      <dt className="text-slate-600">{dias}</dt>
                      <dd className="font-semibold text-navy-900">{horario}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {SEDE.pendientesDeConfirmacion ? (
                <p className="rounded-lg border border-gold-500/40 bg-gold-100/50 p-4 text-xs/5 text-gold-700">
                  Dirección, teléfono, correo y horarios son datos de referencia a la espera de
                  confirmación de AFUCH Servicios Centrales.
                </p>
              ) : null}
            </aside>
          </div>
        </Container>
      </section>
    </>
  );
}
