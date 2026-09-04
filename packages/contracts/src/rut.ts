/**
 * Validación de RUT chileno con dígito verificador (módulo 11).
 *
 * Vive en `contracts` y no en una app porque el formulario de contacto (Fase 1)
 * y el registro de socios contra la nómina (Fase 2) necesitan exactamente la
 * misma regla. Duplicarla es la vía más rápida a que las dos se separen.
 */

const LARGO_MINIMO_CUERPO = 7;
const LARGO_MAXIMO_CUERPO = 8;

/** Deja el RUT como cuerpo + DV, sin puntos, guion ni espacios, con el DV en mayúscula. */
export function normalizarRut(rut: string): string {
  return rut.replace(/[.\-\s]/g, '').toUpperCase();
}

/**
 * Calcula el dígito verificador de un cuerpo de RUT.
 * Devuelve `null` si el cuerpo no es una secuencia de dígitos.
 */
export function calcularDigitoVerificador(cuerpo: string): string | null {
  if (!/^\d+$/.test(cuerpo)) return null;

  // Se recorre de derecha a izquierda con multiplicadores cíclicos 2..7.
  let suma = 0;
  let multiplicador = 2;
  for (let i = cuerpo.length - 1; i >= 0; i -= 1) {
    suma += Number(cuerpo[i]) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }

  const resto = 11 - (suma % 11);
  if (resto === 11) return '0';
  if (resto === 10) return 'K';
  return String(resto);
}

/** Indica si el RUT es válido, aceptando cualquier formato de entrada. */
export function esRutValido(rut: string): boolean {
  const normalizado = normalizarRut(rut);
  if (!/^\d+[\dK]$/.test(normalizado)) return false;

  const cuerpo = normalizado.slice(0, -1);
  const digitoVerificador = normalizado.slice(-1);

  if (cuerpo.length < LARGO_MINIMO_CUERPO || cuerpo.length > LARGO_MAXIMO_CUERPO) {
    return false;
  }

  return calcularDigitoVerificador(cuerpo) === digitoVerificador;
}

/** Devuelve el RUT con puntos y guion. Si no puede formatearlo, devuelve la entrada intacta. */
export function formatearRut(rut: string): string {
  const normalizado = normalizarRut(rut);
  if (!/^\d+[\dK]$/.test(normalizado)) return rut;

  const cuerpo = normalizado.slice(0, -1);
  const digitoVerificador = normalizado.slice(-1);
  const cuerpoConPuntos = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return `${cuerpoConPuntos}-${digitoVerificador}`;
}
