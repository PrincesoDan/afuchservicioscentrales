import { describe, expect, it } from 'vitest';
import {
  crearPlanillaFicticia,
  FILAS_EJEMPLO,
  rutFicticio,
  type FilaFicticia,
} from './fixtures/planilla-ficticia';
import { interpretarCuotaPrestamo, leerPlanilla } from './planilla';

const BASE: FilaFicticia = { nombre: 'X', cuerpoRut: '11111111', facultad: 'F' };

describe('interpretarCuotaPrestamo', () => {
  it('lee «n-m» como cuota n de m', () => {
    expect(interpretarCuotaPrestamo('2-3')).toEqual({ cuota: 2, total: 3 });
    expect(interpretarCuotaPrestamo(' 6 - 10 ')).toEqual({ cuota: 6, total: 10 });
  });

  it.each(['957', '4-3', '0-3', 'a-b', ''])('no interpreta «%s»', (texto) => {
    expect(interpretarCuotaPrestamo(texto)).toBeNull();
  });
});

describe('leerPlanilla', () => {
  it('lee socios, periodo y desglose', async () => {
    const resultado = await leerPlanilla(await crearPlanillaFicticia());

    expect(resultado.errores).toEqual([]);
    expect(resultado.advertencias).toEqual([]);
    expect(resultado.periodo).toEqual({ anio: 2026, mes: 8 });
    expect(resultado.resumen.filasLeidas).toBe(3);
    expect(resultado.socios).toHaveLength(3);

    const socia = resultado.socios.find((s) => s.rut === rutFicticio('11111111'));
    expect(socia?.nombre).toBe('PRUEBA UNO SOCIA');
    expect(socia?.facultad).toBe('FACULTAD DE ARTES');
    expect(socia?.lineas).toEqual([
      {
        concepto: 'CUOTA_SOCIAL',
        monto: 4263,
        detalle: { tipo: 'cuotaSocial', afuchscen: 2558, fenafuch: 1705 },
      },
      { concepto: 'FONDO_SOLIDARIO', monto: 6794 },
      {
        concepto: 'GAS_ABASTIBLE',
        monto: 43106,
        detalle: {
          tipo: 'gas',
          porTipo: [
            { kilos: 11, monto: 19197 },
            { kilos: 15, monto: 23909 },
          ],
          vales: 2,
        },
      },
      {
        concepto: 'PRESTAMO_AFUCH',
        monto: 40000,
        detalle: {
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
      },
    ]);
  });

  it('recorta espacios del nombre', async () => {
    const resultado = await leerPlanilla(await crearPlanillaFicticia());
    expect(resultado.socios.find((s) => s.rut === rutFicticio('12222222'))?.nombre).toBe(
      'PRUEBA DOS SOCIO',
    );
  });

  it('incluye a socios sin descuentos', async () => {
    const resultado = await leerPlanilla(await crearPlanillaFicticia());
    expect(resultado.socios.find((s) => s.rut === rutFicticio('13333333'))?.lineas).toEqual([]);
  });

  it('calcula totales por concepto', async () => {
    const resultado = await leerPlanilla(await crearPlanillaFicticia());
    expect(resultado.resumen.totalPorConcepto.CUOTA_SOCIAL).toBe(4263 + 3565);
    expect(resultado.resumen.total).toBe(94163 + 22527);
  });

  it('encuentra la hoja aunque cambie de nombre', async () => {
    const resultado = await leerPlanilla(
      await crearPlanillaFicticia({ nombreHoja: 'Consolidado_Noviembre_2026' }),
    );
    expect(resultado.errores).toEqual([]);
    expect(resultado.socios).toHaveLength(3);
  });

  it('lee 1 bloque y 4 bloques de préstamo', async () => {
    const prestamo = { fecha: '2026-09-01', monto: 60000, cuotas: '1-3', cuotaMes: 20000 };
    const unBloque = await leerPlanilla(
      await crearPlanillaFicticia({
        bloquesPrestamo: ['OCTUBRE'],
        filas: [{ ...BASE, prestamos: [{ ...prestamo, bloque: 0 }] }],
      }),
    );
    expect(unBloque.errores).toEqual([]);
    expect(unBloque.socios[0]?.lineas).toEqual([
      {
        concepto: 'PRESTAMO_AFUCH',
        monto: 20000,
        detalle: {
          tipo: 'prestamosAfuch',
          prestamos: [
            {
              fecha: '2026-09-01',
              montoPrestado: 60000,
              cuota: 1,
              totalCuotas: 3,
              montoCuota: 20000,
            },
          ],
        },
      },
    ]);

    const cuatroBloques = await leerPlanilla(
      await crearPlanillaFicticia({
        filas: [
          {
            ...BASE,
            prestamos: [
              { ...prestamo, bloque: 0 },
              { ...prestamo, bloque: 3, fecha: '2026-04-27', cuotas: '6-10', cuotaMes: 30000 },
            ],
          },
        ],
      }),
    );
    expect(cuatroBloques.errores).toEqual([]);
    const linea = cuatroBloques.socios[0]?.lineas[0];
    expect(linea?.monto).toBe(50000);
    expect(linea?.detalle).toMatchObject({
      prestamos: [
        { fecha: '2026-09-01', cuota: 1, totalCuotas: 3 },
        { fecha: '2026-04-27', cuota: 6, totalCuotas: 10, montoCuota: 30000 },
      ],
    });
  });

  it('préstamo sin fecha', async () => {
    const resultado = await leerPlanilla(
      await crearPlanillaFicticia({
        filas: [
          {
            ...BASE,
            prestamos: [{ bloque: 0, fecha: null, monto: 60000, cuotas: '1-3', cuotaMes: 20000 }],
          },
        ],
      }),
    );
    expect(resultado.advertencias).toEqual([]);
    expect(resultado.socios[0]?.lineas[0]?.detalle).toMatchObject({
      prestamos: [{ fecha: null, montoPrestado: 60000 }],
    });
  });

  it('advierte cuotas de préstamo ilegibles sin bloquear', async () => {
    const resultado = await leerPlanilla(
      await crearPlanillaFicticia({
        filas: [
          {
            ...BASE,
            prestamos: [
              { bloque: 0, fecha: '2026-09-01', monto: 60000, cuotas: '957', cuotaMes: 20000 },
            ],
          },
        ],
      }),
    );
    expect(resultado.errores).toEqual([]);
    expect(resultado.advertencias).toEqual([
      'Fila 3: las cuotas del préstamo «957» no se pudieron interpretar; se muestra sin cuota n de m.',
    ]);
    expect(resultado.socios[0]?.lineas[0]).toMatchObject({
      monto: 20000,
      detalle: { prestamos: [{ cuota: null, totalCuotas: null, montoCuota: 20000 }] },
    });
  });

  it('advierte cuando el total de la fila no cuadra', async () => {
    const resultado = await leerPlanilla(
      await crearPlanillaFicticia({ filas: [{ ...BASE, cuotaSocial: 4000, totalForzado: 1 }] }),
    );
    expect(resultado.errores).toEqual([]);
    expect(resultado.advertencias).toEqual([
      'Fila 3: TOTAL DESCUENTO AFUCHSCEN (1) no coincide con la suma de conceptos (4000).',
    ]);
  });

  it('advierte cuando el gas por tipo no suma el total', async () => {
    const resultado = await leerPlanilla(
      await crearPlanillaFicticia({
        filas: [{ ...BASE, gas: { 11: 19197 }, totalGas: 20000, valesGas: 1 }],
      }),
    );
    expect(resultado.advertencias).toEqual([
      'Fila 3: los vales de gas por tipo (19197) no suman el total de gas (20000).',
    ]);
    expect(resultado.socios[0]?.lineas[0]).toMatchObject({
      concepto: 'GAS_ABASTIBLE',
      monto: 20000,
    });
  });

  it('advierte gas por tipo cuando el total de gas viene vacío', async () => {
    const resultado = await leerPlanilla(
      await crearPlanillaFicticia({ filas: [{ ...BASE, gas: { 15: 23909 }, totalGas: 0 }] }),
    );
    expect(resultado.advertencias).toEqual([
      'Fila 3: los vales de gas por tipo (23909) no suman el total de gas (0).',
    ]);
    expect(resultado.socios[0]?.lineas).toEqual([]);
  });

  it('excluye y advierte filas con DV inválido', async () => {
    const resultado = await leerPlanilla(
      await crearPlanillaFicticia({ filas: [{ ...BASE, dvForzado: '9' }] }),
    );
    expect(resultado.errores).toEqual([
      'La hoja "Consolidado_Agosto_2026" no tiene filas con RUT.',
    ]);
    expect(resultado.advertencias).toEqual([
      'Fila 3: RUT con dígito verificador inválido; fila excluida (pedir corrección a AFUCH).',
    ]);
  });

  it('bloquea RUT repetido', async () => {
    const resultado = await leerPlanilla(
      await crearPlanillaFicticia({ filas: [FILAS_EJEMPLO[0]!, FILAS_EJEMPLO[0]!] }),
    );
    expect(resultado.errores).toEqual(['RUT repetido en las filas 3 y 4.']);
  });

  it('falla si falta una columna', async () => {
    const resultado = await leerPlanilla(
      await crearPlanillaFicticia({ omitirColumnas: ['GAS11N'] }),
    );
    expect(resultado.errores[0]).toContain('GAS11N');
  });

  it('rechaza el formato antiguo', async () => {
    const resultado = await leerPlanilla(await crearPlanillaFicticia({ formatoAntiguo: true }));
    expect(resultado.errores).toEqual([
      'Es el formato antiguo de la planilla. AFUCH ahora entrega la «PLANILLA DESCUENTOS PAGINA WEB»; sube esa.',
    ]);
  });

  it('falla con un archivo que no es Excel', async () => {
    const resultado = await leerPlanilla(Buffer.from('no soy un excel'));
    expect(resultado.errores).toEqual(['El archivo no es un Excel (.xlsx) válido.']);
  });
});
