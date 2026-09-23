import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import type { ReactNode } from 'react';
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
      <body className="flex min-h-screen flex-col">
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
      </body>
    </html>
  );
}
