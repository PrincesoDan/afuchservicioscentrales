import { describe, expect, it } from 'vitest';
import {
  correoSocioSchema,
  definirContrasenaSchema,
  ingresoSocioSchema,
  registroSchema,
} from './socios';

describe('registroSchema', () => {
  it('normaliza el correo', () => {
    expect(registroSchema.parse({ correo: ' Socia@UChile.cl ' })).toEqual({
      correo: 'socia@uchile.cl',
    });
  });

  it('rechaza un correo inválido o vacío', () => {
    expect(registroSchema.safeParse({ correo: 'no-es-correo' }).success).toBe(false);
    expect(registroSchema.safeParse({ correo: '  ' }).success).toBe(false);
  });
});

describe('ingresoSocioSchema', () => {
  it('identifica al socio por su correo normalizado', () => {
    expect(ingresoSocioSchema.parse({ correo: 'SOCIA@uchile.cl', contrasena: 'x' })).toEqual({
      correo: 'socia@uchile.cl',
      contrasena: 'x',
    });
  });
});

describe('correoSocioSchema', () => {
  it('normaliza RUT y correo', () => {
    expect(correoSocioSchema.parse({ rut: '12.345.678-5', correo: ' A@B.cl' })).toEqual({
      rut: '123456785',
      correo: 'a@b.cl',
    });
  });

  it('rechaza un RUT con DV incorrecto', () => {
    expect(correoSocioSchema.safeParse({ rut: '12.345.678-9', correo: 'a@b.cl' }).success).toBe(
      false,
    );
  });
});

describe('definirContrasenaSchema', () => {
  const token = 'x'.repeat(43);

  it('acepta contraseñas iguales de 10 o más caracteres', () => {
    expect(
      definirContrasenaSchema.safeParse({
        token,
        contrasena: 'una-clave-larga',
        confirmacion: 'una-clave-larga',
      }).success,
    ).toBe(true);
  });

  it('rechaza contraseñas cortas', () => {
    expect(
      definirContrasenaSchema.safeParse({ token, contrasena: 'corta', confirmacion: 'corta' })
        .success,
    ).toBe(false);
  });

  it('marca la confirmación cuando no coincide', () => {
    const resultado = definirContrasenaSchema.safeParse({
      token,
      contrasena: 'una-clave-larga',
      confirmacion: 'otra-clave-larga',
    });
    expect(resultado.success).toBe(false);
    expect(resultado.error?.issues[0]?.path).toEqual(['confirmacion']);
  });
});
