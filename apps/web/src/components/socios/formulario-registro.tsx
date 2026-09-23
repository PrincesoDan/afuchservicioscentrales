'use client';

import { useActionState } from 'react';
import { accionRegistro, type EstadoFormulario } from '@/app/socios/acciones';
import { Boton } from '../ui/button';
import { CLASES_CAMPO, Campo } from '../ui/campo';
import { Aviso } from './tarjeta-acceso';

const INICIAL: EstadoFormulario = { estado: 'inicial' };

export function FormularioRegistro() {
  const [estado, accion, enviando] = useActionState(accionRegistro, INICIAL);

  if (estado.estado === 'listo') return <Aviso tipo="exito">{estado.mensaje}</Aviso>;

  return (
    <form action={accion} noValidate className="space-y-6">
      <Campo
        id="rut"
        etiqueta="RUT"
        error={estado.errores?.rut}
        ayuda="Con o sin puntos y guion."
        requerido
      >
        <input
          id="rut"
          name="rut"
          type="text"
          autoComplete="username"
          placeholder="12.345.678-5"
          className={CLASES_CAMPO}
        />
      </Campo>
      <Campo
        id="correo"
        etiqueta="Correo electrónico"
        error={estado.errores?.correo}
        ayuda="Te enviaremos aquí el enlace para confirmar tu cuenta."
        requerido
      >
        <input
          id="correo"
          name="correo"
          type="email"
          autoComplete="email"
          className={CLASES_CAMPO}
        />
      </Campo>
      {estado.mensaje ? <Aviso tipo="error">{estado.mensaje}</Aviso> : null}
      <Boton type="submit" disabled={enviando} className="w-full">
        {enviando ? 'Enviando…' : 'Crear mi cuenta'}
      </Boton>
    </form>
  );
}
