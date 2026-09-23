import { calcularDigitoVerificador } from '@afuch/contracts';
import ExcelJS from 'exceljs';

/**
 * Planilla con la misma estructura que la de AFUCH y datos 100 % ficticios.
 * La planilla real nunca entra al repo (contiene datos personales).
 */

export const ENCABEZADOS_ASOCIACI = [
  'NOMBRE',
  'FECHA',
  'MES',
  'RUT',
  'DV',
  'RUTDV',
  ' CODI_SIRH ',
  'COPIA NOMBRES',
  'MONTO',
  'SESENTA',
  'TIP_CUO',
  'COD.',
  'INGRESO',
  'SEXO',
  'ASOCIAC',
  'FACULTAD',
  'CUOTA SOCIO',
  'FONDO CONVENIO SOLIDARIO',
  'ACCIONES1',
  'COOPEUCH PRESTAMOS',
  'LIBAHORR1',
  'FUND.LOPEZ P.',
  'CONVENIO OPTICA GO OPTIC SPA',
  'BONO INVIERNO DUPLICADO',
  'GAS',
  'PRESTAMOS AFUCH',
  'C/INICIAL1',
  'C/TERM1',
  'SESENTA',
  'CUARENTA',
  'FIRMA',
  'GRADO',
  'DESCRIPCION',
  'anterior',
] as const;

export type FilaFicticia = {
  nombre: string;
  cuerpoRut: string;
  facultad: string;
  tipoCuota: 1 | 2;
  montos?: Partial<Record<(typeof ENCABEZADOS_ASOCIACI)[number], number>>;
  cuotaInicial?: string | number;
  cuotaTermino?: string | number;
  /** Para probar errores: fuerza un DV distinto del correcto. */
  dvForzado?: string;
};

export function rutFicticio(cuerpo: string): string {
  return `${cuerpo}${calcularDigitoVerificador(cuerpo)}`;
}

export const FILAS_EJEMPLO: FilaFicticia[] = [
  {
    nombre: 'PRUEBA UNO SOCIA',
    cuerpoRut: '11111111',
    facultad: 'FACULTAD DE ARTES',
    tipoCuota: 1,
    montos: { 'CUOTA SOCIO': 4263 },
  },
  {
    nombre: 'PRUEBA UNO SOCIA',
    cuerpoRut: '11111111',
    facultad: 'FACULTAD DE ARTES',
    tipoCuota: 2,
    montos: { 'FONDO CONVENIO SOLIDARIO': 6794, GAS: 24192, 'PRESTAMOS AFUCH': 40000 },
    cuotaInicial: '1-2',
    cuotaTermino: '3-3',
  },
  {
    nombre: 'PRUEBA DOS SOCIO ',
    cuerpoRut: '12222222',
    facultad: 'FACULTAD DE DERECHO',
    tipoCuota: 1,
    montos: { 'CUOTA SOCIO': 3565 },
  },
  {
    nombre: 'PRUEBA DOS SOCIO',
    cuerpoRut: '12222222',
    facultad: 'FACULTAD DE DERECHO',
    tipoCuota: 2,
    montos: { 'FONDO CONVENIO SOLIDARIO': 5382, 'FUND.LOPEZ P.': 9900, ACCIONES1: 3680 },
  },
  {
    nombre: 'PRUEBA TRES SIN DESCUENTOS',
    cuerpoRut: '13333333',
    facultad: 'FACULTAD DE CIENCIAS',
    tipoCuota: 2,
  },
];

export async function crearPlanillaFicticia({
  filas = FILAS_EJEMPLO,
  anio = 2026,
  mes = 8,
  nombreHoja = 'ASOCIACI',
  encabezados = ENCABEZADOS_ASOCIACI as readonly string[],
}: {
  filas?: FilaFicticia[];
  anio?: number;
  mes?: number;
  nombreHoja?: string;
  encabezados?: readonly string[];
} = {}): Promise<Buffer> {
  const libro = new ExcelJS.Workbook();
  // Hojas vecinas de la planilla real: el importador debe ignorarlas.
  libro.addWorksheet('RENUNCIA').addRow(['RENUNCIAS']);
  const hoja = libro.addWorksheet(nombreHoja);
  hoja.addRow([...encabezados]);

  const columna = (encabezado: string) => encabezados.indexOf(encabezado) + 1;
  const letra = (n: number) => hoja.getColumn(n).letter;

  for (const fila of filas) {
    const dv = fila.dvForzado ?? calcularDigitoVerificador(fila.cuerpoRut) ?? '0';
    const r = hoja.addRow([]);
    const poner = (encabezado: string, v: ExcelJS.CellValue) => {
      const n = columna(encabezado);
      if (n > 0) r.getCell(n).value = v;
    };
    poner('NOMBRE', fila.nombre);
    poner('FECHA', anio);
    poner('MES', String(mes).padStart(2, '0'));
    poner('RUT', Number(fila.cuerpoRut));
    poner('DV', dv);
    poner(' CODI_SIRH ', 28011);
    poner('TIP_CUO', fila.tipoCuota);
    poner('ASOCIAC', 'SCENTRAL');
    poner('FACULTAD', fila.facultad);
    for (const encabezado of encabezados.slice(
      encabezados.indexOf('CUOTA SOCIO'),
      encabezados.indexOf('C/INICIAL1'),
    )) {
      poner(encabezado, fila.montos?.[encabezado as keyof typeof fila.montos] ?? 0);
    }
    if (fila.cuotaInicial !== undefined) poner('C/INICIAL1', fila.cuotaInicial);
    if (fila.cuotaTermino !== undefined) poner('C/TERM1', fila.cuotaTermino);
    // MONTO como fórmula, igual que en la planilla real.
    const desde = columna('CUOTA SOCIO');
    const hasta = columna('PRESTAMOS AFUCH');
    if (desde > 0 && hasta > 0 && columna('MONTO') > 0) {
      const suma = Object.values(fila.montos ?? {}).reduce((a, b) => a + (b ?? 0), 0);
      r.getCell(columna('MONTO')).value = {
        formula: `SUM(${letra(desde)}${r.number}:${letra(hasta)}${r.number})`,
        result: suma,
      };
    }
  }
  // Fila de totales sin RUT, como las que aparecen al final de la planilla real.
  hoja.addRow(['TOTAL']);

  return Buffer.from(await libro.xlsx.writeBuffer());
}
