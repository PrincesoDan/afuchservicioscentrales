// @vitest-environment node
import { db } from '@afuch/db';
import { rm } from 'node:fs/promises';
import { beforeEach, describe, expect, it } from 'vitest';
import { limpiarBase } from '@/test/base';
import { leerDocumento, listarDocumentos, publicarDocumento, retirarDocumento } from './rendicion';

const CLI = { tipo: 'SISTEMA', id: 'test' } as const;
const PDF = Buffer.from('%PDF-1.4\n%prueba\n');
const DATOS = { titulo: 'Balance 2025', categoria: 'Balances', fecha: '2026-03-31' };

describe('rendición de cuentas', () => {
  beforeEach(async () => {
    await limpiarBase();
    await rm('.storage-test', { recursive: true, force: true });
  });

  it('publica, lista, lee y retira un PDF', async () => {
    const documento = await publicarDocumento(DATOS, PDF, CLI);
    expect(await listarDocumentos()).toHaveLength(1);

    const leido = await leerDocumento(documento.id);
    expect(leido?.contenido.equals(PDF)).toBe(true);

    await retirarDocumento(documento.id, CLI);
    expect(await db().documentoRendicion.count()).toBe(0);
    await expect(leerDocumento(documento.id)).resolves.toBeNull();
  });

  it('rechaza archivos que no son PDF', async () => {
    await expect(publicarDocumento(DATOS, Buffer.from('<html>'), CLI)).rejects.toThrow(
      'no es un PDF',
    );
  });
});
