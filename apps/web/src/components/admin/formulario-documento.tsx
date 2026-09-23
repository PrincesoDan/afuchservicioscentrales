'use client';

import { useActionState } from 'react';
import { accionPublicarDocumento, type EstadoDocumento } from '@/app/admin/acciones';
import { Aviso } from '../socios/tarjeta-acceso';
import { Boton } from '../ui/button';
import { CLASES_CAMPO } from '../ui/campo';

const INICIAL: EstadoDocumento = { estado: 'inicial' };

export function FormularioDocumento() {
  const [estado, accion, enviando] = useActionState(accionPublicarDocumento, INICIAL);
  return (
    <form action={accion} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label htmlFor="titulo" className="mb-1.5 block text-sm font-semibold text-navy-900">
          Título
        </label>
        <input id="titulo" name="titulo" required className={CLASES_CAMPO} />
      </div>
      <div>
        <label htmlFor="categoria" className="mb-1.5 block text-sm font-semibold text-navy-900">
          Categoría
        </label>
        <input
          id="categoria"
          name="categoria"
          required
          placeholder="Balances, Estados financieros…"
          className={CLASES_CAMPO}
        />
      </div>
      <div>
        <label htmlFor="fecha" className="mb-1.5 block text-sm font-semibold text-navy-900">
          Fecha del documento
        </label>
        <input id="fecha" name="fecha" type="date" required className={CLASES_CAMPO} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="archivo" className="mb-1.5 block text-sm font-semibold text-navy-900">
          PDF (máx. 20 MB)
        </label>
        <input
          id="archivo"
          name="archivo"
          type="file"
          accept="application/pdf"
          required
          className="block text-sm"
        />
      </div>
      {estado.mensaje ? (
        <div className="sm:col-span-2">
          <Aviso tipo={estado.estado === 'listo' ? 'exito' : 'error'}>{estado.mensaje}</Aviso>
        </div>
      ) : null}
      <div>
        <Boton type="submit" disabled={enviando}>
          {enviando ? 'Publicando…' : 'Publicar'}
        </Boton>
      </div>
    </form>
  );
}
