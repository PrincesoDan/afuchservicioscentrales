# CLAUDE.md — AFUCH Servicios Centrales

Sitio institucional + área privada de socios + administración interna para AFUCH Servicios
Centrales. Desarrolla y opera Agencia La Palanca. Lee el `README.md` para la visión completa y
`docs/superpowers/plans/2026-09-23-plan-cierre-propuesta.md` para las decisiones (D1–D9, P5–P6,
T1–T7) antes de cambiar comportamiento.

## Reglas que no se rompen

1. **Datos personales.** La planilla real (`info/*.xlsx`) contiene nombres, RUT y descuentos
   de ~900 personas (dato sensible, Ley 21.719). Nunca la agregues al repo, no la copies fuera
   de `info/`, no imprimas su contenido en la conversación (solo conteos, números de fila y
   estructura) y no la importes en bases de desarrollo. Para pruebas usa
   `crearPlanillaFicticia` (`apps/web/src/server/fixtures/planilla-ficticia.ts`) o
   `pnpm cli planilla:ficticia`.
2. **No inventes contenido institucional** (textos de AFUCH, directiva, convenios, montos). Si
   falta, se marca como pendiente y se pregunta.
3. **No ejecutes `prisma migrate reset`** ni nada que borre bases sin consentimiento explícito.
   Los tests usan `afuch_test` / `afuch_e2e` y limpian con `TRUNCATE` en su propio código.
4. **Nunca guardes datos personales en claro.** RUT, nombre y correo se guardan con `cifrar()`;
   búsqueda por RUT con `hashRut()`. La auditoría (`auditar()`) nunca lleva datos personales en
   `detalle`: solo ids, conteos y motivos.
5. **Las respuestas públicas no revelan quién es socio** (registro, recuperación e ingreso
   responden igual; el ingreso usa `verificarSenuelo` para igualar tiempos).
6. Decisiones de producto vigentes: el socio **no edita nada** (D8), **no hay descargas** de
   descuentos (D7), **importar nunca deshabilita** socios (D6), el registro usa el correo que
   escribe el socio (D4, con las mitigaciones del plan §3.1).

## Comandos

Node 24 (`nvm use`), pnpm 10. Postgres de desarrollo en `localhost:5433`:

```bash
docker compose -f infra/docker-compose.dev.yml up -d
pnpm dev                               # http://localhost:3000
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm e2e                               # Playwright, servidor propio en :3100
pnpm cli ayuda                         # CLI de administración
pnpm --filter @afuch/db migrate:dev --name <nombre>   # nueva migración (desarrollo)
pnpm --filter @afuch/db build          # regenerar cliente Prisma tras cambiar el schema
```

Un test puntual: `cd apps/web && pnpm exec vitest run src/server/cuentas.test.ts`.
Un e2e puntual: `cd apps/web && pnpm exec playwright test e2e/socios.spec.ts`.

## Arquitectura

Monorepo pnpm + Turborepo. **Solo Next.js** (no hay API separada).

- `packages/contracts` — schemas Zod compartidos por navegador y servidor (`contactoSchema`,
  `registroSchema`, `ingresoSocioSchema`…) y `validarRut`/`normalizarRut`/`formatearRut`.
  Sin I/O.
- `packages/db` — `prisma/schema.prisma`, migraciones, `db()` (singleton con `@prisma/adapter-pg`).
  El cliente se genera en `src/generated/` (ignorado por git).
- `apps/web/src/server/` — toda la lógica de servidor. Cada archivo importa `server-only`.
  - `planilla.ts` lee la hoja `ASOCIACI` (puro, sin base) → `importacion.ts` la guarda.
  - `cuentas.ts` registro/verificación/ingreso/recuperación de socios.
  - `administracion.ts` operaciones de admin (listar, habilitar, anular, ausentes, exportar, eliminar).
  - `administradores.ts` admins + TOTP. `auth.ts` NextAuth + `exigirSocio()`/`exigirAdmin()`.
  - `rotacion-claves.ts` recifra todo con claves nuevas (`pnpm cli claves:rotar`).
  - `cifrado.ts`, `auditoria.ts`, `correo.ts`, `rate-limit.ts`, `env.ts` (validación perezosa con Zod).
- `apps/web/src/app/` — rutas. Área privada en `socios/(privado)/`, admin en `admin/(panel)/`.
  Formularios con **server actions** (`socios/acciones.ts`, `admin/acciones.ts`); cada acción
  de admin llama `exigirAdmin()` primero.
- `apps/web/src/middleware.ts` — primera barrera por rol (JWT). La segunda está en cada
  página/acción (`exigirSocio`/`exigirAdmin` revisan la base).
- `apps/web/scripts/cli.ts` — CLI; reutiliza `src/server/*`. Se ejecuta con
  `tsx --conditions=react-server` (necesario por `server-only`).
- Contenido público estático en `apps/web/src/content/*.ts`, validado en build.

## Convenciones

- **Todo en español**: nombres de variables, funciones, archivos, comentarios, textos de UI y
  mensajes de commit. Mantén el estilo existente (`leerPlanilla`, `exigirSocio`, `TarjetaAcceso`).
- TypeScript estricto, sin `any`; usa `unknown` y estrecha. Prettier: comillas simples, coma
  final, 100 columnas.
- Comentarios solo para el **porqué** (decisión, riesgo, restricción), no para el qué.
- Accesibilidad WCAG 2.1 AA: labels asociados (usa `Campo` de `components/ui/campo.tsx`), foco
  visible, `aria-current`, errores con `role="alert"`.
- Tailwind con los tokens de `globals.css` (`navy-*`, `gold-*`); el dorado es acento, no texto de cuerpo.
- Validación: primero el schema de `contracts` (compartido), luego la lógica en `server/`.
- Cambios de schema: migración con nombre descriptivo en español (`socio_ultimo_periodo`).
- Toda acción administrativa nueva debe llamar `auditar()`.
- Un campo cifrado nuevo en el schema debe agregarse también a `rotacion-claves.ts` (lectura,
  escritura y verificación) y a su test; si no, quedará ilegible tras la próxima rotación.

## Tests

- Lógica pura (`lib/`, `planilla.ts`, `contracts`) → unitarios Vitest.
- Servicios con base (`server/*.test.ts`) → integración contra `afuch_test`; empiezan con
  `// @vitest-environment node` y llaman `limpiarBase()` en `beforeEach`. Correos: mock de
  `./correo` hacia el buzón de `src/test/correos.ts`.
- Flujos de usuario → Playwright en `apps/web/e2e/`. Leen correos desde `e2e/.buzon`
  (`CORREO_BUZON_DIR`) y credenciales de admin desde `e2e/.estado.json` (los crea `semilla.ts`).
- Antes de dar algo por terminado: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build`,
  y `pnpm e2e` si tocaste UI o flujos.

## Trampas conocidas

- `next start` es producción y exige `RESEND_API_KEY`; por eso los e2e usan `next dev`.
- Tras cambiar `next.config.ts` con `pnpm dev` corriendo, `tsc` puede fallar con TS6053 sobre
  `.next/types` mientras se regenera: espera y reintenta.
- `rate-limiter-flexible`, `exceljs` y `@node-rs/argon2` van en `serverExternalPackages`.
- `prisma.config.ts` usa `process.env.DATABASE_URL` (no `env()`) para que `prisma generate`
  funcione sin base (build, CI, Docker).
- El dominio es `afuchscen.cl`; el sitio canónico es `https://www.afuchscen.cl` y el correo
  `contacto@afuchscen.cl`. Úsalos desde `SEDE.sitioUrl` / `SEDE.email` (o `env()` en el servidor),
  no los escribas a mano.

## Skills del proyecto

- `/revisar-y-depurar` — revisión de código y depuración con los criterios de este repo
  (`.claude/skills/revisar-y-depurar/SKILL.md`).
