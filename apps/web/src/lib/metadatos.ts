import type { Metadata } from 'next';
import { SEDE } from '@/content/sede';

/**
 * Vista previa del enlace en WhatsApp, Telegram y LinkedIn. Next reemplaza
 * `openGraph` completo cuando una página define el suyo (no lo mezcla con el
 * del layout), así que las páginas que agregan campos deben partir de esta base
 * o pierden la imagen. Las dimensiones van declaradas porque WhatsApp y
 * LinkedIn omiten la imagen si tienen que descargarla para conocerlas.
 */
export const OPEN_GRAPH_BASE = {
  type: 'website',
  locale: 'es_CL',
  siteName: SEDE.nombre,
  // Relativa: Next la resuelve contra `metadataBase` y la ruta de cada página.
  url: './',
  images: [
    {
      url: '/og.png',
      width: 1200,
      height: 630,
      type: 'image/png',
      alt: SEDE.nombre,
    },
  ],
} satisfies NonNullable<Metadata['openGraph']>;
