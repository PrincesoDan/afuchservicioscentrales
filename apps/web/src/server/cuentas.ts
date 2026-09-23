import 'server-only';
import type { DefinirContrasenaInput, IngresoSocioInput, RegistroInput } from '@afuch/contracts';
import { db, type TipoToken } from '@afuch/db';
import { auditar } from './auditoria';
import { cifrar, descifrar, generarToken, hashRut, hashToken } from './cifrado';
import { hashContrasena, verificarContrasena, verificarSenuelo } from './contrasenas';
import { enviarCorreo, plantilla } from './correo';
import { env } from './env';

const VIGENCIA_TOKEN_MS: Record<TipoToken, number> = {
  VERIFICACION: 24 * 60 * 60 * 1000,
  RECUPERACION: 60 * 60 * 1000,
};
const MAXIMO_INTENTOS = 5;
const BLOQUEO_MS = 15 * 60 * 1000;

async function emitirToken(cuentaId: string, tipo: TipoToken): Promise<string> {
  const { token, hash } = generarToken();
  // Un solo token vigente por tipo: pedir otro anula el anterior.
  await db().token.deleteMany({ where: { cuentaId, tipo, usadoEn: null } });
  await db().token.create({
    data: {
      cuentaId,
      tipo,
      tokenHash: hash,
      expiraEn: new Date(Date.now() + VIGENCIA_TOKEN_MS[tipo]),
    },
  });
  return token;
}

function enlace(ruta: string, token: string): string {
  return `${env().NEXTAUTH_URL.replace(/\/$/, '')}${ruta}?token=${encodeURIComponent(token)}`;
}

/**
 * Registro (decisión D4): RUT de la whitelist + correo escrito por el socio.
 * Siempre termina sin error y sin decir si el RUT es socio; el resultado real
 * solo se conoce por el correo. Ver mitigaciones en el plan §3.1.
 */
export async function registrar({ rut, correo }: RegistroInput, ip: string): Promise<void> {
  const socio = await db().socio.findUnique({
    where: { rutHash: hashRut(rut) },
    include: { cuenta: true },
  });

  if (!socio || !socio.habilitado) {
    await auditar({
      actorTipo: 'ANONIMO',
      accion: 'registro.rechazado',
      ip,
      detalle: { motivo: socio ? 'deshabilitado' : 'fuera_de_nomina' },
    });
    return;
  }

  if (socio.cuenta?.verificadaEn) {
    // Ya tiene cuenta: se avisa al correo registrado, sin cambiar nada.
    const { html, texto } = plantilla({
      parrafos: [
        'Alguien intentó crear una cuenta en el área de socios de AFUCH Servicios Centrales con tu RUT, pero tu RUT ya tiene una cuenta activa.',
        'Si fuiste tú y no recuerdas tu contraseña, puedes restablecerla. Si no fuiste tú, no necesitas hacer nada.',
      ],
      boton: {
        texto: 'Restablecer contraseña',
        url: `${env().NEXTAUTH_URL.replace(/\/$/, '')}/socios/recuperar`,
      },
    });
    await enviarCorreo({
      para: descifrar(socio.cuenta.correoCifrado),
      asunto: 'Intento de registro con tu RUT',
      html,
      texto,
    });
    await auditar({
      actorTipo: 'ANONIMO',
      accion: 'registro.ya_registrado',
      entidad: 'Socio',
      entidadId: socio.id,
      ip,
    });
    return;
  }

  // Sin cuenta, o con registro sin verificar: el último correo ingresado reemplaza al anterior.
  const cuenta = socio.cuenta
    ? await db().cuenta.update({
        where: { id: socio.cuenta.id },
        data: { correoCifrado: cifrar(correo) },
      })
    : await db().cuenta.create({ data: { socioId: socio.id, correoCifrado: cifrar(correo) } });

  const token = await emitirToken(cuenta.id, 'VERIFICACION');
  const { html, texto } = plantilla({
    parrafos: [
      'Recibimos una solicitud para crear tu cuenta en el área de socios de AFUCH Servicios Centrales.',
      'Para terminar, confirma tu correo y define tu contraseña. El enlace vence en 24 horas.',
      `Si no fuiste tú, ignora este correo y avísanos a ${env().CORREO_CONTACTO_DESTINO}.`,
    ],
    boton: {
      texto: 'Confirmar correo y crear contraseña',
      url: enlace('/socios/verificar', token),
    },
  });
  await enviarCorreo({ para: correo, asunto: 'Confirma tu cuenta de socio', html, texto });
  await auditar({
    actorTipo: 'ANONIMO',
    accion: 'registro.solicitado',
    entidad: 'Socio',
    entidadId: socio.id,
    ip,
  });
}

export type ResultadoToken = { ok: true } | { ok: false; motivo: 'token_invalido' };

/** Canjea un token de verificación o recuperación y deja definida la contraseña. */
export async function definirContrasena(
  { token, contrasena }: Pick<DefinirContrasenaInput, 'token' | 'contrasena'>,
  tipo: TipoToken,
  ip: string,
): Promise<ResultadoToken> {
  const registro = await db().token.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { cuenta: { include: { socio: true } } },
  });
  if (
    !registro ||
    registro.tipo !== tipo ||
    registro.usadoEn ||
    registro.expiraEn < new Date() ||
    !registro.cuenta.socio.habilitado
  ) {
    return { ok: false, motivo: 'token_invalido' };
  }

  const passwordHash = await hashContrasena(contrasena);
  await db().$transaction([
    db().token.update({ where: { id: registro.id }, data: { usadoEn: new Date() } }),
    db().cuenta.update({
      where: { id: registro.cuentaId },
      data: {
        passwordHash,
        verificadaEn: registro.cuenta.verificadaEn ?? new Date(),
        intentosFallidos: 0,
        bloqueadaHasta: null,
      },
    }),
  ]);
  await auditar({
    actorTipo: 'SOCIO',
    actorId: registro.cuenta.socioId,
    accion: tipo === 'VERIFICACION' ? 'cuenta.verificada' : 'cuenta.contrasena_restablecida',
    entidad: 'Socio',
    entidadId: registro.cuenta.socioId,
    ip,
  });
  return { ok: true };
}

/** Siempre termina sin error; si corresponde, envía el enlace al correo registrado. */
export async function solicitarRecuperacion(rut: string, ip: string): Promise<void> {
  const socio = await db().socio.findUnique({
    where: { rutHash: hashRut(rut) },
    include: { cuenta: true },
  });
  if (!socio?.habilitado || !socio.cuenta?.verificadaEn) {
    await auditar({ actorTipo: 'ANONIMO', accion: 'recuperacion.rechazada', ip });
    return;
  }
  const token = await emitirToken(socio.cuenta.id, 'RECUPERACION');
  const { html, texto } = plantilla({
    parrafos: [
      'Recibimos una solicitud para restablecer la contraseña de tu cuenta de socio.',
      'El enlace vence en 1 hora. Si no fuiste tú, ignora este correo: tu contraseña no cambia.',
    ],
    boton: { texto: 'Restablecer contraseña', url: enlace('/socios/restablecer', token) },
  });
  await enviarCorreo({
    para: descifrar(socio.cuenta.correoCifrado),
    asunto: 'Restablece tu contraseña',
    html,
    texto,
  });
  await auditar({
    actorTipo: 'ANONIMO',
    accion: 'recuperacion.solicitada',
    entidad: 'Socio',
    entidadId: socio.id,
    ip,
  });
}

export type SesionSocio = { socioId: string; cuentaId: string };

/** Devuelve los ids de la sesión si RUT y contraseña son correctos y la cuenta está en condiciones de ingresar. */
export async function verificarIngresoSocio(
  { rut, contrasena }: IngresoSocioInput,
  ip: string,
): Promise<SesionSocio | null> {
  const socio = await db().socio.findUnique({
    where: { rutHash: hashRut(rut) },
    include: { cuenta: true },
  });
  const cuenta = socio?.cuenta;

  if (!socio || !cuenta?.passwordHash || !cuenta.verificadaEn) {
    await verificarSenuelo(contrasena);
    await auditar({
      actorTipo: 'ANONIMO',
      accion: 'ingreso.fallido',
      ip,
      detalle: { motivo: 'sin_cuenta' },
    });
    return null;
  }

  if (cuenta.bloqueadaHasta && cuenta.bloqueadaHasta > new Date()) {
    await verificarSenuelo(contrasena);
    await auditar({
      actorTipo: 'ANONIMO',
      accion: 'ingreso.fallido',
      entidad: 'Socio',
      entidadId: socio.id,
      ip,
      detalle: { motivo: 'bloqueada' },
    });
    return null;
  }

  const correcta = await verificarContrasena(cuenta.passwordHash, contrasena);
  if (!correcta) {
    const intentos = cuenta.intentosFallidos + 1;
    await db().cuenta.update({
      where: { id: cuenta.id },
      data:
        intentos >= MAXIMO_INTENTOS
          ? { intentosFallidos: 0, bloqueadaHasta: new Date(Date.now() + BLOQUEO_MS) }
          : { intentosFallidos: intentos },
    });
    await auditar({
      actorTipo: 'ANONIMO',
      accion: intentos >= MAXIMO_INTENTOS ? 'cuenta.bloqueada_temporalmente' : 'ingreso.fallido',
      entidad: 'Socio',
      entidadId: socio.id,
      ip,
      detalle: { motivo: 'contrasena' },
    });
    return null;
  }

  if (!socio.habilitado) {
    await auditar({
      actorTipo: 'ANONIMO',
      accion: 'ingreso.fallido',
      entidad: 'Socio',
      entidadId: socio.id,
      ip,
      detalle: { motivo: 'deshabilitado' },
    });
    return null;
  }

  await db().cuenta.update({
    where: { id: cuenta.id },
    data: { intentosFallidos: 0, bloqueadaHasta: null },
  });
  await auditar({
    actorTipo: 'SOCIO',
    actorId: socio.id,
    accion: 'ingreso.exitoso',
    entidad: 'Socio',
    entidadId: socio.id,
    ip,
  });
  return { socioId: socio.id, cuentaId: cuenta.id };
}

/**
 * Un JWT sigue siendo válido tras desactivar al socio o anular su cuenta, así
 * que cada página privada lo revisa. Se compara también la cuenta: si se anuló
 * y el socio volvió a registrarse, las sesiones de la cuenta anterior mueren.
 */
export async function socioPuedeVer({ socioId, cuentaId }: SesionSocio): Promise<boolean> {
  const socio = await db().socio.findUnique({ where: { id: socioId }, include: { cuenta: true } });
  return Boolean(socio?.habilitado && socio.cuenta?.verificadaEn && socio.cuenta.id === cuentaId);
}
