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
  estatutosUrl: 'https://www.scribd.com/document/738076080/ESTATUTO-AFUCHSCEN',
} as const;

/**
 * Relación con la federación (decisión D13). Texto entregado por La Palanca tras
 * la reunión con AFUCH del 2026-10-11; no se reescribe sin su aprobación.
 */
export const FENAFUCH = {
  nombre: 'FENAFUCH',
  nombreLargo:
    'Federación Nacional de Asociaciones de Funcionarios y Funcionarias de la Universidad de Chile',
  resumen: 'AFUCH Servicios Centrales es parte de la FENAFUCH.',
  detalle:
    'Todas las personas afiliadas a AFUCH Servicios Centrales son parte de la FENAFUCH y, por ende, tienen acceso a todos los beneficios y convenios que tiene la federación.',
} as const;
