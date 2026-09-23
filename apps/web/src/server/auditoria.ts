import 'server-only';
import { db, type ActorTipo, type Prisma } from '@afuch/db';

export type EventoAuditoria = {
  actorTipo: ActorTipo;
  actorId?: string | null;
  accion: string;
  entidad?: string;
  entidadId?: string;
  ip?: string | null;
  /** Nunca datos personales en claro: ids, conteos, motivos. */
  detalle?: Prisma.InputJsonValue;
};

export async function auditar(evento: EventoAuditoria): Promise<void> {
  await db().registroAuditoria.create({
    data: {
      actorTipo: evento.actorTipo,
      actorId: evento.actorId ?? null,
      accion: evento.accion,
      entidad: evento.entidad ?? null,
      entidadId: evento.entidadId ?? null,
      ip: evento.ip ?? null,
      detalle: evento.detalle,
    },
  });
}
