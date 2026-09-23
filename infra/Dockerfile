# Imagen de producción de apps/web (Next.js standalone).
# Construir desde la raíz del repo: docker build -f infra/Dockerfile .

FROM node:24-alpine AS base
RUN corepack enable
WORKDIR /repo

# Todo el monorepo con dependencias: se usa para compilar y como imagen de
# herramientas (migraciones y CLI de administración).
FROM base AS herramientas
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @afuch/db build
RUN pnpm --filter @afuch/web build

FROM node:24-alpine AS web
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
RUN addgroup -S afuch && adduser -S afuch -G afuch && mkdir -p /data && chown afuch:afuch /data
COPY --from=herramientas --chown=afuch:afuch /repo/apps/web/.next/standalone ./
COPY --from=herramientas --chown=afuch:afuch /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=herramientas --chown=afuch:afuch /repo/apps/web/public ./apps/web/public
USER afuch
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
