import type { Metadata } from 'next';
import Link from 'next/link';
import { FormularioRecuperar } from '@/components/socios/formulario-recuperar';
import { TarjetaAcceso } from '@/components/socios/tarjeta-acceso';

export const metadata: Metadata = { title: 'Recuperar contraseña', robots: { index: false } };

export default function PaginaRecuperar() {
  return (
    <TarjetaAcceso
      titulo="Recupera tu contraseña"
      descripcion="Ingresa tu RUT y te enviaremos un enlace al correo con que te registraste."
      pie={
        <Link href="/socios" className="font-semibold text-navy-600 hover:text-navy-800">
          Volver al ingreso
        </Link>
      }
    >
      <FormularioRecuperar />
    </TarjetaAcceso>
  );
}
