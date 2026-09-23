import { esRutValido } from '@afuch/contracts';
import type { ConceptoDescuento } from '@afuch/db';
import ExcelJS from 'exceljs';

/**
 * Lee la hoja `ASOCIACI` de la planilla mensual de AFUCH. No escribe nada: el
 * resultado se muestra como vista previa y solo se importa si no hay errores.
 * Formato y decisiones: docs/superpowers/plans/2026-09-23-plan-cierre-propuesta.md §3.2 y §5.
 */

export const HOJA_SOCIOS = 'ASOCIACI';

/** Encabezado de la planilla → concepto. El orden es el de las columnas Q..Z. */
export const COLUMNAS_CONCEPTO: ReadonlyArray<readonly [string, ConceptoDescuento]> = [
  ['CUOTA SOCIO', 'CUOTA_SOCIAL'],
  ['FONDO CONVENIO SOLIDARIO', 'FONDO_SOLIDARIO'],
  ['ACCIONES1', 'ACCIONES_COOPEUCH'],
  ['COOPEUCH PRESTAMOS', 'PRESTAMO_COOPEUCH'],
  ['LIBAHORR1', 'LIBRETA_AHORRO'],
  ['FUND.LOPEZ P.', 'SEGURO_ONCOLOGICO_FALP'],
  ['CONVENIO OPTICA GO OPTIC SPA', 'OPTICA_GO_OPTIC'],
  ['BONO INVIERNO DUPLICADO', 'REINTEGRO_BONO_INVIERNO'],
  ['GAS', 'GAS_ABASTIBLE'],
  ['PRESTAMOS AFUCH', 'PRESTAMO_AFUCH'],
];

const COLUMNAS_OBLIGATORIAS = [
  'NOMBRE',
  'FECHA',
  'MES',
  'RUT',
  'DV',
  'FACULTAD',
  'MONTO',
  'C/INICIAL1',
  'C/TERM1',
  ...COLUMNAS_CONCEPTO.map(([encabezado]) => encabezado),
] as const;

export type CuotaPrestamo = { cuota: number; total: number };

export type LineaLeida = {
  concepto: ConceptoDescuento;
  monto: number;
  detalleCuotas?: CuotaPrestamo[];
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

function normalizarEncabezado(texto: string): string {
  return texto.trim().replace(/\s+/g, ' ').toUpperCase();
}

/** Aplana los tipos de celda de exceljs (fórmulas, texto enriquecido, hipervínculos). */
function valor(celda: ExcelJS.CellValue): Primitivo {
  if (celda === null || celda === undefined) return null;
  if (typeof celda !== 'object' || celda instanceof Date) return celda;
  if ('result' in celda) return valor(celda.result as ExcelJS.CellValue);
  if ('richText' in celda) return celda.richText.map((parte) => parte.text).join('');
  if ('text' in celda) return String(celda.text);
  if ('error' in celda) return null;
  return null;
}

function texto(v: Primitivo): string {
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

/**
 * `C/INICIAL1` = cuota del mes, `C/TERM1` = total de cuotas. Con varios
 * préstamos vienen separados por guion en el mismo orden: "1-2" y "3-3".
 * Devuelve `null` si no se puede interpretar.
 */
export function interpretarCuotas(inicial: string, termino: string): CuotaPrestamo[] | null {
  const partesInicial = inicial.split('-').map((p) => p.trim());
  const partesTermino = termino.split('-').map((p) => p.trim());
  if (partesInicial.length !== partesTermino.length) return null;

  const cuotas: CuotaPrestamo[] = [];
  for (let i = 0; i < partesInicial.length; i += 1) {
    const cuota = Number(partesInicial[i]);
    const total = Number(partesTermino[i]);
    if (!Number.isInteger(cuota) || !Number.isInteger(total)) return null;
    if (cuota < 1 || total < 1 || cuota > total) return null;
    cuotas.push({ cuota, total });
  }
  return cuotas;
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

  const hoja = libro.worksheets.find((h) => normalizarEncabezado(h.name) === HOJA_SOCIOS);
  if (!hoja) {
    resultado.errores.push(`No se encontró la hoja "${HOJA_SOCIOS}".`);
    return resultado;
  }

  const columnas = new Map<string, number>();
  hoja.getRow(1).eachCell((celda, numeroColumna) => {
    const encabezado = normalizarEncabezado(texto(valor(celda.value)));
    if (encabezado && !columnas.has(encabezado)) columnas.set(encabezado, numeroColumna);
  });

  const faltantes = COLUMNAS_OBLIGATORIAS.filter((c) => !columnas.has(c));
  if (faltantes.length > 0) {
    resultado.errores.push(
      `Faltan columnas en la fila 1 de "${HOJA_SOCIOS}": ${faltantes.join(', ')}.`,
    );
    return resultado;
  }

  const col = (nombre: (typeof COLUMNAS_OBLIGATORIAS)[number]) => columnas.get(nombre)!;
  const periodos = new Set<string>();
  const porRut = new Map<string, SocioLeido>();

  hoja.eachRow((fila, numeroFila) => {
    if (numeroFila === 1) return;
    const celda = (nombre: (typeof COLUMNAS_OBLIGATORIAS)[number]) =>
      valor(fila.getCell(col(nombre)).value);

    const cuerpoRut = texto(celda('RUT')).replace(/\./g, '');
    // Filas sin RUT: títulos, totales o separadores. No son socios.
    if (!cuerpoRut) return;

    resultado.resumen.filasLeidas += 1;
    const rut = `${cuerpoRut}${texto(celda('DV')).toUpperCase()}`;
    if (!esRutValido(rut)) {
      // No bloquea: la planilla real trae algunos DV mal digitados y detener todo
      // el mes por ellos dejaría sin datos al resto. La fila se excluye y se
      // informa para pedir la corrección a AFUCH.
      resultado.advertencias.push(
        `Fila ${numeroFila}: RUT con dígito verificador inválido; fila excluida (pedir corrección a AFUCH).`,
      );
      return;
    }

    const anio = numero(celda('FECHA'));
    const mes = numero(celda('MES'));
    if (!anio || !mes || !Number.isInteger(anio) || !Number.isInteger(mes) || mes < 1 || mes > 12) {
      resultado.errores.push(`Fila ${numeroFila}: FECHA/MES no es un periodo válido.`);
      return;
    }
    periodos.add(`${anio}-${mes}`);
    resultado.periodo ??= { anio, mes };

    let socio = porRut.get(rut);
    if (!socio) {
      socio = {
        rut,
        nombre: texto(celda('NOMBRE')),
        facultad: texto(celda('FACULTAD')) || null,
        lineas: [],
      };
      porRut.set(rut, socio);
    }

    let sumaFila = 0;
    for (const [encabezado, concepto] of COLUMNAS_CONCEPTO) {
      const monto = numero(
        valor(fila.getCell(col(encabezado as (typeof COLUMNAS_OBLIGATORIAS)[number])).value),
      );
      if (monto === null) {
        resultado.errores.push(`Fila ${numeroFila}: "${encabezado}" no es un número.`);
        continue;
      }
      if (monto === 0) continue;
      const montoEntero = Math.round(monto);
      if (montoEntero !== monto) {
        resultado.advertencias.push(
          `Fila ${numeroFila}: "${encabezado}" tenía decimales; se redondeó a ${montoEntero}.`,
        );
      }
      sumaFila += montoEntero;

      const linea: LineaLeida = { concepto, monto: montoEntero };
      if (concepto === 'PRESTAMO_AFUCH') {
        const inicial = texto(celda('C/INICIAL1'));
        const termino = texto(celda('C/TERM1'));
        if (inicial || termino) {
          const cuotas = interpretarCuotas(inicial, termino);
          if (cuotas) linea.detalleCuotas = cuotas;
          else
            resultado.advertencias.push(
              `Fila ${numeroFila}: cuotas del préstamo AFUCH ("${inicial}" / "${termino}") no se pudieron interpretar; se muestra solo el monto.`,
            );
        }
      }

      const existente = socio.lineas.find((l) => l.concepto === concepto);
      if (existente) {
        existente.monto += linea.monto;
        if (linea.detalleCuotas)
          existente.detalleCuotas = [...(existente.detalleCuotas ?? []), ...linea.detalleCuotas];
      } else {
        socio.lineas.push(linea);
      }
      resultado.resumen.totalPorConcepto[concepto] =
        (resultado.resumen.totalPorConcepto[concepto] ?? 0) + montoEntero;
      resultado.resumen.total += montoEntero;
    }

    const montoPlanilla = numero(celda('MONTO'));
    if (montoPlanilla !== null && Math.round(montoPlanilla) !== sumaFila) {
      resultado.advertencias.push(
        `Fila ${numeroFila}: MONTO (${Math.round(montoPlanilla)}) no coincide con la suma de conceptos (${sumaFila}).`,
      );
    }
  });

  if (periodos.size > 1) {
    resultado.errores.push(
      `La hoja mezcla ${periodos.size} periodos distintos; debe traer uno solo.`,
    );
  }
  if (porRut.size === 0 && resultado.errores.length === 0) {
    resultado.errores.push(`La hoja "${HOJA_SOCIOS}" no tiene filas con RUT.`);
  }

  resultado.socios = [...porRut.values()];
  return resultado;
}
