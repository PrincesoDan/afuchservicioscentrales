// @vitest-environment node
import { db } from '@afuch/db';
import ExcelJS from 'exceljs';
import { beforeEach, describe, expect, it } from 'vitest';
import { limpiarBase } from '@/test/base';
import { cargarBaseDePrueba, leerPadronDePrueba, rutDePrueba } from './base-de-prueba';
import { descifrar, hashCorreo } from './cifrado';
import { periodosDelSocio } from './descuentos';

const CLI = { tipo: 'SISTEMA', id: 'test' } as const;

async function padron(filas: (string | null)[][]): Promise<Buffer> {
  const libro = new ExcelJS.Workbook();
  const hoja = libro.addWorksheet('Hoja 1');
  hoja.addRow(['Prueba de test']);
  hoja.addRow(['Nombre', 'Apellido paterno', 'Apellido Materno', 'Mail']);
  for (const fila of filas) hoja.addRow(fila);
  return Buffer.from(await libro.xlsx.writeBuffer());
}

describe('base de prueba', () => {
  beforeEach(limpiarBase);

  it('lee el padrón bajo un título, arma el nombre y normaliza el correo', async () => {
    const lectura = await leerPadronDePrueba(
      await padron([
        ['Ana', 'Pérez', null, ' Ana@Example.com '],
        ['Luis Alberto', null, null, 'luis@example.com'],
      ]),
    );
    expect(lectura).toEqual({
      personas: [
        { nombre: 'PÉREZ ANA', correo: 'ana@example.com' },
        { nombre: 'LUIS ALBERTO', correo: 'luis@example.com' },
      ],
      errores: [],
    });
  });

  it('informa filas sin correo válido y correos repetidos', async () => {
    const lectura = await leerPadronDePrueba(
      await padron([
        ['Ana', null, null, 'no-es-correo'],
        ['Luis', null, null, 'luis@example.com'],
        ['Lucho', null, null, 'luis@example.com'],
      ]),
    );
    expect(lectura.errores).toEqual([
      'Fila 3: falta el nombre o el correo no es válido.',
      'Hay correos repetidos.',
    ]);
  });

  it('crea socios con RUT ficticio, correo y dos meses de descuentos', async () => {
    const { personas } = await leerPadronDePrueba(
      await padron([
        ['Ana', 'Pérez', null, 'ana@example.com'],
        ['Luis', 'Soto', 'Rojas', 'luis@example.com'],
      ]),
    );
    const base = await cargarBaseDePrueba(personas, CLI);

    expect(base.socios.map((s) => s.rut)).toEqual(['11.111.111-1', '22.222.222-2']);
    expect(rutDePrueba(1)).toBe('222222222');

    const ana = await db().socio.findUniqueOrThrow({
      where: { correoHash: hashCorreo('ana@example.com') },
    });
    expect(descifrar(ana.rutCifrado)).toBe('111111111');
    expect(descifrar(ana.nombreCifrado)).toBe('PÉREZ ANA');
    expect((await periodosDelSocio(ana.id)).map((p) => `${p.anio}-${p.mes}`)).toEqual([
      '2026-9',
      '2026-8',
    ]);
  });
});
