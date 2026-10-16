# Plan — Ajustes tras la reunión con AFUCH (2026-10-11)

Complementa `2026-09-23-plan-cierre-propuesta.md`. Reemplaza la decisión **D4** (registro) y
agrega las decisiones **D10–D13**.

**Estado (2026-10-11):** implementado todo lo que no depende de AFUCH. Quedan C2 (teléfono
y dirección) y los datos de C5 y C6 (clasificación de convenios, fotos de la directiva), cuyo
soporte en el código ya existe; la carga inicial de correos (A4) y la prueba de envío en
producción (B10).

## 1. Decisiones tomadas

| #   | Tema                | Decisión                                                                                                                                                                                                                               |
| --- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D4′ | Registro            | **Reemplaza D4.** El socio se registra con **su correo**, que debe coincidir con el que AFUCH precargó. Ya no se pide RUT en ningún formulario público. Sin correo precargado no hay registro.                                          |
| D10 | Ingreso             | **Correo + contraseña.** Recuperación también por correo. Se mantiene el flujo de verificación, contraseña y bloqueo ya construido.                                                                                                     |
| D11 | Fuente de correos   | **Lista validada por AFUCH** (RUT + correo). No se carga el cruce automático sin revisión. Un admin puede agregar o corregir un correo a mano.                                                                                          |
| D12 | Conceptos ocultos   | «Convenio óptica Go Optic» y «Reintegro bono de invierno» **no se muestran ni se suman** en «Mis descuentos». Se siguen leyendo de la planilla. El total del sitio puede diferir de la liquidación: se avisa en pantalla.                |
| D13 | Relación FENAFUCH   | Texto entregado por La Palanca: «AFUCH Servicios Centrales es parte de la FENAFUCH. Todas las personas afiliadas a AFUCH Servicios Centrales son parte de la FENAFUCH y, por ende, tienen acceso a todos sus beneficios y convenios.» |

Dato de contexto: **no hay cuentas reales registradas en producción**, así que no hay migración
de cuentas que cuidar.

## 2. Pendientes que dependen de AFUCH

| #   | Qué falta                                                             | Bloquea       |
| --- | --------------------------------------------------------------------- | ------------- |
| A1  | ~~Teléfono y dirección nuevos~~ (llegó el 2026-10-15)                 | Tarea C2      |
| A2  | ~~Convenios AFUCH SC / FENAFUCH~~ (llegó el 2026-10-15)               | Tarea C5      |
| A3  | Fotografías de la directiva (y nómina con nombres y cargos)           | Tarea C6      |
| A4  | Excel de correos: llegó `info/SOCIOS PAGINA WEB AFUCHSCEN.xlsx` (2026-10-15); 8 filas con RUT o correo inválido | Carga inicial |
| A5  | API key de Resend y dominio `afuchscen.cl` verificado en Resend (DNS) | Producción    |

Preguntas abiertas para AFUCH:

- **P7.** El convenio «Fondo Solidario» y la portada mencionan un «bono de invierno anual». ¿Se
  mantiene? (Lo que se pidió eliminar es el concepto de descuento «Reintegro bono de invierno»;
  son cosas distintas y por ahora no se toca el texto del beneficio.)
- **P8.** ¿Se enlaza al sitio de FENAFUCH? Si sí, ¿cuál es la URL oficial?

Respondido por AFUCH el 2026-10-15: P7 → el bono de invierno se mantiene (anual, en julio).
Llegaron también misión, visión, formularios de Google (afiliación y vales de gas; el de gas
solo en el área de socios) y queda pendiente el formulario «Danos tu opinión»
(`FORMULARIOS.opinion` en `content/sede.ts`; sin URL la sección no se muestra).

## 3. Parte B — Registro e ingreso por correo

### 3.1 Diseño

- El correo pasa a ser un dato **del socio** (precargado por AFUCH), no de la cuenta.
  - `Socio.correoCifrado String?` y `Socio.correoHash String? @unique` (búsqueda, igual que
    `rutHash`). Nuevo `hashCorreo()` en `cifrado.ts`, sobre el correo normalizado
    (`trim().toLowerCase()`).
  - Se elimina `Cuenta.correoCifrado`: una sola fuente de verdad.
- El RUT sigue siendo la llave de la **planilla** (D5 no cambia): importar descuentos funciona
  igual. Un socio de la planilla sin correo cargado simplemente no puede registrarse aún.
- Regla 5 se mantiene: registro, ingreso y recuperación responden igual exista o no el correo,
  y el ingreso sigue usando `verificarSenuelo`.

Flujos:

| Flujo       | Entrada             | Comportamiento                                                                                                                                             |
| ----------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Registro    | correo              | Si coincide con un socio habilitado sin cuenta verificada → enlace de 24 h para crear contraseña. Si ya tiene cuenta → aviso al mismo correo. Si no → nada. |
| Ingreso     | correo + contraseña | Igual que hoy, buscando por `correoHash`. Rate limit por `ip` + hash del correo.                                                                           |
| Recuperar   | correo              | Enlace de 1 h al correo, si existe cuenta verificada.                                                                                                      |
| Mis datos   | —                   | Muestra el correo registrado, solo lectura (D8).                                                                                                           |

Carga de correos (admin y CLI, misma lógica en `server/correos-socios.ts`):

- **Importar lista**: Excel con columnas `RUT` y `Mail` (el formato del archivo que ya
  generamos; se ignoran las demás columnas). Vista previa con conteos antes de aplicar:
  correos nuevos, cambiados, sin cambios, RUT que no son socios, correos inválidos, correos
  repetidos entre socios. Con errores no se aplica nada.
- **Corregir uno**: formulario en `/admin/socios` (buscar por RUT → definir correo) y
  `pnpm cli socio:correo <rut> <correo>`.
- Si el socio ya tiene cuenta verificada y se le cambia el correo: la cuenta se conserva, se
  cierran sus tokens pendientes y se avisa al correo anterior.
- `/admin/socios` muestra cuántos socios están **sin correo** y permite filtrarlos.
- Todo llama `auditar()` solo con ids y conteos (regla 4).

### 3.2 Tareas

- [x] **B1. Schema y migración** `socio_correo_precargado`: agrega `correoCifrado` y
      `correoHash` a `Socio`, elimina `Cuenta.correoCifrado`. La migración **borra las filas de
      `Cuenta`** existentes (no hay cuentas reales; en desarrollo se pierden las de prueba).
- [x] **B2. Cifrado y rotación**: `hashCorreo()`; `rotacion-claves.ts` lee, reescribe y
      verifica `Socio.correoCifrado`/`correoHash` y deja de tocar `Cuenta.correoCifrado`; su test.
- [x] **B3. Contracts**: `registroSchema`, `ingresoSocioSchema` y `recuperarSchema` pasan a
      `correo`; nuevo `correoSocioSchema` (RUT + correo) para el admin. Tests.
- [x] **B4. `cuentas.ts`**: registrar, recuperar y `verificarIngresoSocio` por correo;
      `auth.ts` (credenciales `correo` + `contrasena`) y claves de `rate-limit`. Tests de
      integración, incluido «responde igual si el correo no existe».
- [x] **B5. `correos-socios.ts`**: leer Excel, vista previa, aplicar, definir uno. Tests con
      planilla ficticia (extender `crearPlanillaFicticia` o agregar `crearListaCorreosFicticia`).
- [x] **B6. Admin y CLI**: página `/admin/correos` (importar con vista previa y formulario de
      corrección), filtro «sin correo» en `/admin/socios`; comandos `correos:importar`,
      `socio:correo` y `prueba:cargar` (base de prueba para revisión manual). `exportar`/`eliminar` del socio incluyen el correo nuevo.
- [x] **B7. UI de socios**: `/socios` (ingreso), `/socios/registro`, `/socios/recuperar` con
      campo correo; textos de ayuda («usa el correo que AFUCH tiene registrado; si no te llega
      el mensaje, escríbenos»); `/socios/datos` muestra el correo.
- [x] **B8. E2E**: `semilla.ts` carga socios con correo; `socios.spec.ts` y `admin.spec.ts`
      con el flujo nuevo.
- [x] **B9. Documentación**: D4′ y D10–D13 en el plan de cierre, regla 6 de `CLAUDE.md`,
      `README.md`.
- [ ] **B10. Resend (producción)**: `RESEND_API_KEY` en el `.env` del VPS (no en el repo ni
      en la conversación) y enviar un correo de prueba. El dominio ya está verificado y el
      remitente por defecto pasó a `contacto@afuchscen.cl`.

## 4. Parte C — Contenido del sitio

- [x] **C1. FENAFUCH (D13)**: constante en `content/` con el texto aprobado; se muestra en la
      portada (bloque propio), en la página de convenios (encabezado) y en el pie. Sin enlace
      externo hasta resolver P8.
- [x] **C2. Teléfono y dirección** _(2026-10-15; además jornada de atención y datos bancarios)_: cambiar `SEDE.telefono` y `SEDE.direccion`
      en `content/sede.ts`; revisar JSON-LD y mapa si corresponde.
- [x] **C3. Quitar horarios**: eliminar `SEDE.horarios` y sus usos en `site-footer.tsx`,
      `contacto/page.tsx` y el JSON-LD de `layout.tsx`; ajustar `publico.spec.ts`.
- [x] **C4. Conceptos ocultos (D12)**: `CONCEPTOS_OCULTOS` en `server/descuentos.ts`;
      `periodosDelSocio` y `detallePeriodo` los excluyen del detalle y del total; nota en
      «Mis descuentos» de que el total puede no incluir todos los descuentos de la liquidación.
      La importación, el admin y la exportación de datos del socio **no cambian** (el dato se
      conserva completo). Tests.
- [x] **C5. Convenios por origen** _(2026-10-15: `origen` obligatorio, filtro por origen en el catálogo y nuevo convenio de asesoría previsional)_: campo `origen: 'afuch-sc' | 'fenafuch'` en
      `convenioSchema`; la página agrupa y etiqueta por origen. Se implementa cuando llegue el
      listado, para no clasificar a ciegas.
- [ ] **C6. Fotos de la directiva** _(espera A3; el campo `foto` y el respaldo con iniciales ya están)_: `foto?: { src; alt }` en
      `MiembroDirectiva`, tarjeta con imagen optimizada (`next/image`, WebP en
      `public/directiva/`) y respaldo con iniciales si falta la foto.

## 5. Orden propuesto

1. **Ahora, sin esperar a AFUCH**: C3, C4, C1 → luego B1–B9.
2. **Cuando llegue cada insumo**: C2 (A1), C5 (A2), C6 (A3), carga de correos (A4), B10 (A5).

Cada bloque termina con
`pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build` y `pnpm e2e`.

## 6. Riesgos

| Riesgo                                                                 | Mitigación                                                                                   |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Un correo mal asignado da acceso a descuentos ajenos.                  | Solo lista validada por AFUCH (D11); la vista previa rechaza correos repetidos; auditoría.   |
| Socios sin correo en la lista (hoy 134) no pueden registrarse.         | Filtro «sin correo» en el admin y carga manual; texto de ayuda que deriva a contacto.        |
| Correos personales desactualizados en el padrón.                       | Corrección individual por admin; el socio lo pide por contacto.                              |
| El total de «Mis descuentos» deja de calzar con la liquidación (D12).  | Nota visible en la página.                                                                   |
| Entregabilidad (spam) al enviar ~900 correos de verificación.          | Dominio verificado en Resend (SPF/DKIM) antes de anunciar el registro.                       |
