import { z } from 'zod';
import { esRutValido } from './rut';

export const ASUNTOS_CONTACTO = {
  convenios: 'Consulta por convenios y beneficios',
  afiliacion: 'Quiero afiliarme',
  descuentos: 'Consulta por descuentos por planilla',
  otro: 'Otro',
} as const;

export const asuntoContactoSchema = z.enum(['convenios', 'afiliacion', 'descuentos', 'otro']);

export type AsuntoContacto = z.infer<typeof asuntoContactoSchema>;

export const contactoSchema = z.object({
  nombre: z.string().trim().min(2, 'Ingresa tu nombre').max(80, 'Máximo 80 caracteres'),
  email: z.string().trim().email('Ingresa un correo válido'),
  rut: z
    .string()
    .trim()
    .optional()
    .refine((valor) => !valor || esRutValido(valor), 'El RUT no es válido'),
  unidad: z.string().trim().max(120, 'Máximo 120 caracteres').optional(),
  asunto: asuntoContactoSchema,
  mensaje: z
    .string()
    .trim()
    .min(10, 'Cuéntanos un poco más (mínimo 10 caracteres)')
    .max(2000, 'Máximo 2000 caracteres'),
  /**
   * Honeypot: campo invisible para personas y visible para bots que rellenan
   * todo el formulario. Si viene con contenido, el mensaje se descarta.
   */
  website: z.string().max(0).optional(),
});

export type ContactoInput = z.infer<typeof contactoSchema>;
