import { describe, expect, it } from 'vitest';
import { interpretarDetalle } from './detalle-descuento';

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
