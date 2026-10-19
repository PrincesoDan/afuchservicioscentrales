#!/usr/bin/env bash
# Despliegue en el VPS: respaldo → código → build → migraciones → reinicio → verificación.
# Uso (runbook §6):
#   /opt/afuch/infra/deploy.sh            # última versión de origin/main
#   /opt/afuch/infra/deploy.sh <tag|sha>  # una versión puntual (también sirve para volver atrás)
set -euo pipefail

RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE=(docker compose -f "$RAIZ/infra/docker-compose.yml" --env-file "$RAIZ/infra/.env")
REF="${1:-}"

paso() { echo -e "\n== $(date '+%H:%M:%S') $*"; }

# Dos despliegues a la vez se pisarían el build y las migraciones.
exec 9>/tmp/afuch-deploy.lock
flock -n 9 || { echo "Ya hay un despliegue en curso." >&2; exit 1; }

cd "$RAIZ"
set -a; source "$RAIZ/infra/.env"; set +a

# Cambios locales sin commit en el VPS se perderían o romperían el pull.
if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
  echo "Hay cambios sin commit en $RAIZ; revísalos con 'git status' antes de desplegar." >&2
  exit 1
fi

ANTERIOR="$(git rev-parse --short HEAD)"

paso "Respaldo"
"$RAIZ/infra/respaldo/respaldar.sh"

paso "Código"
git fetch --tags origin
if [[ -n "$REF" ]]; then
  git checkout --detach "$REF"
else
  git checkout main
  git merge --ff-only origin/main
fi
ACTUAL="$(git rev-parse --short HEAD)"
git log --oneline -1
if [[ "$ACTUAL" == "$ANTERIOR" ]]; then
  echo "Sin cambios de código ($ACTUAL); se reconstruye igual."
fi

paso "Build"
# Sin --profile, compose omite la imagen de herramientas y la CLI queda con código viejo.
"${COMPOSE[@]}" --profile herramientas build

paso "Migraciones"
"${COMPOSE[@]}" run --rm herramientas pnpm --filter @afuch/db migrate:deploy

paso "Reinicio"
"${COMPOSE[@]}" up -d

paso "Verificación"
# --resolve evita depender del DNS: se prueba este mismo VPS, con su certificado.
SITIO="www.$DOMINIO"
for intento in $(seq 1 30); do
  if curl -fsS -o /dev/null --resolve "$SITIO:443:127.0.0.1" "https://$SITIO/"; then
    echo "https://$SITIO responde."
    break
  fi
  if [[ "$intento" == 30 ]]; then
    echo "El sitio no respondió en 60 s. Revisa: docker compose ... logs --since 10m web" >&2
    echo "Para volver a la versión anterior: $0 $ANTERIOR" >&2
    exit 1
  fi
  sleep 2
done

paso "Limpieza de imágenes sin uso"
docker image prune -f >/dev/null

echo -e "\nDespliegue OK: $ANTERIOR → $ACTUAL. Para volver atrás: $0 $ANTERIOR"
