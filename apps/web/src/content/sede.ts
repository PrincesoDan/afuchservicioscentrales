/**
 * Fuente única de los datos de contacto: footer, /contacto y el JSON-LD leen de
 * aquí. Los valores marcados como pendientes son placeholder a la espera de que
 * AFUCH los entregue; están agrupados para que corregirlos sea un solo cambio.
 */
export const SEDE = {
  nombre: 'AFUCH Servicios Centrales',
  nombreLargo:
    'Asociación de Funcionarios de la Universidad de Chile — Servicios Centrales',
  direccion: 'Av. Libertador Bernardo O’Higgins 1058, Santiago',
  comuna: 'Santiago',
  region: 'Región Metropolitana',
  telefono: '+56 2 2978 0000',
  email: 'contacto@afuchserviciocentrales.cl',
  horarios: [
    { dias: 'Lunes a jueves', horario: '9:00 a 17:30' },
    { dias: 'Viernes', horario: '9:00 a 16:30' },
  ],
  /** Datos aún no confirmados por AFUCH; se muestran con aviso en el sitio. */
  pendientesDeConfirmacion: true,
  estatutosUrl: 'https://www.scribd.com/document/738076080/ESTATUTO-AFUCHSCEN',
} as const;
