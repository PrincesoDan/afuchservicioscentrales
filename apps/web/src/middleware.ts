import { getToken } from 'next-auth/jwt';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Primera barrera: sin JWT del rol correcto no se llega a la página. La
 * segunda (en cada página) revisa en la base que el socio o admin siga activo.
 */
export async function middleware(req: NextRequest) {
  const ruta = req.nextUrl.pathname;
  const esAdmin = ruta.startsWith('/admin') || ruta.startsWith('/api/admin');
  const token = await getToken({ req });

  if (token?.rol === (esAdmin ? 'admin' : 'socio')) return NextResponse.next();

  if (ruta.startsWith('/api/')) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  return NextResponse.redirect(new URL(esAdmin ? '/admin/ingreso' : '/socios', req.url));
}

export const config = {
  matcher: [
    '/socios/descuentos/:path*',
    '/socios/rendicion/:path*',
    '/socios/datos/:path*',
    '/api/socios/:path*',
    '/admin',
    '/admin/((?!ingreso).*)',
    '/api/admin/:path*',
  ],
};
