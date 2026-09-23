import 'server-only';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Resend } from 'resend';
import { env } from './env';

export type Correo = {
  para: string;
  asunto: string;
  texto: string;
  html: string;
  responderA?: string;
};

let cliente: Resend | undefined;

export async function enviarCorreo(correo: Correo): Promise<void> {
  const { RESEND_API_KEY, CORREO_REMITENTE } = env();

  if (!RESEND_API_KEY) {
    // Solo desarrollo y tests: env() exige la clave en producción. Con
    // CORREO_BUZON_DIR cada correo queda como archivo (lo leen los e2e).
    const buzon = env().CORREO_BUZON_DIR;
    if (buzon) {
      await mkdir(buzon, { recursive: true });
      await writeFile(
        path.join(buzon, `${Date.now()}-${Math.random().toString(36).slice(2)}.json`),
        JSON.stringify(correo),
      );
    }
    console.info(`[correo] Para: ${correo.para}\nAsunto: ${correo.asunto}\n\n${correo.texto}`);
    return;
  }

  cliente ??= new Resend(RESEND_API_KEY);
  const { error } = await cliente.emails.send({
    from: CORREO_REMITENTE,
    to: correo.para,
    subject: correo.asunto,
    text: correo.texto,
    html: correo.html,
    replyTo: correo.responderA,
  });
  if (error) throw new Error(`Resend rechazó el correo: ${error.message}`);
}

function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Plantilla mínima: párrafos + un botón opcional. Los textos se escapan. */
export function plantilla({
  parrafos,
  boton,
}: {
  parrafos: string[];
  boton?: { texto: string; url: string };
}): { html: string; texto: string } {
  const cuerpo = parrafos.map((p) => `<p style="margin:0 0 16px">${escaparHtml(p)}</p>`).join('');
  const htmlBoton = boton
    ? `<p style="margin:24px 0"><a href="${escaparHtml(boton.url)}" style="background:#00205c;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:600">${escaparHtml(boton.texto)}</a></p><p style="margin:0 0 16px;font-size:13px;color:#475569">Si el botón no funciona, copia este enlace: ${escaparHtml(boton.url)}</p>`
    : '';
  const html = `<div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1e293b;max-width:560px">${cuerpo}${htmlBoton}<p style="margin:24px 0 0;font-size:13px;color:#64748b">AFUCH Servicios Centrales</p></div>`;
  const texto = [
    ...parrafos,
    ...(boton ? [`${boton.texto}: ${boton.url}`] : []),
    'AFUCH Servicios Centrales',
  ].join('\n\n');
  return { html, texto };
}
