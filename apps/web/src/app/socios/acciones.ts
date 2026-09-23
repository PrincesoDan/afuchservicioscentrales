'use server';

import { definirContrasenaSchema, recuperarSchema, registroSchema } from '@afuch/contracts';
import type { ZodError } from 'zod';
import { definirContrasena, registrar, solicitarRecuperacion } from '@/server/cuentas';
import { ipCliente } from '@/server/peticion';
import { permitir } from '@/server/rate-limit';

export type EstadoFormulario = {
  estado: 'inicial' | 'listo' | 'error';
  mensaje?: string;
  errores?: Record<string, string>;
};

function erroresDe(error: ZodError): Record<string, string> {
  const errores: Record<string, string> = {};
  for (const problema of error.issues) {
    const campo = String(problema.path[0] ?? 'formulario');
    errores[campo] ??= problema.message;
  }
  return errores;
}

const DEMASIADOS_INTENTOS: EstadoFormulario = {
  estado: 'error',
  mensaje: 'Hiciste demasiados intentos. Espera un rato antes de volver a intentarlo.',
};

export async function accionRegistro(
  _: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const resultado = registroSchema.safeParse(Object.fromEntries(datos));
  if (!resultado.success) return { estado: 'error', errores: erroresDe(resultado.error) };

  const ip = await ipCliente();
  if (!(await permitir('registro', ip))) return DEMASIADOS_INTENTOS;

  await registrar(resultado.data, ip);
  // Mismo mensaje para socios y no socios: la respuesta no revela quién está en la nómina.
  return {
    estado: 'listo',
    mensaje: `Si tu RUT está en la nómina de socios, te enviamos un correo a ${resultado.data.correo} para confirmar tu cuenta. Revisa también la carpeta de spam.`,
  };
}

export async function accionRecuperar(
  _: EstadoFormulario,
  datos: FormData,
): Promise<EstadoFormulario> {
  const resultado = recuperarSchema.safeParse(Object.fromEntries(datos));
  if (!resultado.success) return { estado: 'error', errores: erroresDe(resultado.error) };

  const ip = await ipCliente();
  if (!(await permitir('recuperacion', ip))) return DEMASIADOS_INTENTOS;

  await solicitarRecuperacion(resultado.data.rut, ip);
  return {
    estado: 'listo',
    mensaje:
      'Si tu RUT tiene una cuenta activa, te enviamos un enlace al correo registrado. El enlace vence en 1 hora.',
  };
}

async function canjear(
  datos: FormData,
  tipo: 'VERIFICACION' | 'RECUPERACION',
): Promise<EstadoFormulario> {
  const resultado = definirContrasenaSchema.safeParse(Object.fromEntries(datos));
  if (!resultado.success) return { estado: 'error', errores: erroresDe(resultado.error) };

  const respuesta = await definirContrasena(resultado.data, tipo, await ipCliente());
  if (!respuesta.ok) {
    return {
      estado: 'error',
      mensaje: 'El enlace no es válido o ya venció. Solicita uno nuevo.',
    };
  }
  return {
    estado: 'listo',
    mensaje: 'Tu contraseña quedó guardada. Ya puedes ingresar con tu RUT.',
  };
}

export async function accionVerificar(_: EstadoFormulario, datos: FormData) {
  return canjear(datos, 'VERIFICACION');
}

export async function accionRestablecer(_: EstadoFormulario, datos: FormData) {
  return canjear(datos, 'RECUPERACION');
}
