import { describe, expect, it } from 'vitest';
import { esRutValido, formatearRut, normalizarRut } from './rut';

describe('normalizarRut', () => {
  it('quita puntos, guiones y espacios, y deja el DV en mayúscula', () => {
    expect(normalizarRut('12.345.678-k')).toBe('12345678K');
    expect(normalizarRut('  5.126.663-3  ')).toBe('51266633');
  });
});

describe('esRutValido', () => {
  it('acepta RUTs válidos en cualquier formato', () => {
    // Casos con DV calculado a mano con el algoritmo módulo 11.
    expect(esRutValido('11.111.111-1')).toBe(true);
    expect(esRutValido('111111111')).toBe(true);
    expect(esRutValido('12345678-5')).toBe(true);
    expect(esRutValido('9.999.999-3')).toBe(true);
  });

  it('acepta DV K en mayúscula y minúscula', () => {
    expect(esRutValido('15.518.583-K')).toBe(true);
    expect(esRutValido('15518583k')).toBe(true);
  });

  it('acepta DV 0', () => {
    expect(esRutValido('12.345.675-0')).toBe(true);
  });

  it('rechaza un DV incorrecto', () => {
    expect(esRutValido('11.111.111-2')).toBe(false);
    expect(esRutValido('12345678-9')).toBe(false);
  });

  it('rechaza entradas mal formadas', () => {
    expect(esRutValido('')).toBe(false);
    expect(esRutValido('abc')).toBe(false);
    expect(esRutValido('-5')).toBe(false);
    expect(esRutValido('123')).toBe(false); // cuerpo demasiado corto
    expect(esRutValido('1234567890123-5')).toBe(false); // cuerpo demasiado largo
    expect(esRutValido('12.345.678-KK')).toBe(false);
  });
});

describe('formatearRut', () => {
  it('agrega puntos y guion', () => {
    expect(formatearRut('123456785')).toBe('12.345.678-5');
    expect(formatearRut('15518583K')).toBe('15.518.583-K');
  });

  it('formatea cuerpos de 7 dígitos', () => {
    expect(formatearRut('9999999')).toBe('999.999-9');
  });

  it('devuelve la entrada intacta si no puede formatearla', () => {
    expect(formatearRut('abc')).toBe('abc');
  });
});
