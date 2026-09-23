#!/usr/bin/env bash
# Respaldo diario: base de datos + documentos de rendición, cifrados con
# AES-256 y copiados fuera del VPS. Programar en el cron del host (ver runbook):
#   15 3 * * * /opt/afuch/infra/respaldo/respaldar.sh >> /var/log/afuch-respaldo.log 2>&1
set -euo pipefail

RAIZ="$(cd "$(dirname "$0")/../.." && pwd)"
COMPOSE=(docker compose -f "$RAIZ/infra/docker-compose.yml" --env-file "$RAIZ/infra/.env")
DESTINO_LOCAL="${DESTINO_LOCAL:-/var/backups/afuch}"
CLAVE_RESPALDO="${CLAVE_RESPALDO:-/etc/afuch/clave-respaldo}"   # archivo con la clave, permisos 600
RETENCION_DIAS="${RETENCION_DIAS:-30}"
RCLONE_DESTINO="${RCLONE_DESTINO:-}"                           # ej. "respaldo:afuch-respaldos"
FECHA="$(date +%Y%m%d-%H%M%S)"

set -a; source "$RAIZ/infra/.env"; set +a
mkdir -p "$DESTINO_LOCAL"
chmod 700 "$DESTINO_LOCAL"

cifrar() { openssl enc -aes-256-cbc -pbkdf2 -iter 200000 -salt -pass "file:$CLAVE_RESPALDO"; }

"${COMPOSE[@]}" exec -T postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom \
  | cifrar > "$DESTINO_LOCAL/afuch-db-$FECHA.dump.enc"

"${COMPOSE[@]}" exec -T web tar -C /data -czf - . \
  | cifrar > "$DESTINO_LOCAL/afuch-documentos-$FECHA.tar.gz.enc"

find "$DESTINO_LOCAL" -name 'afuch-*.enc' -mtime "+$RETENCION_DIAS" -delete

if [[ -n "$RCLONE_DESTINO" ]]; then
  rclone copy "$DESTINO_LOCAL" "$RCLONE_DESTINO" --include "afuch-*-$FECHA.*"
  rclone delete "$RCLONE_DESTINO" --min-age "${RETENCION_DIAS}d" --include 'afuch-*.enc'
else
  echo "ADVERTENCIA: RCLONE_DESTINO vacío; el respaldo quedó solo en el VPS." >&2
fi

echo "$(date -Is) respaldo $FECHA OK"
