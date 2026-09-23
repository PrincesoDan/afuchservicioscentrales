import { ASUNTOS_CONTACTO, contactoSchema, formatearRut } from '@afuch/contracts';
import { NextResponse } from 'next/server';
import { enviarCorreo, plantilla } from '@/server/correo';
import { env } from '@/server/env';
import { ipDesdeCabeceras } from '@/server/peticion';
import { permitir } from '@/server/rate-limit';

/**
 * Valida con el mismo schema que el navegador y envía el mensaje por correo a
 * AFUCH. No se guarda en base de datos: el mensaje ya queda en el correo y
 * almacenarlo solo sumaría obligaciones de Ley 21.719 (spec §6).
 */
export async function POST(request: Request) {
  const cuerpo: unknown = await request.json().catch(() => null);
  const resultado = contactoSchema.safeParse(cuerpo);

  if (!resultado.success) {
    return NextResponse.json(
      { ok: false, errores: resultado.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  // Honeypot: un bot rellenó el campo invisible. Se responde 200 para no
  // enseñarle que fue detectado, pero el mensaje se descarta.
  if (resultado.data.website) {
    return NextResponse.json({ ok: true });
  }

  if (!(await permitir('contacto', ipDesdeCabeceras(request.headers)))) {
    return NextResponse.json({ ok: false, motivo: 'limite' }, { status: 429 });
  }

  const { nombre, email, rut, unidad, asunto, mensaje } = resultado.data;
  const { html, texto } = plantilla({
    parrafos: [
      `Nombre: ${nombre}`,
      `Correo: ${email}`,
      ...(rut ? [`RUT: ${formatearRut(rut)}`] : []),
      ...(unidad ? [`Unidad o facultad: ${unidad}`] : []),
      `Asunto: ${ASUNTOS_CONTACTO[asunto]}`,
      ...mensaje.split(/\n{2,}/),
    ],
  });

  try {
    await enviarCorreo({
      para: env().CORREO_CONTACTO_DESTINO,
      asunto: `[Contacto web] ${ASUNTOS_CONTACTO[asunto]} — ${nombre}`,
      html,
      texto,
      responderA: email,
    });
  } catch (error) {
    console.error('[contacto] No se pudo enviar el correo.', error);
    return NextResponse.json({ ok: false }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
