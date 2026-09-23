import type { Metadata } from 'next';
import { FormularioIngresoAdmin } from '@/components/admin/formulario-ingreso-admin';
import { TarjetaAcceso } from '@/components/socios/tarjeta-acceso';

export const metadata: Metadata = { title: 'Administración', robots: { index: false } };

export default function PaginaIngresoAdmin() {
  return (
    <TarjetaAcceso
      eyebrow="Administración"
      titulo="Ingreso de administración"
      descripcion="Solo para el equipo encargado de la carga de datos."
    >
      <FormularioIngresoAdmin />
    </TarjetaAcceso>
  );
}
