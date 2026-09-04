import { contactoSchema } from '@afuch/contracts';
import { NextResponse } from 'next/server';

/**
 * El navegador envía a este handler y no directamente al API de NestJS: al ser
 * el mismo origen se evita CORS y no se expone la URL del backend.
 *
 * Fase 1: si `AFUCH_API_URL` no está configurada, el mensaje se registra en el
 * servidor y NO se entrega. La entrega real queda operativa cuando se levante el
 * módulo `contact` del backend.
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

  const urlApi = process.env.AFUCH_API_URL;

  if (!urlApi) {
    console.warn(
      '[contacto] AFUCH_API_URL no configurada: el mensaje no fue entregado.',
      { asunto: resultado.data.asunto },
    );
    return NextResponse.json({ ok: true, entregado: false });
  }

  const respuesta = await fetch(`${urlApi}/api/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(resultado.data),
  });

  if (!respuesta.ok) {
    return NextResponse.json({ ok: false }, { status: 502 });
  }

  return NextResponse.json({ ok: true, entregado: true });
}
