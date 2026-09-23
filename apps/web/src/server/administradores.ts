import 'server-only';
import type { IngresoAdminInput } from '@afuch/contracts';
import { db } from '@afuch/db';
import { generateSecret, generateURI, verify } from 'otplib';
import { auditar } from './auditoria';
import { cifrar, descifrar } from './cifrado';
import { hashContrasena, verificarContrasena, verificarSenuelo } from './contrasenas';

/**
 * Crea (o reemplaza la contraseña y el segundo factor de) un admin de La
 * Palanca. Devuelve el secreto TOTP una sola vez, para cargarlo en la app autenticadora.
 */
export async function crearAdministrador(email: string, contrasena: string, actorCli: string) {
  const secreto = generateSecret();
  const datos = {
    passwordHash: await hashContrasena(contrasena),
    totpSecretCifrado: cifrar(secreto),
    activo: true,
  };
  const admin = await db().administrador.upsert({
    where: { email: email.toLowerCase() },
    create: { email: email.toLowerCase(), ...datos },
    update: datos,
  });
  await auditar({
    actorTipo: 'SISTEMA',
    actorId: actorCli,
    accion: 'admin.creado',
    entidad: 'Administrador',
    entidadId: admin.id,
  });
  return {
    admin,
    secreto,
    uri: generateURI({ issuer: 'AFUCH Servicios Centrales', label: admin.email, secret: secreto }),
  };
}

export async function desactivarAdministrador(email: string, actorCli: string): Promise<boolean> {
  const { count } = await db().administrador.updateMany({
    where: { email: email.toLowerCase() },
    data: { activo: false },
  });
  if (count > 0)
    await auditar({
      actorTipo: 'SISTEMA',
      actorId: actorCli,
      accion: 'admin.desactivado',
      detalle: { email },
    });
  return count > 0;
}

export async function verificarIngresoAdmin(
  { email, contrasena, codigo }: IngresoAdminInput,
  ip: string,
): Promise<string | null> {
  const admin = await db().administrador.findUnique({ where: { email } });
  if (!admin || !admin.activo) {
    await verificarSenuelo(contrasena);
    await auditar({ actorTipo: 'ANONIMO', accion: 'admin.ingreso_fallido', ip });
    return null;
  }
  const contrasenaOk = await verificarContrasena(admin.passwordHash, contrasena);
  const { valid: codigoOk } = await verify({
    secret: descifrar(admin.totpSecretCifrado),
    token: codigo,
    epochTolerance: 30,
  });
  if (!contrasenaOk || !codigoOk) {
    await auditar({
      actorTipo: 'ANONIMO',
      accion: 'admin.ingreso_fallido',
      entidad: 'Administrador',
      entidadId: admin.id,
      ip,
    });
    return null;
  }
  await auditar({
    actorTipo: 'ADMIN',
    actorId: admin.id,
    accion: 'admin.ingreso',
    entidad: 'Administrador',
    entidadId: admin.id,
    ip,
  });
  return admin.id;
}

export async function adminActivo(adminId: string): Promise<boolean> {
  const admin = await db().administrador.findUnique({ where: { id: adminId } });
  return Boolean(admin?.activo);
}
