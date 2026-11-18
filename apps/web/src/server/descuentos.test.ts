// @vitest-environment node
import { db } from '@afuch/db';
import { beforeEach, describe, expect, it } from 'vitest';
import { limpiarBase } from '@/test/base';
import { hashRut } from './cifrado';
import { CONCEPTOS_OCULTOS, detallePeriodo, periodosDelSocio } from './descuentos';
import { crearPlanillaFicticia, rutFicticio } from './fixtures/planilla-ficticia';
import { importarPlanilla } from './importacion';
import { leerPlanilla } from './planilla';

const CLI = { tipo: 'SISTEMA', id: 'test' } as const;

async function importarSocia() {
  await importarPlanilla(
    await leerPlanilla(
      await crearPlanillaFicticia({
        filas: [
          {
            nombre: 'PRUEBA UNO SOCIA',
            cuerpoRut: '11111111',
            facultad: 'FACULTAD DE ARTES',
            cuotaSocial: 4000,
            gas: { 15: 20000 },
          },
        ],
      }),
    ),
    CLI,
  );
  const socio = await db().socio.findUniqueOrThrow({
    where: { rutHash: hashRut(rutFicticio('11111111')) },
  });
  const periodo = await db().periodo.findFirstOrThrow();
  return { socioId: socio.id, periodoId: periodo.id };
}

describe('descuentos visibles para el socio', () => {
  beforeEach(limpiarBase);

  it('no muestra ni suma los conceptos ocultos (D12)', async () => {
    const { socioId, periodoId } = await importarSocia();
    // La planilla nueva ya no trae estos conceptos, pero los meses antiguos sí.
    await db().lineaDescuento.createMany({
      data: [
        { socioId, periodoId, concepto: 'OPTICA_GO_OPTIC', monto: 15000 },
        { socioId, periodoId, concepto: 'REINTEGRO_BONO_INVIERNO', monto: 30000 },
      ],
    });

    const [periodo] = await periodosDelSocio(socioId);
    expect(periodo?.total).toBe(24000);

    const lineas = await detallePeriodo(socioId, periodoId);
    expect(lineas.map((l) => l.concepto)).toEqual(['CUOTA_SOCIAL', 'GAS_ABASTIBLE']);

    // El dato se conserva completo: solo se oculta en la vista del socio.
    expect(
      await db().lineaDescuento.count({
        where: { socioId, concepto: { in: [...CONCEPTOS_OCULTOS] } },
      }),
    ).toBe(2);
  });

  it('muestra las cuotas de una línea antigua', async () => {
    const { socioId, periodoId } = await importarSocia();
    await db().lineaDescuento.create({
      data: {
        socioId,
        periodoId,
        concepto: 'PRESTAMO_AFUCH',
        monto: 20000,
        detalle: [{ cuota: 1, total: 3 }],
      },
    });

    const lineas = await detallePeriodo(socioId, periodoId);
    expect(lineas.find((l) => l.concepto === 'PRESTAMO_AFUCH')?.detalle).toEqual({
      tipo: 'cuotasAntiguas',
      cuotas: [{ cuota: 1, total: 3 }],
    });
  });
});
