// @vitest-environment node
import { db } from '@afuch/db';
import { beforeEach, describe, expect, it } from 'vitest';
import { limpiarBase } from '@/test/base';
import {
  ausentesDelUltimoPeriodo,
  deshabilitarAusentes,
  eliminarSocio,
  exportarSocio,
  listarSocios,
} from './administracion';
import { crearPlanillaFicticia, FILAS_EJEMPLO } from './fixtures/planilla-ficticia';
import { importarPlanilla } from './importacion';
import { leerPlanilla } from './planilla';

const CLI = { tipo: 'SISTEMA', id: 'test' } as const;

describe('administración de socios', () => {
  beforeEach(async () => {
    await limpiarBase();
    await importarPlanilla(await leerPlanilla(await crearPlanillaFicticia()), CLI);
    // En septiembre deja de aparecer PRUEBA DOS.
    await importarPlanilla(
      await leerPlanilla(
        await crearPlanillaFicticia({
          mes: 9,
          filas: FILAS_EJEMPLO.filter((f) => f.cuerpoRut !== '12222222'),
        }),
      ),
      CLI,
    );
  });

  it('lista con nombre y RUT descifrados, ordenados por nombre', async () => {
    const socios = await listarSocios();
    expect(socios.map((s) => s.nombre)).toEqual([
      'PRUEBA DOS SOCIO',
      'PRUEBA TRES SIN DESCUENTOS',
      'PRUEBA UNO SOCIA',
    ]);
    expect(socios[0]?.rut).toMatch(/^12\.222\.222-[\dK]$/);
  });

  it('busca por RUT sin puntos ni guion', async () => {
    const [socio] = await listarSocios({ busqueda: '12222222' });
    expect(socio?.nombre).toBe('PRUEBA DOS SOCIO');
  });

  it('identifica ausentes del último periodo y los deshabilita solo al ejecutar la acción', async () => {
    const ausentes = await ausentesDelUltimoPeriodo();
    expect(ausentes.map((s) => s.nombre)).toEqual(['PRUEBA DOS SOCIO']);
    expect(await db().socio.count({ where: { habilitado: false } })).toBe(0);

    expect(await deshabilitarAusentes(CLI)).toBe(1);
    expect(await db().socio.count({ where: { habilitado: false } })).toBe(1);
    expect(await ausentesDelUltimoPeriodo()).toEqual([]);
  });

  it('exporta los datos del socio descifrados', async () => {
    const [socio] = await listarSocios({ busqueda: '11111111' });
    const datos = await exportarSocio(socio!.id, CLI);
    expect(datos.nombre).toBe('PRUEBA UNO SOCIA');
    expect(datos.descuentos.filter((d) => d.periodo === '2026-08')).toHaveLength(4);
  });

  it('elimina al socio con su cuenta y descuentos', async () => {
    const [socio] = await listarSocios({ busqueda: '11111111' });
    await eliminarSocio(socio!.id, CLI);
    expect(await db().socio.findUnique({ where: { id: socio!.id } })).toBeNull();
    expect(await db().lineaDescuento.count({ where: { socioId: socio!.id } })).toBe(0);
    expect(await db().registroAuditoria.count({ where: { accion: 'socio.eliminado' } })).toBe(1);
  });
});
