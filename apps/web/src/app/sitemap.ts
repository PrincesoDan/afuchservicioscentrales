import type { MetadataRoute } from 'next';
import { SEDE } from '@/content/sede';
import { CONVENIOS } from '@/content/convenios';
import { NOTICIAS } from '@/content/noticias';

const BASE = SEDE.sitioUrl;

export default function sitemap(): MetadataRoute.Sitemap {
  const estaticas = ['', '/quienes-somos', '/beneficios', '/noticias', '/contacto', '/privacidad'];

  return [
    ...estaticas.map((ruta) => ({ url: `${BASE}${ruta}`, lastModified: new Date() })),
    ...CONVENIOS.map((convenio) => ({ url: `${BASE}/beneficios/${convenio.slug}` })),
    ...NOTICIAS.map((noticia) => ({
      url: `${BASE}/noticias/${noticia.slug}`,
      lastModified: new Date(noticia.fecha),
    })),
  ];
}
