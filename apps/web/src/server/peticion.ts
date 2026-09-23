import 'server-only';
import { headers } from 'next/headers';

/**
 * IP del cliente. En producción el único punto de entrada es Caddy, que agrega
 * la IP real como primer valor de X-Forwarded-For.
 */
export async function ipCliente(): Promise<string> {
  const cabeceras = await headers();
  return ipDesdeCabeceras(cabeceras);
}

export function ipDesdeCabeceras(cabeceras: Headers): string {
  const reenviada = cabeceras.get('x-forwarded-for')?.split(',')[0]?.trim();
  return reenviada || cabeceras.get('x-real-ip') || 'desconocida';
}
