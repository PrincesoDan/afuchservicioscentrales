import { cloneElement, type ReactElement } from 'react';

export const CLASES_CAMPO =
  'w-full rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-navy-600 focus:outline-none';

/** Atributos de accesibilidad que `Campo` inyecta en el control que envuelve. */
type AtributosControl = {
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  required?: boolean;
};

export function Campo({
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
