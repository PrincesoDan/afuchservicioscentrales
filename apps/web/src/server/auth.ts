import 'server-only';
import { ingresoAdminSchema, ingresoSocioSchema } from '@afuch/contracts';
import type { NextAuthOptions, Session } from 'next-auth';
import { getServerSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { redirect } from 'next/navigation';
import { adminActivo, verificarIngresoAdmin } from './administradores';
import { socioPuedeVer, verificarIngresoSocio, type SesionSocio } from './cuentas';
import { ipDesdeCabeceras } from './peticion';
import { permitir } from './rate-limit';

const OCHO_HORAS = 8 * 60 * 60;

function ipDeSolicitud(req: { headers?: Record<string, unknown> } | undefined): string {
  const cabeceras = new Headers();
  for (const [clave, valor] of Object.entries(req?.headers ?? {})) {
    if (typeof valor === 'string') cabeceras.set(clave, valor);
  }
  return ipDesdeCabeceras(cabeceras);
}

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt', maxAge: OCHO_HORAS },
  pages: { signIn: '/socios', error: '/socios' },
  providers: [
    CredentialsProvider({
      id: 'socio',
      name: 'Socio',
      credentials: { rut: { type: 'text' }, contrasena: { type: 'password' } },
      async authorize(credenciales, req) {
        const datos = ingresoSocioSchema.safeParse(credenciales);
        if (!datos.success) return null;
        const ip = ipDeSolicitud(req);
        if (!(await permitir('ingresoSocio', `${ip}:${datos.data.rut}`))) return null;
        const sesion = await verificarIngresoSocio(datos.data, ip);
        return sesion ? { id: sesion.socioId, rol: 'socio', cuentaId: sesion.cuentaId } : null;
      },
    }),
    CredentialsProvider({
      id: 'admin',
      name: 'Administrador',
      credentials: {
        email: { type: 'email' },
        contrasena: { type: 'password' },
        codigo: { type: 'text' },
      },
      async authorize(credenciales, req) {
        const datos = ingresoAdminSchema.safeParse(credenciales);
        if (!datos.success) return null;
        const ip = ipDeSolicitud(req);
        if (!(await permitir('ingresoAdmin', ip))) return null;
        const adminId = await verificarIngresoAdmin(datos.data, ip);
        return adminId ? { id: adminId, rol: 'admin' } : null;
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.rol = user.rol;
        token.cuentaId = user.cuentaId;
      }
      return token;
    },
    session({ session, token }) {
      session.usuario = { id: token.sub ?? '', rol: token.rol, cuentaId: token.cuentaId };
      return session;
    },
  },
};

export function sesion(): Promise<Session | null> {
  return getServerSession(authOptions);
}

/** Para páginas y acciones del área de socios. Redirige al ingreso si la sesión ya no es válida. */
export async function exigirSocio(): Promise<SesionSocio> {
  const actual = await sesion();
  const usuario = actual?.usuario;
  if (usuario?.rol === 'socio' && usuario.cuentaId) {
    const datos = { socioId: usuario.id, cuentaId: usuario.cuentaId };
    if (await socioPuedeVer(datos)) return datos;
  }
  redirect('/socios?sesion=expirada');
}

export async function exigirAdmin(): Promise<{ adminId: string }> {
  const actual = await sesion();
  const usuario = actual?.usuario;
  if (usuario?.rol === 'admin' && (await adminActivo(usuario.id))) return { adminId: usuario.id };
  redirect('/admin/ingreso');
}
