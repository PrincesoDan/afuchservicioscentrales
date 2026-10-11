import type { Metadata } from 'next';
import Image from 'next/image';
import { BotonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { EncabezadoSeccion } from '@/components/ui/encabezado-seccion';
import { ASOCIACION } from '@/content/asociacion';
import { DIRECTIVA, PERIODO_DIRECTIVA } from '@/content/directiva';
import { FENAFUCH, SEDE } from '@/content/sede';

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

/** Respaldo cuando falta la fotografía. */
function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join('');
}

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
                La asociación
              </h2>
              <div className="mt-6 space-y-5 text-base/8 text-slate-700">
                <p>
                  La {ASOCIACION.nombreLegal}, se constituyó en Santiago el{' '}
                  {ASOCIACION.constitucion}. Tiene personalidad jurídica vigente y está inscrita con
                  el N° {ASOCIACION.registro.numero} en el {ASOCIACION.registro.nombre}.
                </p>
                <ul className="list-disc space-y-2 pl-5">
                  {ASOCIACION.organizacion.map((punto) => (
                    <li key={punto}>{punto}</li>
                  ))}
                </ul>
              </div>

              <h2 className="mt-14 text-3xl font-bold tracking-tight text-balance text-navy-900">
                Para qué existimos
              </h2>
              <p className="mt-6 text-base/8 text-slate-700">
                Según sus estatutos, la asociación tiene por objeto:
              </p>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-base/8 text-slate-700">
                {ASOCIACION.objetivos.map((objetivo) => (
                  <li key={objetivo}>{objetivo}</li>
                ))}
              </ul>

              <h2 className="mt-14 text-3xl font-bold tracking-tight text-balance text-navy-900">
                Somos parte de la {FENAFUCH.nombre}
              </h2>
              <div className="mt-6 space-y-3 text-base/8 text-slate-700">
                <p>
                  {FENAFUCH.resumen} {FENAFUCH.detalle}
                </p>
                <p className="text-sm/6 text-slate-500">
                  {FENAFUCH.nombreLargo}. La asociación está afiliada a la federación desde el{' '}
                  {ASOCIACION.afiliacionFenafuch}.
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
                  Ver estatutos (PDF)
                </BotonLink>
                <p className="mt-3 text-xs/5 text-slate-500">Se abre en una pestaña nueva.</p>
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
            descripcion={`Directorio vigente entre el ${PERIODO_DIRECTIVA.inicio} y el ${PERIODO_DIRECTIVA.termino}.`}
          />

          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {DIRECTIVA.map(({ nombre, cargo, foto }) => (
              <li
                key={nombre}
                className="rounded-xl border border-slate-200 bg-white p-6 text-center"
              >
                {foto ? (
                  <Image
                    src={foto.src}
                    alt={foto.alt}
                    width={160}
                    height={160}
                    className="mx-auto mb-4 h-20 w-20 rounded-full object-cover"
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-navy-100 text-2xl font-bold text-navy-400"
                  >
                    {iniciales(nombre)}
                  </div>
                )}
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
