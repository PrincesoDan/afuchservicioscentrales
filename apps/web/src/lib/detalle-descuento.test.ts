import { describe, expect, it } from 'vitest';
import { interpretarDetalle, lineasDeDetalle } from './detalle-descuento';

describe('interpretarDetalle', () => {
  it('lee las cuotas antiguas de agosto y septiembre', () => {
    expect(
      interpretarDetalle([
        { cuota: 1, total: 3 },
        { cuota: 2, total: 3 },
      ]),
    ).toEqual({
      tipo: 'cuotasAntiguas',
      cuotas: [
        { cuota: 1, total: 3 },
        { cuota: 2, total: 3 },
      ],
    });
  });

  it('lee el reparto de la cuota social', () => {
    const detalle = { tipo: 'cuotaSocial', afuchscen: 2558, fenafuch: 1705 };
    expect(interpretarDetalle(detalle)).toEqual(detalle);
  });

  it('lee los préstamos AFUCH, con y sin fecha o cuotas', () => {
    const detalle = {
      tipo: 'prestamosAfuch',
      prestamos: [
        { fecha: '2026-07-12', montoPrestado: 60000, cuota: 1, totalCuotas: 3, montoCuota: 20000 },
        { fecha: null, montoPrestado: 60000, cuota: null, totalCuotas: null, montoCuota: 20000 },
      ],
    };
    expect(interpretarDetalle(detalle)).toEqual(detalle);
  });

  it('lee el gas por tipo de vale', () => {
    const detalle = { tipo: 'gas', porTipo: [{ kilos: 11, monto: 19197 }], vales: 1 };
    expect(interpretarDetalle(detalle)).toEqual(detalle);
    expect(interpretarDetalle({ ...detalle, vales: null })).toEqual({ ...detalle, vales: null });
  });

  it('ignora lo que no calza con ninguna forma', () => {
    for (const valor of [
      null,
      undefined,
      'x',
      { tipo: 'otro' },
      [{ cuota: 'a' }],
      { tipo: 'gas', porTipo: [{ kilos: 12, monto: 1 }], vales: null },
      { tipo: 'cuotaSocial', afuchscen: 1.5, fenafuch: 1 },
    ]) {
      expect(interpretarDetalle(valor)).toBeNull();
    }
  });
});

const REPARTO = [
  { destino: 'AFUCH Servicios Centrales', parte: '60%' },
  { destino: 'FENAFUCH', parte: '40%' },
];

describe('lineasDeDetalle', () => {
  it('cuota social con su reparto', () => {
    expect(
      lineasDeDetalle({ tipo: 'cuotaSocial', afuchscen: 2558, fenafuch: 1705 }, REPARTO),
    ).toEqual(['AFUCH Servicios Centrales (60%) $2.558 · FENAFUCH (40%) $1.705']);
  });

  it('un renglón por préstamo', () => {
    expect(
      lineasDeDetalle(
        {
          tipo: 'prestamosAfuch',
          prestamos: [
            {
              fecha: '2026-07-12',
              montoPrestado: 60000,
              cuota: 1,
              totalCuotas: 3,
              montoCuota: 20000,
            },
            {
              fecha: '2026-06-05',
              montoPrestado: 60000,
              cuota: 2,
              totalCuotas: 3,
              montoCuota: 20000,
            },
          ],
        },
        REPARTO,
      ),
    ).toEqual([
      'Préstamo del 12-07-2026 por $60.000: cuota 1 de 3, $20.000',
      'Préstamo del 05-06-2026 por $60.000: cuota 2 de 3, $20.000',
    ]);
  });

  it('préstamo sin fecha ni cuotas', () => {
    expect(
      lineasDeDetalle(
        {
          tipo: 'prestamosAfuch',
          prestamos: [
            {
              fecha: null,
              montoPrestado: 60000,
              cuota: null,
              totalCuotas: null,
              montoCuota: 20000,
            },
          ],
        },
        REPARTO,
      ),
    ).toEqual(['Préstamo por $60.000: $20.000']);
  });

  it('gas por tipo con el total de vales', () => {
    const gas = {
      tipo: 'gas' as const,
      porTipo: [
        { kilos: 11 as const, monto: 19197 },
        { kilos: 15 as const, monto: 23909 },
      ],
      vales: 2,
    };
    expect(lineasDeDetalle(gas, REPARTO)).toEqual([
      '11 kg: $19.197 · 15 kg: $23.909 (2 vales en total)',
    ]);
    expect(lineasDeDetalle({ ...gas, vales: 1 }, REPARTO)).toEqual([
      '11 kg: $19.197 · 15 kg: $23.909 (1 vale en total)',
    ]);
    expect(lineasDeDetalle({ ...gas, vales: null }, REPARTO)).toEqual([
      '11 kg: $19.197 · 15 kg: $23.909',
    ]);
  });

  it('cuotas antiguas como hasta ahora', () => {
    expect(
      lineasDeDetalle(
        {
          tipo: 'cuotasAntiguas',
          cuotas: [
            { cuota: 1, total: 3 },
            { cuota: 2, total: 3 },
          ],
        },
        REPARTO,
      ),
    ).toEqual(['Préstamo 1: cuota 1 de 3 · Préstamo 2: cuota 2 de 3']);
    expect(
      lineasDeDetalle({ tipo: 'cuotasAntiguas', cuotas: [{ cuota: 1, total: 3 }] }, REPARTO),
    ).toEqual(['cuota 1 de 3']);
  });
});
