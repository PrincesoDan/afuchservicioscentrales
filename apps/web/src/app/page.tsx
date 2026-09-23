import Image from 'next/image';
import Link from 'next/link';
import { TarjetaConvenio } from '@/components/tarjeta-convenio';
import { TarjetaNoticia } from '@/components/tarjeta-noticia';
import { BotonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { EncabezadoSeccion } from '@/components/ui/encabezado-seccion';
import { CONVENIOS } from '@/content/convenios';
import { NOTICIAS } from '@/content/noticias';
import { formatearClp } from '@/lib/convenios';

const destacados = CONVENIOS.filter((convenio) => convenio.destacado);
const ultimasNoticias = [...NOTICIAS].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 3);

const fondoSolidario = CONVENIOS.find((convenio) => convenio.slug === 'fondo-solidario');

const CIFRAS = [
  { valor: `${CONVENIOS.length}`, etiqueta: 'convenios vigentes' },
  { valor: '9', etiqueta: 'bonos del Fondo Solidario' },
  { valor: '0,8%', etiqueta: 'del sueldo base para aportar' },
  { valor: '$0', etiqueta: 'de interés en el préstamo solidario' },
] as const;

export default function PaginaInicio() {
  return (
    <>
      <section className="relative overflow-hidden bg-navy-800 text-white">
        {/* Trama sutil que evita que el azul plano se lea como un bloque vacío. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />

        <Container className="relative py-20 lg:py-28">
          <div className="grid items-center gap-14 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="eyebrow mb-5 text-gold-500">Universidad de Chile</p>
              <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                La asociación de quienes hacen andar la Universidad
              </h1>
              <p className="mt-6 max-w-xl text-lg/8 text-navy-100">
                Somos AFUCH Servicios Centrales. Negociamos convenios, sostenemos un fondo solidario
                y acompañamos a las trabajadoras y trabajadores de la Casa de Bello en lo cotidiano
                y en lo difícil.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <BotonLink href="/beneficios" variante="sobreOscuro">
                  Ver convenios y beneficios
                </BotonLink>
                <BotonLink href="/contacto" variante="fantasma">
                  Quiero afiliarme
                </BotonLink>
              </div>
            </div>

            <div className="hidden justify-center lg:flex">
              <Image
                src="/logos/logo-blanco.webp"
                alt=""
                aria-hidden="true"
                width={640}
                height={640}
                priority
                className="h-auto w-full max-w-sm opacity-95"
              />
            </div>
          </div>
        </Container>

        <div className="relative border-t border-white/10">
          <Container>
            <dl className="grid grid-cols-2 gap-y-8 py-10 lg:grid-cols-4">
              {CIFRAS.map(({ valor, etiqueta }) => (
                <div key={etiqueta}>
                  <dt className="sr-only">{etiqueta}</dt>
                  <dd>
                    <span className="block text-3xl font-bold text-gold-500">{valor}</span>
                    <span className="mt-1 block text-sm text-navy-100">{etiqueta}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </Container>
        </div>
      </section>

      <section className="py-20 lg:py-24">
        <Container>
          <EncabezadoSeccion
            eyebrow="Beneficios destacados"
            titulo="Lo que ganas por estar afiliado"
            descripcion="Convenios negociados en conjunto, descontados por planilla y sin trámites que tengas que repetir cada mes."
          >
            <BotonLink href="/beneficios" variante="secundario">
              Ver los {CONVENIOS.length} convenios
            </BotonLink>
          </EncabezadoSeccion>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {destacados.map((convenio) => (
              <TarjetaConvenio key={convenio.slug} convenio={convenio} />
            ))}
          </div>
        </Container>
      </section>

      {fondoSolidario ? (
        <section className="bg-navy-900 py-20 text-white lg:py-24">
          <Container>
            <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <p className="eyebrow mb-4 text-gold-500">Fondo Solidario</p>
                <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
                  Un 0,8% del sueldo base que vuelve cuando más se necesita
                </h2>
                <p className="mt-5 text-base/7 text-navy-100">{fondoSolidario.descripcion}</p>
                <p className="mt-5 text-base/7 text-navy-100">
                  Incluye además asesoría legal gratuita en causas laborales y un bono de invierno
                  anual, sujeto a disponibilidad de fondos.
                </p>
                <BotonLink
                  href={`/beneficios/${fondoSolidario.slug}`}
                  variante="sobreOscuro"
                  className="mt-8"
                >
                  Conocer el Fondo Solidario
                </BotonLink>
              </div>

              <div className="rounded-xl border border-white/15 bg-white/5 p-6 sm:p-8">
                <h3 className="eyebrow mb-6 text-gold-500">Bonos de ayuda directa</h3>
                <dl className="divide-y divide-white/10">
                  {fondoSolidario.montos?.map(({ concepto, monto }) => (
                    <div key={concepto} className="flex items-baseline justify-between gap-6 py-3">
                      <dt className="text-sm text-navy-100">{concepto}</dt>
                      <dd className="shrink-0 text-base font-bold text-white tabular-nums">
                        {formatearClp(monto)}
                      </dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-6 text-xs/5 text-navy-200">{fondoSolidario.notaMontos}</p>
              </div>
            </div>
          </Container>
        </section>
      ) : null}

      <section className="py-20 lg:py-24">
        <Container>
          <EncabezadoSeccion
            eyebrow="Noticias"
            titulo="Lo último de la asociación"
            descripcion="Lo que se está negociando, lo que se acordó y lo que viene."
          >
            <BotonLink href="/noticias" variante="secundario">
              Ver todas
            </BotonLink>
          </EncabezadoSeccion>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ultimasNoticias.map((noticia) => (
              <TarjetaNoticia key={noticia.slug} noticia={noticia} />
            ))}
          </div>
        </Container>
      </section>

      <section className="border-t border-slate-200 bg-navy-50 py-20 lg:py-24">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-balance text-navy-900 sm:text-4xl">
              ¿Todavía no eres parte?
            </h2>
            <p className="mt-5 text-base/7 text-slate-600">
              Afiliarte toma poco y te abre los {CONVENIOS.length} convenios, el Fondo Solidario y
              el respaldo de una organización que negocia en nombre de todas y todos.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <BotonLink href="/contacto">Quiero afiliarme</BotonLink>
              <Link
                href="/quienes-somos"
                className="inline-flex items-center px-5 py-3 text-sm font-semibold text-navy-800 underline underline-offset-4 hover:text-navy-600"
              >
                Conocer la asociación
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
