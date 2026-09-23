/**
 * Normaliza para búsqueda: minúsculas y sin tildes, de modo que "optica"
 * encuentre "Óptica". Escribir con tilde en un buscador es fricción innecesaria.
 */
export function normalizar(texto: string): string {
  return texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}
