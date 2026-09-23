import 'server-only';
import { db } from '@afuch/db';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import type { Actor } from './actor';
import { auditar } from './auditoria';
import { env } from './env';

export const TAMANO_MAXIMO_PDF = 20 * 1024 * 1024;

export const documentoRendicionSchema = z.object({
  titulo: z.string().trim().min(3, 'Escribe un título').max(160),
  categoria: z.string().trim().min(2, 'Escribe una categoría').max(60),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha en formato AAAA-MM-DD'),
});

export type DatosDocumento = z.infer<typeof documentoRendicionSchema>;

function carpeta(): string {
  return path.resolve(env().STORAGE_DIR, 'rendicion');
}

export function esPdf(contenido: Buffer): boolean {
  return contenido.subarray(0, 5).toString('latin1') === '%PDF-';
}

export async function publicarDocumento(datos: DatosDocumento, contenido: Buffer, actor: Actor) {
  if (!esPdf(contenido)) throw new Error('El archivo no es un PDF.');
  if (contenido.length > TAMANO_MAXIMO_PDF) throw new Error('El PDF supera los 20 MB.');

  const archivo = `${randomUUID()}.pdf`;
  await mkdir(carpeta(), { recursive: true });
  await writeFile(path.join(carpeta(), archivo), contenido, { mode: 0o640 });

  const documento = await db().documentoRendicion.create({
    data: {
      titulo: datos.titulo,
      categoria: datos.categoria,
      fecha: new Date(`${datos.fecha}T00:00:00Z`),
      archivo,
      tamano: contenido.length,
      publicadoPor: actor.tipo === 'ADMIN' ? `admin:${actor.id}` : `cli:${actor.id}`,
    },
  });
  await auditar({
    actorTipo: actor.tipo,
    actorId: actor.id,
    accion: 'rendicion.publicada',
    entidad: 'DocumentoRendicion',
    entidadId: documento.id,
    ip: actor.tipo === 'ADMIN' ? actor.ip : null,
    detalle: { titulo: datos.titulo },
  });
  return documento;
}

export async function retirarDocumento(id: string, actor: Actor): Promise<void> {
  const documento = await db().documentoRendicion.delete({ where: { id } });
  await rm(path.join(carpeta(), documento.archivo), { force: true });
  await auditar({
    actorTipo: actor.tipo,
    actorId: actor.id,
    accion: 'rendicion.retirada',
    entidad: 'DocumentoRendicion',
    entidadId: id,
    ip: actor.tipo === 'ADMIN' ? actor.ip : null,
    detalle: { titulo: documento.titulo },
  });
}

export function listarDocumentos() {
  return db().documentoRendicion.findMany({
    orderBy: [{ fecha: 'desc' }, { publicadoEn: 'desc' }],
  });
}

export async function leerDocumento(id: string) {
  const documento = await db().documentoRendicion.findUnique({ where: { id } });
  if (!documento) return null;
  // `archivo` lo genera el sistema (UUID), pero se valida igual antes de tocar el disco.
  if (!/^[0-9a-f-]{36}\.pdf$/.test(documento.archivo)) return null;
  const contenido = await readFile(path.join(carpeta(), documento.archivo));
  return { documento, contenido };
}
