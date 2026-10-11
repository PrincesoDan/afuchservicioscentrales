import 'server-only';
import { correoSchema, formatearRut } from '@afuch/contracts';
import ExcelJS from 'exceljs';
import { type Actor } from './actor';
import { definirCorreoSocio } from './correos-socios';
import { env } from './env';
import {
  crearPlanillaFicticia,
  rutFicticio,
  type FilaFicticia,
} from './fixtures/planilla-ficticia';
import { importarPlanilla } from './importacion';
import { leerPlanilla, normalizarEncabezado, texto, valor } from './planilla';

/**
 * Base para revisar la aplicación a mano con correos reales y todo lo demás
 * inventado. Parte de un Excel «Nombre, Apellido paterno, Apellido materno,
 * Mail» (sin RUT ni descuentos) y le asigna a cada persona un RUT ficticio
 * (11.111.111-1, 22.222.222-2…) y descuentos de ejemplo. Nunca corre en producción.
 */

/** Un dígito repetido ocho veces: no hay más de nueve RUT ficticios de esta forma. */
const MAXIMO_PERSONAS = 9;
const FILAS_DE_ENCABEZADO = 5;
const PERIODOS = [
  { anio: 2026, mes: 8 },
  { anio: 2026, mes: 9 },
] as const;

export type PersonaDePrueba = { nombre: string; correo: string };

export type LecturaPadron = { personas: PersonaDePrueba[]; errores: string[] };

const sinTildes = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

export async function leerPadronDePrueba(archivo: ArrayBuffer | Buffer): Promise<LecturaPadron> {
  const lectura: LecturaPadron = { personas: [], errores: [] };
  const libro = new ExcelJS.Workbook();
  try {
    await libro.xlsx.load(archivo as ArrayBuffer);
  } catch {
    lectura.errores.push('El archivo no es un Excel (.xlsx) válido.');
    return lectura;
  }

  for (const hoja of libro.worksheets) {
    for (let n = 1; n <= Math.min(FILAS_DE_ENCABEZADO, hoja.rowCount); n += 1) {
      const columnas = new Map<string, number>();
      hoja.getRow(n).eachCell((celda, columna) => {
        columnas.set(sinTildes(normalizarEncabezado(texto(valor(celda.value)))), columna);
      });
      const nombre = columnas.get('NOMBRE');
      const correo = columnas.get('MAIL') ?? columnas.get('E-MAIL') ?? columnas.get('CORREO');
      if (!nombre || !correo) continue;

      const celda = (fila: ExcelJS.Row, columna: number | undefined) =>
        columna ? texto(valor(fila.getCell(columna).value)) : '';
      for (let f = n + 1; f <= hoja.rowCount; f += 1) {
        const fila = hoja.getRow(f);
        const partes = [
          celda(fila, columnas.get('APELLIDO PATERNO')),
          celda(fila, columnas.get('APELLIDO MATERNO')),
          celda(fila, nombre),
        ].filter(Boolean);
        const correoCrudo = celda(fila, correo);
        if (partes.length === 0 && !correoCrudo) continue;
        const correoLeido = correoSchema.safeParse(correoCrudo);
        if (partes.length === 0 || !correoLeido.success) {
          lectura.errores.push(`Fila ${f}: falta el nombre o el correo no es válido.`);
          continue;
        }
        lectura.personas.push({
          nombre: partes.join(' ').toUpperCase(),
          correo: correoLeido.data,
        });
      }
      if (lectura.personas.length > MAXIMO_PERSONAS) {
        lectura.errores.push(`La base de prueba admite hasta ${MAXIMO_PERSONAS} personas.`);
      }
      if (new Set(lectura.personas.map((p) => p.correo)).size !== lectura.personas.length) {
        lectura.errores.push('Hay correos repetidos.');
      }
      return lectura;
    }
  }
  lectura.errores.push('No se encontró una hoja con las columnas «Nombre» y «Mail».');
  return lectura;
}

export function rutDePrueba(indice: number): string {
  return rutFicticio(String(indice + 1).repeat(8));
}

/** Descuentos inventados; varían por persona y por mes para que el historial se distinga. */
function filasDe(persona: PersonaDePrueba, indice: number, mes: number): FilaFicticia[] {
  const base = { nombre: persona.nombre, cuerpoRut: String(indice + 1).repeat(8) };
  const facultad = 'SERVICIOS CENTRALES';
  const extra = mes === 9 ? 1000 : 0;
  return [
    { ...base, facultad, tipoCuota: 1, montos: { 'CUOTA SOCIO': 4000 + indice * 250 } },
    {
      ...base,
      facultad,
      tipoCuota: 2,
      montos: {
        'FONDO CONVENIO SOLIDARIO': 6500 + indice * 300,
        GAS: 18000 + extra,
        // Conceptos que el socio no debe ver (D12): sirven para comprobar que se ocultan.
        'CONVENIO OPTICA GO OPTIC SPA': 15000,
        'BONO INVIERNO DUPLICADO': 30000,
        ...(indice % 2 === 0 ? { 'PRESTAMOS AFUCH': 20000 } : { 'FUND.LOPEZ P.': 9900 }),
      },
      ...(indice % 2 === 0 ? { cuotaInicial: mes === 9 ? 2 : 1, cuotaTermino: 3 } : {}),
    },
  ];
}

export type ResumenBaseDePrueba = { periodos: number; socios: { rut: string; nombre: string }[] };

export async function cargarBaseDePrueba(
  personas: PersonaDePrueba[],
  actor: Actor,
): Promise<ResumenBaseDePrueba> {
  if (env().NODE_ENV === 'production') {
    throw new Error('La base de prueba no se carga en producción.');
  }
  if (personas.length === 0 || personas.length > MAXIMO_PERSONAS) {
    throw new Error(`Se necesitan entre 1 y ${MAXIMO_PERSONAS} personas.`);
  }

  for (const { anio, mes } of PERIODOS) {
    const planilla = await crearPlanillaFicticia({
      anio,
      mes,
      filas: personas.flatMap((p, i) => filasDe(p, i, mes)),
    });
    await importarPlanilla(await leerPlanilla(planilla), actor);
  }

  const socios: ResumenBaseDePrueba['socios'] = [];
  for (const [i, persona] of personas.entries()) {
    const rut = rutDePrueba(i);
    const resultado = await definirCorreoSocio({ rut, correo: persona.correo }, actor);
    if (!resultado.ok) throw new Error(`No se pudo asignar el correo de la fila ${i + 1}.`);
    socios.push({ rut: formatearRut(rut), nombre: persona.nombre });
  }
  return { periodos: PERIODOS.length, socios };
}
