import { expect, test } from '@playwright/test';

test('navegación principal del sitio público', async ({ page, isMobile }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/AFUCH Servicios Centrales/);

  // En celular la navegación es la barra inferior, con etiquetas cortas.
  for (const [escritorio, movil, ruta, titulo] of [
    ['Quiénes somos', 'Nosotros', '/quienes-somos', /Quiénes somos/],
    ['Convenios y beneficios', 'Beneficios', '/beneficios', /Convenios/],
    ['Noticias', 'Noticias', '/noticias', /Noticias/],
    ['Contacto', 'Contacto', '/contacto', /Contacto/],
    ['Inicio', 'Inicio', '/', /AFUCH Servicios Centrales/],
  ] as const) {
    await page
      .getByRole('navigation', {
        name: isMobile ? 'Navegación principal móvil' : 'Navegación principal',
        exact: true,
      })
      .getByRole('link', { name: isMobile ? movil : escritorio, exact: true })
      .click();
    await expect(page).toHaveURL(ruta);
    await expect(page).toHaveTitle(titulo);
  }
});

test('filtra beneficios por categoría', async ({ page }) => {
  await page.goto('/beneficios');
  await page
    .getByRole('group', { name: 'Filtrar por categoría' })
    .getByRole('button', { name: 'Salud' })
    .click();
  await expect(page.getByText('4 convenios')).toBeVisible();
  await expect(page.getByRole('link', { name: /FALP/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Abastible/ })).toHaveCount(0);
});

test('busca y filtra noticias', async ({ page }) => {
  await page.goto('/noticias');
  await page.getByLabel('Buscar noticias').fill('rectora');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await expect(page).toHaveURL(/q=rectora/);
  await expect(page.getByText('1 noticia')).toBeVisible();

  await page.getByLabel('Buscar noticias').fill('palabra-que-no-existe');
  await page.getByRole('button', { name: 'Buscar' }).click();
  await expect(page.getByText('No hay noticias que coincidan con tu búsqueda.')).toBeVisible();
});

test('envía el formulario de contacto', async ({ page }) => {
  await page.goto('/contacto');
  await page.getByLabel(/Nombre y apellido/).fill('Persona de Prueba');
  await page.getByLabel(/Correo electrónico/).fill('persona@example.com');
  await page.getByLabel(/Mensaje/).fill('Quisiera saber cómo afiliarme a la asociación.');
  await page.getByRole('button', { name: 'Enviar mensaje' }).click();
  await expect(page.getByRole('heading', { name: 'Mensaje enviado' })).toBeVisible();
});

test('muestra errores de validación del contacto', async ({ page }) => {
  await page.goto('/contacto');
  await page.getByRole('button', { name: 'Enviar mensaje' }).click();
  await expect(page.getByText('Ingresa tu nombre')).toBeVisible();
});
