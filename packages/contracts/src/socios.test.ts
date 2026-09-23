import { describe, expect, it } from 'vitest';
import { definirContrasenaSchema, registroSchema } from './socios';

describe('registroSchema', () => {
  it('normaliza el RUT y el correo', () => {
    const resultado = registroSchema.parse({ rut: '12.345.678-5', correo: ' Socia@UChile.cl ' });
    expect(resultado).toEqual({ rut: '123456785', correo: 'socia@uchile.cl' });
  });

  it('rechaza un RUT con DV incorrecto', () => {
    expect(registroSchema.safeParse({ rut: '12.345.678-9', correo: 'a@b.cl' }).success).toBe(false);
  });

  it('rechaza un correo inválido', () => {
    expect(registroSchema.safeParse({ rut: '12.345.678-5', correo: 'no-es-correo' }).success).toBe(
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
