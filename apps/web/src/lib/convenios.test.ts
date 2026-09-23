import type { Convenio } from '@afuch/contracts';
import { describe, expect, it } from 'vitest';
import {
  categoriasConContenido,
  filtrarConvenios,
  formatearClp,
  formatearFecha,
} from './convenios';

function convenio(parcial: Partial<Convenio> & Pick<Convenio, 'slug'>): Convenio {
  return {
    nombre: 'Convenio de prueba',
    categoria: 'salud',
    resumen: 'Resumen de prueba',
    descripcion: 'Descripción de prueba',
    beneficios: ['Un beneficio'],
    formaDeAcceso: 'Solicítalo en AFUCH',
    extensivoGrupoFamiliar: false,
    destacado: false,
    vigencia: 'permanente',
    ...parcial,
  };
}

const catalogo: Convenio[] = [
  convenio({
    slug: 'optica',
    nombre: 'Óptica Bethel',
    categoria: 'salud',
    extensivoGrupoFamiliar: true,
  }),
  convenio({
    slug: 'gas',
    nombre: 'Vales Abastible',
    categoria: 'gas',
    resumen: 'Balones de gas más baratos',
  }),
  convenio({
    slug: 'fondo',
    nombre: 'Fondo Solidario',
    categoria: 'solidaridad',
    extensivoGrupoFamiliar: true,
  }),
];

describe('filtrarConvenios', () => {
  it('sin filtros devuelve el catálogo completo', () => {
    expect(filtrarConvenios(catalogo, {})).toHaveLength(3);
  });

  it('filtra por categoría', () => {
    const resultado = filtrarConvenios(catalogo, { categoria: 'gas' });
    expect(resultado.map((c) => c.slug)).toEqual(['gas']);
  });

  it('busca por nombre sin distinguir mayúsculas ni tildes', () => {
    expect(filtrarConvenios(catalogo, { busqueda: 'optica' }).map((c) => c.slug)).toEqual([
      'optica',
    ]);
    expect(filtrarConvenios(catalogo, { busqueda: 'ÓPTICA' }).map((c) => c.slug)).toEqual([
      'optica',
    ]);
  });

  it('busca también en el resumen', () => {
    expect(filtrarConvenios(catalogo, { busqueda: 'balones' }).map((c) => c.slug)).toEqual(['gas']);
  });

  it('filtra por cobertura de grupo familiar', () => {
    const resultado = filtrarConvenios(catalogo, { soloGrupoFamiliar: true });
    expect(resultado.map((c) => c.slug)).toEqual(['optica', 'fondo']);
  });

  it('combina categoría y búsqueda', () => {
    expect(filtrarConvenios(catalogo, { categoria: 'salud', busqueda: 'abastible' })).toEqual([]);
  });

  it('ignora espacios sobrantes en la búsqueda', () => {
    expect(filtrarConvenios(catalogo, { busqueda: '   fondo  ' }).map((c) => c.slug)).toEqual([
      'fondo',
    ]);
  });
});

describe('categoriasConContenido', () => {
  it('devuelve solo las categorías que tienen al menos un convenio', () => {
    expect(categoriasConContenido(catalogo)).toEqual(['salud', 'solidaridad', 'gas']);
  });

  it('devuelve vacío para un catálogo vacío', () => {
    expect(categoriasConContenido([])).toEqual([]);
  });
});

describe('formatearClp', () => {
  it('formatea montos con separador de miles y signo peso', () => {
    expect(formatearClp(25000)).toBe('$25.000');
    expect(formatearClp(100000)).toBe('$100.000');
    expect(formatearClp(9900)).toBe('$9.900');
  });

  it('no muestra decimales', () => {
    expect(formatearClp(60000)).toBe('$60.000');
  });
});

describe('formatearFecha', () => {
  it('escribe la fecha en español sin desplazarse por zona horaria', () => {
    expect(formatearFecha('2026-07-28')).toBe('28 de julio de 2026');
    expect(formatearFecha('2026-01-01')).toBe('1 de enero de 2026');
  });
});
