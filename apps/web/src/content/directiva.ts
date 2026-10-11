export type MiembroDirectiva = {
  nombre: string;
  cargo: string;
  unidad?: string;
  /** Archivo en `public/directiva/` (WebP, cuadrado). Sin foto se muestran las iniciales. */
  foto?: { src: string; alt: string };
};

/** Periodo del directorio según el certificado de vigencia de la Dirección del Trabajo. */
export const PERIODO_DIRECTIVA = { inicio: '19 de enero de 2026', termino: '19 de enero de 2028' };

/**
 * Directorio 2026–2028, del certificado N° 1301/2026/1307 de la Dirección del
 * Trabajo. Los nombres se copian como aparecen ahí (el certificado no usa
 * tildes): no se corrigen sin confirmación de AFUCH. Faltan las fotografías.
 */
export const DIRECTIVA: readonly MiembroDirectiva[] = [
  { nombre: 'Silvia Bascuñan Silva', cargo: 'Presidencia' },
  { nombre: 'Sylvia Corina Hurtado Sandoval', cargo: 'Secretaría' },
  { nombre: 'Pamela Andrea Alfaro Parada', cargo: 'Tesorería' },
  { nombre: 'Alba Soledad Diaz Rojas', cargo: 'Directorio' },
  { nombre: 'Jorge Luis Hernandez Muñoz', cargo: 'Directorio' },
];
