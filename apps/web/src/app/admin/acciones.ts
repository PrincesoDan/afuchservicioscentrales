'use server';

import { revalidatePath } from 'next/cache';
import { anularCuenta, cambiarHabilitacion, deshabilitarAusentes } from '@/server/administracion';
import type { Actor } from '@/server/actor';
import { exigirAdmin } from '@/server/auth';
import { importarPlanilla, type ResumenImportacion } from '@/server/importacion';
import { ipCliente } from '@/server/peticion';
import { leerPlanilla, type ResultadoPlanilla } from '@/server/planilla';
import { documentoRendicionSchema, publicarDocumento, retirarDocumento } from '@/server/rendicion';

async function actorAdmin(): Promise<Actor> {
  const { adminId } = await exigirAdmin();
  return { tipo: 'ADMIN', id: adminId, ip: await ipCliente() };
}

async function archivoDe(datos: FormData, campo: string): Promise<Buffer | null> {
  const archivo = datos.get(campo);
  if (!(archivo instanceof File) || archivo.size === 0) return null;
  return Buffer.from(await archivo.arrayBuffer());
}

export type EstadoPlanilla =
  | { etapa: 'inicial' }
  | { etapa: 'error'; mensaje: string }
  | {
      etapa: 'vista_previa';
      periodo: ResultadoPlanilla['periodo'];
      socios: number;
      filas: number;
      total: number;
      totalPorConcepto: ResultadoPlanilla['resumen']['totalPorConcepto'];
      errores: string[];
      advertencias: string[];
    }
  | { etapa: 'importada'; resumen: ResumenImportacion; advertencias: number };

/** Un solo formulario en dos pasos: sin `confirmar` muestra la vista previa; con `confirmar` importa. */
export async function accionPlanilla(_: EstadoPlanilla, datos: FormData): Promise<EstadoPlanilla> {
  const actor = await actorAdmin();
  const archivo = await archivoDe(datos, 'archivo');
  if (!archivo) return { etapa: 'error', mensaje: 'Selecciona el archivo .xlsx de la planilla.' };

  const resultado = await leerPlanilla(archivo);

  if (datos.get('confirmar') === 'si' && resultado.errores.length === 0) {
    const resumen = await importarPlanilla(resultado, actor);
    revalidatePath('/admin', 'layout');
    return { etapa: 'importada', resumen, advertencias: resultado.advertencias.length };
  }

  return {
    etapa: 'vista_previa',
    periodo: resultado.periodo,
    socios: resultado.socios.length,
    filas: resultado.resumen.filasLeidas,
    total: resultado.resumen.total,
    totalPorConcepto: resultado.resumen.totalPorConcepto,
    errores: resultado.errores,
    advertencias: resultado.advertencias,
  };
}

export type EstadoDocumento = { estado: 'inicial' | 'listo' | 'error'; mensaje?: string };

export async function accionPublicarDocumento(
  _: EstadoDocumento,
  datos: FormData,
): Promise<EstadoDocumento> {
  const actor = await actorAdmin();
  const campos = documentoRendicionSchema.safeParse(Object.fromEntries(datos));
  if (!campos.success) return { estado: 'error', mensaje: campos.error.issues[0]?.message };
  const archivo = await archivoDe(datos, 'archivo');
  if (!archivo) return { estado: 'error', mensaje: 'Selecciona el PDF.' };
  try {
    await publicarDocumento(campos.data, archivo, actor);
  } catch (error) {
    return {
      estado: 'error',
      mensaje: error instanceof Error ? error.message : 'No se pudo publicar.',
    };
  }
  revalidatePath('/admin/rendicion');
  return { estado: 'listo', mensaje: `Publicado: ${campos.data.titulo}` };
}

export async function accionRetirarDocumento(datos: FormData): Promise<void> {
  const actor = await actorAdmin();
  await retirarDocumento(String(datos.get('id')), actor);
  revalidatePath('/admin/rendicion');
}

export async function accionHabilitacion(datos: FormData): Promise<void> {
  const actor = await actorAdmin();
  await cambiarHabilitacion(String(datos.get('socioId')), datos.get('habilitado') === 'si', actor);
  revalidatePath('/admin/socios');
}

export async function accionAnularCuenta(datos: FormData): Promise<void> {
  const actor = await actorAdmin();
  await anularCuenta(String(datos.get('socioId')), actor);
  revalidatePath('/admin/socios');
}

export async function accionDeshabilitarAusentes(): Promise<void> {
  const actor = await actorAdmin();
  await deshabilitarAusentes(actor);
  revalidatePath('/admin/socios');
}
