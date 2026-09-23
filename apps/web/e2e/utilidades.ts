import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { generateSync } from 'otplib';
import { BUZON, ESTADO } from './entorno';

type Correo = { para: string; asunto: string; texto: string };

export function correosPara(para: string): Correo[] {
  let archivos: string[] = [];
  try {
    archivos = readdirSync(BUZON).sort();
  } catch {
    return [];
  }
  return archivos
    .map((a) => JSON.parse(readFileSync(path.join(BUZON, a), 'utf8')) as Correo)
    .filter((c) => c.para === para);
}

/** Espera el correo (el servidor lo escribe de forma asíncrona) y devuelve el enlace con token. */
export async function enlaceDelCorreo(para: string): Promise<string> {
  for (let intento = 0; intento < 50; intento += 1) {
    const correo = correosPara(para).at(-1);
    const enlace = correo?.texto.match(/https?:\/\/\S+token=\S+/)?.[0];
    if (enlace) return enlace;
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`No llegó correo con enlace para ${para}`);
}

export function credencialesAdmin() {
  const { admin } = JSON.parse(readFileSync(ESTADO, 'utf8')) as {
    admin: { email: string; contrasena: string; secreto: string };
  };
  return { ...admin, codigo: generateSync({ secret: admin.secreto }) };
}
