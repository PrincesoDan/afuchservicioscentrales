/** Quién ejecuta una acción administrativa: un admin desde /admin o el CLI. */
export type Actor =
  { tipo: 'ADMIN'; id: string; ip?: string | null } | { tipo: 'SISTEMA'; id: string };

export function descripcionActor(actor: Actor): string {
  return actor.tipo === 'ADMIN' ? `admin:${actor.id}` : `cli:${actor.id}`;
}
