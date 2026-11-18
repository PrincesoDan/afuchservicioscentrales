import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import { crearPlanillaFicticia } from './planilla-ficticia';

async function abrir(archivo: Buffer) {
  const libro = new ExcelJS.Workbook();
  await libro.xlsx.load(archivo as unknown as ArrayBuffer);
  return libro;
}

function valoresFila(hoja: ExcelJS.Worksheet, numero: number): unknown[] {
  const valores: unknown[] = [];
  hoja.getRow(numero).eachCell({ includeEmpty: true }, (celda) => {
    const v = celda.value;
    valores.push(v && typeof v === 'object' && 'result' in v ? v.result : v);
  });
  return valores;
}

describe('crearPlanillaFicticia', () => {
  it('hoja de descuentos con encabezados en la fila 2', async () => {
    const hoja = (await abrir(await crearPlanillaFicticia())).worksheets[1]!;
    expect(hoja.name).toBe('Consolidado_Agosto_2026');
    const encabezados = valoresFila(hoja, 2);
    expect(encabezados.filter((e) => e === 'TOTAL DESCUENTO AFUCHSCEN')).toHaveLength(2);
    expect(encabezados.filter((e) => e === 'CUOTA DE AGOSTO')).toHaveLength(4);
  });

  it('una fila por socio y fila de totales sin RUT', async () => {
    const hoja = (await abrir(await crearPlanillaFicticia())).worksheets[1]!;
    const columnaRut = valoresFila(hoja, 2).indexOf('RUT') + 1;
    expect([3, 4, 5].map((f) => hoja.getRow(f).getCell(columnaRut).value)).toEqual([
      11111111, 12222222, 13333333,
    ]);
    expect(hoja.getRow(6).getCell(1).value).toBe('TOTALES');
    expect(hoja.getRow(6).getCell(columnaRut).value).toBeNull();
  });

  it('escribe el 60/40 con decimales y el total de la fila', async () => {
    const hoja = (await abrir(await crearPlanillaFicticia())).worksheets[1]!;
    const encabezados = valoresFila(hoja, 2);
    const celda = (encabezado: string) =>
      hoja.getRow(3).getCell(encabezados.indexOf(encabezado) + 1).value;
    expect(celda('CUOTA SOCIAL AFUCHSCEN 60%')).toBeCloseTo(2557.8);
    expect(celda('TOTAL DESCUENTO AFUCHSCEN')).toBe(94163);
  });

  it('formatoAntiguo produce la hoja ASOCIACI', async () => {
    const libro = await abrir(await crearPlanillaFicticia({ formatoAntiguo: true }));
    const hoja = libro.getWorksheet('ASOCIACI');
    expect(hoja?.getRow(1).getCell(1).value).toBe('NOMBRE');
  });
});
