import { convenioSchema, type Convenio } from '@afuch/contracts';
import { z } from 'zod';

/**
 * Catálogo inicial, transcrito desde `info/BENEFICIOS AFUCH.pdf` y las piezas
 * gráficas de convenios entregadas por AFUCH.
 *
 * Los montos provienen de documentos de septiembre de 2026 y deben confirmarse
 * con AFUCH antes de publicar en producción.
 */
const convenios: Convenio[] = [
  {
    slug: 'fondo-solidario',
    nombre: 'Fondo Solidario AFUCH',
    categoria: 'solidaridad',
    resumen:
      'Aporte voluntario de 0,8% del sueldo base que da acceso a asesoría legal laboral gratuita y a nueve bonos de ayuda directa.',
    descripcion:
      'El Fondo Solidario es el corazón de la asociación: quienes se incorporan voluntariamente aportan un 0,8% de su sueldo base y, a cambio, cuentan con respaldo económico en los momentos que más pesan —un nacimiento, un matrimonio, una enfermedad, la pérdida de un familiar— además de asesoría legal gratuita en causas laborales.',
    beneficios: [
      'Asesoría legal gratuita en causas laborales',
      'Nueve bonos de ayuda directa, entregados por una sola vez y sin devolución',
      'Bono de invierno anual, sujeto a disponibilidad de fondos',
    ],
    formaDeAcceso:
      'La incorporación es voluntaria y se solicita directamente en AFUCH Servicios Centrales. Todos los bonos se cobran acreditando la situación con los certificados correspondientes.',
    formaDePago: 'Cuota mensual de 0,8% del sueldo base, descontada por planilla',
    extensivoGrupoFamiliar: true,
    destacado: true,
    vigencia: 'permanente',
    montos: [
      { concepto: 'Nacimiento de hijo o hija', monto: 25000 },
      { concepto: 'Matrimonio o acuerdo de unión civil', monto: 25000 },
      { concepto: 'Fallecimiento del socio o socia', monto: 100000 },
      { concepto: 'Fallecimiento de hijo o hija', monto: 50000 },
      { concepto: 'Fallecimiento de cónyuge', monto: 50000 },
      { concepto: 'Fallecimiento de padre o madre', monto: 50000 },
      { concepto: 'Enfermedad catastrófica del socio o socia', monto: 50000 },
      { concepto: 'Accidente del socio o socia', monto: 10000 },
      { concepto: 'Accidente de locomoción', monto: 10000 },
    ],
    notaMontos:
      'Todos los bonos se entregan por una sola vez y sin devolución. En caso de fallecimiento del socio o socia, se puede designar como beneficiario al cónyuge o conviviente.',
  },
  {
    slug: 'vales-abastible',
    nombre: 'Vales digitales Abastible',
    categoria: 'gas',
    resumen:
      'Balones de 5, 11, 15 y 45 kg a un precio más bajo que una recarga, en una sola cuota descontada por planilla.',
    descripcion:
      'AFUCH entrega vales digitales de Abastible que se compran a un valor menor al de una recarga corriente. El vale se paga en una sola cuota descontada por planilla al mes siguiente, sin interés ni recargo.',
    beneficios: [
      'Balones de 5, 11, 15 y 45 kg',
      'Precio más bajo que el de una recarga',
      'Hasta 3 vales mensuales por socio: dos de una misma carga y uno de carga distinta',
    ],
    formaDeAcceso: 'Solicita tus vales en AFUCH Servicios Centrales.',
    formaDePago: 'Una cuota descontada por planilla al mes siguiente',
    extensivoGrupoFamiliar: false,
    destacado: true,
    vigencia: 'permanente',
    notaMontos: 'Los valores están sujetos a cambio semanal según el precio del gas.',
  },
  {
    slug: 'prestamo-solidario',
    nombre: 'Préstamo Solidario',
    categoria: 'solidaridad',
    resumen:
      'Hasta $60.000 sin intereses, en tres cuotas, para pagar cuentas básicas o cubrir un gasto urgente.',
    descripcion:
      'Un préstamo pensado para el apuro puntual: cuentas básicas atrasadas o un gasto que no puede esperar. AFUCH transfiere directamente a la entidad a la que se le debe, y el socio devuelve el monto en hasta tres cuotas por planilla, sin intereses.',
    beneficios: [
      'Tope de $60.000 por solicitud',
      'Sin intereses',
      'Pago directo por transferencia bancaria a la entidad adeudada',
    ],
    formaDeAcceso:
      'Solicítalo en AFUCH Servicios Centrales indicando la cuenta o el gasto que necesitas cubrir.',
    formaDePago: 'Hasta 3 cuotas descontadas por planilla, sin intereses',
    extensivoGrupoFamiliar: false,
    destacado: true,
    vigencia: 'permanente',
  },
  {
    slug: 'seguro-oncologico-falp',
    nombre: 'Seguro Oncológico FALP',
    categoria: 'salud',
    resumen:
      'Cobertura oncológica de la Fundación Arturo López Pérez desde $9.900 al mes, extensiva al grupo familiar.',
    descripcion:
      'Convenio vigente con la Fundación Arturo López Pérez (FALP) para socios y socias que quieran contratar un seguro oncológico. La cuota se descuenta por planilla, sin trámites adicionales cada mes.',
    beneficios: [
      'Plan individual: $9.900 mensuales',
      'Plan grupo familiar: $19.800 mensuales',
      'Cobertura de la Fundación Arturo López Pérez',
    ],
    formaDeAcceso: 'Manifiesta tu interés en AFUCH Servicios Centrales para iniciar la contratación.',
    formaDePago: 'Cuota mensual descontada por planilla',
    extensivoGrupoFamiliar: true,
    destacado: true,
    vigencia: 'permanente',
    montos: [
      { concepto: 'Plan individual', monto: 9900 },
      { concepto: 'Plan grupo familiar', monto: 19800 },
    ],
  },
  {
    slug: 'prestamos-coopeuch',
    nombre: 'Préstamos de consumo Coopeuch',
    categoria: 'ahorro-credito',
    resumen:
      'Créditos de consumo a tasas de interés más convenientes que las de plaza, descontados por planilla.',
    descripcion:
      'A través del convenio con Coopeuch, los socios y socias acceden a préstamos de consumo con tasas de interés más convenientes que las que obtendrían de forma individual, con el pago descontado directamente por planilla.',
    beneficios: [
      'Tasas de interés preferentes respecto de las de plaza',
      'Descuento por planilla, sin gestión mensual de tu parte',
    ],
    formaDeAcceso: 'Consulta las condiciones vigentes en AFUCH Servicios Centrales.',
    formaDePago: 'Cuotas descontadas por planilla',
    extensivoGrupoFamiliar: false,
    destacado: false,
    vigencia: 'permanente',
  },
  {
    slug: 'caja-ahorros-empleados-publicos',
    nombre: 'Caja de Ahorros de Empleados Públicos',
    categoria: 'ahorro-credito',
    resumen:
      'Ahorro por planilla del 1% de tus haberes, créditos a baja tasa y asistencia médica y veterinaria incluidas.',
    descripcion:
      'La Caja de Ahorros de Empleados Públicos combina un mecanismo de ahorro automático con una red de asistencias que se activan cuando se necesitan, sin costo adicional por evento.',
    beneficios: [
      'Ahorro del 1% del total de haberes, descontado por planilla',
      'Créditos a baja tasa de interés',
      'Asistencia médica: teleorientación, médico a domicilio y traslado médico',
      'Asistencia veterinaria',
    ],
    formaDeAcceso: 'Inscríbete a través de AFUCH Servicios Centrales.',
    formaDePago: 'Descuento por planilla del 1% del total de haberes',
    extensivoGrupoFamiliar: false,
    destacado: false,
    vigencia: 'permanente',
  },
  {
    slug: 'optica-bethel',
    nombre: 'Óptica Bethel',
    categoria: 'salud',
    resumen:
      '10% de descuento y operativo oftalmológico gratuito al comprar lentes ópticos, extensivo al grupo familiar.',
    descripcion:
      'Óptica Bethel realiza el operativo oftalmológico sin costo cuando compras tus lentes ópticos, y el beneficio alcanza también a tu grupo familiar. El pago se distribuye por planilla en hasta cuatro meses.',
    beneficios: [
      '10% de descuento',
      'Operativo oftalmológico gratuito por la compra de lentes ópticos',
      'Convenios con FONASA, Isapres y Bienestar del Personal U. de Chile',
    ],
    formaDeAcceso: 'Solicita el respaldo del convenio en AFUCH Servicios Centrales antes de tu compra.',
    formaDePago: 'Descuento por planilla en hasta 4 meses',
    extensivoGrupoFamiliar: true,
    destacado: false,
    vigencia: 'permanente',
  },
  {
    slug: 'optica-mugello',
    nombre: 'Óptica Mugello',
    categoria: 'salud',
    resumen:
      'Operativo oftalmológico gratuito al comprar lentes ópticos, con pago por planilla y extensivo al grupo familiar.',
    descripcion:
      'Óptica Mugello ofrece el operativo oftalmológico sin costo asociado a la compra de lentes ópticos. El convenio se extiende al grupo familiar del trabajador o trabajadora.',
    beneficios: [
      'Operativo oftalmológico gratuito por la compra de lentes ópticos',
      'Convenios con FONASA, Isapres y Bienestar del Personal U. de Chile',
    ],
    formaDeAcceso: 'Solicita el respaldo del convenio en AFUCH Servicios Centrales antes de tu compra.',
    formaDePago: 'Descuento por planilla',
    extensivoGrupoFamiliar: true,
    destacado: false,
    vigencia: 'permanente',
  },
  {
    slug: 'clinica-dental-alto-valle',
    nombre: 'Clínica Dental Alto Valle',
    categoria: 'salud',
    resumen: '20% de descuento en atención dental, con pago en cuotas por planilla y cobertura familiar.',
    descripcion:
      'Convenio de atención dental con descuento directo y pago pactado en cuotas descontadas por planilla. El beneficio se extiende al grupo familiar del trabajador o trabajadora.',
    beneficios: [
      '20% de descuento',
      'Pago pactado en cuotas descontadas por planilla',
    ],
    formaDeAcceso: 'Solicita el respaldo del convenio en AFUCH Servicios Centrales antes de tu atención.',
    formaDePago: 'Cuotas pactadas y descontadas por planilla',
    extensivoGrupoFamiliar: true,
    destacado: false,
    vigencia: 'permanente',
  },
  {
    slug: 'funeraria-juan-antonio-solar',
    nombre: 'Funeraria Juan Antonio Solar',
    categoria: 'funeraria',
    resumen:
      '20% de descuento, sala velatoria gratuita 24/7, terapias de duelo y servicio Pet Funeral.',
    descripcion:
      'Un convenio pensado para acompañar en el momento más difícil, con descuento en el servicio, sala velatoria sin costo y apoyo posterior a través de terapias de duelo.',
    beneficios: [
      '20% de descuento',
      'Sala velatoria gratuita, disponible 24/7',
      'Terapias de duelo',
      'Pet Funeral: sistema de identificación, retiro 24/7, ánfora y placa grabada, y guía de duelo',
    ],
    formaDeAcceso: 'Contacta a AFUCH Servicios Centrales para activar el convenio.',
    extensivoGrupoFamiliar: true,
    destacado: false,
    vigencia: 'permanente',
  },
  {
    slug: 'libreria-dimeiggs',
    nombre: 'Librería Dimeiggs',
    categoria: 'educacion',
    resumen: '20% de descuento en compras presenciales y online, con cupón solicitado en AFUCH.',
    descripcion:
      'Descuento en librería y artículos escolares, aplicable tanto en tienda como en el sitio web. Requiere solicitar previamente el cupón de descuento.',
    beneficios: ['20% de descuento en compras presenciales y online'],
    formaDeAcceso:
      'Debes solicitar el cupón de descuento directamente en AFUCH Servicios Centrales antes de comprar.',
    extensivoGrupoFamiliar: false,
    destacado: false,
    vigencia: 'permanente',
  },
];

/** Falla en build si algún convenio se desvía del contrato compartido. */
export const CONVENIOS: readonly Convenio[] = z.array(convenioSchema).parse(convenios);
