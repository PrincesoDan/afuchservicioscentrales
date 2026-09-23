import 'server-only';
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from 'node:crypto';
import { env } from './env';

const VERSION = 'v1';

function clave(): Buffer {
  return Buffer.from(env().CLAVE_CIFRADO, 'base64');
}

/** AES-256-GCM. Formato: `v1.<iv>.<tag>.<texto cifrado>`, todo en base64url. */
export function cifrar(texto: string): string {
  const iv = randomBytes(12);
  const cifrador = createCipheriv('aes-256-gcm', clave(), iv);
  const cifrado = Buffer.concat([cifrador.update(texto, 'utf8'), cifrador.final()]);
  const tag = cifrador.getAuthTag();
  return [VERSION, iv, tag, cifrado]
    .map((p) => (typeof p === 'string' ? p : p.toString('base64url')))
    .join('.');
}

export function descifrar(valor: string): string {
  const [version, iv, tag, cifrado] = valor.split('.');
  if (version !== VERSION || !iv || !tag || cifrado === undefined) {
    throw new Error('Valor cifrado con formato desconocido.');
  }
  const descifrador = createDecipheriv('aes-256-gcm', clave(), Buffer.from(iv, 'base64url'));
  descifrador.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([
    descifrador.update(Buffer.from(cifrado, 'base64url')),
    descifrador.final(),
  ]).toString('utf8');
}

/** Índice ciego: permite buscar por RUT (ya normalizado) sin guardarlo en claro. */
export function hashRut(rutNormalizado: string): string {
  return createHmac('sha256', Buffer.from(env().CLAVE_HMAC, 'base64'))
    .update(rutNormalizado)
    .digest('hex');
}

/** Token de un solo uso para enlaces de correo. Se envía `token`; se guarda `hash`. */
export function generarToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Oculta el correo para mostrarlo en pantallas de admin: `so***@uchile.cl`. */
export function enmascararCorreo(correo: string): string {
  const [usuario = '', dominio = ''] = correo.split('@');
  return `${usuario.slice(0, 2)}***@${dominio}`;
}
