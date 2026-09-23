import { calcularDigitoVerificador } from '@afuch/contracts';
import { expect, test } from '@playwright/test';
import { correosPara, enlaceDelCorreo } from './utilidades';

const RUT = `11.111.111-${calcularDigitoVerificador('11111111')}`;
const CORREO = 'socia.e2e@uchile.cl';
const CLAVE = 'clave-e2e-bien-larga';

test.describe.configure({ mode: 'serial' });

test('sin sesión, el área privada lleva al ingreso', async ({ page }) => {
  await page.goto('/socios/descuentos');
  await expect(page).toHaveURL('/socios');
});

test('registro, verificación, ingreso y consulta', async ({ page }) => {
  await page.goto('/socios/registro');
  await page.getByLabel('RUT').fill(RUT);
  await page.getByLabel('Correo electrónico').fill(CORREO);
  await page.getByRole('button', { name: 'Crear mi cuenta' }).click();
  await expect(page.getByText(/Si tu RUT está en la nómina/)).toBeVisible();

  await page.goto(await enlaceDelCorreo(CORREO));
  await page.getByLabel('Nueva contraseña').fill(CLAVE);
  await page.getByLabel('Repite la contraseña').fill(CLAVE);
  await page.getByRole('button', { name: 'Guardar contraseña' }).click();
  await expect(page.getByText('Tu contraseña quedó guardada.')).toBeVisible();

  await page.getByRole('link', { name: 'Ingresar' }).click();
  await page.getByLabel('RUT').fill(RUT);
  await page.getByLabel('Contraseña').fill(CLAVE);
  await page.getByRole('button', { name: 'Ingresar' }).click();

  await expect(page).toHaveURL('/socios/descuentos');
  await expect(page.getByRole('heading', { name: 'Descuentos de agosto 2026' })).toBeVisible();
  const tabla = page.getByRole('table');
  await expect(tabla.getByRole('rowheader', { name: /Vales de gas Abastible/ })).toBeVisible();
  await expect(
    tabla.getByText('Préstamo 1: cuota 1 de 3 · Préstamo 2: cuota 2 de 3'),
  ).toBeVisible();
  await expect(tabla.getByRole('row', { name: /Total del mes/ })).toContainText('$75.249');

  // El admin publicó este documento en admin.spec.ts (se ejecuta antes).
  await page.getByRole('link', { name: 'Rendición de cuentas' }).click();
  await expect(page.getByText('Balance 2025')).toBeVisible();
  const href = await page
    .getByRole('link', { name: 'Ver documento (PDF)' })
    .first()
    .getAttribute('href');
  const pdf = await page.request.get(href!);
  expect(pdf.headers()['content-type']).toBe('application/pdf');

  await page.getByRole('link', { name: 'Mis datos' }).click();
  await expect(page.getByText('PRUEBA UNO SOCIA').first()).toBeVisible();
  await expect(page.getByText(CORREO)).toBeVisible();
  await expect(page.getByRole('textbox')).toHaveCount(0);

  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL('/socios');
});

test('sin sesión, los documentos de rendición no se entregan', async ({ request }) => {
  const respuesta = await request.get('/api/socios/rendicion/cualquiera', { maxRedirects: 0 });
  expect(respuesta.status()).toBe(401);
});

test('RUT fuera de la nómina recibe el mismo mensaje y ningún correo', async ({ page }) => {
  const rutAjeno = `19.999.999-${calcularDigitoVerificador('19999999')}`;
  await page.goto('/socios/registro');
  await page.getByLabel('RUT').fill(rutAjeno);
  await page.getByLabel('Correo electrónico').fill('ajeno@example.com');
  await page.getByRole('button', { name: 'Crear mi cuenta' }).click();
  await expect(page.getByText(/Si tu RUT está en la nómina/)).toBeVisible();
  expect(correosPara('ajeno@example.com')).toHaveLength(0);
});

test('contraseña incorrecta no ingresa', async ({ page }) => {
  await page.goto('/socios');
  await page.getByLabel('RUT').fill(RUT);
  await page.getByLabel('Contraseña').fill('incorrecta-larga');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page.getByText('RUT o contraseña incorrectos.', { exact: false })).toBeVisible();
});
