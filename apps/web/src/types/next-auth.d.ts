import 'next-auth';
import 'next-auth/jwt';

type Rol = 'socio' | 'admin';

declare module 'next-auth' {
  interface User {
    rol: Rol;
    cuentaId?: string;
  }
  interface Session {
    usuario?: { id: string; rol: Rol; cuentaId?: string };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    rol: Rol;
    cuentaId?: string;
  }
}
