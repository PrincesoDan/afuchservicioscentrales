import type { Correo } from '@/server/correo';

/** Buzón en memoria: los tests reemplazan `enviarCorreo` con `vi.mock` y leen desde aquí. */
export const buzon: Correo[] = [];

export function tokenDelUltimoCorreo(para: string): string {
  const correo = [...buzon].reverse().find((c) => c.para === para);
  const token = correo?.texto.match(/token=([^\s]+)/)?.[1];
  if (!token) throw new Error(`No hay correo con token para ${para}`);
  return decodeURIComponent(token);
}
