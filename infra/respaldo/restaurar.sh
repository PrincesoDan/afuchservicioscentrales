#!/usr/bin/env bash
# Restaura un respaldo creado por respaldar.sh. DESTRUCTIVO: reemplaza la base
# y los documentos actuales. Uso:
#   restaurar.sh /var/backups/afuch/afuch-db-AAAAMMDD-HHMMSS.dump.enc [afuch-documentos-....tar.gz.enc]
set -euo pipefail

RAIZ="$(cd "$(dirname "$0")/../.." && pwd)"
COMPOSE=(docker compose -f "$RAIZ/infra/docker-compose.yml" --env-file "$RAIZ/infra/.env")
CLAVE_RESPALDO="${CLAVE_RESPALDO:-/etc/afuch/clave-respaldo}"
DB="${1:?Indica el archivo .dump.enc}"
DOCS="${2:-}"

set -a; source "$RAIZ/infra/.env"; set +a
descifrar() { openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -pass "file:$CLAVE_RESPALDO" -in "$1"; }

read -r -p "Se reemplazará la base '$POSTGRES_DB'. Escribe RESTAURAR para continuar: " respuesta
[[ "$respuesta" == "RESTAURAR" ]] || { echo "Cancelado."; exit 1; }

"${COMPOSE[@]}" stop web
descifrar "$DB" | "${COMPOSE[@]}" exec -T postgres pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner
if [[ -n "$DOCS" ]]; then
  descifrar "$DOCS" | "${COMPOSE[@]}" run --rm --no-deps -T --entrypoint sh web -c 'rm -rf /data/* && tar -C /data -xzf -'
fi
"${COMPOSE[@]}" start web
echo "Restauración completa."
