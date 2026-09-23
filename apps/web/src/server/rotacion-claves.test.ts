// @vitest-environment node
import { db } from '@afuch/db';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { limpiarBase } from '@/test/base';
import { ENTORNO_TEST } from '@/test/entorno';
import { buzon, tokenDelUltimoCorreo } from '@/test/correos';
import { crearAdministrador } from './administradores';
import { descifrarCon, hashRutCon } from './cifrado';
import { definirContrasena, registrar } from './cuentas';
import { crearPlanillaFicticia, rutFicticio } from './fixtures/planilla-ficticia';
import { importarPlanilla } from './importacion';
import { leerPlanilla } from './planilla';
import { prepararClaves, rotarClaves } from './rotacion-claves';

vi.mock('./correo', async (original) => ({
  ...(await original<typeof import('./correo')>()),
  enviarCorreo: vi.fn(async (correo) => {
    const { buzon } = await import('@/test/correos');
    buzon.push(correo);
  }),
}));

const IP = '203.0.113.9';
const CORREO = 'socia@uchile.cl';
const CIFRADO_NUEVA = Buffer.alloc(32, 7).toString('base64');
const HMAC_NUEVA = Buffer.alloc(32, 8).toString('base64');
const ACTUALES = { cifradoActual: ENTORNO_TEST.CLAVE_CIFRADO, hmacActual: ENTORNO_TEST.CLAVE_HMAC };

async function instantanea() {
  return JSON.stringify([
    await db().socio.findMany({ orderBy: { id: 'asc' } }),
    await db().cuenta.findMany({ orderBy: { id: 'asc' } }),
    await db().administrador.findMany({ orderBy: { id: 'asc' } }),
  ]);
}

describe('rotación de claves', () => {
  beforeEach(async () => {
    buzon.length = 0;
    await limpiarBase();
    await importarPlanilla(await leerPlanilla(await crearPlanillaFicticia()), {
      tipo: 'SISTEMA',
      id: 'test',
    });
    await registrar({ rut: rutFicticio('11111111'), correo: CORREO }, IP);
    await definirContrasena(
      { token: tokenDelUltimoCorreo(CORREO), contrasena: 'una-clave-bien-larga' },
      'VERIFICACION',
      IP,
    );
    await crearAdministrador('admin@test.cl', 'contrasena-admin', 'test');
  });

  it('rota ambas claves y todo se lee con las nuevas', async () => {
    const claves = prepararClaves({
      ...ACTUALES,
      cifradoNueva: CIFRADO_NUEVA,
      hmacNueva: HMAC_NUEVA,
    });
    const resultado = await rotarClaves(claves, { aplicar: true, actorId: 'test' });

    expect(resultado).toEqual({
      socios: 3,
      cuentas: 1,
      administradores: 1,
      rotaCifrado: true,
      rotaHmac: true,
      aplicado: true,
    });

    const rut = rutFicticio('11111111');
    const socio = await db().socio.findUniqueOrThrow({
      where: { rutHash: hashRutCon(claves.hmacNueva, rut) },
      include: { cuenta: true },
    });
    expect(descifrarCon(claves.cifradoNueva, socio.rutCifrado)).toBe(rut);
    expect(descifrarCon(claves.cifradoNueva, socio.nombreCifrado)).toBe('PRUEBA UNO SOCIA');
    expect(descifrarCon(claves.cifradoNueva, socio.cuenta!.correoCifrado)).toBe(CORREO);
    expect(() => descifrarCon(claves.cifradoActual, socio.rutCifrado)).toThrow();

    const admin = await db().administrador.findFirstOrThrow();
    expect(descifrarCon(claves.cifradoNueva, admin.totpSecretCifrado)).toMatch(/^[A-Z2-7]+$/);

    expect(await db().registroAuditoria.count({ where: { accion: 'claves.rotadas' } })).toBe(1);
  });

  it('rota solo la clave HMAC sin tocar lo cifrado', async () => {
    const antes = await db().socio.findMany({ orderBy: { id: 'asc' } });
    const claves = prepararClaves({ ...ACTUALES, hmacNueva: HMAC_NUEVA });
    await rotarClaves(claves, { aplicar: true, actorId: 'test' });

    const despues = await db().socio.findMany({ orderBy: { id: 'asc' } });
    despues.forEach((s, i) => {
      expect(s.rutHash).not.toBe(antes[i]!.rutHash);
      expect(descifrarCon(claves.cifradoActual, s.rutCifrado)).toBe(
        descifrarCon(claves.cifradoActual, antes[i]!.rutCifrado),
      );
    });
  });

  it('sin aplicar no modifica nada', async () => {
    const antes = await instantanea();
    const resultado = await rotarClaves(
      prepararClaves({ ...ACTUALES, cifradoNueva: CIFRADO_NUEVA }),
      { aplicar: false, actorId: 'test' },
    );
    expect(resultado.aplicado).toBe(false);
    expect(await instantanea()).toBe(antes);
  });

  it('aborta sin tocar nada si la clave de cifrado actual es incorrecta', async () => {
    const antes = await instantanea();
    const claves = prepararClaves({
      cifradoActual: Buffer.alloc(32, 5).toString('base64'),
      hmacActual: ENTORNO_TEST.CLAVE_HMAC,
      cifradoNueva: CIFRADO_NUEVA,
    });
    await expect(rotarClaves(claves, { aplicar: true, actorId: 'test' })).rejects.toThrow(
      /no se pudieron descifrar/,
    );
    expect(await instantanea()).toBe(antes);
  });

  it('aborta si la clave HMAC actual no corresponde a los índices', async () => {
    const claves = prepararClaves({
      cifradoActual: ENTORNO_TEST.CLAVE_CIFRADO,
      hmacActual: Buffer.alloc(32, 5).toString('base64'),
      hmacNueva: HMAC_NUEVA,
    });
    await expect(rotarClaves(claves, { aplicar: true, actorId: 'test' })).rejects.toThrow(
      /índice de RUT/,
    );
  });
});

describe('prepararClaves', () => {
  it('exige que al menos una clave cambie', () => {
    expect(() => prepararClaves(ACTUALES)).toThrow(/distintos de los actuales/);
  });

  it('rechaza claves que no son de 32 bytes', () => {
    expect(() => prepararClaves({ ...ACTUALES, cifradoNueva: 'corta' })).toThrow(/32 bytes/);
  });

  it('rechaza usar la misma clave nueva para cifrado y HMAC', () => {
    expect(() =>
      prepararClaves({ ...ACTUALES, cifradoNueva: CIFRADO_NUEVA, hmacNueva: CIFRADO_NUEVA }),
    ).toThrow(/deben ser distintas/);
  });
});
