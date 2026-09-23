import { db } from '@afuch/db';
import { FormularioPlanilla } from '@/components/admin/formulario-planilla';
import { nombrePeriodo } from '@/lib/periodos';
import { NOMBRE_CONCEPTO } from '@/server/descuentos';

export default async function PaginaPlanilla() {
  const periodos = await db().periodo.findMany({
    orderBy: [{ anio: 'desc' }, { mes: 'desc' }],
    take: 12,
  });

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_300px]">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Planilla mensual de descuentos</h1>
        <p className="mt-2 mb-8 max-w-2xl text-sm/6 text-slate-600">
          Sube la planilla, revisa la vista previa y confirma. Reimportar un mes lo reemplaza
          completo. Importar nunca deshabilita socios: para eso usa la sección Socios.
        </p>
        <FormularioPlanilla nombresConcepto={NOMBRE_CONCEPTO} />
      </div>
      <aside>
        <h2 className="eyebrow mb-4 text-slate-600">Periodos importados</h2>
        {periodos.length === 0 ? (
          <p className="text-sm text-slate-500">Ninguno todavía.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {periodos.map((p) => (
              <li key={p.id} className="flex justify-between gap-4">
                <span className="capitalize">{nombrePeriodo(p.anio, p.mes)}</span>
                <span className="text-slate-500">{p.importadoEn.toLocaleDateString('es-CL')}</span>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}
