'use client';

import { useActionState } from 'react';
import { accionCorreos, type EstadoCorreos } from '@/app/admin/acciones';
import { Aviso } from '../socios/tarjeta-acceso';
import { Boton } from '../ui/button';
import { enviarSinReiniciar } from './enviar-sin-reiniciar';

const INICIAL: EstadoCorreos = { etapa: 'inicial' };

export function FormularioCorreos() {
  const [estado, accion, enviando] = useActionState(accionCorreos, INICIAL);
  const resumen = estado.etapa === 'vista_previa' ? estado.resumen : null;
  const hayCambios = resumen ? resumen.nuevos + resumen.cambiados > 0 : false;

  return (
    // El botón que envía decide la etapa: solo «Cargar» agrega confirmar=si al FormData.
    <form onSubmit={enviarSinReiniciar(accion)} className="space-y-6">
      <div>
        <label htmlFor="archivo-correos" className="mb-2 block text-sm font-semibold text-navy-900">
          Lista de correos (.xlsx)
        </label>
        <input
          id="archivo-correos"
          name="archivo"
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          required
          className="block text-sm"
        />
        <p className="mt-1.5 text-xs text-slate-500">
          Debe tener las columnas «RUT» y «Mail»; las demás se ignoran. El archivo no se guarda en
          el servidor.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Boton type="submit" variante="secundario" disabled={enviando}>
          {enviando ? 'Leyendo…' : 'Ver vista previa'}
        </Boton>
        {resumen && resumen.errores.length === 0 && hayCambios ? (
          <Boton type="submit" name="confirmar" value="si" disabled={enviando}>
            Cargar {resumen.nuevos + resumen.cambiados} correos
          </Boton>
        ) : null}
      </div>

      {estado.etapa === 'error' ? <Aviso tipo="error">{estado.mensaje}</Aviso> : null}

      {estado.etapa === 'cargada' ? (
        <Aviso tipo="exito">
          Correos cargados: {estado.resumen.nuevos} nuevos y {estado.resumen.cambiados} cambiados.
          {estado.resumen.rutDesconocidos > 0
            ? ` ${estado.resumen.rutDesconocidos} filas se omitieron porque su RUT no es de un socio.`
            : ''}
        </Aviso>
      ) : null}

      {resumen ? (
        <div className="space-y-6">
          {resumen.errores.length > 0 ? (
            <Aviso tipo="error">
              La lista tiene errores y no se puede cargar:
              <span className="mt-2 block">{resumen.errores.slice(0, 20).join(' · ')}</span>
              {resumen.errores.length > 20 ? (
                <span className="mt-2 block">…y {resumen.errores.length - 20} más.</span>
              ) : null}
            </Aviso>
          ) : null}

          <dl className="grid gap-4 sm:grid-cols-3">
            {[
              ['Filas leídas', resumen.filasLeidas],
              ['Correos nuevos', resumen.nuevos],
              ['Correos que cambian', resumen.cambiados],
              ['Sin cambios', resumen.sinCambios],
              ['RUT que no son socios', resumen.rutDesconocidos],
              ['Filas sin correo', resumen.sinCorreo],
            ].map(([titulo, valor]) => (
              <div key={titulo} className="rounded-lg border border-slate-200 p-4">
                <dt className="text-xs text-slate-500">{titulo}</dt>
                <dd className="mt-1 text-lg font-bold text-navy-900 tabular-nums">{valor}</dd>
              </div>
            ))}
          </dl>

          {resumen.errores.length === 0 && !hayCambios ? (
            <Aviso tipo="info">No hay correos nuevos ni cambios que cargar.</Aviso>
          ) : null}
          {resumen.rutDesconocidos > 0 ? (
            <p className="text-sm/6 text-slate-600">
              Las filas cuyo RUT no es de un socio se omiten. Si corresponden a socios nuevos,
              importa primero la planilla mensual y vuelve a cargar esta lista.
            </p>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
