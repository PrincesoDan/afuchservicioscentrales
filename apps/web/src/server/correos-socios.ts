import 'server-only';
import { correoSchema, esRutValido, normalizarRut } from '@afuch/contracts';
import { db, type Prisma } from '@afuch/db';
import ExcelJS from 'exceljs';
import { type Actor } from './actor';
import { auditar } from './auditoria';
import { cifrar, descifrar, hashCorreo, hashRut } from './cifrado';
import { enviarCorreo, plantilla } from './correo';
import { env } from './env';
import { normalizarEncabezado, texto, valor } from './planilla';

/**
 * Carga de los correos de los socios (decisiones D4′ y D11): el correo lo
 * entrega AFUCH en una lista validada (RUT + correo) y es con lo que el socio
 * se registra e ingresa. El socio debe existir antes (viene de la planilla).
 */

const ENCABEZADOS_CORREO = ['MAIL', 'E-MAIL', 'EMAIL', 'CORREO', 'CORREO ELECTRONICO'];
/** El encabezado puede venir bajo un título: se busca en las primeras filas. */
const FILAS_DE_ENCABEZADO = 5;

export type FilaCorreo = { fila: number; rut: string; correo: string };

export type LecturaCorreos = {
  filas: FilaCorreo[];
  filasLeidas: number;
  /** Filas con RUT pero sin correo: se omiten, no son error. */
  sinCorreo: number;
  errores: string[];
};

type Columnas = {
  hoja: ExcelJS.Worksheet;
  filaEncabezado: number;
  rut: number;
  /**
   * La lista «SOCIOS PAGINA WEB» (2026-10-15) trae el RUT sin dígito verificador
   * y el DV en su propia columna: si existe, se juntan antes de validar.
   */
  dv: number;
  correo: number;
};

function ubicarColumnas(libro: ExcelJS.Workbook): Columnas | null {
  for (const hoja of libro.worksheets) {
    for (let n = 1; n <= Math.min(FILAS_DE_ENCABEZADO, hoja.rowCount); n += 1) {
      let rut = 0;
      let dv = 0;
      let correo = 0;
      hoja.getRow(n).eachCell((celda, columna) => {
        const encabezado = normalizarEncabezado(texto(valor(celda.value)))
          .normalize('NFD')
          .replace(/[̀-ͯ]/g, '');
        if (encabezado === 'RUT' && !rut) rut = columna;
        if (encabezado === 'DV' && !dv) dv = columna;
        if (ENCABEZADOS_CORREO.includes(encabezado) && !correo) correo = columna;
      });
      if (rut && correo) return { hoja, filaEncabezado: n, rut, dv, correo };
    }
  }
  return null;
}

/**
 * Lee la lista de correos. Puro: no toca la base. Los errores citan solo el
 * número de fila, nunca el RUT ni el correo (pueden terminar en pantalla o logs).
 */
export async function leerListaCorreos(archivo: ArrayBuffer | Buffer): Promise<LecturaCorreos> {
  const lectura: LecturaCorreos = { filas: [], filasLeidas: 0, sinCorreo: 0, errores: [] };

  const libro = new ExcelJS.Workbook();
  try {
    await libro.xlsx.load(archivo as ArrayBuffer);
  } catch {
    lectura.errores.push('El archivo no es un Excel (.xlsx) válido.');
    return lectura;
  }

  const columnas = ubicarColumnas(libro);
  if (!columnas) {
    lectura.errores.push('No se encontró una hoja con las columnas «RUT» y «Mail».');
    return lectura;
  }

  const filaPorRut = new Map<string, FilaCorreo>();
  const filaPorCorreo = new Map<string, number>();

  for (let n = columnas.filaEncabezado + 1; n <= columnas.hoja.rowCount; n += 1) {
    const fila = columnas.hoja.getRow(n);
    const cuerpo = texto(valor(fila.getCell(columnas.rut).value));
    const dv = columnas.dv ? texto(valor(fila.getCell(columnas.dv).value)) : '';
    const rutCrudo = cuerpo && dv ? `${cuerpo}-${dv}` : cuerpo;
    const correoCrudo = texto(valor(fila.getCell(columnas.correo).value));
    if (!rutCrudo && !correoCrudo) continue;
    lectura.filasLeidas += 1;

    if (!esRutValido(rutCrudo)) {
      lectura.errores.push(`Fila ${n}: el RUT no es válido.`);
      continue;
    }
    if (!correoCrudo) {
      lectura.sinCorreo += 1;
      continue;
    }
    const correo = correoSchema.safeParse(correoCrudo);
    if (!correo.success) {
      lectura.errores.push(`Fila ${n}: el correo no es válido.`);
      continue;
    }

    const rut = normalizarRut(rutCrudo);
    const repetida = filaPorRut.get(rut);
    if (repetida) {
      if (repetida.correo !== correo.data)
        lectura.errores.push(
          `Fila ${n}: el mismo RUT aparece en la fila ${repetida.fila} con otro correo.`,
        );
      continue;
    }
    const otraFila = filaPorCorreo.get(correo.data);
    if (otraFila) {
      lectura.errores.push(`Fila ${n}: el mismo correo está en la fila ${otraFila} con otro RUT.`);
      continue;
    }

    const leida = { fila: n, rut, correo: correo.data };
    filaPorRut.set(rut, leida);
    filaPorCorreo.set(correo.data, n);
    lectura.filas.push(leida);
  }

  if (lectura.filasLeidas === 0) lectura.errores.push('La lista no tiene filas con datos.');
  return lectura;
}

export type ResumenCorreos = {
  filasLeidas: number;
  nuevos: number;
  cambiados: number;
  sinCambios: number;
  /** RUT que no corresponden a ningún socio: se omiten (primero debe importarse la planilla). */
  rutDesconocidos: number;
  sinCorreo: number;
  errores: string[];
};

type Cambio = { socioId: string; correo: string; tipo: 'nuevo' | 'cambiado' };

type Plan = { resumen: ResumenCorreos; cambios: Cambio[] };

async function planificar(lectura: LecturaCorreos): Promise<Plan> {
  const resumen: ResumenCorreos = {
    filasLeidas: lectura.filasLeidas,
    nuevos: 0,
    cambiados: 0,
    sinCambios: 0,
    rutDesconocidos: 0,
    sinCorreo: lectura.sinCorreo,
    errores: [...lectura.errores],
  };
  const cambios: Cambio[] = [];

  const filas = lectura.filas.map((f) => ({
    ...f,
    rutHash: hashRut(f.rut),
    correoHash: hashCorreo(f.correo),
  }));
  const [porRut, porCorreo] = await Promise.all([
    db().socio.findMany({
      where: { rutHash: { in: filas.map((f) => f.rutHash) } },
      select: { id: true, rutHash: true, correoHash: true },
    }),
    db().socio.findMany({
      where: { correoHash: { in: filas.map((f) => f.correoHash) } },
      select: { id: true, correoHash: true },
    }),
  ]);
  const socioPorRut = new Map(porRut.map((s) => [s.rutHash, s]));
  const duenoPorCorreo = new Map(porCorreo.map((s) => [s.correoHash, s.id]));
  // Quien cambia de correo en esta misma lista libera el que tenía.
  const liberan = new Set<string>();
  for (const f of filas) {
    const socio = socioPorRut.get(f.rutHash);
    if (socio && socio.correoHash !== f.correoHash) liberan.add(socio.id);
  }

  for (const f of filas) {
    const socio = socioPorRut.get(f.rutHash);
    if (!socio) {
      resumen.rutDesconocidos += 1;
      continue;
    }
    if (socio.correoHash === f.correoHash) {
      resumen.sinCambios += 1;
      continue;
    }
    const dueno = duenoPorCorreo.get(f.correoHash);
    if (dueno && dueno !== socio.id && !liberan.has(dueno)) {
      resumen.errores.push(`Fila ${f.fila}: el correo ya está asignado a otro socio.`);
      continue;
    }
    const tipo = socio.correoHash ? 'cambiado' : 'nuevo';
    resumen[tipo === 'nuevo' ? 'nuevos' : 'cambiados'] += 1;
    cambios.push({ socioId: socio.id, correo: f.correo, tipo });
  }
  return { resumen, cambios };
}

/** Qué pasaría al aplicar la lista. No modifica nada. */
export async function previsualizarCorreos(lectura: LecturaCorreos): Promise<ResumenCorreos> {
  return (await planificar(lectura)).resumen;
}

/**
 * Deja al socio con el correo nuevo. Si tenía otro: los enlaces enviados al
 * anterior dejan de servir, un registro sin terminar se descarta y una cuenta
 * ya verificada se conserva (devuelve el correo anterior para avisarle).
 */
async function asignar(
  tx: Prisma.TransactionClient,
  socioId: string,
  correo: string,
): Promise<string | null> {
  const socio = await tx.socio.findUniqueOrThrow({
    where: { id: socioId },
    include: { cuenta: true },
  });
  await tx.socio.update({
    where: { id: socioId },
    data: { correoCifrado: cifrar(correo), correoHash: hashCorreo(correo) },
  });
  if (!socio.cuenta || !socio.correoCifrado) return null;
  if (!socio.cuenta.verificadaEn) {
    await tx.cuenta.delete({ where: { id: socio.cuenta.id } });
    return null;
  }
  await tx.token.deleteMany({ where: { cuentaId: socio.cuenta.id, usadoEn: null } });
  return descifrar(socio.correoCifrado);
}

async function avisarCambio(correoAnterior: string): Promise<void> {
  const { html, texto } = plantilla({
    parrafos: [
      'AFUCH Servicios Centrales actualizó el correo asociado a tu cuenta de socio. Desde ahora debes ingresar con el correo nuevo; tu contraseña no cambia.',
      `Si no pediste este cambio, avísanos a ${env().CORREO_CONTACTO_DESTINO}.`,
    ],
  });
  await enviarCorreo({
    para: correoAnterior,
    asunto: 'Cambió el correo de tu cuenta de socio',
    html,
    texto,
  });
}

function ipDe(actor: Actor) {
  return actor.tipo === 'ADMIN' ? actor.ip : null;
}

/** Aplica la lista. Con cualquier error no se modifica nada. */
export async function aplicarCorreos(
  lectura: LecturaCorreos,
  actor: Actor,
): Promise<ResumenCorreos> {
  const { resumen, cambios } = await planificar(lectura);
  if (resumen.errores.length > 0) {
    throw new Error('La lista de correos tiene errores; corrígelos antes de cargarla.');
  }

  const avisos: string[] = [];
  await db().$transaction(
    async (tx) => {
      // Primero se liberan los correos que cambian de dueño dentro de la misma lista.
      await tx.socio.updateMany({
        where: { id: { in: cambios.filter((c) => c.tipo === 'cambiado').map((c) => c.socioId) } },
        data: { correoHash: null },
      });
      for (const cambio of cambios) {
        const anterior = await asignar(tx, cambio.socioId, cambio.correo);
        if (anterior) avisos.push(anterior);
      }
    },
    { timeout: 120_000 },
  );
  for (const anterior of avisos) await avisarCambio(anterior);

  await auditar({
    actorTipo: actor.tipo,
    actorId: actor.id,
    accion: 'correos.importados',
    ip: ipDe(actor),
    detalle: {
      filasLeidas: resumen.filasLeidas,
      nuevos: resumen.nuevos,
      cambiados: resumen.cambiados,
      sinCambios: resumen.sinCambios,
      rutDesconocidos: resumen.rutDesconocidos,
      sinCorreo: resumen.sinCorreo,
    },
  });
  return resumen;
}

export type ResultadoCorreoSocio =
  | { ok: true; cambio: 'nuevo' | 'cambiado' | 'sin_cambios' }
  | { ok: false; motivo: 'socio_no_existe' | 'correo_en_uso' };

/** Asigna o corrige el correo de un socio (formulario de /admin y CLI). */
export async function definirCorreoSocio(
  { rut, correo }: { rut: string; correo: string },
  actor: Actor,
): Promise<ResultadoCorreoSocio> {
  const socio = await db().socio.findUnique({ where: { rutHash: hashRut(rut) } });
  if (!socio) return { ok: false, motivo: 'socio_no_existe' };

  const correoHash = hashCorreo(correo);
  if (socio.correoHash === correoHash) return { ok: true, cambio: 'sin_cambios' };
  const dueno = await db().socio.findUnique({ where: { correoHash } });
  if (dueno) return { ok: false, motivo: 'correo_en_uso' };

  const cambio = socio.correoHash ? 'cambiado' : 'nuevo';
  const anterior = await db().$transaction((tx) => asignar(tx, socio.id, correo));
  if (anterior) await avisarCambio(anterior);

  await auditar({
    actorTipo: actor.tipo,
    actorId: actor.id,
    accion: 'socio.correo_definido',
    entidad: 'Socio',
    entidadId: socio.id,
    ip: ipDe(actor),
    detalle: { cambio },
  });
  return { ok: true, cambio };
}
