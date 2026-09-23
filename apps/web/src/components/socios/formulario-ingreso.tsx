'use client';

import { ingresoSocioSchema } from '@afuch/contracts';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Boton } from '../ui/button';
import { CLASES_CAMPO, Campo } from '../ui/campo';
import { Aviso } from './tarjeta-acceso';

export function FormularioIngreso() {
  const router = useRouter();
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [fallo, setFallo] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function manejarEnvio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const resultado = ingresoSocioSchema.safeParse(
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
    const respuesta = await signIn('socio', { ...resultado.data, redirect: false });
    setEnviando(false);
    if (respuesta?.ok) {
      router.push('/socios/descuentos');
      router.refresh();
    } else {
      setFallo(true);
    }
  }

  return (
    <form onSubmit={manejarEnvio} noValidate className="space-y-6">
      <Campo id="rut" etiqueta="RUT" error={errores.rut} requerido>
        <input
          id="rut"
          name="rut"
          type="text"
          autoComplete="username"
          placeholder="12.345.678-5"
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
      {fallo ? (
        <Aviso tipo="error">
          RUT o contraseña incorrectos. Tras varios intentos fallidos la cuenta se bloquea 15
          minutos.
        </Aviso>
      ) : null}
      <Boton type="submit" disabled={enviando} className="w-full">
        {enviando ? 'Ingresando…' : 'Ingresar'}
      </Boton>
    </form>
  );
}
