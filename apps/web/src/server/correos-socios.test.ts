// @vitest-environment node
import { formatearRut } from '@afuch/contracts';
import { db } from '@afuch/db';
import ExcelJS from 'exceljs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { limpiarBase } from '@/test/base';
import { buzon, tokenDelUltimoCorreo } from '@/test/correos';
import { listarSocios } from './administracion';
import { descifrar, hashRut } from './cifrado';
import {
  aplicarCorreos,
  definirCorreoSocio,
  leerListaCorreos,
  previsualizarCorreos,
} from './correos-socios';
import { definirContrasena, registrar, verificarIngresoSocio } from './cuentas';
import {
  crearListaCorreosFicticia,
  crearPlanillaFicticia,
  rutFicticio,
} from './fixtures/planilla-ficticia';
import { importarPlanilla } from './importacion';
import { leerPlanilla } from './planilla';

vi.mock('./correo', async (original) => ({
  ...(await original<typeof import('./correo')>()),
  enviarCorreo: vi.fn(async (correo) => {
    const { buzon } = await import('@/test/correos');
    buzon.push(correo);
  }),
}));

const CLI = { tipo: 'SISTEMA', id: 'test' } as const;
const IP = '203.0.113.9';
const UNO = rutFicticio('11111111');
const DOS = rutFicticio('12222222');
const TRES = rutFicticio('13333333');

const socioDe = (rut: string) =>
  db().socio.findUniqueOrThrow({ where: { rutHash: hashRut(rut) }, include: { cuenta: true } });

describe('leerListaCorreos', () => {
  it('lee RUT y correo en distintos formatos y los normaliza', async () => {
    const lectura = await leerListaCorreos(
      await crearListaCorreosFicticia([
        { rut: formatearRut(UNO), correo: ' Uno@UChile.cl ' },
        { rut: `${DOS.slice(0, -1)}-${DOS.slice(-1)}`, correo: 'dos@uchile.cl' },
        { rut: TRES, correo: null },
      ]),
    );
    expect(lectura.errores).toEqual([]);
    expect(lectura.filas).toEqual([
      { fila: 2, rut: UNO, correo: 'uno@uchile.cl' },
      { fila: 3, rut: DOS, correo: 'dos@uchile.cl' },
    ]);
    expect(lectura).toMatchObject({ filasLeidas: 3, sinCorreo: 1 });
  });

  it('acepta un título sobre los encabezados y otros nombres de columna', async () => {
    const lectura = await leerListaCorreos(
      await crearListaCorreosFicticia([{ rut: UNO, correo: 'uno@uchile.cl' }], {
        titulo: 'Correos validados',
        encabezados: ['Nombre', 'rut', 'Correo electrónico'],
      }),
    );
    expect(lectura.errores).toEqual([]);
    expect(lectura.filas).toHaveLength(1);
  });

  it('junta el RUT con la columna DV cuando el dígito verificador viene aparte', async () => {
    const libro = new ExcelJS.Workbook();
    const hoja = libro.addWorksheet('Hoja1');
    hoja.addRow(['RUTDV', 'RUT', 'DV', 'NOMBRE', 'CORREO']);
    for (const [rut, correo] of [
      [UNO, 'uno@uchile.cl'],
      [DOS, 'dos@uchile.cl'],
    ] as const) {
      hoja.addRow([Number(rut), Number(rut.slice(0, -1)), rut.slice(-1), 'PRUEBA', correo]);
    }
    const lectura = await leerListaCorreos(Buffer.from(await libro.xlsx.writeBuffer()));
    expect(lectura.errores).toEqual([]);
    expect(lectura.filas.map((f) => f.rut)).toEqual([UNO, DOS]);
  });

  it('informa los errores por número de fila, sin datos personales', async () => {
    const lectura = await leerListaCorreos(
      await crearListaCorreosFicticia([
        { rut: '11.111.111-9', correo: 'uno@uchile.cl' },
        { rut: DOS, correo: 'no-es-correo' },
        { rut: TRES, correo: 'tres@uchile.cl' },
        { rut: TRES, correo: 'otro@uchile.cl' },
        { rut: UNO, correo: 'tres@uchile.cl' },
      ]),
    );
    expect(lectura.errores).toEqual([
      'Fila 2: el RUT no es válido.',
      'Fila 3: el correo no es válido.',
      'Fila 5: el mismo RUT aparece en la fila 4 con otro correo.',
      'Fila 6: el mismo correo está en la fila 4 con otro RUT.',
    ]);
  });

  it('rechaza un archivo sin las columnas esperadas o que no es Excel', async () => {
    expect((await leerListaCorreos(await crearPlanillaFicticia())).errores).toEqual([
      'No se encontró una hoja con las columnas «RUT» y «Mail».',
    ]);
    expect((await leerListaCorreos(Buffer.from('no es excel'))).errores).toHaveLength(1);
  });
});

describe('carga de correos de socios', () => {
  beforeEach(async () => {
    buzon.length = 0;
    await limpiarBase();
    await importarPlanilla(await leerPlanilla(await crearPlanillaFicticia()), CLI);
  });

  const lista = (filas: Parameters<typeof crearListaCorreosFicticia>[0]) =>
    crearListaCorreosFicticia(filas).then(leerListaCorreos);

  it('la vista previa cuenta sin modificar nada', async () => {
    const lectura = await lista([
      { rut: UNO, correo: 'uno@uchile.cl' },
      { rut: rutFicticio('19999999'), correo: 'nadie@uchile.cl' },
    ]);
    expect(await previsualizarCorreos(lectura)).toMatchObject({
      nuevos: 1,
      cambiados: 0,
      sinCambios: 0,
      rutDesconocidos: 1,
      errores: [],
    });
    expect(await db().socio.count({ where: { correoHash: { not: null } } })).toBe(0);
  });

  it('carga los correos cifrados y permite registrarse con ellos', async () => {
    const resumen = await aplicarCorreos(
      await lista([
        { rut: UNO, correo: 'uno@uchile.cl' },
        { rut: DOS, correo: 'dos@uchile.cl' },
      ]),
      CLI,
    );
    expect(resumen).toMatchObject({ nuevos: 2, cambiados: 0 });

    const socio = await socioDe(UNO);
    expect(socio.correoCifrado).not.toContain('uno@');
    expect(descifrar(socio.correoCifrado!)).toBe('uno@uchile.cl');

    await registrar({ correo: 'dos@uchile.cl' }, IP);
    await definirContrasena(
      { token: tokenDelUltimoCorreo('dos@uchile.cl'), contrasena: 'una-clave-bien-larga' },
      'VERIFICACION',
      IP,
    );
    const sesion = await verificarIngresoSocio(
      { correo: 'dos@uchile.cl', contrasena: 'una-clave-bien-larga' },
      IP,
    );
    expect(sesion?.socioId).toBe((await socioDe(DOS)).id);
  });

  it('repetir la misma lista no cambia nada', async () => {
    const lectura = await lista([{ rut: UNO, correo: 'uno@uchile.cl' }]);
    await aplicarCorreos(lectura, CLI);
    expect(await aplicarCorreos(lectura, CLI)).toMatchObject({ nuevos: 0, sinCambios: 1 });
  });

  it('se niega a cargar un correo que ya es de otro socio y no modifica nada', async () => {
    await aplicarCorreos(await lista([{ rut: UNO, correo: 'uno@uchile.cl' }]), CLI);
    const lectura = await lista([
      { rut: TRES, correo: 'tres@uchile.cl' },
      { rut: DOS, correo: 'uno@uchile.cl' },
    ]);

    expect((await previsualizarCorreos(lectura)).errores).toEqual([
      'Fila 3: el correo ya está asignado a otro socio.',
    ]);
    await expect(aplicarCorreos(lectura, CLI)).rejects.toThrow(/tiene errores/);
    expect((await socioDe(TRES)).correoHash).toBeNull();
  });

  it('permite intercambiar correos entre dos socios en una misma lista', async () => {
    await aplicarCorreos(
      await lista([
        { rut: UNO, correo: 'a@uchile.cl' },
        { rut: DOS, correo: 'b@uchile.cl' },
      ]),
      CLI,
    );
    const resumen = await aplicarCorreos(
      await lista([
        { rut: UNO, correo: 'b@uchile.cl' },
        { rut: DOS, correo: 'a@uchile.cl' },
      ]),
      CLI,
    );
    expect(resumen).toMatchObject({ cambiados: 2, errores: [] });
    expect(descifrar((await socioDe(UNO)).correoCifrado!)).toBe('b@uchile.cl');
  });

  it('cambiar el correo descarta un registro sin terminar', async () => {
    await definirCorreoSocio({ rut: UNO, correo: 'viejo@uchile.cl' }, CLI);
    await registrar({ correo: 'viejo@uchile.cl' }, IP);
    const token = tokenDelUltimoCorreo('viejo@uchile.cl');

    await definirCorreoSocio({ rut: UNO, correo: 'nuevo@uchile.cl' }, CLI);

    expect((await socioDe(UNO)).cuenta).toBeNull();
    expect(
      await definirContrasena({ token, contrasena: 'una-clave-bien-larga' }, 'VERIFICACION', IP),
    ).toEqual({ ok: false, motivo: 'token_invalido' });
  });

  it('definir un correo informa cuando el socio no existe o el correo está en uso', async () => {
    await definirCorreoSocio({ rut: UNO, correo: 'uno@uchile.cl' }, CLI);
    expect(
      await definirCorreoSocio({ rut: rutFicticio('19999999'), correo: 'x@uchile.cl' }, CLI),
    ).toEqual({ ok: false, motivo: 'socio_no_existe' });
    expect(await definirCorreoSocio({ rut: DOS, correo: 'uno@uchile.cl' }, CLI)).toEqual({
      ok: false,
      motivo: 'correo_en_uso',
    });
    expect(await definirCorreoSocio({ rut: UNO, correo: 'uno@uchile.cl' }, CLI)).toEqual({
      ok: true,
      cambio: 'sin_cambios',
    });
  });

  it('la auditoría registra conteos e ids, nunca correos ni RUT', async () => {
    await aplicarCorreos(await lista([{ rut: UNO, correo: 'uno@uchile.cl' }]), CLI);
    await definirCorreoSocio({ rut: DOS, correo: 'dos@uchile.cl' }, CLI);

    const registros = JSON.stringify(
      await db().registroAuditoria.findMany({
        where: { accion: { in: ['correos.importados', 'socio.correo_definido'] } },
      }),
    );
    expect(registros).toContain('correos.importados');
    expect(registros).toContain('socio.correo_definido');
    expect(registros).not.toContain('uchile.cl');
    expect(registros).not.toContain('11111111');
  });

  it('el admin ve el correo enmascarado y puede filtrar a quienes no tienen', async () => {
    await definirCorreoSocio({ rut: UNO, correo: 'uno@uchile.cl' }, CLI);

    const [conCorreo] = await listarSocios({ busqueda: '11111111' });
    expect(conCorreo?.correo).toBe('un***@uchile.cl');
    expect((await listarSocios({ filtro: 'sin_correo' })).map((s) => s.nombre)).toEqual([
      'PRUEBA DOS SOCIO',
      'PRUEBA TRES SIN DESCUENTOS',
    ]);
  });
});
