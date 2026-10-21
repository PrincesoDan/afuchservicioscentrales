import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { FormularioIngreso } from '@/components/socios/formulario-ingreso';
import { Aviso, TarjetaAcceso } from '@/components/socios/tarjeta-acceso';
import { sesion } from '@/server/auth';

export const metadata: Metadata = {
  title: 'Acceso socios',
  description: 'Ingreso al área privada de socios de AFUCH Servicios Centrales.',
  robots: { index: false },
};

type Props = { searchParams: Promise<{ sesion?: string }> };

export default async function PaginaIngresoSocios({ searchParams }: Props) {
  const actual = await sesion();
  if (actual?.usuario?.rol === 'socio') redirect('/socios/descuentos');
  const { sesion: estadoSesion } = await searchParams;

  return (
    <TarjetaAcceso
      titulo="Ingresa con tu correo"
      descripcion={
        <>
          <p>Revisa tus descuentos por planilla y la rendición de cuentas de la asociación.</p>
          {/* En soporte (oct. 2026) la mayoría de los fallos fueron personas que intentaban
              ingresar sin haber creado su cuenta, o con un correo distinto al precargado. */}
          <div className="mt-4 rounded-md border border-navy-200 bg-navy-50 p-4 text-navy-900">
            <h2 className="font-semibold">¿Es tu primera vez? Antes de ingresar:</h2>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>
                <Link
                  href="/socios/registro"
                  className="font-semibold text-navy-600 underline hover:text-navy-800"
                >
                  Crea tu cuenta
                </Link>{' '}
                con el correo que AFUCH tiene registrado para ti.
              </li>
              <li>
                Abre el mensaje que te enviaremos (revisa también spam) y define tu contraseña.
              </li>
              <li>Vuelve aquí e ingresa con ese mismo correo y tu contraseña.</li>
            </ol>
          </div>
        </>
      }
      pie={
        <div className="space-y-2">
          <p>
            <Link
              href="/socios/recuperar"
              className="font-semibold text-navy-600 hover:text-navy-800"
            >
              Olvidé mi contraseña
            </Link>
          </p>
        </div>
      }
    >
      {estadoSesion === 'expirada' ? (
        <div className="mb-6">
          <Aviso tipo="info">Tu sesión terminó. Vuelve a ingresar.</Aviso>
        </div>
      ) : null}
      <FormularioIngreso />
    </TarjetaAcceso>
  );
}
