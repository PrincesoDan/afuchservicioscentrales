import { CATEGORIAS_CONVENIO, type CategoriaConvenio, type Convenio } from '@afuch/contracts';
import { normalizar } from './texto';

export type FiltrosConvenio = {
  categoria?: CategoriaConvenio;
  busqueda?: string;
  soloGrupoFamiliar?: boolean;
};

export function filtrarConvenios(
  convenios: readonly Convenio[],
  { categoria, busqueda, soloGrupoFamiliar }: FiltrosConvenio,
): Convenio[] {
  const termino = busqueda ? normalizar(busqueda) : '';

  return convenios.filter((convenio) => {
    if (categoria && convenio.categoria !== categoria) return false;
    if (soloGrupoFamiliar && !convenio.extensivoGrupoFamiliar) return false;
    if (!termino) return true;

    return (
      normalizar(convenio.nombre).includes(termino) ||
      normalizar(convenio.resumen).includes(termino)
    );
  });
}

/**
 * Categorías presentes en el catálogo, en el orden canónico de
 * `CATEGORIAS_CONVENIO` y no en el orden en que aparecen los convenios: así los
 * chips del filtro no se reordenan cuando alguien agrega o mueve un convenio.
 *
 * El modelo admite `recreacion` y `comercio`, pero ofrecer un filtro que no
 * devuelve nada solo confunde, así que las categorías vacías no se muestran.
 */
export function categoriasConContenido(convenios: readonly Convenio[]): CategoriaConvenio[] {
  const presentes = new Set(convenios.map((convenio) => convenio.categoria));

  return (Object.keys(CATEGORIAS_CONVENIO) as CategoriaConvenio[]).filter((categoria) =>
    presentes.has(categoria),
  );
}

const FORMATO_CLP = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});

export function formatearClp(monto: number): string {
  // Intl inserta un espacio no separable tras el signo en es-CL; aquí sobra.
  return FORMATO_CLP.format(monto).replace(/\s/g, '');
}

const FORMATO_FECHA = new Intl.DateTimeFormat('es-CL', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

/**
 * Recibe una fecha ISO sin hora ("2026-07-28"). Se fuerza UTC porque
 * `new Date('2026-07-28')` se interpreta a medianoche UTC y, al formatear en la
 * zona local de Chile, retrocedería un día.
 */
export function formatearFecha(fechaIso: string): string {
  return FORMATO_FECHA.format(new Date(`${fechaIso}T00:00:00Z`));
}
