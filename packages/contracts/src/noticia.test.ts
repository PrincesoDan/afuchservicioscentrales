import { describe, expect, it } from 'vitest';
import { noticiaSchema } from './noticia';

const base = {
  slug: 'a',
  titulo: 'Título',
  bajada: 'Bajada',
  fecha: '2026-11-18',
  categoria: 'comunicado',
};

describe('noticiaSchema', () => {
  it('acepta párrafos, listas y galería', () => {
    const resultado = noticiaSchema.safeParse({
      ...base,
      cuerpo: ['Párrafo', { lista: ['Uno', 'Dos'] }],
      galeria: [{ src: '/noticias/x.webp', alt: 'Foto' }],
    });
    expect(resultado.success).toBe(true);
  });

  it('rechaza listas vacías e ítems vacíos', () => {
    expect(noticiaSchema.safeParse({ ...base, cuerpo: [{ lista: [] }] }).success).toBe(false);
    expect(noticiaSchema.safeParse({ ...base, cuerpo: [{ lista: [''] }] }).success).toBe(false);
  });

  it('exige texto alternativo en las fotos de la galería', () => {
    const resultado = noticiaSchema.safeParse({
      ...base,
      cuerpo: ['x'],
      galeria: [{ src: '/noticias/x.webp', alt: '' }],
    });
    expect(resultado.success).toBe(false);
  });
});
