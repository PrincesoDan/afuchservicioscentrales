import { z } from 'zod';

/**
 * Categorías del catálogo. Incluye `recreacion` y `comercio`, que la propuesta
 * a AFUCH menciona pero que todavía no tienen convenios cargados: el filtro solo
 * muestra las categorías con al menos un convenio.
 */
export const categoriaConvenioSchema = z.enum([
  'salud',
  'ahorro-credito',
  'solidaridad',
  'gas',
  'funeraria',
  'educacion',
  'recreacion',
  'comercio',
]);

export type CategoriaConvenio = z.infer<typeof categoriaConvenioSchema>;

export const CATEGORIAS_CONVENIO: Record<CategoriaConvenio, string> = {
  salud: 'Salud',
  'ahorro-credito': 'Ahorro y crédito',
  solidaridad: 'Solidaridad',
  gas: 'Gas',
  funeraria: 'Funeraria',
  educacion: 'Educación',
  recreacion: 'Recreación',
  comercio: 'Comercio',
};

export const vigenciaSchema = z.union([
  z.literal('permanente'),
  z.object({
    desde: z.string().optional(),
    hasta: z.string().optional(),
  }),
]);

export const convenioSchema = z.object({
  slug: z.string().min(1),
  nombre: z.string().min(1),
  categoria: categoriaConvenioSchema,
  /** Una o dos líneas para la tarjeta del listado. */
  resumen: z.string().min(1),
  /** Párrafo de contexto para la ficha. */
  descripcion: z.string().min(1),
  beneficios: z.array(z.string().min(1)).min(1),
  formaDeAcceso: z.string().min(1),
  formaDePago: z.string().optional(),
  /**
   * Campo de primer nivel y no un bullet más: aparece en casi todos los
   * convenios de salud y es el dato que más pesa en la decisión del socio, así
   * que la tarjeta lo muestra como chip y el catálogo puede filtrar por él.
   */
  extensivoGrupoFamiliar: z.boolean(),
  destacado: z.boolean(),
  vigencia: vigenciaSchema,
  contacto: z
    .object({
      web: z.string().url().optional(),
      telefono: z.string().optional(),
      email: z.string().email().optional(),
    })
    .optional(),
  /** Tabla opcional de montos, para convenios con varios topes (ej. Fondo Solidario). */
  montos: z
    .array(z.object({ concepto: z.string().min(1), monto: z.number().int().nonnegative() }))
    .optional(),
  notaMontos: z.string().optional(),
});

export type Convenio = z.infer<typeof convenioSchema>;
