import { CATEGORIAS_CONVENIO, type CategoriaConvenio } from '@afuch/contracts';

/**
 * Clases completas y no interpoladas: Tailwind escanea el código fuente en
 * busca de nombres literales, así que `bg-cat-${categoria}-bg` nunca generaría
 * el CSS correspondiente.
 */
const ESTILOS: Record<CategoriaConvenio, string> = {
  salud: 'bg-cat-salud-bg text-cat-salud-fg',
  'ahorro-credito': 'bg-cat-ahorro-bg text-cat-ahorro-fg',
  solidaridad: 'bg-cat-solidaridad-bg text-cat-solidaridad-fg',
  gas: 'bg-cat-gas-bg text-cat-gas-fg',
  funeraria: 'bg-cat-funeraria-bg text-cat-funeraria-fg',
  educacion: 'bg-cat-educacion-bg text-cat-educacion-fg',
  recreacion: 'bg-cat-recreacion-bg text-cat-recreacion-fg',
  comercio: 'bg-cat-comercio-bg text-cat-comercio-fg',
};

export function ChipCategoria({ categoria }: { categoria: CategoriaConvenio }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${ESTILOS[categoria]}`}
    >
      {CATEGORIAS_CONVENIO[categoria]}
    </span>
  );
}
