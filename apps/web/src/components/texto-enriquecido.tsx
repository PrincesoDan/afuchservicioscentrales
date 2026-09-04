import { Fragment } from 'react';

/**
 * Renderiza los `**negritas**` del cuerpo de una noticia sin arrastrar una
 * dependencia de Markdown: es la única marca que el modelo de contenido admite,
 * y hacerlo así evita inyectar HTML crudo en la página.
 */
export function TextoEnriquecido({ texto }: { texto: string }) {
  const partes = texto.split(/\*\*(.+?)\*\*/g);

  return (
    <>
      {partes.map((parte, indice) =>
        indice % 2 === 1 ? (
          <strong key={indice} className="font-semibold text-navy-900">
            {parte}
          </strong>
        ) : (
          <Fragment key={indice}>{parte}</Fragment>
        ),
      )}
    </>
  );
}
