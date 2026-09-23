import { categoriaNoticiaSchema, type CategoriaNoticia, type Noticia } from '@afuch/contracts';
import { normalizar } from './texto';

export const NOTICIAS_POR_PAGINA = 9;

export type FiltrosNoticia = { categoria?: CategoriaNoticia; busqueda?: string };

/** Más recientes primero; filtra por categoría y busca en título y bajada. */
export function filtrarNoticias(
  noticias: readonly Noticia[],
  { categoria, busqueda }: FiltrosNoticia,
): Noticia[] {
  const termino = busqueda ? normalizar(busqueda) : '';
  return noticias
    .filter((noticia) => {
      if (categoria && noticia.categoria !== categoria) return false;
      if (!termino) return true;
      return (
        normalizar(noticia.titulo).includes(termino) || normalizar(noticia.bajada).includes(termino)
      );
    })
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
}

export type Pagina<T> = { elementos: T[]; pagina: number; totalPaginas: number };

/** La página pedida se ajusta al rango válido: un enlace viejo nunca lleva a una página vacía. */
export function paginar<T>(
  elementos: readonly T[],
  pagina: number,
  porPagina = NOTICIAS_POR_PAGINA,
): Pagina<T> {
  const totalPaginas = Math.max(1, Math.ceil(elementos.length / porPagina));
  const actual = Math.min(Math.max(1, Math.trunc(pagina) || 1), totalPaginas);
  return {
    elementos: elementos.slice((actual - 1) * porPagina, actual * porPagina),
    pagina: actual,
    totalPaginas,
  };
}

/** Lee los parámetros de la URL tolerando valores inválidos (se ignoran). */
export function leerParametrosNoticias(parametros: Record<string, string | string[] | undefined>) {
  const uno = (clave: string) => {
    const valor = parametros[clave];
    return Array.isArray(valor) ? valor[0] : valor;
  };
  const categoria = categoriaNoticiaSchema.safeParse(uno('categoria'));
  return {
    categoria: categoria.success ? categoria.data : undefined,
    busqueda: uno('q')?.slice(0, 100) || undefined,
    pagina: Number(uno('pagina') ?? 1),
  };
}
