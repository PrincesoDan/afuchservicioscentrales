/**
 * Datos institucionales tomados de documentos entregados por AFUCH el 2026-10-11:
 * los estatutos (vigentes al primer semestre de 2019) y el certificado de
 * vigencia N° 1301/2026/1307 de la Dirección del Trabajo (emitido el 2026-02-04).
 * No se agrega nada que no esté en esos documentos.
 */
export const ASOCIACION = {
  nombreLegal: 'Asociación de Funcionarios de la Universidad de Chile, Servicios Centrales',
  /** Estatutos, art. 1. */
  constitucion: '2 de junio de 2000',
  /** Certificado de vigencia de la Dirección del Trabajo. */
  registro: {
    numero: '93010129',
    nombre:
      'Registro de Asociaciones de Funcionarios de la Inspección Provincial del Trabajo de Santiago',
  },
  afiliacionFenafuch: '2 de noviembre de 2011',
  /** Estatutos, art. 2: objeto de la asociación, letras a) a h). */
  objetivos: [
    'Promover el mejoramiento económico de sus afiliados y de sus condiciones de vida y de trabajo.',
    'Procurar el perfeccionamiento de sus asociados, en lo material y lo espiritual, así como su recreación y esparcimiento.',
    'Recabar información sobre las políticas de la Universidad y sobre los planes, programas y resoluciones relativos a sus funcionarios.',
    'Dar a conocer a las autoridades sus criterios sobre políticas y resoluciones relativas al personal, la carrera funcionaria, la capacitación y materias de interés general.',
    'Representar a los funcionarios en los organismos y entidades en que la ley les conceda participación.',
    'Realizar acciones de bienestar, orientación, formación gremial y capacitación, dirigidas al perfeccionamiento, la recreación y el mejoramiento social de sus afiliados.',
    'Prestar asistencia y asesoría técnica a sus asociados.',
    'Constituir mutualidades, fondos y otros servicios, o asociarse a ellos, y celebrar convenios con instituciones públicas o privadas.',
  ],
  /** Estatutos, arts. 4, 9 y 24. */
  organizacion: [
    'Pueden ser socios los funcionarios de la Universidad de Chile.',
    'La asamblea es el órgano resolutivo superior de la asociación y la componen sus afiliados.',
    'El directorio dura dos años en sus funciones y se elige por votación directa de los socios.',
  ],
} as const;

/**
 * Cuotas y descuentos por planilla, según el detalle entregado por AFUCH tras
 * la reunión del 2026-10-11. La cuota de 0,5% coincide con el art. 24 de los estatutos.
 */
export const CUOTAS = {
  cuotaSocial: {
    porcentaje: '0,5% del sueldo base',
    reparto: [
      { destino: 'AFUCH Servicios Centrales', parte: '60%' },
      { destino: 'FENAFUCH', parte: '40%' },
    ],
  },
  /** Descuentos adicionales que realiza AFUCH Servicios Centrales. */
  descuentosAdicionales: [
    'Cuota del Fondo Solidario: 0,8% del sueldo base',
    'Cuota CUT, que se paga desde el Fondo Solidario',
    'Préstamo Coopeuch',
    'Acciones Coopeuch',
    'Ahorro Coopeuch',
    'FALP',
    'Gas',
    'Préstamos solidarios',
  ],
  notaFenafuch: 'Los convenios de FENAFUCH los descuenta FENAFUCH.',
} as const;
