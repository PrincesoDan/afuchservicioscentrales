import { startTransition, type FormEvent } from 'react';

/**
 * React reinicia los campos de un `<form action>` al terminar la acción, y con
 * eso se pierde el archivo elegido entre la vista previa y la confirmación.
 * Enviar a mano conserva el archivo; el botón pulsado viaja en el FormData.
 */
export function enviarSinReiniciar(accion: (datos: FormData) => void) {
  return (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const boton = (evento.nativeEvent as SubmitEvent).submitter;
    const datos = new FormData(evento.currentTarget, boton);
    startTransition(() => accion(datos));
  };
}
