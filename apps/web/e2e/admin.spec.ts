import { calcularDigitoVerificador } from '@afuch/contracts';
import { expect, test, type Page } from '@playwright/test';
import path from 'node:path';
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { crearListaCorreosFicticia } from '../src/server/fixtures/planilla-ficticia';
import { CORREO_SOCIA } from './entorno';
import { credencialesAdmin } from './utilidades';

test.describe.configure({ mode: 'serial' });

function seccion(page: Page, nombre: string) {
  return page
    .getByRole('navigation', { name: 'Secciones de administración' })
    .getByRole('link', { name: nombre, exact: true });
}

async function ingresarAdmin(page: Page) {
  const { email, contrasena, codigo } = credencialesAdmin();
  await page.goto('/admin/ingreso');
  await page.getByLabel('Correo').fill(email);
  await page.getByLabel('Contraseña').fill(contrasena);
  await page.getByLabel('Código de la app autenticadora').fill(codigo);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page).toHaveURL('/admin/planilla');
}

test('sin sesión de admin, /admin lleva al ingreso de admin', async ({ page }) => {
  await page.goto('/admin/socios');
  await expect(page).toHaveURL('/admin/ingreso');
});

test('publica un documento de rendición', async ({ page }) => {
  await ingresarAdmin(page);
  await seccion(page, 'Rendición de cuentas').click();

  const pdf = path.join(tmpdir(), 'balance-e2e.pdf');
  writeFileSync(pdf, '%PDF-1.4\n%e2e\n');
  await page.getByLabel('Título').fill('Balance 2025');
  await page.getByLabel('Categoría').fill('Balances');
  await page.getByLabel('Fecha del documento').fill('2026-03-31');
  await page.getByLabel('PDF (máx. 20 MB)').setInputFiles(pdf);
  await page.getByRole('button', { name: 'Publicar' }).click();
  await expect(page.getByText('Publicado: Balance 2025')).toBeVisible();
});

test('lista socios y deshabilita uno', async ({ page }) => {
  await ingresarAdmin(page);
  await seccion(page, 'Socios').click();
  await expect(page.getByText('3 resultados')).toBeVisible();

  const rut = `12.222.222-${calcularDigitoVerificador('12222222')}`;
  const fila = page.getByRole('row', { name: new RegExp(rut.replace(/\./g, '\\.')) });
  page.once('dialog', (d) => d.accept());
  await fila.getByRole('button', { name: 'Deshabilitar' }).click();
  await expect(fila.getByText('Deshabilitado')).toBeVisible();
});

test('carga la lista de correos, corrige uno y filtra a quienes no tienen', async ({ page }) => {
  await ingresarAdmin(page);
  await seccion(page, 'Correos de socios').click();
  await expect(page.getByRole('heading', { name: 'Correos de socios' })).toBeVisible();

  await page.getByLabel('Lista de correos (.xlsx)').setInputFiles({
    name: 'correos.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: await crearListaCorreosFicticia([
      { rut: `11.111.111-${calcularDigitoVerificador('11111111')}`, correo: CORREO_SOCIA },
      { rut: `19.999.999-${calcularDigitoVerificador('19999999')}`, correo: 'nadie@uchile.cl' },
    ]),
  });
  await page.getByRole('button', { name: 'Ver vista previa' }).click();
  const vista = page.getByRole('definition');
  await expect(vista.nth(1)).toHaveText('1');
  await expect(page.getByText('Las filas cuyo RUT no es de un socio se omiten.')).toBeVisible();

  await page.getByRole('button', { name: 'Cargar 1 correos' }).click();
  await expect(page.getByText(/Correos cargados: 1 nuevos y 0 cambiados/)).toBeVisible();

  // Mismo test que la carga: el ingreso de admin admite 5 intentos cada 15 minutos por IP.
  await page.getByLabel('RUT del socio').fill('13333333-0');
  await page.getByLabel('Correo electrónico').fill('tres@uchile.cl');
  await page.getByRole('button', { name: 'Guardar correo' }).click();
  await expect(page.getByText('El RUT no es válido')).toBeVisible();

  await page
    .getByLabel('RUT del socio')
    .fill(`13.333.333-${calcularDigitoVerificador('13333333')}`);
  await page.getByRole('button', { name: 'Guardar correo' }).click();
  await expect(page.getByText('Correo guardado. El socio ya puede crear su cuenta.')).toBeVisible();

  await page.getByRole('link', { name: 'Ver socios sin correo' }).click();
  await expect(page).toHaveURL('/admin/socios?filtro=sin_correo');
  await expect(page.getByText('1 resultados')).toBeVisible();
  await expect(page.getByRole('cell', { name: /Sin correo cargado/ })).toBeVisible();
});

test('vista previa de la planilla', async ({ page }) => {
  await ingresarAdmin(page);
  await page.getByLabel('Planilla (.xlsx)').setInputFiles({
    name: 'no-es-excel.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: Buffer.from('no soy un excel'),
  });
  await page.getByRole('button', { name: 'Ver vista previa' }).click();
  await expect(page.getByText(/no es un Excel/)).toBeVisible();
});

test('el registro de auditoría muestra las acciones', async ({ page }) => {
  await ingresarAdmin(page);
  await seccion(page, 'Auditoría').click();
  await expect(page.getByRole('cell', { name: 'socio.deshabilitado' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'rendicion.publicada' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'correos.importados' })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'socio.correo_definido' })).toBeVisible();
});
