# Runbook de operación — AFUCH Servicios Centrales

Operación del sitio en un VPS con Docker. Encargado: Agencia La Palanca.
Archivos: `infra/docker-compose.yml`, `infra/Dockerfile`, `infra/Caddyfile`, `infra/respaldo/`.

En los comandos, `dc` significa:

```bash
alias dc='docker compose -f /opt/afuch/infra/docker-compose.yml --env-file /opt/afuch/infra/.env'
```

---

## 1. Requisitos del VPS

- Ubuntu Server LTS, 2 vCPU, 2–4 GB RAM, 40 GB de disco (referencial; ~900 socios).
- Docker Engine con el plugin `docker compose`.
- `openssl` y `rclone` (copia de respaldos fuera del VPS).
- Contratado a nombre de AFUCH (propuesta §6). Proveedor: pendiente (plan, P11).

## 2. Endurecimiento inicial

1. Crear un usuario sin privilegios de root para operar; deshabilitar el ingreso SSH de `root` y por contraseña (`PermitRootLogin no`, `PasswordAuthentication no`). Solo llaves SSH.
2. Firewall: permitir solo 22, 80 y 443.
   ```bash
   ufw default deny incoming && ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443 && ufw enable
   ```
3. Actualizaciones de seguridad automáticas: `apt install unattended-upgrades`.
4. Cifrado de disco si el proveedor lo ofrece.
5. Postgres **no** publica puertos: solo lo alcanza la red interna de compose.

## 3. DNS y correo

- Registro `A` (y `AAAA` si aplica) de `afuchservicioscentrales.cl` y `www` hacia la IP del VPS. Caddy obtiene el certificado HTTPS solo cuando el DNS apunta al VPS.
- Resend: agregar el dominio y crear los registros SPF/DKIM que indique el panel. Sin eso, los correos de verificación caen en spam.

## 4. Primer despliegue

```bash
sudo mkdir -p /opt/afuch && sudo chown "$USER" /opt/afuch
git clone <repo> /opt/afuch && cd /opt/afuch
cp infra/.env.example infra/.env && chmod 600 infra/.env
# Completar infra/.env: generar cada clave con openssl (ver comentarios del archivo).
```

**Guardar `CLAVE_CIFRADO`, `CLAVE_HMAC` y la clave de respaldos también fuera del VPS**
(gestor de contraseñas de La Palanca y copia sellada para AFUCH). Sin ellas, los datos
cifrados y los respaldos son irrecuperables.

```bash
dc build
dc run --rm herramientas pnpm --filter @afuch/db migrate:deploy
dc up -d
dc run --rm herramientas pnpm cli admin:crear persona@lapalanca.cl
```

`admin:crear` imprime una contraseña y un secreto TOTP una sola vez: cargarlo en una app
autenticadora (Google Authenticator, 1Password, etc.) y guardar la contraseña en el gestor.

Verificar: `https://afuchservicioscentrales.cl` responde, `/admin/ingreso` permite entrar.

## 5. Carga mensual

**Planilla de descuentos** (canal de entrega con AFUCH: plan P7).

- Desde `/admin/planilla`: subir el `.xlsx`, revisar vista previa y advertencias, «Importar».
- Desde el VPS:
  ```bash
  mkdir -p /opt/afuch/infra/entrada && cp planilla.xlsx /opt/afuch/infra/entrada/
  dc run --rm herramientas pnpm cli planilla:importar /entrada/planilla.xlsx             # vista previa
  dc run --rm herramientas pnpm cli planilla:importar /entrada/planilla.xlsx --confirmar
  shred -u /opt/afuch/infra/entrada/planilla.xlsx
  ```

Las filas con RUT de DV inválido se excluyen y se informan como advertencia: enviar la lista
de filas a AFUCH para que corrija la planilla.

**Bajas de socios.** Importar nunca deshabilita. Cuando AFUCH lo indique:
`/admin/socios` → filtro «Ausentes del último mes» → «Deshabilitar ausentes», o por RUT
(`pnpm cli socio:desactivar <rut>`).

**Cuenta registrada por otra persona.** Si un socio reclama que su RUT «ya tiene cuenta»:
verificar su identidad con AFUCH y usar «Anular cuenta» (`pnpm cli socio:anular-cuenta <rut>`).
El socio vuelve a registrarse con su correo; las sesiones de la cuenta anulada dejan de valer.

**Rendición de cuentas.** `/admin/rendicion` o
`dc run --rm herramientas pnpm cli rendicion:publicar /entrada/doc.pdf --titulo "…" --categoria "…" --fecha AAAA-MM-DD`.

## 6. Actualizar la aplicación

```bash
cd /opt/afuch && git fetch && git checkout <tag-o-commit>
dc build
dc run --rm herramientas pnpm --filter @afuch/db migrate:deploy
dc up -d
```

Antes de actualizar, ejecutar un respaldo manual (sección 7).

**Rollback.** Volver al tag anterior y repetir `build` + `up -d`. Las migraciones solo
avanzan: si la versión nueva cambió el schema de forma incompatible, restaurar el respaldo
tomado antes de actualizar (sección 8).

## 7. Respaldos

1. Clave de respaldo:
   ```bash
   sudo mkdir -p /etc/afuch && openssl rand -base64 48 | sudo tee /etc/afuch/clave-respaldo >/dev/null
   sudo chmod 600 /etc/afuch/clave-respaldo
   ```
2. Destino fuera del VPS: configurar un remoto con `rclone config` (almacenamiento de objetos a nombre de AFUCH) y definir `RCLONE_DESTINO`.
3. Cron diario del usuario root:
   ```
   RCLONE_DESTINO=respaldo:afuch-respaldos
   15 3 * * * /opt/afuch/infra/respaldo/respaldar.sh >> /var/log/afuch-respaldo.log 2>&1
   ```
4. Retención por defecto: 30 días (`RETENCION_DIAS`). Pendiente de confirmar con AFUCH (plan P8).

Cada respaldo contiene la base (`pg_dump`) y los PDF de rendición, cifrados con AES-256.
Los datos personales ya van cifrados por la aplicación dentro del dump.

## 8. Restaurar

```bash
/opt/afuch/infra/respaldo/restaurar.sh /var/backups/afuch/afuch-db-AAAAMMDD-HHMMSS.dump.enc \
  /var/backups/afuch/afuch-documentos-AAAAMMDD-HHMMSS.tar.gz.enc
```

**Prueba de restauración mensual** (obligatoria): restaurar el último respaldo en un
VPS o máquina de pruebas con las mismas claves y comprobar que un socio de prueba ve
sus descuentos. Registrar fecha y resultado.

## 9. Monitoreo

- Disponibilidad: un servicio externo de monitoreo que consulte `https://afuchservicioscentrales.cl/` cada 5 minutos y avise por correo.
- Respaldos: revisar `/var/log/afuch-respaldo.log`; configurar `MAILTO` en el cron para recibir los errores.
- Logs de la app: `dc logs --since 24h web`.
- Auditoría funcional: `/admin/auditoria`.

## 10. Rotación de claves

| Clave | Procedimiento | Efecto |
|---|---|---|
| `NEXTAUTH_SECRET` | Cambiar en `infra/.env` y `dc up -d` | Cierra todas las sesiones. |
| `POSTGRES_PASSWORD` | `ALTER USER` en Postgres, cambiar en `.env`, `dc up -d` | — |
| `RESEND_API_KEY` | Crear nueva en Resend, cambiar en `.env`, `dc up -d`, revocar la anterior | — |
| Contraseña/TOTP de un admin | `pnpm cli admin:crear <email>` (reinicia ambos) | — |
| Baja de un admin | `pnpm cli admin:desactivar <email>` | Pierde acceso de inmediato. |
| `CLAVE_CIFRADO` / `CLAVE_HMAC` | **No hay rotación automática.** Requiere un script que descifre y vuelva a cifrar todos los registros; queda pendiente. Rotar solo ante sospecha de filtración. | — |

## 11. Incidentes

Ver `docs/cumplimiento/procedimientos.md` §3.
