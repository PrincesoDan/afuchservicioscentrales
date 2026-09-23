import { describe, expect, it } from 'vitest';
import {
  crearPlanillaFicticia,
  ENCABEZADOS_ASOCIACI,
  rutFicticio,
} from './fixtures/planilla-ficticia';
import { interpretarCuotas, leerPlanilla } from './planilla';

describe('interpretarCuotas', () => {
  it('lee un préstamo', () => {
    expect(interpretarCuotas('2', '3')).toEqual([{ cuota: 2, total: 3 }]);
  });

  it('lee varios préstamos separados por guion', () => {
    expect(interpretarCuotas('1-2', '3-3')).toEqual([
      { cuota: 1, total: 3 },
      { cuota: 2, total: 3 },
    ]);
  });

  it.each([
    ['1-2', '3'],
    ['4', '3'],
    ['0', '3'],
    ['957', 'x'],
    ['', ''],
  ])('rechaza "%s" / "%s"', (inicial, termino) => {
    expect(interpretarCuotas(inicial, termino)).toBeNull();
  });
});

describe('leerPlanilla', () => {
  it('agrupa por RUT, suma conceptos y lee el periodo', async () => {
    const resultado = await leerPlanilla(await crearPlanillaFicticia());

    expect(resultado.errores).toEqual([]);
    expect(resultado.advertencias).toEqual([]);
    expect(resultado.periodo).toEqual({ anio: 2026, mes: 8 });
    expect(resultado.resumen.filasLeidas).toBe(5);
    expect(resultado.socios).toHaveLength(3);

    const socia = resultado.socios.find((s) => s.rut === rutFicticio('11111111'));
    expect(socia?.nombre).toBe('PRUEBA UNO SOCIA');
    expect(socia?.facultad).toBe('FACULTAD DE ARTES');
    expect(socia?.lineas).toEqual([
      { concepto: 'CUOTA_SOCIAL', monto: 4263 },
      { concepto: 'FONDO_SOLIDARIO', monto: 6794 },
      { concepto: 'GAS_ABASTIBLE', monto: 24192 },
      {
        concepto: 'PRESTAMO_AFUCH',
        monto: 40000,
        detalleCuotas: [
          { cuota: 1, total: 3 },
          { cuota: 2, total: 3 },
        ],
      },
    ]);
  });

  it('recorta espacios del nombre', async () => {
    const resultado = await leerPlanilla(await crearPlanillaFicticia());
    expect(resultado.socios.find((s) => s.rut === rutFicticio('12222222'))?.nombre).toBe(
      'PRUEBA DOS SOCIO',
    );
  });

  it('incluye en la whitelist a socios sin descuentos', async () => {
    const resultado = await leerPlanilla(await crearPlanillaFicticia());
    expect(resultado.socios.find((s) => s.rut === rutFicticio('13333333'))?.lineas).toEqual([]);
  });

  it('calcula totales por concepto', async () => {
    const resultado = await leerPlanilla(await crearPlanillaFicticia());
    expect(resultado.resumen.totalPorConcepto.CUOTA_SOCIAL).toBe(4263 + 3565);
    expect(resultado.resumen.total).toBe(4263 + 6794 + 24192 + 40000 + 3565 + 5382 + 9900 + 3680);
  });

  it('excluye y advierte filas con RUT de DV inválido', async () => {
    const archivo = await crearPlanillaFicticia({
      filas: [{ nombre: 'X', cuerpoRut: '11111111', facultad: 'F', tipoCuota: 1, dvForzado: '9' }],
    });
    const resultado = await leerPlanilla(archivo);
    expect(resultado.errores).toEqual(['La hoja "ASOCIACI" no tiene filas con RUT.']);
    expect(resultado.advertencias).toEqual([
      'Fila 2: RUT con dígito verificador inválido; fila excluida (pedir corrección a AFUCH).',
    ]);
  });

  it('advierte cuotas que no se pueden interpretar sin bloquear', async () => {
    const archivo = await crearPlanillaFicticia({
      filas: [
        {
          nombre: 'X',
          cuerpoRut: '11111111',
          facultad: 'F',
          tipoCuota: 2,
          montos: { 'PRESTAMOS AFUCH': 20000 },
          cuotaInicial: '957',
          cuotaTermino: '3',
        },
      ],
    });
    const resultado = await leerPlanilla(archivo);
    expect(resultado.errores).toEqual([]);
    expect(resultado.advertencias).toHaveLength(1);
    expect(resultado.socios[0]?.lineas[0]).toEqual({ concepto: 'PRESTAMO_AFUCH', monto: 20000 });
  });

  it('falla si falta una columna', async () => {
    const archivo = await crearPlanillaFicticia({
      encabezados: ENCABEZADOS_ASOCIACI.filter((e) => e !== 'GAS'),
    });
    const resultado = await leerPlanilla(archivo);
    expect(resultado.errores[0]).toContain('GAS');
  });

  it('falla si no existe la hoja ASOCIACI', async () => {
    const resultado = await leerPlanilla(await crearPlanillaFicticia({ nombreHoja: 'OTRA' }));
    expect(resultado.errores).toEqual(['No se encontró la hoja "ASOCIACI".']);
  });

  it('falla con un archivo que no es Excel', async () => {
    const resultado = await leerPlanilla(Buffer.from('no soy un excel'));
    expect(resultado.errores).toEqual(['El archivo no es un Excel (.xlsx) válido.']);
  });
});
