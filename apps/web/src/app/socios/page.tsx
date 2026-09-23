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
      titulo="Ingresa con tu RUT"
      descripcion="Revisa tus descuentos por planilla y la rendición de cuentas de la asociación."
      pie={
        <div className="space-y-2">
          <p>
            ¿Primera vez?{' '}
            <Link
              href="/socios/registro"
              className="font-semibold text-navy-600 hover:text-navy-800"
            >
              Crea tu cuenta
            </Link>
          </p>
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
