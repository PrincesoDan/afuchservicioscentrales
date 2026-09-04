export type MiembroDirectiva = {
  nombre: string;
  cargo: string;
  unidad?: string;
};

/**
 * Placeholder: AFUCH aún no entrega la nómina ni las fotografías de la
 * directiva. La página los muestra con aviso explícito de dato pendiente.
 */
export const DIRECTIVA: readonly MiembroDirectiva[] = [
  { nombre: 'Por confirmar', cargo: 'Presidencia' },
  { nombre: 'Por confirmar', cargo: 'Vicepresidencia' },
  { nombre: 'Por confirmar', cargo: 'Secretaría' },
  { nombre: 'Por confirmar', cargo: 'Tesorería' },
  { nombre: 'Por confirmar', cargo: 'Directorio' },
];
