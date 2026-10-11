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

describe('descuentos visibles para el socio', () => {
  beforeEach(limpiarBase);

  it('no muestra ni suma los conceptos ocultos (D12)', async () => {
    await importarPlanilla(
      await leerPlanilla(
        await crearPlanillaFicticia({
          filas: [
            {
              nombre: 'PRUEBA UNO SOCIA',
              cuerpoRut: '11111111',
              facultad: 'FACULTAD DE ARTES',
              tipoCuota: 1,
              montos: {
                'CUOTA SOCIO': 4000,
                GAS: 20000,
                'CONVENIO OPTICA GO OPTIC SPA': 15000,
                'BONO INVIERNO DUPLICADO': 30000,
              },
            },
          ],
        }),
      ),
      CLI,
    );
    const socio = await db().socio.findUniqueOrThrow({
      where: { rutHash: hashRut(rutFicticio('11111111')) },
    });

    const [periodo] = await periodosDelSocio(socio.id);
    expect(periodo?.total).toBe(24000);

    const lineas = await detallePeriodo(socio.id, periodo?.id ?? '');
    expect(lineas.map((l) => l.concepto)).toEqual(['CUOTA_SOCIAL', 'GAS_ABASTIBLE']);

    // El dato se conserva completo: solo se oculta en la vista del socio.
    expect(
      await db().lineaDescuento.count({
        where: { socioId: socio.id, concepto: { in: [...CONCEPTOS_OCULTOS] } },
      }),
    ).toBe(2);
  });
});
