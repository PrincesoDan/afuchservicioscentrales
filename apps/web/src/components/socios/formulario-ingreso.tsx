'use client';

import { ingresoSocioSchema } from '@afuch/contracts';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { SEDE } from '@/content/sede';
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
      <Campo id="correo" etiqueta="Correo electrónico" error={errores.correo} requerido>
        <input
          id="correo"
          name="correo"
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
      {fallo ? (
        <Aviso tipo="error">
          Correo o contraseña incorrectos. Revisa que:
          <span className="mt-2 block">
            • ya hayas{' '}
            <Link href="/socios/registro" className="font-semibold underline">
              creado tu cuenta
            </Link>{' '}
            y confirmado el mensaje que te enviamos;
          </span>
          <span className="block">
            • uses el correo que AFUCH tiene registrado para ti (no otro correo tuyo).
          </span>
          <span className="mt-2 block">
            Si no recuerdas tu contraseña,{' '}
            <Link href="/socios/recuperar" className="font-semibold underline">
              restablécela
            </Link>
            . Si no sabes qué correo tiene AFUCH, escríbenos a{' '}
            <a href={`mailto:${SEDE.email}`} className="font-semibold underline">
              {SEDE.email}
            </a>
            . Tras varios intentos fallidos la cuenta se bloquea 15 minutos.
          </span>
        </Aviso>
      ) : null}
      <Boton type="submit" disabled={enviando} className="w-full">
        {enviando ? 'Ingresando…' : 'Ingresar'}
      </Boton>
    </form>
  );
}
