import type { Metadata } from 'next';
import { BotonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { EncabezadoSeccion } from '@/components/ui/encabezado-seccion';
import { DIRECTIVA } from '@/content/directiva';
import { SEDE } from '@/content/sede';

export const metadata: Metadata = {
  title: 'Quiénes somos',
  description:
    'Historia, misión y directiva de AFUCH Servicios Centrales, la asociación de funcionarias y funcionarios de la Universidad de Chile.',
};

const PRINCIPIOS = [
  {
    titulo: 'Negociación colectiva',
    detalle:
      'Lo que una persona no consigue sola, lo consigue una organización. Cada convenio de este sitio existe porque se negoció en conjunto.',
  },
  {
    titulo: 'Solidaridad concreta',
    detalle:
      'El Fondo Solidario no es un principio abstracto: es dinero que llega cuando nace un hijo, cuando alguien enferma o cuando falta un familiar.',
  },
  {
    titulo: 'Transparencia',
    detalle:
      'Las cuentas de la asociación se rinden a sus socios, no solo a quienes asisten a la asamblea.',
  },
] as const;

export default function PaginaQuienesSomos() {
  return (
    <>
      <section className="bg-navy-800 py-16 text-white lg:py-20">
        <Container>
          <p className="eyebrow mb-4 text-gold-500">Quiénes somos</p>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            Una organización de trabajadoras y trabajadores de la Casa de Bello
          </h1>
          <p className="mt-5 max-w-2xl text-lg/8 text-navy-100">{SEDE.nombreLargo}</p>
        </Container>
      </section>

      <section className="py-16 lg:py-24">
        <Container>
          <div className="grid gap-14 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-balance text-navy-900">
                Nuestra historia
              </h2>
              <div className="mt-6 space-y-5 text-base/8 text-slate-700">
                <p className="rounded-lg border border-dashed border-gold-500/50 bg-gold-100/40 p-5 text-sm/7 text-gold-700">
                  <strong className="font-semibold">Contenido pendiente.</strong> AFUCH Servicios
                  Centrales aún no entrega el texto de historia y misión institucional. Este bloque
                  queda maquetado y listo para recibirlo.
                </p>
                <p>
                  AFUCH Servicios Centrales agrupa a las funcionarias y funcionarios que sostienen
                  el funcionamiento administrativo de la Universidad de Chile. Su tarea es
                  representar sus intereses ante la institución, negociar beneficios colectivos y
                  administrar un fondo solidario que responde en los momentos difíciles.
                </p>
              </div>

              <h2 className="mt-14 text-3xl font-bold tracking-tight text-balance text-navy-900">
                En qué creemos
              </h2>
              <ul className="mt-6 space-y-6">
                {PRINCIPIOS.map(({ titulo, detalle }) => (
                  <li key={titulo} className="border-l-2 border-gold-500 pl-5">
                    <h3 className="font-bold text-navy-900">{titulo}</h3>
                    <p className="mt-1.5 text-base/7 text-slate-600">{detalle}</p>
                  </li>
                ))}
              </ul>
            </div>

            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="rounded-xl border border-slate-200 bg-navy-50 p-7">
                <h2 className="text-xl font-bold text-navy-900">Estatutos</h2>
                <p className="mt-3 text-sm/7 text-slate-600">
                  Las reglas que rigen la asociación: quiénes pueden afiliarse, cómo se elige la
                  directiva y cómo se administran los fondos.
                </p>
                <BotonLink
                  href={SEDE.estatutosUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 w-full"
                >
                  Ver estatutos
                </BotonLink>
                <p className="mt-3 text-xs/5 text-slate-500">
                  Se abre en Scribd, en una pestaña nueva. Cuando AFUCH entregue el PDF, pasará a
                  ser descarga directa desde este sitio.
                </p>
              </div>
            </aside>
          </div>
        </Container>
      </section>

      <section className="border-t border-slate-200 bg-slate-50 py-16 lg:py-24">
        <Container>
          <EncabezadoSeccion
            eyebrow="Directiva"
            titulo="Quiénes nos representan"
            descripcion="La directiva vigente de AFUCH Servicios Centrales."
          />

          <p className="mb-8 rounded-lg border border-dashed border-gold-500/50 bg-gold-100/40 p-5 text-sm/7 text-gold-700">
            <strong className="font-semibold">Contenido pendiente.</strong> Faltan los nombres,
            cargos y fotografías de la directiva actual. La grilla queda lista para recibirlos.
          </p>

          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {DIRECTIVA.map(({ nombre, cargo }) => (
              <li key={cargo} className="rounded-xl border border-slate-200 bg-white p-6 text-center">
                <div
                  aria-hidden="true"
                  className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-navy-100 text-2xl font-bold text-navy-400"
                >
                  ?
                </div>
                <p className="font-bold text-navy-900">{nombre}</p>
                <p className="mt-1 text-sm text-slate-600">{cargo}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
