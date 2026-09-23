import type { Noticia } from '@afuch/contracts';
import { describe, expect, it } from 'vitest';
import { filtrarNoticias, leerParametrosNoticias, paginar } from './noticias';

function noticia(slug: string, fecha: string, extra: Partial<Noticia> = {}): Noticia {
  return {
    slug,
    titulo: `Título ${slug}`,
    bajada: 'Bajada',
    fecha,
    categoria: 'institucional',
    cuerpo: ['x'],
    ...extra,
  };
}

const NOTICIAS = [
  noticia('a', '2026-07-01'),
  noticia('b', '2026-09-01', { categoria: 'asamblea', titulo: 'Asamblea extraordinaria' }),
  noticia('c', '2026-08-01', { bajada: 'Nuevo convenio con una óptica' }),
];

describe('filtrarNoticias', () => {
  it('ordena de la más reciente a la más antigua', () => {
    expect(filtrarNoticias(NOTICIAS, {}).map((n) => n.slug)).toEqual(['b', 'c', 'a']);
  });

  it('filtra por categoría', () => {
    expect(filtrarNoticias(NOTICIAS, { categoria: 'asamblea' }).map((n) => n.slug)).toEqual(['b']);
  });

  it('busca en título y bajada sin importar tildes', () => {
    expect(filtrarNoticias(NOTICIAS, { busqueda: 'OPTICA' }).map((n) => n.slug)).toEqual(['c']);
    expect(filtrarNoticias(NOTICIAS, { busqueda: 'asamblea' }).map((n) => n.slug)).toEqual(['b']);
  });
});

describe('paginar', () => {
  const numeros = Array.from({ length: 20 }, (_, i) => i + 1);

  it('devuelve la página pedida', () => {
    expect(paginar(numeros, 2, 9)).toEqual({
      elementos: [10, 11, 12, 13, 14, 15, 16, 17, 18],
      pagina: 2,
      totalPaginas: 3,
    });
  });

  it('ajusta páginas fuera de rango', () => {
    expect(paginar(numeros, 99, 9).pagina).toBe(3);
    expect(paginar(numeros, -1, 9).pagina).toBe(1);
    expect(paginar(numeros, Number.NaN, 9).pagina).toBe(1);
  });

  it('con lista vacía hay una página', () => {
    expect(paginar([], 1)).toEqual({ elementos: [], pagina: 1, totalPaginas: 1 });
  });
});

describe('leerParametrosNoticias', () => {
  it('ignora una categoría desconocida', () => {
    expect(leerParametrosNoticias({ categoria: 'inventada', q: 'hola', pagina: '2' })).toEqual({
      categoria: undefined,
      busqueda: 'hola',
      pagina: 2,
    });
  });
});
