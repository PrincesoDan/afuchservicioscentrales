'use client';

import { useActionState } from 'react';
import { accionRecuperar, type EstadoFormulario } from '@/app/socios/acciones';
import { Boton } from '../ui/button';
import { CLASES_CAMPO, Campo } from '../ui/campo';
import { Aviso } from './tarjeta-acceso';

const INICIAL: EstadoFormulario = { estado: 'inicial' };

export function FormularioRecuperar() {
  const [estado, accion, enviando] = useActionState(accionRecuperar, INICIAL);

  if (estado.estado === 'listo') return <Aviso tipo="exito">{estado.mensaje}</Aviso>;

  return (
    <form action={accion} noValidate className="space-y-6">
      <Campo id="rut" etiqueta="RUT" error={estado.errores?.rut} requerido>
        <input
          id="rut"
          name="rut"
          type="text"
          autoComplete="username"
          placeholder="12.345.678-5"
          className={CLASES_CAMPO}
        />
      </Campo>
      {estado.mensaje ? <Aviso tipo="error">{estado.mensaje}</Aviso> : null}
      <Boton type="submit" disabled={enviando} className="w-full">
        {enviando ? 'Enviando…' : 'Enviar enlace'}
      </Boton>
    </form>
  );
}
