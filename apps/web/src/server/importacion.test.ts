// @vitest-environment node
import { db } from '@afuch/db';
import { beforeEach, describe, expect, it } from 'vitest';
import { limpiarBase } from '@/test/base';
import { crearPlanillaFicticia, FILAS_EJEMPLO, rutFicticio } from './fixtures/planilla-ficticia';
import { hashRut } from './cifrado';
import { importarPlanilla } from './importacion';
import { leerPlanilla } from './planilla';

const CLI = { tipo: 'SISTEMA', id: 'test' } as const;

describe('importarPlanilla', () => {
  beforeEach(limpiarBase);

  it('crea socios, periodo y líneas', async () => {
    const resumen = await importarPlanilla(await leerPlanilla(await crearPlanillaFicticia()), CLI);

    expect(resumen).toMatchObject({
      anio: 2026,
      mes: 8,
      socios: 3,
      sociosNuevos: 3,
      lineas: 8,
      reemplazoPeriodoExistente: false,
    });
    expect(await db().socio.count()).toBe(3);
    const socio = await db().socio.findUniqueOrThrow({
      where: { rutHash: hashRut(rutFicticio('11111111')) },
    });
    expect(socio.rutCifrado).not.toContain('11111111');
    const prestamo = await db().lineaDescuento.findFirstOrThrow({
      where: { socioId: socio.id, concepto: 'PRESTAMO_AFUCH' },
    });
    expect(prestamo.detalleCuotas).toEqual([
      { cuota: 1, total: 3 },
      { cuota: 2, total: 3 },
    ]);
  });

  it('reimportar el mismo periodo lo reemplaza sin duplicar', async () => {
    const resultado = await leerPlanilla(await crearPlanillaFicticia());
    await importarPlanilla(resultado, CLI);
    const resumen = await importarPlanilla(resultado, CLI);

    expect(resumen.reemplazoPeriodoExistente).toBe(true);
    expect(resumen.sociosNuevos).toBe(0);
    expect(await db().periodo.count()).toBe(1);
    expect(await db().lineaDescuento.count()).toBe(8);
  });

  it('no deshabilita a quien deja de aparecer (D6)', async () => {
    await importarPlanilla(await leerPlanilla(await crearPlanillaFicticia()), CLI);
    await importarPlanilla(
      await leerPlanilla(await crearPlanillaFicticia({ mes: 9, filas: FILAS_EJEMPLO.slice(0, 2) })),
      CLI,
    );

    const ausente = await db().socio.findUniqueOrThrow({
      where: { rutHash: hashRut(rutFicticio('12222222')) },
    });
    expect(ausente.habilitado).toBe(true);
    expect(await db().periodo.count()).toBe(2);
  });

  it('se niega a importar una planilla con errores', async () => {
    const conErrores = await leerPlanilla(Buffer.from('no es excel'));
    await expect(importarPlanilla(conErrores, CLI)).rejects.toThrow();
  });

  it('registra la importación en auditoría', async () => {
    await importarPlanilla(await leerPlanilla(await crearPlanillaFicticia()), CLI);
    const registro = await db().registroAuditoria.findFirstOrThrow({
      where: { accion: 'planilla.importada' },
    });
    expect(registro).toMatchObject({ actorTipo: 'SISTEMA', entidadId: '2026-08' });
  });
});
