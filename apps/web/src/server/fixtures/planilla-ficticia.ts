import { calcularDigitoVerificador } from '@afuch/contracts';
import ExcelJS from 'exceljs';

/**
 * Planilla con la misma estructura que la «PLANILLA DESCUENTOS PAGINA WEB» de
 * AFUCH (formato vigente desde octubre de 2026) y datos 100 % ficticios. La
 * planilla real nunca entra al repo (contiene datos personales).
 * Estructura: docs/superpowers/specs/2026-11-18-planilla-nuevo-formato-design.md.
 */

const MESES = [
  'ENERO',
  'FEBRERO',
  'MARZO',
  'ABRIL',
  'MAYO',
  'JUNIO',
  'JULIO',
  'AGOSTO',
  'SEPTIEMBRE',
  'OCTUBRE',
  'NOVIEMBRE',
  'DICIEMBRE',
] as const;

const KILOS_GAS = [5, 11, 15, 45] as const;
type KilosGas = (typeof KILOS_GAS)[number];
const encabezadoGas = (kilos: KilosGas) => `GAS${String(kilos).padStart(2, '0')}N`;

export type PrestamoFicticio = {
  /** Índice en `bloquesPrestamo`. */
  bloque: number;
  /** 'AAAA-MM-DD'; se escribe como fecha de Excel. */
  fecha: string | null;
  monto: number;
  /** Texto «n-m» tal cual, para poder probar valores ilegibles. */
  cuotas: string;
  cuotaMes: number;
};

export type FilaFicticia = {
  nombre: string;
  cuerpoRut: string;
  facultad: string;
  cuotaSocial?: number;
  fondoSolidario?: number;
  accionesCoopeuch?: number;
  prestamoCoopeuch?: number;
  libretaAhorro?: number;
  falp?: number;
  gas?: Partial<Record<KilosGas, number>>;
  /** Por defecto, la suma de `gas`. */
  totalGas?: number;
  valesGas?: number;
  prestamos?: PrestamoFicticio[];
  /** Por defecto, la suma de los conceptos. */
  totalForzado?: number;
  /** Para probar errores: fuerza un DV distinto del correcto. */
  dvForzado?: string;
};

export function rutFicticio(cuerpo: string): string {
  return `${cuerpo}${calcularDigitoVerificador(cuerpo)}`;
}

export const BLOQUES_PRESTAMO = ['SEPT', 'AGOSTO', 'JULIO', 'MESES ANTERIORES'] as const;

export const FILAS_EJEMPLO: FilaFicticia[] = [
  {
    nombre: 'PRUEBA UNO SOCIA',
    cuerpoRut: '11111111',
    facultad: 'FACULTAD DE ARTES',
    cuotaSocial: 4263,
    fondoSolidario: 6794,
    gas: { 11: 19197, 15: 23909 },
    valesGas: 2,
    prestamos: [
      { bloque: 0, fecha: '2026-07-12', monto: 60000, cuotas: '1-3', cuotaMes: 20000 },
      { bloque: 1, fecha: '2026-06-05', monto: 60000, cuotas: '2-3', cuotaMes: 20000 },
    ],
  },
  {
    nombre: 'PRUEBA DOS SOCIO ',
    cuerpoRut: '12222222',
    facultad: 'FACULTAD DE DERECHO',
    cuotaSocial: 3565,
    fondoSolidario: 5382,
    falp: 9900,
    accionesCoopeuch: 3680,
  },
  {
    nombre: 'PRUEBA TRES SIN DESCUENTOS',
    cuerpoRut: '13333333',
    facultad: 'FACULTAD DE CIENCIAS',
  },
];

/** Encabezados de la fila 2, en el orden de la planilla real (con sus repetidos y su espacio doble). */
export function encabezadosPlanilla(mes: number, bloquesPrestamo: readonly string[]): string[] {
  const nombreMes = MESES[mes - 1] ?? 'MES';
  return [
    'NOMBRE',
    'FECHA',
    'MES',
    'RUT',
    'DV',
    '',
    'TOTAL DESCUENTO AFUCHSCEN',
    'SESENTA',
    'TIP_CUO (1+2)',
    'INGRESO',
    'SEXO',
    'ASOCIAC',
    'FACULTAD',
    'TOTAL CUOTA SOCIAL 0,5% SUELDO BASE',
    'CUOTA SOCIAL AFUCHSCEN 60%',
    'CUOTA SOCIAL FENAFUCH 40%',
    'FONDO  SOLIDARIO 0,8%',
    'COOPEUCH ACCIONES',
    'COOPEUCH PRESTAMOS',
    'COOPEUCH LIB. AHORRO',
    'FUND.LOPEZ PEREZ.',
    'GRADO',
    'DESCRIPCION',
    'anterior',
    ...KILOS_GAS.map(encabezadoGas),
    'TOTAL COSTO VALES DE GAS',
    'total vales de gas',
    'fecha asignacion',
    ...bloquesPrestamo.flatMap((etiqueta) => [
      `FECHA PRESTAMO ${etiqueta}`,
      `MONTO PRESTAMO ${etiqueta}`,
      `CUOTAS PRESTAMO ${etiqueta}`,
      `CUOTA DE ${nombreMes}`,
    ]),
    `TOTAL DESC PRESTAMOS ${nombreMes} (AI,AM,AQ,AU)`,
    'TOTAL EXTRA AFSC (Q,R,S,T,U,AC,AV',
    'TOTAL DESCUENTO AFUCHSCEN',
  ];
}

function totalGas(fila: FilaFicticia): number {
  return fila.totalGas ?? Object.values(fila.gas ?? {}).reduce((a, b) => a + b, 0);
}

function totalPrestamos(fila: FilaFicticia): number {
  return (fila.prestamos ?? []).reduce((a, p) => a + p.cuotaMes, 0);
}

function totalFila(fila: FilaFicticia): number {
  return (
    fila.totalForzado ??
    (fila.cuotaSocial ?? 0) +
      (fila.fondoSolidario ?? 0) +
      (fila.accionesCoopeuch ?? 0) +
      (fila.prestamoCoopeuch ?? 0) +
      (fila.libretaAhorro ?? 0) +
      (fila.falp ?? 0) +
      totalGas(fila) +
      totalPrestamos(fila)
  );
}

function hojaAntigua(libro: ExcelJS.Workbook) {
  const hoja = libro.addWorksheet('ASOCIACI');
  hoja.addRow(['NOMBRE', 'FECHA', 'MES', 'RUT', 'DV', 'MONTO', 'CUOTA SOCIO', 'GAS']);
  hoja.addRow(['PRUEBA ANTIGUA', 2026, 8, 11111111, rutFicticio('11111111').slice(-1), 0, 0, 0]);
}

export async function crearPlanillaFicticia({
  filas = FILAS_EJEMPLO,
  anio = 2026,
  mes = 8,
  nombreHoja,
  bloquesPrestamo = BLOQUES_PRESTAMO,
  omitirColumnas = [],
  formatoAntiguo = false,
}: {
  filas?: FilaFicticia[];
  anio?: number;
  mes?: number;
  nombreHoja?: string;
  bloquesPrestamo?: readonly string[];
  /** Encabezados a quitar, para probar errores de formato. */
  omitirColumnas?: readonly string[];
  formatoAntiguo?: boolean;
} = {}): Promise<Buffer> {
  const libro = new ExcelJS.Workbook();
  // Hoja vecina: el lector debe ignorarla.
  libro.addWorksheet('RENUNCIA').addRow(['RENUNCIAS']);
  if (formatoAntiguo) {
    hojaAntigua(libro);
    return Buffer.from(await libro.xlsx.writeBuffer());
  }

  const nombreMes = MESES[mes - 1] ?? 'MES';
  const hoja = libro.addWorksheet(
    nombreHoja ?? `Consolidado_${nombreMes.charAt(0)}${nombreMes.slice(1).toLowerCase()}_${anio}`,
  );
  const encabezados = encabezadosPlanilla(mes, bloquesPrestamo).map((e) =>
    omitirColumnas.includes(e) ? 'OMITIDA' : e,
  );
  hoja.addRow([`PLANILLA DESCUENTOS ${nombreMes} ${anio} (TIP_CUO 1 + TIP_CUO 2 UNIDOS)`]);
  hoja.addRow(encabezados);

  for (const fila of filas) {
    const r = hoja.addRow([]);
    // Primera aparición: los repetidos (p. ej. «CUOTA DE <MES>») se escriben por posición.
    const poner = (encabezado: string, v: ExcelJS.CellValue) => {
      const n = encabezado ? encabezados.indexOf(encabezado) + 1 : 0;
      if (n > 0) r.getCell(n).value = v;
    };
    const total = totalFila(fila);
    poner('NOMBRE', fila.nombre);
    poner('FECHA', anio);
    poner('MES', mes);
    poner('RUT', Number(fila.cuerpoRut));
    poner('DV', fila.dvForzado ?? calcularDigitoVerificador(fila.cuerpoRut) ?? '0');
    poner('TOTAL DESCUENTO AFUCHSCEN', total);
    poner('TIP_CUO (1+2)', '1+2');
    poner('ASOCIAC', 'SCENTRAL');
    poner('FACULTAD', fila.facultad);
    const cuota = fila.cuotaSocial ?? 0;
    poner('TOTAL CUOTA SOCIAL 0,5% SUELDO BASE', cuota);
    poner('CUOTA SOCIAL AFUCHSCEN 60%', cuota * 0.6);
    poner('CUOTA SOCIAL FENAFUCH 40%', cuota * 0.4);
    poner('FONDO  SOLIDARIO 0,8%', fila.fondoSolidario ?? 0);
    poner('COOPEUCH ACCIONES', fila.accionesCoopeuch ?? 0);
    poner('COOPEUCH PRESTAMOS', fila.prestamoCoopeuch ?? 0);
    poner('COOPEUCH LIB. AHORRO', fila.libretaAhorro ?? 0);
    poner('FUND.LOPEZ PEREZ.', fila.falp ?? 0);
    for (const kilos of KILOS_GAS) poner(encabezadoGas(kilos), fila.gas?.[kilos] ?? 0);
    poner('TOTAL COSTO VALES DE GAS', totalGas(fila));
    poner('total vales de gas', fila.valesGas ?? 0);
    const inicioPrestamos = encabezados.findIndex((e) => e.startsWith('FECHA PRESTAMO')) + 1;
    for (const prestamo of fila.prestamos ?? []) {
      const columna = inicioPrestamos + prestamo.bloque * 4;
      if (prestamo.fecha) r.getCell(columna).value = new Date(`${prestamo.fecha}T00:00:00Z`);
      r.getCell(columna + 1).value = prestamo.monto;
      r.getCell(columna + 2).value = prestamo.cuotas;
      r.getCell(columna + 3).value = prestamo.cuotaMes;
    }
    const totalPrestamosEncabezado = encabezados.find((e) => e.startsWith('TOTAL DESC PRESTAMOS'));
    if (totalPrestamosEncabezado) poner(totalPrestamosEncabezado, totalPrestamos(fila));
    const ultimoTotal = encabezados.lastIndexOf('TOTAL DESCUENTO AFUCHSCEN');
    if (ultimoTotal >= 0) r.getCell(ultimoTotal + 1).value = total;
  }
  // Fila de totales sin RUT, como la que trae la planilla real al final.
  hoja.addRow(['TOTALES']);

  return Buffer.from(await libro.xlsx.writeBuffer());
}

export type FilaCorreoFicticia = { nombre?: string; rut: string; correo: string | null };

/**
 * Lista de correos con el formato que AFUCH devuelve validado: una fila de
 * encabezados (opcionalmente bajo un título) y las columnas «RUT» y «Mail».
 */
export async function crearListaCorreosFicticia(
  filas: FilaCorreoFicticia[],
  {
    encabezados = ['Nombre completo', 'RUT', 'Mail', 'Coincidencia'],
    titulo,
  }: { encabezados?: readonly string[]; titulo?: string } = {},
): Promise<Buffer> {
  const libro = new ExcelJS.Workbook();
  const hoja = libro.addWorksheet('Socios con mail');
  if (titulo) hoja.addRow([titulo]);
  hoja.addRow([...encabezados]);
  for (const fila of filas) hoja.addRow([fila.nombre ?? 'PRUEBA', fila.rut, fila.correo, 'Exacta']);
  return Buffer.from(await libro.xlsx.writeBuffer());
}
