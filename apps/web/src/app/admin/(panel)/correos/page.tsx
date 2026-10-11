import { db } from '@afuch/db';
import Link from 'next/link';
import { FormularioCorreoSocio } from '@/components/admin/formulario-correo-socio';
import { FormularioCorreos } from '@/components/admin/formulario-correos';

export default async function PaginaCorreos() {
  const [total, conCorreo] = await Promise.all([
    db().socio.count(),
    db().socio.count({ where: { correoHash: { not: null } } }),
  ]);

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_300px]">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Correos de socios</h1>
        <p className="mt-2 mb-8 max-w-2xl text-sm/6 text-slate-600">
          El socio crea su cuenta e ingresa con el correo que se carga aquí; sin correo no puede
          registrarse. Sube la lista validada por AFUCH, revisa la vista previa y confirma. Los
          socios deben existir antes: se crean al importar la planilla mensual.
        </p>
        <FormularioCorreos />

        <h2 className="mt-14 text-xl font-bold text-navy-900">Agregar o corregir un correo</h2>
        <p className="mt-2 mb-6 max-w-2xl text-sm/6 text-slate-600">
          Si el socio ya tenía cuenta, la conserva e ingresa con el correo nuevo; se le avisa al
          correo anterior.
        </p>
        <FormularioCorreoSocio />
      </div>

      <aside>
        <h2 className="eyebrow mb-4 text-slate-600">Estado</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt>Socios</dt>
            <dd className="tabular-nums">{total}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Con correo cargado</dt>
            <dd className="tabular-nums">{conCorreo}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Sin correo</dt>
            <dd className="tabular-nums">{total - conCorreo}</dd>
          </div>
        </dl>
        {total - conCorreo > 0 ? (
          <Link
            href="/admin/socios?filtro=sin_correo"
            className="mt-4 inline-block text-sm font-semibold text-navy-600 hover:text-navy-800"
          >
            Ver socios sin correo
          </Link>
        ) : null}
      </aside>
    </div>
  );
}
