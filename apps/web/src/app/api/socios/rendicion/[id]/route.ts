import { NextResponse } from 'next/server';
import { sesion } from '@/server/auth';
import { auditar } from '@/server/auditoria';
import { socioPuedeVer } from '@/server/cuentas';
import { ipDesdeCabeceras } from '@/server/peticion';
import { leerDocumento } from '@/server/rendicion';

/** Sirve el PDF solo a socios con sesión válida; se muestra en el navegador (no es descarga forzada). */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuario = (await sesion())?.usuario;
  const datos =
    usuario?.rol === 'socio' && usuario.cuentaId
      ? { socioId: usuario.id, cuentaId: usuario.cuentaId }
      : null;
  if (!datos || !(await socioPuedeVer(datos))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const { id } = await params;
  const leido = await leerDocumento(id);
  if (!leido) return NextResponse.json({ ok: false }, { status: 404 });

  await auditar({
    actorTipo: 'SOCIO',
    actorId: datos.socioId,
    accion: 'rendicion.vista',
    entidad: 'DocumentoRendicion',
    entidadId: id,
    ip: ipDesdeCabeceras(request.headers),
  });

  const nombre =
    leido.documento.titulo.replace(/[^\p{L}\p{N} ._-]/gu, '').slice(0, 80) || 'documento';
  return new NextResponse(new Uint8Array(leido.contenido), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(`${nombre}.pdf`)}`,
      'Cache-Control': 'private, no-store',
    },
  });
}
