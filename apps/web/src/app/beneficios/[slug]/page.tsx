import { CATEGORIAS_CONVENIO } from '@afuch/contracts';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BotonLink } from '@/components/ui/button';
import { ChipCategoria } from '@/components/ui/chip-categoria';
import { Container } from '@/components/ui/container';
import { CONVENIOS } from '@/content/convenios';
import { formatearClp } from '@/lib/convenios';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return CONVENIOS.map((convenio) => ({ slug: convenio.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const convenio = CONVENIOS.find((item) => item.slug === slug);
  if (!convenio) return { title: 'Convenio no encontrado' };

  return { title: convenio.nombre, description: convenio.resumen };
}

export default async function PaginaConvenio({ params }: Props) {
  const { slug } = await params;
  const convenio = CONVENIOS.find((item) => item.slug === slug);
  if (!convenio) notFound();

  const relacionados = CONVENIOS.filter(
    (item) => item.categoria === convenio.categoria && item.slug !== convenio.slug,
  ).slice(0, 3);

  return (
    <>
      <section className="border-b border-slate-200 bg-navy-50 py-12 lg:py-16">
        <Container>
          <Link
            href="/beneficios"
            className="mb-8 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-600 hover:text-navy-800"
          >
            <span aria-hidden="true">←</span> Volver a convenios
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <ChipCategoria categoria={convenio.categoria} />
            {convenio.extensivoGrupoFamiliar ? (
              <span className="inline-flex items-center rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                Extensivo al grupo familiar
              </span>
            ) : null}
            {convenio.vigencia === 'permanente' ? (
              <span className="inline-flex items-center rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                Vigencia permanente
              </span>
            ) : null}
          </div>

          <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight text-balance text-navy-900 sm:text-5xl">
            {convenio.nombre}
          </h1>
          <p className="mt-5 max-w-2xl text-lg/8 text-slate-600">{convenio.resumen}</p>
        </Container>
      </section>

      <section className="py-14 lg:py-20">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[1.35fr_0.65fr]">
            <div>
              <p className="text-base/8 text-slate-700">{convenio.descripcion}</p>

              <h2 className="mt-12 text-xl font-bold text-navy-900">Qué incluye</h2>
              <ul className="mt-5 space-y-3">
                {convenio.beneficios.map((beneficio) => (
                  <li key={beneficio} className="flex gap-3 text-base/7 text-slate-700">
                    <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" />
                    {beneficio}
                  </li>
                ))}
              </ul>

              {convenio.montos ? (
                <>
                  <h2 className="mt-12 text-xl font-bold text-navy-900">Montos</h2>
                  <div className="mt-5 overflow-x-auto">
                    <table className="w-full min-w-md border-collapse text-left">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th scope="col" className="py-3 pr-4 text-sm font-semibold text-navy-900">
                            Concepto
                          </th>
                          <th scope="col" className="py-3 text-right text-sm font-semibold text-navy-900">
                            Monto
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {convenio.montos.map(({ concepto, monto }) => (
                          <tr key={concepto} className="border-b border-slate-100">
                            <td className="py-3 pr-4 text-sm text-slate-700">{concepto}</td>
                            <td className="py-3 text-right text-sm font-bold tabular-nums text-navy-900">
                              {formatearClp(monto)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : null}

              {convenio.notaMontos ? (
                <p className="mt-5 rounded-lg border border-gold-500/30 bg-gold-100/50 p-4 text-sm/6 text-gold-700">
                  {convenio.notaMontos}
                </p>
              ) : null}
            </div>

            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="eyebrow mb-4 text-navy-600">Cómo acceder</h2>
                <p className="text-sm/6 text-slate-700">{convenio.formaDeAcceso}</p>

                {convenio.formaDePago ? (
                  <>
                    <h3 className="eyebrow mt-7 mb-3 text-navy-600">Forma de pago</h3>
                    <p className="text-sm/6 text-slate-700">{convenio.formaDePago}</p>
                  </>
                ) : null}

                <BotonLink href="/contacto" className="mt-7 w-full">
                  Consultar por este convenio
                </BotonLink>
              </div>
            </aside>
          </div>

          {relacionados.length > 0 ? (
            <div className="mt-20 border-t border-slate-200 pt-12">
              <h2 className="text-xl font-bold text-navy-900">
                Otros convenios de {CATEGORIAS_CONVENIO[convenio.categoria].toLowerCase()}
              </h2>
              <ul className="mt-6 grid gap-4 sm:grid-cols-3">
                {relacionados.map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={`/beneficios/${item.slug}`}
                      className="block rounded-lg border border-slate-200 p-5 transition-colors hover:border-navy-200 hover:bg-navy-50"
                    >
                      <span className="font-semibold text-navy-900">{item.nombre}</span>
                      <span className="mt-1.5 block text-sm/6 text-slate-600">{item.resumen}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Container>
      </section>
    </>
  );
}
