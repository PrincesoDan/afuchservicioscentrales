'use server';

import { correoSocioSchema } from '@afuch/contracts';
import { revalidatePath } from 'next/cache';
import { anularCuenta, cambiarHabilitacion, deshabilitarAusentes } from '@/server/administracion';
import type { Actor } from '@/server/actor';
import { exigirAdmin } from '@/server/auth';
import {
  aplicarCorreos,
  definirCorreoSocio,
  leerListaCorreos,
  previsualizarCorreos,
  type ResumenCorreos,
} from '@/server/correos-socios';
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

export type EstadoCorreos =
  | { etapa: 'inicial' }
  | { etapa: 'error'; mensaje: string }
  | { etapa: 'vista_previa'; resumen: ResumenCorreos }
  | { etapa: 'cargada'; resumen: ResumenCorreos };

/** Mismo patrón que la planilla: sin `confirmar` muestra la vista previa; con `confirmar` carga. */
export async function accionCorreos(_: EstadoCorreos, datos: FormData): Promise<EstadoCorreos> {
  const actor = await actorAdmin();
  const archivo = await archivoDe(datos, 'archivo');
  if (!archivo) return { etapa: 'error', mensaje: 'Selecciona el archivo .xlsx con los correos.' };

  const lectura = await leerListaCorreos(archivo);
  const resumen = await previsualizarCorreos(lectura);

  if (datos.get('confirmar') === 'si' && resumen.errores.length === 0) {
    const aplicado = await aplicarCorreos(lectura, actor);
    revalidatePath('/admin', 'layout');
    return { etapa: 'cargada', resumen: aplicado };
  }
  return { etapa: 'vista_previa', resumen };
}

export type EstadoCorreoSocio = {
  estado: 'inicial' | 'listo' | 'error';
  mensaje?: string;
  errores?: Record<string, string>;
};

export async function accionCorreoSocio(
  _: EstadoCorreoSocio,
  datos: FormData,
): Promise<EstadoCorreoSocio> {
  const actor = await actorAdmin();
  const campos = correoSocioSchema.safeParse(Object.fromEntries(datos));
  if (!campos.success) {
    const errores: Record<string, string> = {};
    for (const problema of campos.error.issues)
      errores[String(problema.path[0] ?? 'formulario')] ??= problema.message;
    return { estado: 'error', errores };
  }

  const resultado = await definirCorreoSocio(campos.data, actor);
  if (!resultado.ok) {
    return {
      estado: 'error',
      mensaje:
        resultado.motivo === 'socio_no_existe'
          ? 'No hay un socio con ese RUT. Los socios se crean al importar la planilla.'
          : 'Ese correo ya está asignado a otro socio.',
    };
  }
  revalidatePath('/admin', 'layout');
  return {
    estado: 'listo',
    mensaje: {
      nuevo: 'Correo guardado. El socio ya puede crear su cuenta.',
      cambiado: 'Correo actualizado. Desde ahora el socio ingresa con el correo nuevo.',
      sin_cambios: 'El socio ya tenía ese correo; no se cambió nada.',
    }[resultado.cambio],
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
