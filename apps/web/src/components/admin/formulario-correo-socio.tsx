'use client';

import { useActionState } from 'react';
import { accionCorreoSocio, type EstadoCorreoSocio } from '@/app/admin/acciones';
import { Aviso } from '../socios/tarjeta-acceso';
import { Boton } from '../ui/button';
import { CLASES_CAMPO, Campo } from '../ui/campo';
import { enviarSinReiniciar } from './enviar-sin-reiniciar';

const INICIAL: EstadoCorreoSocio = { estado: 'inicial' };

export function FormularioCorreoSocio() {
  const [estado, accion, enviando] = useActionState(accionCorreoSocio, INICIAL);

  return (
    // Enviar a mano conserva lo escrito cuando la validación falla (ver enviarSinReiniciar).
    <form onSubmit={enviarSinReiniciar(accion)} noValidate className="max-w-xl space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <Campo
          id="rut-socio"
          etiqueta="RUT del socio"
          error={estado.errores?.rut}
          ayuda="Con o sin puntos y guion."
          requerido
        >
          <input
            id="rut-socio"
            name="rut"
            type="text"
            autoComplete="off"
            placeholder="12.345.678-5"
            className={CLASES_CAMPO}
          />
        </Campo>
        <Campo
          id="correo-socio"
          etiqueta="Correo electrónico"
          error={estado.errores?.correo}
          requerido
        >
          <input
            id="correo-socio"
            name="correo"
            type="email"
            autoComplete="off"
            className={CLASES_CAMPO}
          />
        </Campo>
      </div>
      {estado.mensaje ? (
        <Aviso tipo={estado.estado === 'listo' ? 'exito' : 'error'}>{estado.mensaje}</Aviso>
      ) : null}
      <Boton type="submit" variante="secundario" disabled={enviando}>
        {enviando ? 'Guardando…' : 'Guardar correo'}
      </Boton>
    </form>
  );
}
