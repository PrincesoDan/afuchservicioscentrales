# AFUCH Servicios Centrales — sitio web y área de socios

Sitio institucional público, área privada de socios (descuentos por planilla y rendición de
cuentas) y administración interna para la carga de datos.

- Plan y decisiones: `docs/superpowers/plans/2026-09-23-plan-cierre-propuesta.md`
- Diseño del sitio público: `docs/superpowers/specs/2026-09-04-afuch-landing-design.md`
- Operación en producción: `docs/operacion/runbook.md`
- Protección de datos: `docs/cumplimiento/`

## Stack

Next.js 15 · React 19 · TypeScript · Tailwind 4 · PostgreSQL 16 · Prisma 7 · NextAuth ·
pnpm + Turborepo · Vitest · Playwright · Docker + Caddy.

## Desarrollo local

Requisitos: Node 24 (`nvm use`), pnpm 10 (`corepack enable`), Docker.

```bash
pnpm install
docker compose -f infra/docker-compose.dev.yml up -d        # Postgres en localhost:5433
cp packages/db/.env.example packages/db/.env
cp apps/web/.env.example apps/web/.env                         # completar las claves con openssl
pnpm --filter @afuch/db migrate:deploy
pnpm --filter @afuch/db build                                  # genera el cliente Prisma
pnpm dev                                                       # http://localhost:3000
```

Crear un admin local: `pnpm cli admin:crear tu@correo.cl`. Datos de prueba: generar una
planilla ficticia con `crearPlanillaFicticia` (`apps/web/src/server/fixtures/`).

**La planilla real de AFUCH contiene datos personales: nunca se agrega al repo** (`info/*.xlsx`
está en `.gitignore`).

## Verificación

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm e2e        # Playwright; usa la base afuch_e2e
```

Los tests de integración usan la base `afuch_test` (se crea y migra sola).
