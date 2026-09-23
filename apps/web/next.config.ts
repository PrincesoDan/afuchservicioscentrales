import type { NextConfig } from 'next';

const esDesarrollo = process.env.NODE_ENV !== 'production';

/**
 * CSP sin nonces: Next inyecta scripts en línea para hidratar, así que
 * `script-src` necesita 'unsafe-inline'. El resto de directivas sí se restringe
 * al propio origen. `frame-ancestors 'none'` impide incrustar el sitio.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${esDesarrollo ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const cabecerasSeguridad = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  poweredByHeader: false,
  transpilePackages: ['@afuch/contracts', '@afuch/db'],
  serverExternalPackages: ['@node-rs/argon2', 'exceljs', 'rate-limiter-flexible'],
  // La planilla mensual pesa ~650 KB y los PDF de rendición hasta 20 MB.
  experimental: { serverActions: { bodySizeLimit: '21mb' } },
  async headers() {
    return [{ source: '/:path*', headers: cabecerasSeguridad }];
  },
};

export default nextConfig;
