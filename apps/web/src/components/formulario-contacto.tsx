'use client';

import { ASUNTOS_CONTACTO, contactoSchema, type AsuntoContacto } from '@afuch/contracts';
import { cloneElement, useState, type FormEvent, type ReactElement } from 'react';
import { Boton } from './ui/button';

type Errores = Partial<Record<string, string>>;
type Estado = 'inactivo' | 'enviando' | 'enviado' | 'error';

const CLASES_CAMPO =
  'w-full rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-navy-600 focus:outline-none';

export function FormularioContacto() {
  const [errores, setErrores] = useState<Errores>({});
  const [estado, setEstado] = useState<Estado>('inactivo');

  async function manejarEnvio(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const datos = Object.fromEntries(new FormData(formulario));

    // Misma validación que aplica el servidor: el schema vive en @afuch/contracts.
    const resultado = contactoSchema.safeParse(datos);
    if (!resultado.success) {
      const nuevosErrores: Errores = {};
      for (const problema of resultado.error.issues) {
        const campo = problema.path[0];
        if (typeof campo === 'string' && !nuevosErrores[campo]) {
          nuevosErrores[campo] = problema.message;
        }
      }
      setErrores(nuevosErrores);
      return;
    }

    setErrores({});
    setEstado('enviando');

    try {
      const respuesta = await fetch('/api/contacto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resultado.data),
      });
      if (!respuesta.ok) throw new Error('El envío falló');
      setEstado('enviado');
      formulario.reset();
    } catch {
      setEstado('error');
    }
  }

  if (estado === 'enviado') {
    return (
      <div className="rounded-xl border border-slate-200 bg-navy-50 p-8" role="status">
        <h2 className="text-xl font-bold text-navy-900">Mensaje enviado</h2>
        <p className="mt-3 text-base/7 text-slate-700">
          Gracias por escribirnos. Te responderemos al correo que nos dejaste, normalmente dentro
          de los próximos días hábiles.
        </p>
        <Boton variante="secundario" className="mt-6" onClick={() => setEstado('inactivo')}>
          Enviar otro mensaje
        </Boton>
      </div>
    );
  }

  return (
    <form onSubmit={manejarEnvio} noValidate className="space-y-6">
      <Campo id="nombre" etiqueta="Nombre y apellido" error={errores.nombre} requerido>
        <input id="nombre" name="nombre" type="text" autoComplete="name" className={CLASES_CAMPO} />
      </Campo>

      <div className="grid gap-6 sm:grid-cols-2">
        <Campo id="email" etiqueta="Correo electrónico" error={errores.email} requerido>
          <input id="email" name="email" type="email" autoComplete="email" className={CLASES_CAMPO} />
        </Campo>

        <Campo id="rut" etiqueta="RUT" error={errores.rut} ayuda="Opcional. Con o sin puntos.">
          <input id="rut" name="rut" type="text" placeholder="12.345.678-5" className={CLASES_CAMPO} />
        </Campo>
      </div>

      <Campo
        id="unidad"
        etiqueta="Unidad o facultad"
        error={errores.unidad}
        ayuda="Opcional. Nos ayuda a derivar tu consulta."
      >
        <input id="unidad" name="unidad" type="text" className={CLASES_CAMPO} />
      </Campo>

      <Campo id="asunto" etiqueta="Asunto" error={errores.asunto} requerido>
        <select id="asunto" name="asunto" defaultValue="convenios" className={CLASES_CAMPO}>
          {Object.entries(ASUNTOS_CONTACTO).map(([valor, etiqueta]) => (
            <option key={valor} value={valor as AsuntoContacto}>
              {etiqueta}
            </option>
          ))}
        </select>
      </Campo>

      <Campo id="mensaje" etiqueta="Mensaje" error={errores.mensaje} requerido>
        <textarea id="mensaje" name="mensaje" rows={6} className={`${CLASES_CAMPO} resize-y`} />
      </Campo>

      {/* Honeypot: invisible para personas, tentador para bots que rellenan todo. */}
      <div aria-hidden="true" className="absolute left-[-9999px]">
        <label htmlFor="website">No completes este campo</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {estado === 'error' ? (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          No pudimos enviar tu mensaje. Intenta de nuevo o escríbenos directamente por correo.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-4">
        <Boton type="submit" disabled={estado === 'enviando'}>
          {estado === 'enviando' ? 'Enviando…' : 'Enviar mensaje'}
        </Boton>
        <p className="text-xs/5 text-slate-500">
          Usamos tus datos solo para responder esta consulta.
        </p>
      </div>
    </form>
  );
}

/** Atributos de accesibilidad que `Campo` inyecta en el control que envuelve. */
type AtributosControl = {
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  required?: boolean;
};

function Campo({
  id,
  etiqueta,
  error,
  ayuda,
  requerido = false,
  children,
}: {
  id: string;
  etiqueta: string;
  error?: string;
  ayuda?: string;
  requerido?: boolean;
  /** Un único control de formulario: input, select o textarea. */
  children: ReactElement<AtributosControl>;
}) {
  const idAyuda = ayuda ? `${id}-ayuda` : undefined;
  const idError = error ? `${id}-error` : undefined;
  const descripcion = [idAyuda, idError].filter(Boolean).join(' ');

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-navy-900">
        {etiqueta}
        {requerido ? (
          <span className="ml-1 text-red-600" aria-hidden="true">
            *
          </span>
        ) : (
          <span className="ml-1.5 font-normal text-slate-400">(opcional)</span>
        )}
      </label>

      {/* Se clona el control para inyectar los atributos de accesibilidad una
          sola vez, en lugar de repetirlos en cada uso de Campo. */}
      {cloneElement(children, {
        'aria-describedby': descripcion || undefined,
        'aria-invalid': error ? true : undefined,
        required: requerido,
      })}

      {ayuda ? (
        <p id={idAyuda} className="mt-1.5 text-xs text-slate-500">
          {ayuda}
        </p>
      ) : null}
      {error ? (
        <p id={idError} role="alert" className="mt-1.5 text-xs font-medium text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
