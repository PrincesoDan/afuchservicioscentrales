// @vitest-environment node
import { db } from '@afuch/db';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { limpiarBase } from '@/test/base';
import { buzon, tokenDelUltimoCorreo } from '@/test/correos';
import { anularCuenta, cambiarHabilitacion } from './administracion';
import { hashRut } from './cifrado';
import {
  definirContrasena,
  registrar,
  socioPuedeVer,
  solicitarRecuperacion,
  verificarIngresoSocio,
} from './cuentas';
import { crearPlanillaFicticia, rutFicticio } from './fixtures/planilla-ficticia';
import { importarPlanilla } from './importacion';
import { leerPlanilla } from './planilla';

vi.mock('./correo', async (original) => ({
  ...(await original<typeof import('./correo')>()),
  enviarCorreo: vi.fn(async (correo) => {
    const { buzon } = await import('@/test/correos');
    buzon.push(correo);
  }),
}));

const IP = '203.0.113.9';
const RUT = rutFicticio('11111111');
const CORREO = 'socia@uchile.cl';
const CLAVE = 'una-clave-bien-larga';
const ADMIN = { tipo: 'ADMIN', id: 'admin-test', ip: IP } as const;

async function registrarYVerificar(correo = CORREO) {
  await registrar({ rut: RUT, correo }, IP);
  const token = tokenDelUltimoCorreo(correo);
  return definirContrasena({ token, contrasena: CLAVE }, 'VERIFICACION', IP);
}

describe('cuentas de socio', () => {
  beforeEach(async () => {
    buzon.length = 0;
    await limpiarBase();
    await importarPlanilla(await leerPlanilla(await crearPlanillaFicticia()), {
      tipo: 'SISTEMA',
      id: 'test',
    });
  });

  it('registro → verificación → ingreso', async () => {
    expect(await registrarYVerificar()).toEqual({ ok: true });
    const sesion = await verificarIngresoSocio({ rut: RUT, contrasena: CLAVE }, IP);
    expect(sesion).not.toBeNull();
    expect(await socioPuedeVer(sesion!)).toBe(true);
  });

  it('un RUT fuera de la nómina no recibe correo ni crea cuenta', async () => {
    await registrar({ rut: rutFicticio('19999999'), correo: 'otro@uchile.cl' }, IP);
    expect(buzon).toHaveLength(0);
    expect(await db().cuenta.count()).toBe(0);
  });

  it('no permite ingresar antes de verificar', async () => {
    await registrar({ rut: RUT, correo: CORREO }, IP);
    expect(await verificarIngresoSocio({ rut: RUT, contrasena: CLAVE }, IP)).toBeNull();
  });

  it('el token de verificación es de un solo uso', async () => {
    await registrar({ rut: RUT, correo: CORREO }, IP);
    const token = tokenDelUltimoCorreo(CORREO);
    await definirContrasena({ token, contrasena: CLAVE }, 'VERIFICACION', IP);
    expect(
      await definirContrasena({ token, contrasena: 'otra-clave-larga' }, 'VERIFICACION', IP),
    ).toEqual({
      ok: false,
      motivo: 'token_invalido',
    });
  });

  it('con cuenta activa, un nuevo registro no cambia el correo y avisa al registrado', async () => {
    await registrarYVerificar();
    await registrar({ rut: RUT, correo: 'intruso@example.com' }, IP);

    expect(buzon.at(-1)?.para).toBe(CORREO);
    expect(buzon.at(-1)?.asunto).toBe('Intento de registro con tu RUT');
    expect(buzon.some((c) => c.para === 'intruso@example.com')).toBe(false);
  });

  it('bloquea la cuenta tras 5 contraseñas incorrectas', async () => {
    await registrarYVerificar();
    for (let i = 0; i < 5; i += 1) {
      expect(await verificarIngresoSocio({ rut: RUT, contrasena: 'incorrecta' }, IP)).toBeNull();
    }
    expect(await verificarIngresoSocio({ rut: RUT, contrasena: CLAVE }, IP)).toBeNull();
  });

  it('recupera la contraseña por correo', async () => {
    await registrarYVerificar();
    await solicitarRecuperacion(RUT, IP);
    const token = tokenDelUltimoCorreo(CORREO);
    expect(
      await definirContrasena({ token, contrasena: 'nueva-clave-larga' }, 'RECUPERACION', IP),
    ).toEqual({ ok: true });
    expect(
      await verificarIngresoSocio({ rut: RUT, contrasena: 'nueva-clave-larga' }, IP),
    ).not.toBeNull();
  });

  it('un token de verificación no sirve para recuperación', async () => {
    await registrar({ rut: RUT, correo: CORREO }, IP);
    const token = tokenDelUltimoCorreo(CORREO);
    expect((await definirContrasena({ token, contrasena: CLAVE }, 'RECUPERACION', IP)).ok).toBe(
      false,
    );
  });

  it('un socio deshabilitado no ingresa y pierde la sesión', async () => {
    await registrarYVerificar();
    const sesion = await verificarIngresoSocio({ rut: RUT, contrasena: CLAVE }, IP);
    const socio = await db().socio.findUniqueOrThrow({ where: { rutHash: hashRut(RUT) } });

    await cambiarHabilitacion(socio.id, false, ADMIN);

    expect(await socioPuedeVer(sesion!)).toBe(false);
    expect(await verificarIngresoSocio({ rut: RUT, contrasena: CLAVE }, IP)).toBeNull();
  });

  it('anular una cuenta mata sus sesiones y permite al dueño registrarse de nuevo', async () => {
    await registrarYVerificar('intruso@example.com');
    const sesionIntruso = await verificarIngresoSocio({ rut: RUT, contrasena: CLAVE }, IP);
    const socio = await db().socio.findUniqueOrThrow({ where: { rutHash: hashRut(RUT) } });

    expect(await anularCuenta(socio.id, ADMIN)).toBe(true);
    await registrarYVerificar(CORREO);

    expect(await socioPuedeVer(sesionIntruso!)).toBe(false);
    expect(await verificarIngresoSocio({ rut: RUT, contrasena: CLAVE }, IP)).not.toBeNull();
  });

  it('no guarda RUT, nombre ni correo en claro', async () => {
    await registrarYVerificar();
    const filas = JSON.stringify(await db().socio.findMany({ include: { cuenta: true } }));
    expect(filas).not.toContain('11111111');
    expect(filas).not.toContain('PRUEBA UNO');
    expect(filas).not.toContain(CORREO);
  });
});
