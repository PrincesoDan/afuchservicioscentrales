'use client';

import { ingresoAdminSchema } from '@afuch/contracts';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Aviso } from '../socios/tarjeta-acceso';
import { Boton } from '../ui/button';
import { CLASES_CAMPO, Campo } from '../ui/campo';

export function FormularioIngresoAdmin() {
  const router = useRouter();
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [fallo, setFallo] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function manejarEnvio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const resultado = ingresoAdminSchema.safeParse(
      Object.fromEntries(new FormData(evento.currentTarget)),
    );
    if (!resultado.success) {
      const nuevos: Record<string, string> = {};
      for (const problema of resultado.error.issues)
        nuevos[String(problema.path[0])] ??= problema.message;
      setErrores(nuevos);
      return;
    }
    setErrores({});
    setFallo(false);
    setEnviando(true);
    const respuesta = await signIn('admin', { ...resultado.data, redirect: false });
    setEnviando(false);
    if (respuesta?.ok) {
      router.push('/admin');
      router.refresh();
    } else {
      setFallo(true);
    }
  }

  return (
    <form onSubmit={manejarEnvio} noValidate className="space-y-6">
      <Campo id="email" etiqueta="Correo" error={errores.email} requerido>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          className={CLASES_CAMPO}
        />
      </Campo>
      <Campo id="contrasena" etiqueta="Contraseña" error={errores.contrasena} requerido>
        <input
          id="contrasena"
          name="contrasena"
          type="password"
          autoComplete="current-password"
          className={CLASES_CAMPO}
        />
      </Campo>
      <Campo id="codigo" etiqueta="Código de la app autenticadora" error={errores.codigo} requerido>
        <input
          id="codigo"
          name="codigo"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          className={CLASES_CAMPO}
        />
      </Campo>
      {fallo ? <Aviso tipo="error">Datos incorrectos.</Aviso> : null}
      <Boton type="submit" disabled={enviando} className="w-full">
        {enviando ? 'Ingresando…' : 'Ingresar'}
      </Boton>
    </form>
  );
}
