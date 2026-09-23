import 'server-only';
import { z } from 'zod';

const clave32Bytes = z
  .string()
  .refine(
    (valor) => Buffer.from(valor, 'base64').length === 32,
    'Debe ser 32 bytes en base64 (openssl rand -base64 32)',
  );

const esquema = z.object({
  DATABASE_URL: z.string().url(),
  /** AES-256-GCM para datos personales. Rotarla exige recifrar (ver runbook). */
  CLAVE_CIFRADO: clave32Bytes,
  /** HMAC para el índice ciego del RUT. Distinta de CLAVE_CIFRADO. */
  CLAVE_HMAC: clave32Bytes,
  NEXTAUTH_SECRET: z.string().min(32),
  /** URL pública del sitio, para los enlaces de los correos. */
  NEXTAUTH_URL: z.string().url(),
  /** Sin clave (solo desarrollo) los correos se imprimen en consola. */
  RESEND_API_KEY: z.string().optional(),
  /** Solo desarrollo: carpeta donde se guardan los correos en vez de enviarlos. */
  CORREO_BUZON_DIR: z.string().optional(),
  CORREO_REMITENTE: z
    .string()
    .default('AFUCH Servicios Centrales <no-responder@afuchservicioscentrales.cl>'),
  CORREO_CONTACTO_DESTINO: z.string().email().default('contacto@afuchservicioscentrales.cl'),
  /** Carpeta persistente (volumen Docker) para los documentos de rendición. */
  STORAGE_DIR: z.string().default('./storage'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

export type Env = z.infer<typeof esquema>;

let cache: Env | undefined;

/** Lee y valida el entorno la primera vez que se usa, no al importar el módulo (el build no tiene secretos). */
export function env(): Env {
  if (cache) return cache;
  const resultado = esquema.safeParse(process.env);
  if (!resultado.success) {
    const detalle = resultado.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    throw new Error(`Variables de entorno inválidas: ${detalle}`);
  }
  if (resultado.data.NODE_ENV === 'production' && !resultado.data.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY es obligatoria en producción.');
  }
  cache = resultado.data;
  return cache;
}
