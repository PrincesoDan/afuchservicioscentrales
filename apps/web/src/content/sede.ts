/**
 * Fuente única de los datos de contacto: footer, /contacto y el JSON-LD leen de
 * aquí. Dirección, teléfono y correo entregados por AFUCH el 2026-10-15.
 */
export const SEDE = {
  sitioUrl: 'https://www.afuchscen.cl',
  nombre: 'AFUCH Servicios Centrales',
  nombreLargo: 'Asociación de Funcionarios de la Universidad de Chile — Servicios Centrales',
  direccion: 'Diagonal Paraguay 265, Of. 505 interior (Torre 15), Santiago',
  comuna: 'Santiago',
  region: 'Región Metropolitana',
  /** Tal como lo indicó AFUCH el 2026-10-15 (el formulario de ingreso trae «22978 2014»). */
  telefono: '+56 2 2978 82014',
  /**
   * Correo de atención de AFUCH. Los correos automáticos siguen saliendo desde
   * `contacto@afuchscen.cl` (Resend solo envía desde el dominio verificado), con
   * respuesta dirigida a este.
   */
  email: 'afuchscen@gmail.com',
  /** PDF entregado por AFUCH el 2026-10-11; se sirve desde `public/documentos/`. */
  estatutosUrl: '/documentos/estatutos-afuch-servicios-centrales.pdf',
  /** Formulario en papel entregado por AFUCH el 2026-10-15. */
  formularioIngresoUrl: '/documentos/formulario-ingreso-socio-2026.pdf',
} as const;

/** Datos de la asociación para transferencias, entregados por AFUCH el 2026-10-15. */
export const DATOS_BANCARIOS = {
  titular: 'AFUCH Servicios Centrales',
  rut: '75.910.300-9',
  banco: 'BancoEstado',
  tipoCuenta: 'Cuenta corriente',
  numeroCuenta: '29100037627',
} as const;

/**
 * Formularios de Google que administra AFUCH (correo del 2026-10-15). La
 * solicitud de gas solo se muestra dentro del área de socios. `opinion` queda en
 * `null` hasta que AFUCH envíe el formulario: sin URL, la sección no se muestra.
 */
export const FORMULARIOS = {
  afiliacion:
    'https://docs.google.com/forms/d/e/1FAIpQLSfYDosi4WixHD7SCSFl8RGKQcACqre09Yzke8HvuQq0JhkW0w/viewform',
  solicitudGas:
    'https://docs.google.com/forms/d/e/1FAIpQLSfosY6EvNhkrr6648-i6JZuv20r5JU5MhkPo3SAUP6m9A_zbA/viewform',
  opinion: null as string | null,
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
