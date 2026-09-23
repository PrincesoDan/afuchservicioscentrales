/**
 * Fuente única de los datos de contacto: footer, /contacto y el JSON-LD leen de
 * aquí. Datos confirmados por AFUCH el 2026-09-23.
 */
export const SEDE = {
  sitioUrl: 'https://www.afuchscen.cl',
  nombre: 'AFUCH Servicios Centrales',
  nombreLargo: 'Asociación de Funcionarios de la Universidad de Chile — Servicios Centrales',
  direccion: 'Av. Libertador Bernardo O’Higgins 1058, Santiago',
  comuna: 'Santiago',
  region: 'Región Metropolitana',
  telefono: '+56 2 2978 0000',
  email: 'contacto@afuchscen.cl',
  horarios: [
    { dias: 'Lunes a jueves', horario: '9:00 a 17:30' },
    { dias: 'Viernes', horario: '9:00 a 16:30' },
  ],
  estatutosUrl: 'https://www.scribd.com/document/738076080/ESTATUTO-AFUCHSCEN',
} as const;
