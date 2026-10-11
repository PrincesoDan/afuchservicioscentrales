import type { Metadata } from 'next';
import Link from 'next/link';
import { FormularioRegistro } from '@/components/socios/formulario-registro';
import { TarjetaAcceso } from '@/components/socios/tarjeta-acceso';
import { SEDE } from '@/content/sede';

export const metadata: Metadata = { title: 'Crear cuenta de socio', robots: { index: false } };

export default function PaginaRegistro() {
  return (
    <TarjetaAcceso
      titulo="Crea tu cuenta"
      descripcion={
        <p>
          Solo pueden registrarse socias y socios de AFUCH Servicios Centrales, con el correo que la
          asociación tiene registrado. Te enviaremos un mensaje para confirmar la cuenta y definir
          tu contraseña.
        </p>
      }
      pie={
        <div className="space-y-2">
          <p>
            ¿Ya tienes cuenta?{' '}
            <Link href="/socios" className="font-semibold text-navy-600 hover:text-navy-800">
              Ingresa
            </Link>
          </p>
          <p className="text-xs/5 text-slate-500">
            Si no te llega el mensaje o cambiaste de correo, escríbenos a{' '}
            <a href={`mailto:${SEDE.email}`} className="font-semibold text-navy-600">
              {SEDE.email}
            </a>
            .
          </p>
        </div>
      }
    >
      <FormularioRegistro />
    </TarjetaAcceso>
  );
}
