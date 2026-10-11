// @vitest-environment node
import { db } from '@afuch/db';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { limpiarBase } from '@/test/base';
import { buzon, tokenDelUltimoCorreo } from '@/test/correos';
import { anularCuenta, cambiarHabilitacion } from './administracion';
import { hashRut } from './cifrado';
import { definirCorreoSocio } from './correos-socios';
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
const CLI = { tipo: 'SISTEMA', id: 'test' } as const;

async function registrarYVerificar(correo = CORREO) {
  await registrar({ correo }, IP);
  const token = tokenDelUltimoCorreo(correo);
  return definirContrasena({ token, contrasena: CLAVE }, 'VERIFICACION', IP);
}

describe('cuentas de socio', () => {
  beforeEach(async () => {
    buzon.length = 0;
    await limpiarBase();
    await importarPlanilla(await leerPlanilla(await crearPlanillaFicticia()), CLI);
    await definirCorreoSocio({ rut: RUT, correo: CORREO }, CLI);
  });

  it('registro → verificación → ingreso', async () => {
    expect(await registrarYVerificar()).toEqual({ ok: true });
    const sesion = await verificarIngresoSocio({ correo: CORREO, contrasena: CLAVE }, IP);
    expect(sesion).not.toBeNull();
    expect(await socioPuedeVer(sesion!)).toBe(true);
  });

  it('un correo que AFUCH no cargó no recibe mensaje ni crea cuenta', async () => {
    await registrar({ correo: 'otro@uchile.cl' }, IP);
    expect(buzon).toHaveLength(0);
    expect(await db().cuenta.count()).toBe(0);
  });

  it('el enlace llega al correo guardado aunque se escriba con mayúsculas o espacios', async () => {
    const { registroSchema } = await import('@afuch/contracts');
    await registrar(registroSchema.parse({ correo: '  Socia@UChile.cl ' }), IP);
    expect(buzon.at(-1)?.para).toBe(CORREO);
  });

  it('no permite ingresar antes de verificar', async () => {
    await registrar({ correo: CORREO }, IP);
    expect(await verificarIngresoSocio({ correo: CORREO, contrasena: CLAVE }, IP)).toBeNull();
  });

  it('el token de verificación es de un solo uso', async () => {
    await registrar({ correo: CORREO }, IP);
    const token = tokenDelUltimoCorreo(CORREO);
    await definirContrasena({ token, contrasena: CLAVE }, 'VERIFICACION', IP);
    expect(
      await definirContrasena({ token, contrasena: 'otra-clave-larga' }, 'VERIFICACION', IP),
    ).toEqual({
      ok: false,
      motivo: 'token_invalido',
    });
  });

  it('con cuenta activa, un nuevo registro no crea otra y solo avisa al dueño', async () => {
    await registrarYVerificar();
    await registrar({ correo: CORREO }, IP);

    expect(buzon.at(-1)?.para).toBe(CORREO);
    expect(buzon.at(-1)?.asunto).toBe('Ya tienes una cuenta de socio');
    expect(buzon.at(-1)?.texto).not.toContain('token=');
    expect(await db().cuenta.count()).toBe(1);
  });

  it('bloquea la cuenta tras 5 contraseñas incorrectas', async () => {
    await registrarYVerificar();
    for (let i = 0; i < 5; i += 1) {
      expect(
        await verificarIngresoSocio({ correo: CORREO, contrasena: 'incorrecta' }, IP),
      ).toBeNull();
    }
    expect(await verificarIngresoSocio({ correo: CORREO, contrasena: CLAVE }, IP)).toBeNull();
  });

  it('recupera la contraseña por correo', async () => {
    await registrarYVerificar();
    await solicitarRecuperacion(CORREO, IP);
    const token = tokenDelUltimoCorreo(CORREO);
    expect(
      await definirContrasena({ token, contrasena: 'nueva-clave-larga' }, 'RECUPERACION', IP),
    ).toEqual({ ok: true });
    expect(
      await verificarIngresoSocio({ correo: CORREO, contrasena: 'nueva-clave-larga' }, IP),
    ).not.toBeNull();
  });

  it('un token de verificación no sirve para recuperación', async () => {
    await registrar({ correo: CORREO }, IP);
    const token = tokenDelUltimoCorreo(CORREO);
    expect((await definirContrasena({ token, contrasena: CLAVE }, 'RECUPERACION', IP)).ok).toBe(
      false,
    );
  });

  it('un socio deshabilitado no ingresa y pierde la sesión', async () => {
    await registrarYVerificar();
    const sesion = await verificarIngresoSocio({ correo: CORREO, contrasena: CLAVE }, IP);
    const socio = await db().socio.findUniqueOrThrow({ where: { rutHash: hashRut(RUT) } });

    await cambiarHabilitacion(socio.id, false, ADMIN);

    expect(await socioPuedeVer(sesion!)).toBe(false);
    expect(await verificarIngresoSocio({ correo: CORREO, contrasena: CLAVE }, IP)).toBeNull();
  });

  it('anular una cuenta mata sus sesiones y permite registrarse de nuevo', async () => {
    await registrarYVerificar();
    const sesionAnterior = await verificarIngresoSocio({ correo: CORREO, contrasena: CLAVE }, IP);
    const socio = await db().socio.findUniqueOrThrow({ where: { rutHash: hashRut(RUT) } });

    expect(await anularCuenta(socio.id, ADMIN)).toBe(true);
    expect(await verificarIngresoSocio({ correo: CORREO, contrasena: CLAVE }, IP)).toBeNull();
    await registrarYVerificar();

    expect(await socioPuedeVer(sesionAnterior!)).toBe(false);
    expect(await verificarIngresoSocio({ correo: CORREO, contrasena: CLAVE }, IP)).not.toBeNull();
  });

  it('al corregir el correo, el anterior deja de servir y la cuenta se conserva', async () => {
    await registrarYVerificar();
    const NUEVO = 'socia.nueva@uchile.cl';

    expect(await definirCorreoSocio({ rut: RUT, correo: NUEVO }, ADMIN)).toEqual({
      ok: true,
      cambio: 'cambiado',
    });

    expect(await verificarIngresoSocio({ correo: CORREO, contrasena: CLAVE }, IP)).toBeNull();
    expect(await verificarIngresoSocio({ correo: NUEVO, contrasena: CLAVE }, IP)).not.toBeNull();
    expect(buzon.at(-1)).toMatchObject({
      para: CORREO,
      asunto: 'Cambió el correo de tu cuenta de socio',
    });
  });

  it('no guarda RUT, nombre ni correo en claro', async () => {
    await registrarYVerificar();
    const filas = JSON.stringify(await db().socio.findMany({ include: { cuenta: true } }));
    expect(filas).not.toContain('11111111');
    expect(filas).not.toContain('PRUEBA UNO');
    expect(filas).not.toContain(CORREO);
  });
});
