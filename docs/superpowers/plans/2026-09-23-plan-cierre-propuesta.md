# Plan para cerrar la propuesta AFUCH Servicios Centrales

**Fecha:** 2026-09-23 (revisado el mismo día con las respuestas de La Palanca)
**Estado:** desarrollo completo; pendiente despliegue en VPS y revisión legal (ver §7)
**Fuente de alcance:** `info/Propuesta-AFUCH-Sitio-Web-La-Palanca-1.pdf` (Agencia La Palanca, agosto 2026)
**Documentos relacionados:** `docs/superpowers/specs/2026-09-04-afuch-landing-design.md` (diseño Fase 1)

---

## 1. Objetivo

Entregar todo lo comprometido en la sección 2 de la propuesta ("Fase 1: Desarrollo"):

| § | Entregable | Valor |
|---|---|---|
| 2.1 | Sitio público institucional | $200.000 |
| 2.2 | Área privada de socios y autenticación | $220.000 |
| 2.4 | Seguridad, cifrado y cumplimiento Ley 21.719 | $80.000 |
| 2.3 | Esquema de carga de información (sin panel autogestionado para AFUCH) | incluido |

Este plan no agrega funciones fuera de la propuesta. Donde la propuesta no especifica
algo, la decisión queda registrada en la sección 3 con su motivo.

---

## 2. Estado del repo al iniciar (revisión 2026-09-23)

### 2.1 Lo que existía

- Monorepo pnpm + Turborepo: `apps/web` (Next.js 15, App Router, Tailwind 4),
  `packages/contracts` (Zod: convenio, noticia, contacto, `validarRut`) y `packages/tsconfig`.
- Rutas públicas: `/`, `/quienes-somos`, `/beneficios`, `/beneficios/[slug]`,
  `/noticias`, `/noticias/[slug]`, `/contacto`, `/privacidad`, `/socios` (placeholder), `not-found`,
  `sitemap.ts` y `robots.ts`.
- Contenido tipado en `apps/web/src/content/`: 11 convenios, 1 noticia, sede y directiva.
- Tests con Vitest: `rut.test.ts`, `convenios.test.ts`.

### 2.2 Brechas contra la propuesta y el spec

| # | Brecha | Dónde |
|---|---|---|
| B1 | **No existía `apps/api`** (el spec decía NestJS). El formulario de contacto llegaba a `apps/web/src/app/api/contacto/route.ts`, que sin `AFUCH_API_URL` solo escribía en el log: **los mensajes no se entregaban**. | spec §2.1, §6 |
| B2 | `/noticias` sin **paginación, filtro por categoría ni buscador** (la propuesta 2.1 los exige). | `apps/web/src/app/noticias/page.tsx` |
| B3 | Sin rate limiting ni cabeceras de seguridad en el endpoint de contacto. | spec §6.1 |
| B4 | ESLint no instalado (`next lint` sin dependencia), sin Prettier, sin Playwright. | `apps/web/package.json` |
| B5 | Sin `docker-compose.yml`, `Dockerfile`, `.env.example` ni CI. | spec §2.1, §6.1 |
| B6 | Correo de sede mal escrito: `contacto@afuchserviciocentrales.cl` → `contacto@afuchservicioscentrales.cl`. Los datos de sede **son reales** (confirmado): se quita `pendientesDeConfirmacion` y el aviso en `/contacto`. | `apps/web/src/content/sede.ts` |
| B7 | Área privada (2.2) sin empezar. | — |
| B8 | Seguridad y cumplimiento (2.4) sin empezar. | — |
| B9 | Contenido institucional pendiente de AFUCH (historia, misión, directiva, estatutos PDF, más noticias, vigencias de convenios). | spec §9 |
| B10 | Node local v12.22; Next 15 requiere Node ≥ 18.18. Se fija Node 24 LTS (`.nvmrc` + `engines`). | entorno |

### 2.3 Higiene aplicada

- `info/*.xlsx`, `info/*.xls` e `info/*.csv` en `.gitignore`: la planilla de socios contiene
  nombres, RUT y descuentos de ~900 personas y **nunca debe entrar al repo**. Los tests usan
  un fixture generado con datos ficticios.

---

## 3. Registro de decisiones

### 3.1 Decisiones de La Palanca

| # | Decisión | Resuelto |
|---|---|---|
| D1 | Arquitectura | **Solo Next.js** (full-stack). Se elimina NestJS del spec. |
| D2 | Hosting | **VPS con Docker** (docker-compose). AFUCH contrata el VPS a su nombre (propuesta §6). |
| D3 | Carga de datos | **Admin interno** (`/admin`, solo La Palanca) **+ CLI sencillo** que reutiliza la misma lógica. |
| D4 | Registro | El socio se registra con **su RUT y escribe un correo** al registrarse. La verificación llega a ese correo. |
| D5 | Whitelist | Todo RUT presente en la hoja **`ASOCIACI`** de una planilla importada. `RENUNCIA` y `CONTRATOS NO VALIDOS` no se usan. |
| D6 | Baja de socios | Un socio **sigue habilitado** aunque deje de aparecer en la planilla, **hasta que un admin lo desactive** (función de admin/CLI). |
| D7 | Mis descuentos | **Solo visualización en pantalla**, detalle por concepto y mes + total. **Sin descarga.** Sin columnas internas `SESENTA`/`CUARENTA`. |
| D8 | Mis datos | **Solo lectura.** El socio no edita nada: el área privada es visualización de datos, no un lugar de trámites. Esto reemplaza "Mis datos editables" de la propuesta 2.2. |
| D9 | Datos de sede | Son reales; se corrige el correo (B6). |

**Riesgo aceptado por D4.** Como el correo lo escribe el socio y no viene de AFUCH, alguien
que conozca un RUT ajeno podría registrarse antes que su dueño y ver sus descuentos.
Mitigaciones implementadas:

- Una sola cuenta por RUT. Si el RUT ya tiene cuenta, el registro no crea otra y el mensaje
  deriva a "recuperar contraseña" (que se envía al correo ya registrado).
- La respuesta del registro es la misma para RUT socio y no socio (no revela quién es socio).
- `/admin` lista las cuentas registradas con su fecha y correo, y permite **anular una cuenta**
  (borra la cuenta, el socio puede volver a registrarse) cuando el socio real reclama.
- Todo registro, verificación e ingreso queda en la auditoría.
- La ayuda del registro indica contactar a AFUCH si el RUT "ya tiene cuenta" y no fue el socio.

### 3.2 Decisiones propias sobre la planilla (antes preguntas P5 y P6)

Tomadas a partir del contenido de `info/Planilla Afuch SC - AGOSTO 2026 OK(1).xlsx`.

**P5 — nombre visible de cada concepto.**

| Columna | Nombre para el socio | Por qué |
|---|---|---|
| CUOTA SOCIO | Cuota social | Cuota ordinaria (TIP_CUO 1). |
| FONDO CONVENIO SOLIDARIO | Fondo Solidario | Es el 0,8 % del Fondo Solidario publicado en beneficios. |
| ACCIONES1 | Acciones Coopeuch | La hoja de trabajo `Hoja2` anota esos montos como "acciones coopeuch". |
| COOPEUCH PRESTAMOS | Préstamo Coopeuch | Convenio de préstamos de consumo Coopeuch. |
| LIBAHORR1 | Libreta de ahorro | Abreviatura de "libreta de ahorro". No se nombra la entidad porque la planilla no la indica. |
| FUND.LOPEZ P. | Seguro oncológico FALP | Convenio FALP publicado. |
| CONVENIO OPTICA GO OPTIC SPA | Convenio óptica Go Optic | Se usa el nombre de la columna. En agosto 2026 todos los montos son 0; si hay monto se muestra. Go Optic no se publica como convenio en el sitio porque no está en los materiales de beneficios. |
| BONO INVIERNO DUPLICADO | Reintegro bono de invierno | Es un descuento (monto positivo) a quien recibió el bono dos veces: la devolución del pago duplicado. |
| GAS | Vales de gas Abastible | Convenio Abastible publicado. |
| PRESTAMOS AFUCH | Préstamo AFUCH | Préstamo solidario de la asociación. |

**P6 — cuotas del préstamo AFUCH.** `C/INICIAL1` es la cuota que se descuenta ese mes y
`C/TERM1` el total de cuotas. Cuando el socio tiene más de un préstamo, ambos valores vienen
separados por guion en el mismo orden (ej. `1-2` y `3-3` = préstamo 1 en cuota 1 de 3,
préstamo 2 en cuota 2 de 3). Se muestra "Cuota n de m" por préstamo junto a la línea
"Préstamo AFUCH". Si el valor no se puede interpretar (cantidades distintas de partes,
texto no numérico o n > m), se muestra el monto sin el detalle de cuotas y el importador lo
reporta como advertencia (no bloquea la importación).

### 3.3 Decisiones técnicas

| # | Decisión | Motivo |
|---|---|---|
| T1 | Autenticación con **NextAuth v4** (estable), no Auth.js v5. | v5 sigue en beta; v4 soporta Next 15 y React 19. |
| T2 | **Prisma 7** con el adaptador `@prisma/adapter-pg`. | Versión estable actual. |
| T3 | Correos con Resend y plantillas en HTML simple. | Son 3 correos transaccionales; React Email sería una dependencia más sin beneficio. Sin `RESEND_API_KEY` (solo desarrollo) el correo se imprime en consola. |
| T4 | Los documentos de rendición se guardan en un volumen del servidor y se sirven por una ruta autenticada, para verse en el navegador. | No quedan en `public/`. |
| T5 | Rate limiting con `rate-limiter-flexible` sobre Prisma/Postgres. | Sobrevive reinicios, no suma Redis. |
| T6 | Los e2e corren contra `next dev` y leen los correos desde archivos (`CORREO_BUZON_DIR`). | `next start` es modo producción y exige Resend. En producción el modo archivo no se usa. |
| T7 | La sesión (JWT) guarda también el id de la cuenta y cada página privada lo compara con la base. | Al anular una cuenta, las sesiones del intruso mueren aunque el dueño se registre de nuevo. |

---

## 4. Stack final

| Capa | Elección |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript estricto |
| Estilos | Tailwind CSS 4 |
| Validación | Zod en `packages/contracts` |
| Base de datos | PostgreSQL 16 |
| ORM / migraciones | Prisma 7 (`packages/db`) |
| Autenticación | NextAuth v4, provider Credentials (socio: RUT + contraseña; admin: correo + contraseña + TOTP), sesión JWT en cookie `httpOnly` |
| Hash de contraseñas | Argon2id (`@node-rs/argon2`) |
| Segundo factor admin | TOTP (`otplib`) |
| Correo transaccional | Resend |
| Rate limiting | `rate-limiter-flexible` (Prisma) |
| Lectura de Excel | `exceljs` |
| CLI | TypeScript con `tsx` (`pnpm cli <comando>`) |
| Tests | Vitest + Testing Library, Playwright (e2e) |
| Lint / formato | ESLint (config de Next) + Prettier |
| Infra | Docker (`output: 'standalone'`), docker-compose, Caddy (HTTPS automático) |
| CI | GitHub Actions: lint, typecheck, test, build |

### 4.1 Estructura

```
afuchservicioscentrales/
├── apps/web/
│   ├── src/app/                   # rutas públicas + socios/ + admin/ + api/
│   ├── src/server/                # servicios: importación, socios, auditoría, correo, cifrado
│   └── scripts/cli.ts             # CLI (usa src/server)
├── packages/contracts/            # Zod + validarRut
├── packages/db/                   # Prisma schema, migraciones, cliente
├── packages/tsconfig/
├── infra/                         # docker-compose, Caddyfile, respaldo
└── docs/                          # spec, plan, runbook, documentos de cumplimiento
```

---

## 5. Formato de la planilla mensual (entrada del importador)

Archivo de referencia: `info/Planilla Afuch SC - AGOSTO 2026 OK(1).xlsx` (fuera de git).
Tiene 12 hojas. **El importador lee solo `ASOCIACI`**, buscando las columnas por encabezado.

### 5.1 Hoja `ASOCIACI` — encabezados en la fila 1

Una fila por socio y tipo de cuota. Agosto 2026: 1.741 filas, 899 RUT distintos.

| Encabezado | Uso |
|---|---|
| NOMBRE | Nombre del socio (se recortan espacios). |
| FECHA / MES | Año y mes del periodo. |
| RUT / DV | Se valida con `validarRut`. |
| MONTO | `SUM(Q:Z)`: se compara con la suma de conceptos (advertencia si difiere). |
| TIP_CUO | 1 ordinaria, 2 extraordinaria. Informativo. |
| FACULTAD | Unidad o facultad del socio. |
| Conceptos (§3.2) | Una línea de descuento por concepto con monto distinto de 0. |
| C/INICIAL1, C/TERM1 | Cuotas del préstamo AFUCH (§3.2 P6). |
| Resto (SESENTA, CUARENTA, CODI_SIRH, GRADO, DESCRIPCION, anterior, observaciones) | No se importan. |

Filas sin RUT (títulos, totales, vacías) se ignoran.

### 5.2 Reglas del importador

1. Una importación = un periodo. Reimportar el mismo periodo **reemplaza** ese periodo (idempotente) y queda en auditoría.
2. Vista previa antes de escribir: un solo periodo, columnas completas, montos numéricos. Con errores no se importa.
   Una fila con **RUT de DV inválido no bloquea**: se excluye y se informa como advertencia para pedir la
   corrección a AFUCH. Motivo: la planilla de agosto 2026 trae 10 filas así; bloquear dejaría sin datos a
   los otros ~890 socios.
3. Los RUT nuevos crean un socio habilitado; los existentes actualizan nombre y facultad. **Nadie se deshabilita al importar** (D6).
4. El archivo original no se guarda en el servidor.

---

## 6. Modelo de datos

```
Socio              id, rutHash (HMAC, único), rutCifrado, nombreCifrado, facultad?,
                   habilitado, creadoEn, actualizadoEn
Cuenta             id, socioId (único), correoCifrado, passwordHash?, verificadaEn?,
                   intentosFallidos, bloqueadaHasta?, creadaEn
Token              id, cuentaId, tokenHash, tipo (VERIFICACION|RECUPERACION), expiraEn, usadoEn?
Periodo            id, anio, mes, importadoEn, importadoPor
LineaDescuento     id, periodoId, socioId, concepto (enum), monto, detalleCuotas?
DocumentoRendicion id, titulo, categoria, fecha, archivo, tamano, publicadoEn, publicadoPor
Administrador      id, email, passwordHash, totpSecretCifrado, activo
RegistroAuditoria  id, actorTipo (SOCIO|ADMIN|SISTEMA), actorId?, accion, entidad?, entidadId?, ip?, detalle?, fecha
RateLimit          key, points, expire  (tabla de rate-limiter-flexible)
```

- `rutHash` permite buscar por RUT sin guardarlo en claro (índice ciego HMAC-SHA256).
- Nombre, RUT, correo y secreto TOTP se cifran en la aplicación con AES-256-GCM (`node:crypto`);
  las claves viven en variables de entorno, fuera de la base y de los respaldos.

---

## 7. Plan de trabajo y estado

Estado al 2026-09-23 (rama `feat/cierre-propuesta`). Verificación: `pnpm format:check`,
`lint`, `typecheck`, `test` (79 tests) y `build` en verde; Playwright 20/20 (escritorio y móvil);
imagen Docker de producción construida y probada (páginas, cabeceras, redirecciones,
módulos nativos).

### Etapa 0 — Base del repo ✅
- [x] Node 24 LTS: `.nvmrc`, `engines`.
- [x] ESLint (config de Next, CLI `eslint .`) + Prettier.
- [x] Corregir sede (B6); el dominio también estaba mal escrito en `layout.tsx`, `sitemap.ts` y `robots.ts`: ahora sale de `SEDE.sitioUrl`.
- [x] Spec de F1 actualizado: arquitectura solo Next.js (B1).
- [x] `.env.example` (`apps/web`, `packages/db`, `infra`).
- [x] GitHub Actions (`.github/workflows/ci.yml`) con Postgres de servicio y e2e.

### Etapa 1 — Cerrar el sitio público (2.1) ✅
- [x] Contacto: Resend + honeypot + rate limiting (5/hora por IP) (B1, B3).
- [x] Cabeceras de seguridad (CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy).
- [x] `/noticias`: paginación (9 por página), categoría y buscador con formulario GET (B2).
- [x] Playwright e2e del sitio público (escritorio y móvil).
- [x] `robots.txt` excluye `/socios`, `/admin` y `/api`; `/socios` sale del sitemap.
- [ ] Lighthouse ≥ 95 (spec §10.6): **no medido** en esta sesión.

### Etapa 2 — Base de datos y seguridad transversal (2.4) ✅
- [x] `packages/db` (Prisma 7) + migraciones.
- [x] `infra/docker-compose.dev.yml` (Postgres en `localhost:5433`).
- [x] Cifrado AES-256-GCM + índice ciego HMAC, con tests.
- [x] Auditoría de accesos y acciones administrativas.
- [x] Rate limiting en Postgres (contacto, registro, recuperación, ingresos).

### Etapa 3 — Registro y acceso del socio (2.2) ✅
- [x] Registro RUT + correo → verificación → contraseña, con las mitigaciones de §3.1.
- [x] Ingreso RUT + contraseña; bloqueo 15 min tras 5 fallos; respuesta sin filtrar si el RUT existe (hash señuelo).
- [x] Recuperación de contraseña (token de 1 hora, un solo uso).
- [x] Middleware + revisión en base en cada página privada (socio deshabilitado o cuenta anulada pierden la sesión).

### Etapa 4 — Vistas del socio (2.2) ✅
- [x] Mis descuentos: detalle por concepto, cuotas del préstamo AFUCH, total e historial (D7).
- [x] Rendición de cuentas: PDF en el navegador por ruta autenticada; cada vista queda en auditoría.
- [x] Mis datos, solo lectura (D8).
- [x] `/privacidad` actualizada (área privada, encargada, proveedor de correo, cookie de sesión).

### Etapa 5 — Admin interno y CLI (2.3) ✅
- [x] Ingreso admin con contraseña + TOTP.
- [x] Planilla: vista previa → importar (mismo formulario).
- [x] Rendición: publicar / retirar PDF.
- [x] Socios: buscar, habilitar/deshabilitar, anular cuenta, deshabilitar ausentes del último mes (D6).
- [x] Auditoría paginada.
- [x] CLI (`pnpm cli ayuda`): `planilla:importar`, `rendicion:publicar`, `rendicion:listar`, `socio:estado`, `socio:activar`, `socio:desactivar`, `socio:anular-cuenta`, `socio:exportar`, `socio:eliminar`, `socios:ausentes`, `admin:crear`, `admin:desactivar`, `planilla:ficticia`, `claves:rotar`.

### Etapa 6 — Infraestructura VPS (2.4, §6) ✅ (código) / ⏳ (VPS)
- [x] `infra/Dockerfile` (standalone, usuario no root) + imagen `herramientas` para migraciones y CLI.
- [x] `infra/docker-compose.yml` (web, postgres sin puertos, caddy con HTTPS automático).
- [x] `infra/respaldo/respaldar.sh` y `restaurar.sh` (cifrado AES-256, copia externa con rclone, retención 30 días).
- [x] Runbook: `docs/operacion/runbook.md`.
- [ ] Ejecutar en el VPS real y probar la restauración (requiere P10, P11).
- [x] Rotación de `CLAVE_CIFRADO` / `CLAVE_HMAC`: `pnpm cli claves:rotar` (transaccional, con verificación previa y posterior; runbook §10.1).

### Etapa 7 — Cumplimiento Ley 21.719 (2.4, §7.2) ✅ (borradores)
- [x] `docs/cumplimiento/instrucciones-tratamiento-datos.md` (borrador para revisión legal y firma).
- [x] `/privacidad` actualizada.
- [x] `docs/cumplimiento/procedimientos.md`: derechos del titular (con `socio:exportar` y `socio:eliminar`), retención, incidentes, accesos del equipo.
- [ ] Revisión legal y firma.

### Etapa 8 — Pruebas, carga y producción (§4 etapa 5) ⏳
Requiere VPS, dominio, DNS y clave de Resend; se ejecuta con el runbook.
- [ ] Ambiente de pruebas en el VPS.
- [ ] Carga real de la planilla y de los documentos de rendición.
- [ ] Pedir a AFUCH la corrección de las 10 filas con DV inválido de agosto 2026.
- [ ] Aceptación con AFUCH y puesta en producción.
- [ ] Sesión de estrategia de 2 horas.

---

## 8. Riesgos

| Riesgo | Mitigación |
|---|---|
| Registro de un RUT ajeno (D4). | Mitigaciones de §3.1. |
| El formato de la planilla cambia entre meses. | Columnas por encabezado; error claro si falta alguna. |
| Filtración de la planilla por canales informales. | Fuera de git; no se guarda tras importar; acordar canal con AFUCH (P7). |
| Pérdida de datos en el VPS. | Respaldo diario fuera del VPS con prueba de restauración. |
| Plazo de 6 semanas con entregas de AFUCH en 3 días hábiles. | Registrar fechas de solicitud y entrega. |

---

## 9. Preguntas abiertas para AFUCH

| # | Pregunta | Estado |
|---|---|---|
| P1 | Correos de la nómina | **Resuelta** (D4). |
| P2 | Acceso tras renuncia | **Resuelta** (D6). |
| P3 | Formato de descarga | **Resuelta**: sin descarga (D7). |
| P4 | Campos editables | **Resuelta**: ninguno (D8). |
| P5 | Nombres de conceptos | **Resuelta** por La Palanca (§3.2); confirmar con AFUCH. |
| P6 | Cuotas del préstamo AFUCH | **Resuelta** por La Palanca (§3.2); confirmar con AFUCH. |
| P7 | Canal de entrega mensual de la planilla (recomendado: no WhatsApp). | Abierta |
| P8 | Retención del historial de descuentos y de respaldos. | Abierta (por defecto: respaldos 30 días) |
| P9 | Documentos de rendición iniciales y sus categorías. | Abierta |
| P10 | Dominio `afuchservicioscentrales.cl` y acceso al DNS. | Abierta |
| P11 | Proveedor de VPS y titular de la cuenta. | Abierta |
| P12 | Contenido pendiente del spec §9 (historia, misión, directiva, estatutos, noticias, vigencias, Dimeiggs). | Abierta |

---

## 10. Fuera de alcance (propuesta §3)

Panel autogestionado para AFUCH, producción de contenidos, carga histórica anterior al
proyecto, integración con remuneraciones/ERP, app móvil nativa, pasarela de pagos, compra de
dominio y hosting, más de dos rondas de revisión de diseño. El servicio mensual (§5.2) es un
contrato aparte.

---

## 11. Criterios de aceptación

1. Criterios del spec de F1 (§10), con el formulario de contacto entregando correos reales.
2. `/noticias` pagina, filtra por categoría y busca.
3. Un RUT de la whitelist puede registrarse con su correo, verificarlo, ingresar con RUT + contraseña y recuperar la contraseña.
4. Un RUT fuera de la whitelist no puede registrarse, y la respuesta no revela si es socio.
5. El socio ve sus descuentos por concepto y mes, con historial.
6. El socio ve los documentos de rendición; sin sesión no se accede a ellos.
7. El socio ve sus datos en modo lectura.
8. La Palanca importa la planilla desde `/admin` y desde el CLI, con vista previa.
9. Un admin puede desactivar socios y anular cuentas; un socio desactivado no puede ingresar.
10. Toda acción administrativa y de acceso queda en auditoría.
11. HTTPS, campos personales cifrados, respaldo diario fuera del VPS con restauración probada.
12. Documento de instrucciones de tratamiento de datos entregado.
13. `pnpm lint && pnpm typecheck && pnpm test && pnpm build` y Playwright pasan en CI.
