import { esRutValido } from '@afuch/contracts';
import type { ConceptoDescuento } from '@afuch/db';
import ExcelJS from 'exceljs';
import type { DetalleDescuento, PrestamoDetalle } from '@/lib/detalle-descuento';

/**
 * Lee la «PLANILLA DESCUENTOS PAGINA WEB» que AFUCH entrega desde octubre de 2026.
 * No escribe nada: el resultado se muestra como vista previa y solo se importa si
 * no hay errores. Formato y decisiones:
 * docs/superpowers/specs/2026-11-18-planilla-nuevo-formato-design.md.
 */

/** Encabezado → concepto, en el orden en que se muestran al socio. */
const CONCEPTOS_FIJOS: ReadonlyArray<readonly [string, ConceptoDescuento]> = [
  ['TOTAL CUOTA SOCIAL 0,5% SUELDO BASE', 'CUOTA_SOCIAL'],
  ['FONDO SOLIDARIO 0,8%', 'FONDO_SOLIDARIO'],
  ['COOPEUCH ACCIONES', 'ACCIONES_COOPEUCH'],
  ['COOPEUCH PRESTAMOS', 'PRESTAMO_COOPEUCH'],
  ['COOPEUCH LIB. AHORRO', 'LIBRETA_AHORRO'],
  ['FUND.LOPEZ PEREZ.', 'SEGURO_ONCOLOGICO_FALP'],
  ['TOTAL COSTO VALES DE GAS', 'GAS_ABASTIBLE'],
];

const GAS_POR_TIPO = [
  ['GAS05N', 5],
  ['GAS11N', 11],
  ['GAS15N', 15],
  ['GAS45N', 45],
] as const;

const CUOTA_60 = 'CUOTA SOCIAL AFUCHSCEN 60%';
const CUOTA_40 = 'CUOTA SOCIAL FENAFUCH 40%';
const TOTAL_FILA = 'TOTAL DESCUENTO AFUCHSCEN';
const VALES_GAS = 'TOTAL VALES DE GAS';

const COLUMNAS_OBLIGATORIAS = [
  'NOMBRE',
  'FECHA',
  'MES',
  'RUT',
  'DV',
  'FACULTAD',
  TOTAL_FILA,
  CUOTA_60,
  CUOTA_40,
  VALES_GAS,
  ...CONCEPTOS_FIJOS.map(([encabezado]) => encabezado),
  ...GAS_POR_TIPO.map(([encabezado]) => encabezado),
];

/** Columnas que identifican la hoja de descuentos entre las demás del libro. */
const COLUMNAS_IDENTIFICADORAS = ['NOMBRE', 'RUT', TOTAL_FILA];
const FILAS_CON_ENCABEZADOS = 5;
const HOJA_FORMATO_ANTIGUO = 'ASOCIACI';

export type LineaLeida = {
  concepto: ConceptoDescuento;
  monto: number;
  detalle?: DetalleDescuento;
};

export type SocioLeido = {
  /** Normalizado: cuerpo + DV, sin puntos ni guion. */
  rut: string;
  nombre: string;
  facultad: string | null;
  lineas: LineaLeida[];
};

export type ResultadoPlanilla = {
  periodo: { anio: number; mes: number } | null;
  socios: SocioLeido[];
  errores: string[];
  advertencias: string[];
  resumen: {
    filasLeidas: number;
    totalPorConcepto: Partial<Record<ConceptoDescuento, number>>;
    total: number;
  };
};

type Primitivo = string | number | boolean | Date | null;

export function normalizarEncabezado(texto: string): string {
  return texto.trim().replace(/\s+/g, ' ').toUpperCase();
}

/** Aplana los tipos de celda de exceljs (fórmulas, texto enriquecido, hipervínculos). */
export function valor(celda: ExcelJS.CellValue): Primitivo {
  if (celda === null || celda === undefined) return null;
  if (typeof celda !== 'object' || celda instanceof Date) return celda;
  if ('result' in celda) return valor(celda.result as ExcelJS.CellValue);
  if ('richText' in celda) return celda.richText.map((parte) => parte.text).join('');
  if ('text' in celda) return String(celda.text);
  if ('error' in celda) return null;
  return null;
}

export function texto(v: Primitivo): string {
  if (v === null) return '';
  if (v instanceof Date) return v.toISOString();
  return String(v).trim().replace(/\s+/g, ' ');
}

function numero(v: Primitivo): number | null {
  if (v === null || v === '') return 0;
  if (typeof v === 'number') return v;
  const limpio = String(v).trim().replace(/\./g, '').replace(',', '.');
  if (limpio === '') return 0;
  const n = Number(limpio);
  return Number.isFinite(n) ? n : null;
}

/** «2-3» = cuota 2 de 3. Devuelve `null` si no se puede interpretar. */
export function interpretarCuotaPrestamo(
  textoCuotas: string,
): { cuota: number; total: number } | null {
  const partes = textoCuotas.split('-').map((p) => p.trim());
  if (partes.length !== 2 || partes.some((p) => !/^\d+$/.test(p))) return null;
  const [cuota, total] = partes.map(Number) as [number, number];
  if (cuota < 1 || total < 1 || cuota > total) return null;
  return { cuota, total };
}

type Encabezados = {
  fila: number;
  /** Columna → encabezado normalizado, en orden de columna. */
  porColumna: Map<number, string>;
  /** Encabezado → primera columna donde aparece (los hay repetidos). */
  columna: Map<string, number>;
};

function leerEncabezados(hoja: ExcelJS.Worksheet): Encabezados | null {
  for (let fila = 1; fila <= FILAS_CON_ENCABEZADOS; fila += 1) {
    const porColumna = new Map<number, string>();
    const columna = new Map<string, number>();
    hoja.getRow(fila).eachCell((celda, numeroColumna) => {
      const encabezado = normalizarEncabezado(texto(valor(celda.value)));
      if (!encabezado) return;
      porColumna.set(numeroColumna, encabezado);
      if (!columna.has(encabezado)) columna.set(encabezado, numeroColumna);
    });
    if (COLUMNAS_IDENTIFICADORAS.every((c) => columna.has(c))) return { fila, porColumna, columna };
  }
  return null;
}

type BloquePrestamo = { fecha: number; monto: number; cuotas: number; cuotaMes: number };

/**
 * Los préstamos vienen en bloques de 4 columnas, uno por mes de otorgamiento, y
 * sus nombres cambian cada mes («CUOTA DE <MES>» se repite en todos). Por eso se
 * detectan por posición a partir de cada «FECHA PRESTAMO…».
 */
function bloquesPrestamo(
  hoja: ExcelJS.Worksheet,
  { porColumna }: Encabezados,
  errores: string[],
): BloquePrestamo[] {
  const bloques: BloquePrestamo[] = [];
  const esperados = ['MONTO PRESTAMO', 'CUOTAS PRESTAMO', 'CUOTA DE'];
  for (const [columna, encabezado] of porColumna) {
    if (!encabezado.startsWith('FECHA PRESTAMO')) continue;
    const enOrden = esperados.every((prefijo, i) =>
      (porColumna.get(columna + i + 1) ?? '').startsWith(prefijo),
    );
    if (!enOrden) {
      errores.push(
        `Las columnas del préstamo que empieza en la columna ${hoja.getColumn(columna).letter} no siguen el orden FECHA, MONTO, CUOTAS, CUOTA DEL MES.`,
      );
      continue;
    }
    bloques.push({
      fecha: columna,
      monto: columna + 1,
      cuotas: columna + 2,
      cuotaMes: columna + 3,
    });
  }
  if (bloques.length === 0 && errores.length === 0) {
    errores.push('No se encontraron las columnas de préstamos AFUCH (FECHA PRESTAMO…).');
  }
  return bloques;
}

function fechaIso(v: Primitivo): string | null {
  return v instanceof Date && !Number.isNaN(v.getTime()) ? v.toISOString().slice(0, 10) : null;
}

export async function leerPlanilla(archivo: ArrayBuffer | Buffer): Promise<ResultadoPlanilla> {
  const resultado: ResultadoPlanilla = {
    periodo: null,
    socios: [],
    errores: [],
    advertencias: [],
    resumen: { filasLeidas: 0, totalPorConcepto: {}, total: 0 },
  };

  const libro = new ExcelJS.Workbook();
  try {
    await libro.xlsx.load(archivo as ArrayBuffer);
  } catch {
    resultado.errores.push('El archivo no es un Excel (.xlsx) válido.');
    return resultado;
  }

  let hoja: ExcelJS.Worksheet | undefined;
  let encontrados: Encabezados | null = null;
  for (const candidata of libro.worksheets) {
    encontrados = leerEncabezados(candidata);
    if (encontrados) {
      hoja = candidata;
      break;
    }
  }
  if (!hoja || !encontrados) {
    const esAntigua = libro.worksheets.some(
      (h) => normalizarEncabezado(h.name) === HOJA_FORMATO_ANTIGUO,
    );
    resultado.errores.push(
      esAntigua
        ? 'Es el formato antiguo de la planilla. AFUCH ahora entrega la «PLANILLA DESCUENTOS PAGINA WEB»; sube esa.'
        : `No se encontró la hoja de descuentos (una fila con las columnas ${COLUMNAS_IDENTIFICADORAS.join(', ')}).`,
    );
    return resultado;
  }
  const encabezados = encontrados;

  const faltantes = COLUMNAS_OBLIGATORIAS.filter((c) => !encabezados.columna.has(c));
  if (faltantes.length > 0) {
    resultado.errores.push(
      `Faltan columnas en la fila ${encabezados.fila} de "${hoja.name}": ${faltantes.join(', ')}.`,
    );
    return resultado;
  }
  const bloques = bloquesPrestamo(hoja, encabezados, resultado.errores);
  if (resultado.errores.length > 0) return resultado;

  const col = (encabezado: string) => encabezados.columna.get(encabezado)!;
  const columnaTotalPrestamos = [...encabezados.porColumna].find(([, e]) =>
    e.startsWith('TOTAL DESC PRESTAMOS'),
  )?.[0];
  const periodos = new Set<string>();
  const porRut = new Map<string, { fila: number; socio: SocioLeido }>();

  hoja.eachRow((fila, numeroFila) => {
    if (numeroFila <= encabezados.fila) return;
    const celda = (columna: number) => valor(fila.getCell(columna).value);

    const cuerpoRut = texto(celda(col('RUT'))).replace(/\./g, '');
    // Filas sin RUT: títulos, totales o separadores. No son socios.
    if (!cuerpoRut) return;

    resultado.resumen.filasLeidas += 1;
    const rut = `${cuerpoRut}${texto(celda(col('DV'))).toUpperCase()}`;
    if (!esRutValido(rut)) {
      // No bloquea: la planilla real trae algunos DV mal digitados y detener todo
      // el mes por ellos dejaría sin datos al resto. La fila se excluye y se
      // informa para pedir la corrección a AFUCH.
      resultado.advertencias.push(
        `Fila ${numeroFila}: RUT con dígito verificador inválido; fila excluida (pedir corrección a AFUCH).`,
      );
      return;
    }
    const repetido = porRut.get(rut);
    if (repetido) {
      // En este formato cada socio viene en una sola fila: sumar dos sería adivinar.
      resultado.errores.push(`RUT repetido en las filas ${repetido.fila} y ${numeroFila}.`);
      return;
    }

    const anio = numero(celda(col('FECHA')));
    const mes = numero(celda(col('MES')));
    if (!anio || !mes || !Number.isInteger(anio) || !Number.isInteger(mes) || mes < 1 || mes > 12) {
      resultado.errores.push(`Fila ${numeroFila}: FECHA/MES no es un periodo válido.`);
      return;
    }
    periodos.add(`${anio}-${mes}`);
    resultado.periodo ??= { anio, mes };

    /** Monto entero de una columna; `null` si no es número (el error ya quedó anotado). */
    const monto = (columna: number): number | null => {
      const n = numero(celda(columna));
      const encabezado = encabezados.porColumna.get(columna) ?? '';
      if (n === null) {
        resultado.errores.push(`Fila ${numeroFila}: "${encabezado}" no es un número.`);
        return null;
      }
      const entero = Math.round(n);
      if (entero !== n) {
        resultado.advertencias.push(
          `Fila ${numeroFila}: "${encabezado}" tenía decimales; se redondeó a ${entero}.`,
        );
      }
      return entero;
    };

    const socio: SocioLeido = {
      rut,
      nombre: texto(celda(col('NOMBRE'))),
      facultad: texto(celda(col('FACULTAD'))) || null,
      lineas: [],
    };
    porRut.set(rut, { fila: numeroFila, socio });

    // El gas por tipo se compara siempre: la planilla real trae filas con vales
    // por tipo y el total de gas vacío, y eso debe verse en la vista previa.
    const gasPorTipo: { kilos: 5 | 11 | 15 | 45; monto: number }[] = [];
    for (const [encabezadoGas, kilos] of GAS_POR_TIPO) {
      const montoTipo = monto(col(encabezadoGas));
      if (montoTipo) gasPorTipo.push({ kilos, monto: montoTipo });
    }

    for (const [encabezado, concepto] of CONCEPTOS_FIJOS) {
      const montoConcepto = monto(col(encabezado));

      if (concepto === 'GAS_ABASTIBLE') {
        const sumaTipos = gasPorTipo.reduce((a, t) => a + t.monto, 0);
        if (montoConcepto !== null && sumaTipos !== montoConcepto) {
          resultado.advertencias.push(
            `Fila ${numeroFila}: los vales de gas por tipo (${sumaTipos}) no suman el total de gas (${montoConcepto}).`,
          );
        }
      }
      if (!montoConcepto) continue;
      const linea: LineaLeida = { concepto, monto: montoConcepto };

      if (concepto === 'CUOTA_SOCIAL') {
        // El 60/40 trae decimales siempre: se redondea la parte de AFUCHSCEN y
        // FENAFUCH recibe el resto, para que siempre sumen la cuota.
        const sesenta = numero(celda(col(CUOTA_60)));
        const afuchscen = Math.round(sesenta ?? montoConcepto * 0.6);
        linea.detalle = { tipo: 'cuotaSocial', afuchscen, fenafuch: montoConcepto - afuchscen };
      }

      if (concepto === 'GAS_ABASTIBLE') {
        const vales = numero(celda(col(VALES_GAS)));
        linea.detalle = {
          tipo: 'gas',
          porTipo: gasPorTipo,
          vales: vales && vales > 0 ? Math.round(vales) : null,
        };
      }

      socio.lineas.push(linea);
    }

    const prestamos: PrestamoDetalle[] = [];
    for (const bloque of bloques) {
      const montoCuota = monto(bloque.cuotaMes);
      if (!montoCuota) continue;
      const textoCuotas = texto(celda(bloque.cuotas));
      const cuotas = interpretarCuotaPrestamo(textoCuotas);
      if (!cuotas) {
        resultado.advertencias.push(
          `Fila ${numeroFila}: las cuotas del préstamo «${textoCuotas}» no se pudieron interpretar; se muestra sin cuota n de m.`,
        );
      }
      prestamos.push({
        fecha: fechaIso(celda(bloque.fecha)),
        montoPrestado: monto(bloque.monto) ?? 0,
        cuota: cuotas?.cuota ?? null,
        totalCuotas: cuotas?.total ?? null,
        montoCuota,
      });
    }
    if (prestamos.length > 0) {
      const montoPrestamos = prestamos.reduce((a, p) => a + p.montoCuota, 0);
      socio.lineas.push({
        concepto: 'PRESTAMO_AFUCH',
        monto: montoPrestamos,
        detalle: { tipo: 'prestamosAfuch', prestamos },
      });
      const totalPlanilla =
        columnaTotalPrestamos === undefined ? null : numero(celda(columnaTotalPrestamos));
      if (totalPlanilla !== null && Math.round(totalPlanilla) !== montoPrestamos) {
        resultado.advertencias.push(
          `Fila ${numeroFila}: el total de préstamos AFUCH (${Math.round(totalPlanilla)}) no coincide con la suma de sus cuotas (${montoPrestamos}).`,
        );
      }
    }

    const sumaFila = socio.lineas.reduce((a, l) => a + l.monto, 0);
    const totalFila = numero(celda(col(TOTAL_FILA)));
    if (totalFila !== null && Math.round(totalFila) !== sumaFila) {
      resultado.advertencias.push(
        `Fila ${numeroFila}: TOTAL DESCUENTO AFUCHSCEN (${Math.round(totalFila)}) no coincide con la suma de conceptos (${sumaFila}).`,
      );
    }
    for (const linea of socio.lineas) {
      resultado.resumen.totalPorConcepto[linea.concepto] =
        (resultado.resumen.totalPorConcepto[linea.concepto] ?? 0) + linea.monto;
      resultado.resumen.total += linea.monto;
    }
  });

  if (periodos.size > 1) {
    resultado.errores.push(
      `La hoja mezcla ${periodos.size} periodos distintos; debe traer uno solo.`,
    );
  }
  if (porRut.size === 0 && resultado.errores.length === 0) {
    resultado.errores.push(`La hoja "${hoja.name}" no tiene filas con RUT.`);
  }

  resultado.socios = [...porRut.values()].map(({ socio }) => socio);
  return resultado;
}
