# AFUCH Servicios Centrales — sitio web y área de socios

Plataforma de la Asociación de Funcionarios de la Universidad de Chile, Servicios Centrales
(AFUCH SC), desarrollada por Agencia La Palanca según la propuesta de agosto de 2026
(`info/Propuesta-AFUCH-Sitio-Web-La-Palanca-1.pdf`).

Tiene tres partes:

| Parte                      | Ruta                                                                          | Quién la usa                                                                                                      |
| -------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Sitio público**          | `/`, `/quienes-somos`, `/beneficios`, `/noticias`, `/contacto`, `/privacidad` | Cualquier persona                                                                                                 |
| **Área de socios**         | `/socios`                                                                     | Socias y socios de la nómina: ven sus descuentos por planilla, la rendición de cuentas y sus datos (solo lectura) |
| **Administración interna** | `/admin` + CLI `pnpm cli`                                                     | Equipo de La Palanca: carga la planilla mensual, publica documentos, gestiona socios                              |

Documentos clave:

- Plan, decisiones y estado: [`docs/superpowers/plans/2026-09-23-plan-cierre-propuesta.md`](docs/superpowers/plans/2026-09-23-plan-cierre-propuesta.md)
- Ajustes tras la reunión con AFUCH del 2026-10-11 (registro por correo, FENAFUCH, conceptos ocultos): [`docs/superpowers/plans/2026-10-11-plan-ajustes-reunion-clientas.md`](docs/superpowers/plans/2026-10-11-plan-ajustes-reunion-clientas.md)
- Diseño del sitio público: [`docs/superpowers/specs/2026-09-04-afuch-landing-design.md`](docs/superpowers/specs/2026-09-04-afuch-landing-design.md)
- Operación en producción (VPS): [`docs/operacion/runbook.md`](docs/operacion/runbook.md)
- Protección de datos (Ley 21.719): [`docs/cumplimiento/`](docs/cumplimiento/)
- Guía para Claude Code: [`CLAUDE.md`](CLAUDE.md)

---

## 1. Stack

| Capa                  | Tecnología                                                                                    |
| --------------------- | --------------------------------------------------------------------------------------------- |
| Framework             | Next.js 15 (App Router), React 19, TypeScript estricto                                        |
| Estilos               | Tailwind CSS 4                                                                                |
| Validación compartida | Zod (`packages/contracts`)                                                                    |
| Base de datos         | PostgreSQL 16 + Prisma 7 (`packages/db`)                                                      |
| Autenticación         | NextAuth v4 (credenciales). Socio: RUT + contraseña. Admin: correo + contraseña + código TOTP |
| Contraseñas           | Argon2id                                                                                      |
| Correo                | Resend                                                                                        |
| Excel                 | exceljs                                                                                       |
| Monorepo              | pnpm workspaces + Turborepo                                                                   |
| Tests                 | Vitest (unitarios e integración con Postgres), Playwright (e2e)                               |
| Producción            | Docker + docker-compose + Caddy (HTTPS automático) en un VPS                                  |

## 2. Estructura

```
afuchservicioscentrales/
├── apps/web/                      # la aplicación Next.js
│   ├── src/app/                   # rutas: públicas, socios/, admin/, api/
│   ├── src/components/            # UI (ui/, socios/, admin/)
│   ├── src/content/               # contenido público en TS: convenios, noticias, sede, directiva
│   ├── src/lib/                   # utilidades puras (filtros, formatos)
│   ├── src/server/                # lógica de servidor: planilla, importación, cuentas, cifrado,
│   │                              #   auditoría, correo, rate limit, rendición, auth
│   ├── src/test/                  # soporte de tests (base de tests, buzón de correos)
│   ├── scripts/cli.ts             # CLI de administración
│   └── e2e/                       # pruebas Playwright
├── packages/
│   ├── contracts/                 # schemas Zod + validarRut (cliente y servidor)
│   ├── db/                        # schema Prisma, migraciones y cliente
│   └── tsconfig/                  # configuración TypeScript base
├── infra/                         # Dockerfile, docker-compose (dev y prod), Caddyfile, respaldos
├── docs/                          # plan, spec, runbook, cumplimiento
├── info/                          # material entregado por AFUCH (logos, PDFs). La planilla NO se versiona
├── CLAUDE.md
└── .claude/skills/                # skills de Claude Code del proyecto
```

## 3. Requisitos

- **Node 24** (`nvm install 24 && nvm use`; el repo trae `.nvmrc`).
- **pnpm 10** (`corepack enable`; la versión exacta está en `package.json`).
- **Docker** (para Postgres en desarrollo y para producción).
- `openssl` (generar claves).

## 4. Puesta en marcha local

```bash
# 1. Dependencias
nvm use
corepack enable
pnpm install

# 2. Postgres de desarrollo (localhost:5433, usuario/clave/base: afuch)
docker compose -f infra/docker-compose.dev.yml up -d

# 3. Variables de entorno
cp packages/db/.env.example packages/db/.env
cp apps/web/.env.example apps/web/.env
#    Completar en apps/web/.env las claves vacías (ver sección 5):
#    CLAVE_CIFRADO, CLAVE_HMAC  -> openssl rand -base64 32
#    NEXTAUTH_SECRET            -> openssl rand -base64 48

# 4. Base de datos
pnpm --filter @afuch/db migrate:deploy     # crea las tablas
pnpm --filter @afuch/db build              # genera el cliente Prisma

# 5. Levantar
pnpm dev                                   # http://localhost:3000
```

### Datos de prueba

La planilla real tiene datos personales y no se usa para desarrollo. Hay dos formas de
cargar datos inventados:

**A. Socios ficticios con correos reales** (para revisar el flujo completo, con correos que
llegan de verdad). Parte de un Excel con las columnas `Nombre`, `Apellido paterno`,
`Apellido materno` y `Mail` (hasta 9 personas; por ejemplo `info/test-1.xlsx`). A cada
persona le asigna un RUT ficticio (`11.111.111-1`, `22.222.222-2`, …), su correo y dos meses
de descuentos inventados (agosto y septiembre de 2026):

```bash
pnpm cli prueba:cargar ../../info/test-1.xlsx              # vista previa
pnpm cli prueba:cargar ../../info/test-1.xlsx --confirmar
pnpm cli admin:crear tu@correo.cl           # imprime contraseña y secreto TOTP una sola vez
```

(`pnpm cli` se ejecuta dentro de `apps/web`: las rutas relativas parten desde ahí.)

**B. Planilla ficticia + correos a mano** (sin correos reales):

```bash
pnpm cli planilla:ficticia /tmp/planilla-ficticia.xlsx
pnpm cli planilla:importar /tmp/planilla-ficticia.xlsx --confirmar
pnpm cli socio:correo 11.111.111-1 socia@example.com
```

Deja a `11.111.111-1` PRUEBA UNO SOCIA, `12.222.222-5` PRUEBA DOS SOCIO y `13.333.333-9`
PRUEBA TRES SIN DESCUENTOS.

**Correos.** Con `RESEND_API_KEY` en `apps/web/.env` los correos **se envían de verdad**
desde `CORREO_REMITENTE` (por defecto `contacto@afuchscen.cl`). Sin la clave no se envía
nada: el enlace aparece en la consola de `pnpm dev` (y en `CORREO_BUZON_DIR` si está
definido). Los tests y los e2e nunca envían correos.

Para el admin: `/admin/ingreso` con el correo, la contraseña impresa y el código de 6
dígitos de una app autenticadora (Google Authenticator, 1Password, etc.) donde se cargó el
secreto TOTP. Para obtener un código sin app:

```bash
cd apps/web && node -e "import('otplib').then(o=>console.log(o.generateSync({secret:'SECRETO'})))"
```

### Revisión manual (lista de comprobación)

Con la opción A cargada y `pnpm dev` corriendo en <http://localhost:3000>:

**Sitio público**

- [ ] Portada: aparece el bloque «AFUCH Servicios Centrales es parte de la FENAFUCH».
- [ ] `/beneficios` y `/quienes-somos`: aparece el mismo texto; el pie de página lo resume.
- [ ] `/contacto` y el pie: **no** hay horarios de atención. Teléfono y dirección siguen con
      los valores anteriores (pendiente de AFUCH).
- [ ] `/quienes-somos`: descripción y objetivos tomados de los estatutos, directorio 2026–2028
      con iniciales (faltan las fotos) y «Ver estatutos (PDF)» abre el PDF del propio sitio.
- [ ] `/beneficios`: bloque de cuota social (60% AFUCH SC / 40% FENAFUCH) y descuentos
      adicionales; los convenios de AFUCH SC llevan su etiqueta.

**Registro e ingreso con correo**

- [ ] `/socios/registro` pide **solo el correo** (no hay campo RUT).
- [ ] Con un correo del Excel de prueba: llega un mensaje desde `contacto@afuchscen.cl` con
      el enlace; al abrirlo se define la contraseña (mínimo 10 caracteres).
- [ ] Con un correo que no está cargado: la pantalla muestra **el mismo mensaje** y no llega
      nada.
- [ ] `/socios`: se ingresa con correo + contraseña. Con la contraseña mala dice «Correo o
      contraseña incorrectos».
- [ ] `/socios/recuperar`: pide el correo y llega un enlace para cambiar la contraseña.
- [ ] Registrarse otra vez con un correo que ya tiene cuenta: llega «Ya tienes una cuenta de
      socio» y no se crea otra.

**Área privada**

- [ ] «Mis descuentos» muestra septiembre y agosto de 2026 en el historial.
- [ ] En la tabla **no** aparecen «Convenio óptica Go Optic» ni «Reintegro bono de
      invierno», aunque la base de prueba los trae ($15.000 y $30.000 por mes): el total no
      los suma y hay una nota que lo advierte.
- [ ] «Mis datos» muestra nombre, RUT ficticio y correo; no hay nada editable.

**Administración** (`/admin/ingreso`)

- [ ] «Correos de socios»: el estado muestra cuántos socios tienen correo.
- [ ] «Agregar o corregir un correo»: cambiar el correo de `22.222.222-2` → ese socio
      ingresa con el correo nuevo y, si ya tenía cuenta, recibe un aviso en el anterior.
- [ ] Subir una lista `.xlsx` con columnas `RUT` y `Mail`: la vista previa cuenta nuevos,
      cambios, RUT que no son socios y errores por número de fila; «Cargar» la aplica.
- [ ] «Socios»: el filtro «Sin correo cargado» lista a quienes aún no pueden registrarse.
- [ ] «Planilla mensual»: la vista previa sí muestra Go Optic y Reintegro bono de invierno
      (el admin ve el dato completo).
- [ ] «Auditoría»: aparecen `correos.importados`, `socio.correo_definido`,
      `registro.solicitado`, `ingreso.exitoso`, sin correos ni RUT en el detalle.

Para empezar de cero: `docker compose -f infra/docker-compose.dev.yml down -v`, volver a
levantar, `pnpm --filter @afuch/db migrate:deploy` y repetir la carga.

### Apagar

```bash
# Ctrl+C en la terminal de pnpm dev
docker compose -f infra/docker-compose.dev.yml down        # conserva los datos (volumen)
docker compose -f infra/docker-compose.dev.yml down -v     # borra también los datos de desarrollo
```

## 5. Variables de entorno

Hay **tres** archivos, cada uno con su `.env.example` versionado. Los `.env` reales **nunca**
se versionan (están en `.gitignore`).

### `apps/web/.env` — la aplicación (desarrollo)

| Variable                  | Obligatoria   | Qué es                                                                                                                       |
| ------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`            | Sí            | Conexión a Postgres. Desarrollo: `postgresql://afuch:afuch@localhost:5433/afuch`                                             |
| `CLAVE_CIFRADO`           | Sí            | 32 bytes en base64. Cifra RUT, nombre, correo y secretos TOTP (AES-256-GCM). **Si se pierde, esos datos son irrecuperables** |
| `CLAVE_HMAC`              | Sí            | 32 bytes en base64, distinta de la anterior. Índice para buscar por RUT sin guardarlo en claro                               |
| `NEXTAUTH_SECRET`         | Sí            | Firma las sesiones. Cambiarla cierra todas las sesiones                                                                      |
| `NEXTAUTH_URL`            | Sí            | URL pública del sitio; se usa en los enlaces de los correos                                                                  |
| `RESEND_API_KEY`          | En producción | API key de Resend. Sin ella (solo desarrollo) los correos se imprimen en consola                                             |
| `CORREO_REMITENTE`        | No            | Remitente. Por defecto `AFUCH Servicios Centrales <contacto@afuchscen.cl>`                                                   |
| `CORREO_CONTACTO_DESTINO` | No            | Dónde llegan los mensajes del formulario y las respuestas. Por defecto `afuchscen@gmail.com`                                 |
| `STORAGE_DIR`             | No            | Carpeta de los PDF de rendición. Por defecto `./storage`                                                                     |
| `CORREO_BUZON_DIR`        | No            | Solo desarrollo: guarda cada correo como archivo JSON                                                                        |

### `packages/db/.env` — comandos de Prisma

| Variable       | Qué es                                                 |
| -------------- | ------------------------------------------------------ |
| `DATABASE_URL` | La misma base, para `prisma migrate` y `prisma studio` |

### `infra/.env` — producción (en el VPS)

Parte de `infra/.env.example`. Contiene lo mismo que `apps/web/.env` más:

| Variable                                            | Qué es                                                                                     |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `DOMINIO`                                           | Dominio público (Caddy obtiene el certificado HTTPS)                                       |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Credenciales de la base de producción. `DATABASE_URL` se arma sola en `docker-compose.yml` |

Generar claves:

```bash
openssl rand -base64 32   # CLAVE_CIFRADO, CLAVE_HMAC
openssl rand -base64 48   # NEXTAUTH_SECRET
openssl rand -hex 24      # POSTGRES_PASSWORD (hexadecimal: va dentro de una URL)
```

Guardar `CLAVE_CIFRADO`, `CLAVE_HMAC` y la clave de respaldos también **fuera del servidor**
(gestor de contraseñas). Sin ellas, la base y los respaldos no sirven.

## 6. Cómo funciona

### Sitio público

El contenido (convenios, noticias, datos de la sede, directiva) vive en
`apps/web/src/content/*.ts`, validado contra los schemas de `packages/contracts` en el build.
Para publicar una noticia o un convenio se edita ese archivo y se despliega.
El formulario de contacto valida con el mismo schema en navegador y servidor, tiene honeypot
y límite de 5 envíos por hora por IP, y envía el mensaje por correo (no se guarda).

### Área de socios

1. **Correo precargado**: AFUCH entrega una lista validada (RUT + correo) que se carga en
   `/admin/correos` o con el CLI. Sin correo cargado el socio no puede registrarse.
2. **Registro** (`/socios/registro`): solo el correo. Funciona si coincide con el que AFUCH
   cargó y el socio está habilitado. La respuesta es la misma para socios y no socios, para
   no revelar quién está en la nómina.
3. **Verificación**: llega un enlace a ese correo (vence en 24 h); ahí se define la contraseña.
4. **Ingreso** (`/socios`): correo + contraseña. 5 intentos fallidos bloquean la cuenta 15 min.
5. **Recuperación** (`/socios/recuperar`): enlace al correo (vence en 1 h).
6. **Vistas**: Mis descuentos (detalle por concepto, cuotas del préstamo AFUCH, historial),
   Rendición de cuentas (PDF en el navegador) y Mis datos (solo lectura). «Mis descuentos»
   no muestra ni suma «Convenio óptica Go Optic» ni «Reintegro bono de invierno» (D12).

El RUT ya no se pide en ningún formulario público: sigue siendo la llave de la planilla. Si
un socio cambia de correo, un admin lo corrige en `/admin/correos`; **Anular cuenta** obliga
a registrarse de nuevo. Decisiones D4′ y D10–D13: plan de ajustes del 2026-10-11.

### Planilla mensual

Se importa desde `/admin/planilla` o con el CLI. Se lee **solo la hoja `ASOCIACI`**, buscando
columnas por encabezado. Reimportar un mes lo reemplaza. Importar **nunca deshabilita** socios.
Las filas con RUT de dígito verificador inválido se excluyen y se informan como advertencia.
Formato completo y nombre visible de cada concepto: plan §3.2 y §5.

### Administración

`/admin` (correo + contraseña + código TOTP):

- **Planilla mensual**: vista previa (periodo, socios, totales por concepto, advertencias) y luego importar.
- **Correos de socios**: cargar la lista RUT + Mail con vista previa, y agregar o corregir un correo.
- **Socios**: buscar por RUT o nombre, filtrar a quienes no tienen correo, habilitar/deshabilitar, anular cuenta, deshabilitar en bloque a los ausentes del último mes.
- **Rendición de cuentas**: publicar y retirar PDF.
- **Auditoría**: todos los accesos y acciones administrativas.

### CLI

```bash
pnpm cli ayuda
```

| Comando                                                                        | Qué hace                                                               |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `planilla:importar <archivo.xlsx> [--confirmar]`                               | Sin `--confirmar` solo muestra la vista previa                         |
| `planilla:ficticia <salida.xlsx>`                                              | Genera una planilla de prueba con datos inventados                     |
| `correos:importar <archivo.xlsx> [--confirmar]`                                | Carga los correos de los socios (columnas `RUT` y `Mail`)              |
| `prueba:cargar <padron.xlsx> [--confirmar]`                                    | Solo desarrollo: socios ficticios con los correos del Excel            |
| `rendicion:publicar <archivo.pdf> --titulo T --categoria C --fecha AAAA-MM-DD` | Publica un documento                                                   |
| `rendicion:listar`                                                             | Lista documentos publicados                                            |
| `socio:estado <rut>`                                                           | Ficha del socio                                                        |
| `socio:activar <rut>` / `socio:desactivar <rut>`                               | Habilita o deshabilita                                                 |
| `socio:correo <rut> <correo>`                                                  | Asigna o corrige el correo con que el socio se registra e ingresa      |
| `socio:anular-cuenta <rut>`                                                    | Borra la cuenta de acceso (no los descuentos)                          |
| `socio:exportar <rut>`                                                         | Derecho de acceso: todo lo guardado del socio, en JSON                 |
| `socio:eliminar <rut> --confirmar`                                             | Derecho de supresión: borra socio, cuenta y descuentos                 |
| `socios:ausentes [--desactivar]`                                               | Lista (o deshabilita) a quienes no están en el último mes              |
| `admin:crear <email>`                                                          | Crea o reinicia un admin (contraseña y TOTP nuevos)                    |
| `admin:desactivar <email>`                                                     | Quita el acceso a un admin                                             |
| `claves:rotar [--confirmar]`                                                   | Recifra con `CLAVE_CIFRADO_NUEVA` / `CLAVE_HMAC_NUEVA` (runbook §10.1) |

Todo lo que hace el CLI queda en la auditoría con el usuario del sistema operativo.

## 7. Seguridad (resumen)

- RUT, nombre, correo y secretos TOTP **cifrados** en la base (AES-256-GCM); búsqueda por RUT y por correo con HMAC.
- Contraseñas con **Argon2id**; nadie puede verlas.
- Sesiones JWT en cookie `httpOnly`, revalidadas contra la base en cada página privada.
- Rate limiting en Postgres (contacto, registro, recuperación, ingresos).
- Cabeceras de seguridad (CSP, HSTS, X-Frame-Options…) en `apps/web/next.config.ts`.
- Auditoría de accesos y acciones administrativas.
- Postgres sin puertos públicos en producción; respaldos diarios cifrados fuera del VPS.
- **La planilla real nunca entra al repo** (`info/*.xlsx` en `.gitignore`).

## 8. Tests y verificación

```bash
pnpm format:check   # Prettier
pnpm lint           # ESLint
pnpm typecheck      # TypeScript
pnpm test           # Vitest: unitarios + integración (necesita el Postgres de desarrollo)
pnpm build          # build de producción
pnpm e2e            # Playwright (levanta su propio servidor en :3100)
```

- Los tests de integración usan la base `afuch_test` y los e2e la base `afuch_e2e`, en el mismo
  Postgres de desarrollo; se crean y migran solas.
- Primera vez con e2e: `pnpm --filter @afuch/web exec playwright install chromium`.
- CI (GitHub Actions, `.github/workflows/ci.yml`) corre todo lo anterior en cada push a `main` y en cada PR.

## 9. Despliegue

Resumen (detalle completo en el [runbook](docs/operacion/runbook.md)):

```bash
cp infra/.env.example infra/.env        # completar
alias dc='docker compose -f infra/docker-compose.yml --env-file infra/.env'
dc build
dc run --rm herramientas pnpm --filter @afuch/db migrate:deploy
dc up -d
dc run --rm herramientas pnpm cli admin:crear persona@lapalanca.cl
```

Respaldos: `infra/respaldo/respaldar.sh` (cron diario) y `restaurar.sh`.

Antes de apuntar el dominio real conviene ensayar todo en un subdominio de prueba con socios
ficticios: runbook §4.1.

## 10. Lo que falta configurar (fuera del código)

| #   | Qué                                                                                             | Quién              | Dónde se usa                                     |
| --- | ----------------------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------ |
| 1   | Contratar el **VPS** a nombre de AFUCH                                                          | AFUCH / La Palanca | Runbook §1                                       |
| 2   | Confirmar titularidad del dominio **afuchscen.cl** y acceso al DNS                              | AFUCH              | Runbook §3                                       |
| 3   | Registros DNS `A`/`AAAA` hacia el VPS                                                           | La Palanca         | Caddy (HTTPS)                                    |
| 4   | Cuenta en **Resend**, verificar el dominio (SPF/DKIM) y crear la **API key** → `RESEND_API_KEY` | La Palanca         | Correos de contacto, verificación y recuperación |
| 5   | ~~Confirmar el correo de contacto~~: `afuchscen@gmail.com` (2026-10-15)                         | AFUCH              | Formulario de contacto                           |
| 6   | Generar las claves de `infra/.env` y guardarlas en un gestor de contraseñas                     | La Palanca         | Producción                                       |
| 7   | Almacenamiento externo para respaldos + `rclone config` + clave de respaldo                     | La Palanca         | Runbook §7                                       |
| 8   | Monitoreo externo de disponibilidad                                                             | La Palanca         | Runbook §9                                       |
| 9   | Crear los admins reales (`admin:crear`) y cargar el TOTP en sus celulares                       | La Palanca         | `/admin`                                         |
| 10  | Revisión legal y firma de `docs/cumplimiento/instrucciones-tratamiento-datos.md`                | AFUCH + abogado    | Ley 21.719                                       |
| 11  | Si se usa CI: el repo en GitHub (no requiere secretos)                                          | La Palanca         | `.github/workflows/ci.yml`                       |

## 11. Pendientes

**Del lado de AFUCH** (plan §9 y plan de ajustes §2):

- **Lista de correos validada** (RUT + correo) para cargar en `/admin/correos`. El cruce
  preliminar con el padrón dejó 134 socios sin correo y 6 RUT con dígito verificador inválido.
- Teléfono y dirección nuevos; clasificación de convenios (AFUCH SC / FENAFUCH); fotografías
  y nómina de la directiva.
- Confirmar si se mantiene la mención al «bono de invierno anual» del Fondo Solidario y si
  se enlaza al sitio de FENAFUCH.

- Canal para entregar la planilla cada mes (P7), sin usar WhatsApp.
- Plazos de retención de historial y respaldos (P8; hoy respaldos 30 días por defecto).
- Documentos de rendición iniciales y sus categorías (P9).
- Contenido del sitio (P12): relato de historia de la asociación (hoy la descripción sale de
  los estatutos), fotografías de la directiva y confirmación de tildes en sus nombres (el
  certificado no las trae), más noticias, vigencias de convenios, texto de Dimeiggs.
- Corregir las **10 filas con dígito verificador inválido** de la planilla de agosto 2026.
- Confirmar los nombres de conceptos y la lectura de cuotas del préstamo AFUCH (plan §3.2).

**Técnicos:**

- Medir Lighthouse (objetivo ≥ 95 en Rendimiento y Accesibilidad).
- Despliegue en el VPS, prueba de restauración de respaldo y aceptación con AFUCH (plan Etapa 8).
