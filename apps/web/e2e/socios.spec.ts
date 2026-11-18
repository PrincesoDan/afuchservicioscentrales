import { expect, test } from '@playwright/test';
import { CORREO_SOCIA as CORREO } from './entorno';
import { correosPara, enlaceDelCorreo } from './utilidades';

// El admin cargó este correo para la socia de prueba en admin.spec.ts (se ejecuta antes).
const CLAVE = 'clave-e2e-bien-larga';

test.describe.configure({ mode: 'serial' });

test('sin sesión, el área privada lleva al ingreso', async ({ page }) => {
  await page.goto('/socios/descuentos');
  await expect(page).toHaveURL('/socios');
});

test('registro, verificación, ingreso y consulta', async ({ page }) => {
  await page.goto('/socios/registro');
  await expect(page.getByLabel('RUT')).toHaveCount(0);
  await page.getByLabel('Correo electrónico').fill(CORREO);
  await page.getByRole('button', { name: 'Crear mi cuenta' }).click();
  await expect(page.getByText(/es el correo que AFUCH tiene registrado para ti/)).toBeVisible();

  await page.goto(await enlaceDelCorreo(CORREO));
  await page.getByLabel('Nueva contraseña').fill(CLAVE);
  await page.getByLabel('Repite la contraseña').fill(CLAVE);
  await page.getByRole('button', { name: 'Guardar contraseña' }).click();
  await expect(page.getByText('Tu contraseña quedó guardada.')).toBeVisible();

  await page.getByRole('link', { name: 'Ingresar' }).click();
  await page.getByLabel('Correo electrónico').fill(CORREO);
  await page.getByLabel('Contraseña').fill(CLAVE);
  await page.getByRole('button', { name: 'Ingresar' }).click();

  await expect(page).toHaveURL('/socios/descuentos');
  await expect(page.getByRole('heading', { name: 'Descuentos de agosto 2026' })).toBeVisible();
  const tabla = page.getByRole('table');
  await expect(tabla.getByRole('rowheader', { name: /Vales de gas Abastible/ })).toBeVisible();
  await expect(
    tabla.getByText('AFUCH Servicios Centrales (60%) $2.558 · FENAFUCH (40%) $1.705'),
  ).toBeVisible();
  await expect(
    tabla.getByText('Préstamo del 12-07-2026 por $60.000: cuota 1 de 3, $20.000'),
  ).toBeVisible();
  await expect(tabla.getByText('11 kg: $19.197 · 15 kg: $23.909 (2 vales en total)')).toBeVisible();
  await expect(tabla.getByRole('row', { name: /Total del mes/ })).toContainText('$94.163');
  await expect(tabla.getByText(/Go Optic|bono de invierno/i)).toHaveCount(0);

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

test('un correo que AFUCH no cargó recibe el mismo mensaje y ningún correo', async ({ page }) => {
  await page.goto('/socios/registro');
  await page.getByLabel('Correo electrónico').fill('ajeno@example.com');
  await page.getByRole('button', { name: 'Crear mi cuenta' }).click();
  await expect(page.getByText(/es el correo que AFUCH tiene registrado para ti/)).toBeVisible();
  expect(correosPara('ajeno@example.com')).toHaveLength(0);
});

test('recupera la contraseña con el correo', async ({ page }) => {
  await page.goto('/socios/recuperar');
  await page.getByLabel('Correo electrónico').fill(CORREO);
  await page.getByRole('button', { name: 'Enviar enlace' }).click();
  await expect(page.getByText(/Si ese correo tiene una cuenta activa/)).toBeVisible();

  const enlace = await enlaceDelCorreo(CORREO, '/socios/restablecer');
  await page.goto(enlace);
  await page.getByLabel('Nueva contraseña').fill(CLAVE);
  await page.getByLabel('Repite la contraseña').fill(CLAVE);
  await page.getByRole('button', { name: 'Guardar contraseña' }).click();
  await expect(page.getByText('Tu contraseña quedó guardada.')).toBeVisible();
});

test('contraseña incorrecta no ingresa', async ({ page }) => {
  await page.goto('/socios');
  await page.getByLabel('Correo electrónico').fill(CORREO);
  await page.getByLabel('Contraseña').fill('incorrecta-larga');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page.getByText('Correo o contraseña incorrectos.', { exact: false })).toBeVisible();
  await expect(page.getByRole('link', { name: 'creado tu cuenta' })).toHaveAttribute(
    'href',
    '/socios/registro',
  );
  await expect(page.getByRole('link', { name: 'restablécela' })).toHaveAttribute(
    'href',
    '/socios/recuperar',
  );
});

test('el ingreso explica los pasos de la primera vez', async ({ page }) => {
  await page.goto('/socios');
  await expect(page.getByRole('heading', { name: /primera vez/ })).toBeVisible();
  await page.getByRole('link', { name: 'Crea tu cuenta' }).click();
  await expect(page).toHaveURL('/socios/registro');
});
