import { z } from 'zod';

export const categoriaNoticiaSchema = z.enum([
  'institucional',
  'convenios',
  'asamblea',
  'comunicado',
]);

export type CategoriaNoticia = z.infer<typeof categoriaNoticiaSchema>;

export const CATEGORIAS_NOTICIA: Record<CategoriaNoticia, string> = {
  institucional: 'Institucional',
  convenios: 'Convenios',
  asamblea: 'Asamblea',
  comunicado: 'Comunicado',
};

const imagenNoticiaSchema = z.object({ src: z.string().min(1), alt: z.string().min(1) });

/** Un bloque del cuerpo: un párrafo, o una lista de viñetas. Ambos admiten **negrita** en línea. */
export const bloqueNoticiaSchema = z.union([
  z.string().min(1),
  z.object({ lista: z.array(z.string().min(1)).min(1) }),
]);

export type BloqueNoticia = z.infer<typeof bloqueNoticiaSchema>;

export const noticiaSchema = z.object({
  slug: z.string().min(1),
  titulo: z.string().min(1),
  bajada: z.string().min(1),
  /** ISO 8601, solo fecha: "2026-07-28". */
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  categoria: categoriaNoticiaSchema,
  portada: imagenNoticiaSchema.optional(),
  cuerpo: z.array(bloqueNoticiaSchema).min(1),
  /** Fotos adicionales, que se muestran al final del cuerpo. */
  galeria: z.array(imagenNoticiaSchema).optional(),
  autor: z.string().optional(),
  creditoFoto: z.string().optional(),
  /** Permite republicar notas de terceros con atribución visible y enlace al original. */
  fuente: z.object({ nombre: z.string().min(1), url: z.string().url() }).optional(),
});

export type Noticia = z.infer<typeof noticiaSchema>;
