import type { Metadata } from 'next';
import Link from 'next/link';
import { FormularioContrasena } from '@/components/socios/formulario-contrasena';
import { Aviso, TarjetaAcceso } from '@/components/socios/tarjeta-acceso';

export const metadata: Metadata = { title: 'Confirmar cuenta', robots: { index: false } };

type Props = { searchParams: Promise<{ token?: string }> };

export default async function Pagina({ searchParams }: Props) {
  const { token } = await searchParams;

  return (
    <TarjetaAcceso
      titulo="Confirma tu cuenta"
      descripcion="Define la contraseña con la que ingresarás al área de socios."
    >
      {token ? (
        <FormularioContrasena token={token} tipo="verificacion" />
      ) : (
        <Aviso tipo="error">
          Falta el enlace del correo.{' '}
          <Link href="/socios/recuperar" className="font-semibold underline">
            Solicita uno nuevo
          </Link>
          .
        </Aviso>
      )}
    </TarjetaAcceso>
  );
}
