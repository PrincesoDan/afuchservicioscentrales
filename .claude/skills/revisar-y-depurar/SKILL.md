---
name: revisar-y-depurar
description: Revisa cambios de código y depura fallas en el proyecto AFUCH Servicios Centrales (Next.js + Prisma + NextAuth). Úsala cuando pidan revisar un diff, una rama o un archivo; cuando falle un test, el build, un e2e o una página; o cuando algo del área de socios, el admin, la planilla o el contacto no funcione como se espera.
---

# Revisar y depurar — AFUCH Servicios Centrales

Lee `CLAUDE.md` primero. Esta skill tiene dos modos: **Revisión** y **Depuración**. Si el
pedido no dice cuál, deduce: hay un error concreto → Depuración; hay cambios que evaluar →
Revisión.

Regla transversal: **nunca abras, imprimas ni importes la planilla real** (`info/*.xlsx`) para
reproducir un problema. Usa `pnpm cli planilla:ficticia` o `crearPlanillaFicticia`. Si el bug
solo aparece con la planilla real, analízala mostrando únicamente estructura, conteos y números
de fila (nunca nombres ni RUT).

---

## Modo Revisión

### 1. Delimitar qué revisar

```bash
git status --short
git diff --stat main...HEAD        # rama completa
git diff                            # sin commitear
```

Lee cada archivo modificado completo, no solo el diff, cuando el cambio toque `src/server/`,
`middleware.ts`, `auth.ts`, acciones (`acciones.ts`) o el schema de Prisma.

### 2. Checklist (en orden de gravedad)

**Seguridad y datos personales (bloqueante)**

- [ ] Ningún dato personal en claro en la base: RUT/nombre/correo pasan por `cifrar()`; búsquedas por RUT usan `hashRut()`.
- [ ] `auditar()` no recibe RUT, nombres ni correos en `detalle`.
- [ ] Toda server action de admin llama `exigirAdmin()` antes de hacer nada; toda página o ruta privada de socio usa `exigirSocio()` o `socioPuedeVer()`.
- [ ] Rutas nuevas bajo `/socios/*` privadas o `/admin/*` están cubiertas por el `matcher` de `middleware.ts`.
- [ ] Respuestas públicas (registro, recuperación, ingreso) no revelan si un RUT es socio.
- [ ] Entradas validadas con un schema de `packages/contracts` (o Zod en el servidor) antes de usarse.
- [ ] Endpoints públicos que envían correo o consultan cuentas pasan por `permitir()` (rate limit).
- [ ] Archivos subidos: tamaño y tipo validados (`esPdf`, límite 20 MB); nombres en disco generados por el sistema.
- [ ] Ningún secreto, `.env`, planilla ni dato real agregado al repo (`git status --untracked-files=all`).

**Reglas de producto (plan §3)**

- [ ] El socio no puede editar datos (D8) ni descargar descuentos (D7).
- [ ] Importar planilla no deshabilita socios (D6).
- [ ] Toda acción administrativa nueva queda en auditoría.
- [ ] Nombres de conceptos consistentes con `NOMBRE_CONCEPTO` (`src/server/descuentos.ts`).

**Correctitud**

- [ ] Casos límite: listas vacías, periodo sin datos, socio sin cuenta, token vencido o usado, sesión de una cuenta anulada.
- [ ] Operaciones múltiples en base dentro de `$transaction` cuando deben ser atómicas.
- [ ] Fechas: las ISO sin hora se formatean en UTC (`formatearFecha`); montos con `formatearClp`.
- [ ] Cambios en `schema.prisma` vienen con migración y `pnpm --filter @afuch/db build`.
- [ ] Todo campo cifrado nuevo está cubierto por `rotacion-claves.ts` y su test.

**Calidad y convenciones**

- [ ] Nombres y textos en español, estilo del código vecino; sin `any`.
- [ ] Accesibilidad: `Campo` para inputs, `aria-current` en navegación, errores con `role="alert"`.
- [ ] Tests nuevos o actualizados para la lógica cambiada (unitario, integración o e2e según corresponda).

### 3. Verificar ejecutando

```bash
docker compose -f infra/docker-compose.dev.yml up -d
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm e2e    # si cambió UI, auth o flujos
```

### 4. Informe

Lista los hallazgos **del más grave al menos grave**. Para cada uno: archivo:línea, qué está
mal, escenario concreto que lo rompe y la corrección propuesta. Separa "bloqueante" de
"sugerencia". Si no hay hallazgos, dilo y di qué verificaste. No apliques cambios salvo que lo
pidan.

---

## Modo Depuración

### 1. Reproducir antes de tocar código

Consigue el error exacto (mensaje, stack, URL, pasos). Reprodúcelo con el camino más corto:

| Síntoma                            | Reproducir con                                                                                                                                     |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Falla un test unitario/integración | `cd apps/web && pnpm exec vitest run <archivo>`                                                                                                    |
| Falla un e2e                       | `cd apps/web && pnpm exec playwright test <spec> --project=escritorio`; revisar `test-results/*/error-context.md` (tiene el snapshot de la página) |
| Falla el build                     | `pnpm build` y leer el primer error, no el último                                                                                                  |
| Error en una página                | `pnpm dev` y consola del servidor; reproducir en el navegador                                                                                      |
| Problema con la planilla           | `pnpm cli planilla:importar <archivo> ` (sin `--confirmar`) muestra errores y advertencias                                                         |
| Problema de un socio               | `pnpm cli socio:estado <rut>` + `/admin/auditoria`                                                                                                 |

Luego escribe un test que falle por el bug (cuando sea posible) antes de corregir.

### 2. Mapa de síntomas frecuentes

| Síntoma                                                                            | Causa probable                                                                                                                     | Dónde mirar                                                                                               |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `Variables de entorno inválidas: …`                                                | Falta o formato incorrecto en `apps/web/.env` (claves deben ser 32 bytes base64)                                                   | `src/server/env.ts`, `.env.example`                                                                       |
| `DATABASE_URL no está configurada` / conexión rechazada                            | Postgres de desarrollo apagado o puerto distinto (5433)                                                                            | `infra/docker-compose.dev.yml`                                                                            |
| `Cannot find module './generated/prisma/client'` o tipos de Prisma desactualizados | Cliente no generado tras cambiar el schema                                                                                         | `pnpm --filter @afuch/db build`                                                                           |
| `The table ... does not exist`                                                     | Migraciones no aplicadas en esa base                                                                                               | `pnpm --filter @afuch/db migrate:deploy` (con el `DATABASE_URL` correcto)                                 |
| `This module cannot be imported from a Client Component`                           | Un componente cliente importó algo de `src/server/`                                                                                | Mover la lógica a una server action o pasar datos como props                                              |
| Error de `server-only` al correr un script                                         | Falta `--conditions=react-server` en `tsx`                                                                                         | `apps/web/package.json` (`cli`)                                                                           |
| Socio no recibe el correo de verificación                                          | Sin `RESEND_API_KEY` (va a la consola), dominio sin SPF/DKIM, RUT fuera de nómina o deshabilitado (respuesta genérica a propósito) | `src/server/correo.ts`, `/admin/auditoria` (`registro.rechazado`)                                         |
| Socio "no puede ingresar"                                                          | Cuenta sin verificar, bloqueada 15 min, socio deshabilitado o rate limit                                                           | `pnpm cli socio:estado <rut>`, auditoría (`ingreso.fallido` + motivo)                                     |
| Sesión válida pero redirige a `/socios?sesion=expirada`                            | Cuenta anulada/re-registrada o socio deshabilitado (comportamiento esperado, T7)                                                   | `socioPuedeVer` en `src/server/cuentas.ts`                                                                |
| Admin no puede entrar                                                              | Código TOTP vencido o reloj desfasado, admin desactivado                                                                           | `administradores.ts`; `pnpm cli admin:crear` reinicia                                                     |
| Importación con advertencias de "RUT con dígito verificador inválido"              | Error de digitación en la planilla de AFUCH (esperado; se excluye la fila)                                                         | Pedir corrección a AFUCH                                                                                  |
| "Faltan columnas en la fila 1"                                                     | AFUCH cambió encabezados de `ASOCIACI`                                                                                             | `COLUMNAS_OBLIGATORIAS` y `COLUMNAS_CONCEPTO` en `src/server/planilla.ts`                                 |
| `429` en contacto/registro                                                         | Rate limit (5/hora por IP)                                                                                                         | `src/server/rate-limit.ts`; en desarrollo, vaciar la tabla `RateLimiterFlexible` de la base de desarrollo |
| TS6053 sobre `.next/types`                                                         | `pnpm dev` regenerando tipos                                                                                                       | Esperar y reintentar                                                                                      |
| e2e: `strict mode violation`                                                       | Selector ambiguo (p. ej. "Socios" vs "Acceso socios")                                                                              | Acotar con `getByRole('navigation', { name, exact: true })`                                               |
| e2e: timeout en la primera visita                                                  | `next dev` compila la ruta la primera vez                                                                                          | `expect.timeout` en `playwright.config.ts`                                                                |
| Contenedor de producción no arranca                                                | `infra/.env` incompleto o migraciones sin aplicar                                                                                  | Runbook §4 y §6; `dc logs web`                                                                            |

### 3. Corregir

- Corrige la causa, no el síntoma. Si el arreglo toca una decisión del plan (§3), detente y pregunta.
- Agrega o ajusta el test que reproduce el bug.
- Corre la verificación completa del Modo Revisión §3.

### 4. Informe

Explica en pocas líneas: causa raíz (con archivo:línea), cómo se reprodujo, qué cambió y qué
comandos se corrieron con su resultado. Si no se pudo reproducir o verificar, dilo explícitamente.
