import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { SEDE } from '@/content/sede';

export const metadata: Metadata = {
  title: 'Política de privacidad',
  description:
    'Cómo AFUCH Servicios Centrales trata los datos personales de sus socias y socios, conforme a la Ley 21.719.',
};

export default function PaginaPrivacidad() {
  return (
    <section className="py-14 lg:py-20">
      <Container>
        <div className="mx-auto max-w-3xl">
          <p className="eyebrow mb-4 text-navy-600">Legal</p>
          <h1 className="text-4xl font-bold tracking-tight text-balance text-navy-900">
            Política de tratamiento de datos personales
          </h1>
          <p className="mt-5 text-lg/8 text-slate-600">
            Esta política explica qué datos recogemos a través de este sitio, para qué los usamos y
            qué derechos tienes sobre ellos, conforme a la Ley 21.719 sobre protección de datos
            personales.
          </p>

          <div className="mt-12 space-y-10">
            <Articulo titulo="Quién es responsable">
              <p>
                {SEDE.nombre} es el responsable del tratamiento de los datos personales recogidos a
                través de este sitio. Puedes contactarnos en{' '}
                <a href={`mailto:${SEDE.email}`} className="font-semibold text-navy-600 underline underline-offset-2">
                  {SEDE.email}
                </a>
                .
              </p>
            </Articulo>

            <Articulo titulo="Qué datos recogemos">
              <p>
                A través del formulario de contacto recogemos tu nombre, tu correo electrónico y el
                contenido de tu mensaje. Opcionalmente, si decides entregarlos, tu RUT y tu unidad o
                facultad.
              </p>
              <p>
                No usamos cookies de seguimiento ni herramientas de analítica de terceros en la
                sección pública de este sitio.
              </p>
            </Articulo>

            <Articulo titulo="Para qué los usamos">
              <p>
                Únicamente para responder la consulta que nos envías y, cuando corresponda, para
                gestionar tu afiliación o tu solicitud sobre un convenio. No cedemos tus datos a
                terceros ni los usamos con fines distintos de aquel para el que los entregaste.
              </p>
            </Articulo>

            <Articulo titulo="Cuánto los conservamos">
              <p>
                Los mensajes enviados por el formulario de contacto llegan a nuestro correo
                institucional y se conservan solo el tiempo necesario para resolver la consulta.
                Este sitio no almacena los mensajes en una base de datos.
              </p>
            </Articulo>

            <Articulo titulo="Datos sensibles">
              <p>
                La información sobre afiliación sindical y sobre descuentos por planilla constituye
                dato personal sensible bajo la Ley 21.719. Ese tipo de información no se recoge ni
                se muestra en la sección pública de este sitio: vivirá exclusivamente en el área
                privada de socios, protegida por autenticación y cifrado.
              </p>
            </Articulo>

            <Articulo titulo="Tus derechos">
              <p>
                Puedes solicitar en cualquier momento el acceso, la rectificación, la supresión o la
                portabilidad de tus datos, así como oponerte a su tratamiento. Para ejercer
                cualquiera de estos derechos, escríbenos a{' '}
                <a href={`mailto:${SEDE.email}`} className="font-semibold text-navy-600 underline underline-offset-2">
                  {SEDE.email}
                </a>{' '}
                o a través del{' '}
                <Link href="/contacto" className="font-semibold text-navy-600 underline underline-offset-2">
                  formulario de contacto
                </Link>
                .
              </p>
            </Articulo>

            <Articulo titulo="Seguridad">
              <p>
                El sitio opera sobre conexión cifrada (HTTPS). Los datos sensibles del área privada
                de socios se almacenarán cifrados, con registro de accesos y respaldo automático
                diario, según el estándar que exige la Ley 21.719.
              </p>
            </Articulo>
          </div>

          <p className="mt-14 border-t border-slate-200 pt-8 text-sm text-slate-500">
            Última actualización: septiembre de 2026. Documento en revisión, sujeto a validación
            legal antes de la puesta en producción.
          </p>
        </div>
      </Container>
    </section>
  );
}

function Articulo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-navy-900">{titulo}</h2>
      <div className="mt-3 space-y-4 text-base/8 text-slate-700">{children}</div>
    </div>
  );
}
