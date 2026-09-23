import { z } from 'zod';
import { esRutValido, normalizarRut } from './rut';

/** RUT en cualquier formato de entrada; sale normalizado (cuerpo + DV, sin puntos ni guion). */
export const rutSchema = z
  .string()
  .trim()
  .min(1, 'Ingresa tu RUT')
  .refine(esRutValido, 'El RUT no es válido')
  .transform(normalizarRut);

const LARGO_MINIMO_CONTRASENA = 10;

export const contrasenaSchema = z
  .string()
  .min(LARGO_MINIMO_CONTRASENA, `Usa al menos ${LARGO_MINIMO_CONTRASENA} caracteres`)
  .max(128, 'Máximo 128 caracteres');

export const registroSchema = z.object({
  rut: rutSchema,
  correo: z.string().trim().toLowerCase().email('Ingresa un correo válido').max(254),
});

export type RegistroInput = z.infer<typeof registroSchema>;

export const ingresoSocioSchema = z.object({
  rut: rutSchema,
  contrasena: z.string().min(1, 'Ingresa tu contraseña').max(128),
});

export type IngresoSocioInput = z.infer<typeof ingresoSocioSchema>;

export const recuperarSchema = z.object({ rut: rutSchema });

export const definirContrasenaSchema = z
  .object({
    token: z.string().min(20).max(200),
    contrasena: contrasenaSchema,
    confirmacion: z.string(),
  })
  .refine((datos) => datos.contrasena === datos.confirmacion, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmacion'],
  });

export type DefinirContrasenaInput = z.infer<typeof definirContrasenaSchema>;

export const ingresoAdminSchema = z.object({
  email: z.string().trim().toLowerCase().email('Ingresa un correo válido'),
  contrasena: z.string().min(1, 'Ingresa tu contraseña').max(128),
  codigo: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'El código tiene 6 dígitos'),
});

export type IngresoAdminInput = z.infer<typeof ingresoAdminSchema>;
