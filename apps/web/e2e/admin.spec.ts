import { calcularDigitoVerificador } from '@afuch/contracts';
import { expect, test, type Page } from '@playwright/test';
import path from 'node:path';
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { credencialesAdmin } from './utilidades';

test.describe.configure({ mode: 'serial' });

function seccion(page: Page, nombre: string) {
  return page
    .getByRole('navigation', { name: 'Secciones de administración' })
    .getByRole('link', { name: nombre });
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
});
