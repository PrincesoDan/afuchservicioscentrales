# Uso: source "$RAIZ/infra/cargar-env.sh"; cargar_env "$RAIZ/infra/.env"
# Lee el .env como Docker Compose y exporta sus variables. No se hace `source` del .env:
# Compose acepta valores sin comillas que bash rechaza (CORREO_REMITENTE=Nombre <correo>).
cargar_env() {
  local linea clave valor
  while IFS= read -r linea || [[ -n "$linea" ]]; do
    [[ "$linea" =~ ^[[:space:]]*([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]] || continue
    clave="${BASH_REMATCH[1]}"
    valor="${BASH_REMATCH[2]}"
    if [[ "$valor" =~ ^\"(.*)\"[[:space:]]*(#.*)?$ || "$valor" =~ ^\'(.*)\'[[:space:]]*(#.*)?$ ]]; then
      valor="${BASH_REMATCH[1]}"
    else
      valor="${valor%%[[:space:]]#*}"
      valor="${valor%"${valor##*[![:space:]]}"}"
    fi
    export "$clave=$valor"
  done < "$1"
}
