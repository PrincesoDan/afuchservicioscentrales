import 'server-only';
import { hash, verify } from '@node-rs/argon2';

/** Argon2id con los parámetros por defecto de @node-rs/argon2 (recomendación OWASP). */
export function hashContrasena(contrasena: string): Promise<string> {
  return hash(contrasena);
}

export function verificarContrasena(hashGuardado: string, contrasena: string): Promise<boolean> {
  return verify(hashGuardado, contrasena);
}

let hashSenuelo: Promise<string> | undefined;

/**
 * Verifica contra un hash que nunca coincide. Se usa cuando el usuario no
 * existe, para que la respuesta tarde lo mismo y el tiempo no revele quién es socio.
 */
export async function verificarSenuelo(contrasena: string): Promise<false> {
  hashSenuelo ??= hash('senuelo-que-nunca-coincide');
  await verify(await hashSenuelo, contrasena);
  return false;
}
