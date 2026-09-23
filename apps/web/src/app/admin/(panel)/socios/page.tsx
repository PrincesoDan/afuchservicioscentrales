import {
  accionAnularCuenta,
  accionDeshabilitarAusentes,
  accionHabilitacion,
} from '@/app/admin/acciones';
import { BotonConfirmar } from '@/components/admin/boton-confirmar';
import { CLASES_CAMPO } from '@/components/ui/campo';
import { listarSocios, type EstadoCuenta } from '@/server/administracion';

type Filtro = 'todos' | 'con_cuenta' | 'deshabilitados' | 'ausentes';
const FILTROS: Record<Filtro, string> = {
  todos: 'Todos',
  con_cuenta: 'Con cuenta',
  deshabilitados: 'Deshabilitados',
  ausentes: 'Ausentes del último mes',
};
const CUENTA: Record<EstadoCuenta, string> = {
  sin_cuenta: 'Sin cuenta',
  pendiente: 'Pendiente de verificar',
  activa: 'Activa',
};
const LIMITE = 100;

type Props = { searchParams: Promise<{ q?: string; filtro?: string }> };

export default async function PaginaSocios({ searchParams }: Props) {
  const { q, filtro: filtroPedido } = await searchParams;
  const filtro: Filtro =
    filtroPedido && filtroPedido in FILTROS ? (filtroPedido as Filtro) : 'todos';
  const socios = await listarSocios({ busqueda: q, filtro });
  const ausentes =
    filtro === 'ausentes' ? socios.length : (await listarSocios({ filtro: 'ausentes' })).length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy-900">Socios</h1>
      <p className="mt-2 max-w-3xl text-sm/6 text-slate-600">
        Un socio sigue habilitado aunque no aparezca en la última planilla, hasta que se deshabilite
        aquí. «Anular cuenta» borra la cuenta de acceso (no los descuentos): úsalo si alguien
        registró un RUT ajeno.
      </p>

      <form method="get" className="mt-6 flex flex-col gap-3 sm:flex-row">
        <label htmlFor="q" className="sr-only">
          Buscar por RUT o nombre
        </label>
        <input
          id="q"
          name="q"
          defaultValue={q}
          placeholder="RUT o nombre"
          className={`${CLASES_CAMPO} sm:max-w-xs`}
        />
        <label htmlFor="filtro" className="sr-only">
          Filtro
        </label>
        <select
          id="filtro"
          name="filtro"
          defaultValue={filtro}
          className={`${CLASES_CAMPO} sm:max-w-56`}
        >
          {Object.entries(FILTROS).map(([v, t]) => (
            <option key={v} value={v}>
              {t}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md bg-navy-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-600"
        >
          Buscar
        </button>
      </form>

      {ausentes > 0 ? (
        <form
          action={accionDeshabilitarAusentes}
          className="mt-6 flex flex-wrap items-center gap-4 rounded-lg border border-gold-500/40 bg-gold-100/40 p-4 text-sm"
        >
          <span>{ausentes} socios habilitados no aparecen en la última planilla importada.</span>
          <BotonConfirmar
            mensaje={`Se deshabilitarán ${ausentes} socios y perderán el acceso. ¿Continuar?`}
            className="rounded-md border border-gold-700 px-3 py-1.5 font-semibold text-gold-700 hover:bg-gold-100"
          >
            Deshabilitar ausentes
          </BotonConfirmar>
        </form>
      ) : null}

      <p className="mt-6 text-sm text-slate-600">
        {socios.length} resultados
        {socios.length > LIMITE ? ` (se muestran los primeros ${LIMITE})` : ''}.
      </p>

      <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-3">
                Nombre
              </th>
              <th scope="col" className="px-4 py-3">
                RUT
              </th>
              <th scope="col" className="px-4 py-3">
                Estado
              </th>
              <th scope="col" className="px-4 py-3">
                Cuenta
              </th>
              <th scope="col" className="px-4 py-3">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {socios.slice(0, LIMITE).map((s) => (
              <tr key={s.id} className={s.habilitado ? '' : 'bg-slate-50 text-slate-500'}>
                <td className="px-4 py-3">
                  <span className="font-medium">{s.nombre}</span>
                  <span className="block text-xs text-slate-500">{s.facultad}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap tabular-nums">{s.rut}</td>
                <td className="px-4 py-3">
                  {s.habilitado ? 'Habilitado' : 'Deshabilitado'}
                  {!s.enUltimoPeriodo ? (
                    <span className="block text-xs text-gold-700">No está en el último mes</span>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  {CUENTA[s.cuenta]}
                  {s.correo ? (
                    <span className="block text-xs text-slate-500">{s.correo}</span>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-2">
                    <form action={accionHabilitacion}>
                      <input type="hidden" name="socioId" value={s.id} />
                      <input type="hidden" name="habilitado" value={s.habilitado ? 'no' : 'si'} />
                      <BotonConfirmar
                        mensaje={
                          s.habilitado
                            ? `¿Deshabilitar a ${s.nombre}? Perderá el acceso.`
                            : `¿Habilitar a ${s.nombre}?`
                        }
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold hover:border-navy-400"
                      >
                        {s.habilitado ? 'Deshabilitar' : 'Habilitar'}
                      </BotonConfirmar>
                    </form>
                    {s.cuenta !== 'sin_cuenta' ? (
                      <form action={accionAnularCuenta}>
                        <input type="hidden" name="socioId" value={s.id} />
                        <BotonConfirmar
                          mensaje={`¿Anular la cuenta de ${s.nombre}? Deberá registrarse de nuevo.`}
                          className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                        >
                          Anular cuenta
                        </BotonConfirmar>
                      </form>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
