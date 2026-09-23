import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';
import { BarraInferior } from '@/components/barra-inferior';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { SEDE } from '@/content/sede';
import './globals.css';

/**
 * Inter es la sustituta libre más cercana a Helvetica en color de texto. El
 * stack de respaldo cae a Helvetica real en macOS y a Arial en el resto, nunca
 * a un serif del sistema.
 */
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  fallback: ['Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
});

export const metadata: Metadata = {
  metadataBase: new URL(SEDE.sitioUrl),
  title: {
    default: 'AFUCH Servicios Centrales',
    template: '%s · AFUCH Servicios Centrales',
  },
  description:
    'Asociación de Funcionarios de la Universidad de Chile, Servicios Centrales. Convenios, beneficios y Fondo Solidario para trabajadoras y trabajadores de la Casa de Bello.',
  openGraph: {
    type: 'website',
    locale: 'es_CL',
    siteName: 'AFUCH Servicios Centrales',
    images: ['/og.png'],
  },
  icons: { icon: '/icon.png' },
};

/** `viewport-fit=cover` habilita `env(safe-area-inset-bottom)` para la barra inferior en iPhone. */
export const viewport: Viewport = { viewportFit: 'cover', themeColor: '#00205c' };

export default function RootLayout({ children }: { children: ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SEDE.nombre,
    alternateName: SEDE.nombreLargo,
    url: SEDE.sitioUrl,
    logo: `${SEDE.sitioUrl}/icon.png`,
    email: SEDE.email,
    telephone: SEDE.telefono,
    address: {
      '@type': 'PostalAddress',
      streetAddress: SEDE.direccion,
      addressLocality: SEDE.comuna,
      addressRegion: SEDE.region,
      addressCountry: 'CL',
    },
  };

  return (
    <html lang="es-CL" className={inter.variable}>
      {/* En celular se reserva el alto de la barra inferior para que no tape el footer. */}
      <body className="flex min-h-screen flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0">
        <script
          type="application/ld+json"
          // JSON-LD estático, sin datos de usuario.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <SiteHeader />
        <main id="contenido" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <BarraInferior />
      </body>
    </html>
  );
}
