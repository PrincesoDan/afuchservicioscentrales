import { formatearRut } from '@afuch/contracts';
import type { Metadata } from 'next';
import { SEDE } from '@/content/sede';
import { exigirSocio } from '@/server/auth';
import { descifrar } from '@/server/cifrado';
import { datosDelSocio } from '@/server/descuentos';

export const metadata: Metadata = { title: 'Mis datos' };

/** Solo lectura (decisión D8): el área de socios es de consulta, no de trámites. */
export default async function PaginaDatos() {
  const { socioId } = await exigirSocio();
  const socio = await datosDelSocio(socioId);

  const filas = [
    ['Nombre', descifrar(socio.nombreCifrado)],
    ['RUT', formatearRut(descifrar(socio.rutCifrado))],
    ['Unidad o facultad', socio.facultad ?? '—'],
    ['Correo de la cuenta', socio.cuenta ? descifrar(socio.cuenta.correoCifrado) : '—'],
  ] as const;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-navy-900">Mis datos</h1>
      <dl className="mt-6 divide-y divide-slate-200 rounded-xl border border-slate-200">
        {filas.map(([etiqueta, valor]) => (
          <div key={etiqueta} className="grid gap-1 px-5 py-4 sm:grid-cols-[200px_1fr]">
            <dt className="text-sm text-slate-500">{etiqueta}</dt>
            <dd className="text-sm font-medium text-slate-800">{valor}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-6 text-sm/6 text-slate-600">
        Estos datos provienen de la nómina de AFUCH Servicios Centrales. Si hay algún error,
        escríbenos a{' '}
        <a
          href={`mailto:${SEDE.email}`}
          className="font-semibold text-navy-600 hover:text-navy-800"
        >
          {SEDE.email}
        </a>
        .
      </p>
    </div>
  );
}
