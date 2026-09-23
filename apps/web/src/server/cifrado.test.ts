// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { cifrar, descifrar, enmascararCorreo, generarToken, hashRut, hashToken } from './cifrado';

describe('cifrado', () => {
  it('descifra lo que cifra', () => {
    expect(descifrar(cifrar('PRUEBA ÑANDÚ'))).toBe('PRUEBA ÑANDÚ');
  });

  it('usa un IV distinto en cada cifrado', () => {
    expect(cifrar('x')).not.toBe(cifrar('x'));
  });

  it('detecta un valor alterado', () => {
    const [v, iv, tag, dato] = cifrar('secreto').split('.');
    const alterado = [v, iv, tag, `${dato}A`].join('.');
    expect(() => descifrar(alterado)).toThrow();
  });

  it('el hash de RUT es estable y no contiene el RUT', () => {
    expect(hashRut('111111111')).toBe(hashRut('111111111'));
    expect(hashRut('111111111')).not.toContain('11111111');
  });

  it('el hash del token coincide con el generado', () => {
    const { token, hash } = generarToken();
    expect(hashToken(token)).toBe(hash);
  });

  it('enmascara el correo', () => {
    expect(enmascararCorreo('socia@uchile.cl')).toBe('so***@uchile.cl');
  });
});
