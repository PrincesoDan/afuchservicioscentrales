'use client';

import { useActionState } from 'react';
import { accionRestablecer, accionVerificar, type EstadoFormulario } from '@/app/socios/acciones';
import { BotonLink, Boton } from '../ui/button';
import { CLASES_CAMPO, Campo } from '../ui/campo';
import { Aviso } from './tarjeta-acceso';

const INICIAL: EstadoFormulario = { estado: 'inicial' };

/** Define la contraseña a partir del token del correo (verificación o recuperación). */
export function FormularioContrasena({
  token,
  tipo,
}: {
  token: string;
  tipo: 'verificacion' | 'recuperacion';
}) {
  const [estado, accion, enviando] = useActionState(
    tipo === 'verificacion' ? accionVerificar : accionRestablecer,
    INICIAL,
  );

  if (estado.estado === 'listo') {
    return (
      <div className="space-y-6">
        <Aviso tipo="exito">{estado.mensaje}</Aviso>
        <BotonLink href="/socios" className="w-full">
          Ingresar
        </BotonLink>
      </div>
    );
  }

  return (
    <form action={accion} noValidate className="space-y-6">
      <input type="hidden" name="token" value={token} />
      <Campo
        id="contrasena"
        etiqueta="Nueva contraseña"
        error={estado.errores?.contrasena}
        ayuda="Al menos 10 caracteres. Una frase corta es más fácil de recordar y más segura."
        requerido
      >
        <input
          id="contrasena"
          name="contrasena"
          type="password"
          autoComplete="new-password"
          className={CLASES_CAMPO}
        />
      </Campo>
      <Campo
        id="confirmacion"
        etiqueta="Repite la contraseña"
        error={estado.errores?.confirmacion}
        requerido
      >
        <input
          id="confirmacion"
          name="confirmacion"
          type="password"
          autoComplete="new-password"
          className={CLASES_CAMPO}
        />
      </Campo>
      {estado.mensaje ? <Aviso tipo="error">{estado.mensaje}</Aviso> : null}
      {estado.errores?.token ? (
        <Aviso tipo="error">El enlace no es válido. Solicita uno nuevo.</Aviso>
      ) : null}
      <Boton type="submit" disabled={enviando} className="w-full">
        {enviando ? 'Guardando…' : 'Guardar contraseña'}
      </Boton>
    </form>
  );
}
