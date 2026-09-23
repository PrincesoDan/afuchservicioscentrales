# Procedimientos de protección de datos

**Borrador para revisión legal.** Complementa `instrucciones-tratamiento-datos.md`.
Los plazos legales exactos deben confirmarse con asesoría legal.

## 1. Derechos del titular

Canal: `contacto@afuchscen.cl` o el formulario de `/contacto`.

1. **Recepción.** AFUCH registra la solicitud (fecha, titular, derecho ejercido) y la reenvía a La Palanca si requiere acción técnica.
2. **Verificación de identidad.** AFUCH confirma que quien solicita es el titular (por ejemplo, desde su correo institucional o presencialmente en la sede). Nunca se entregan datos a quien no se verificó.
3. **Ejecución** (La Palanca, con instrucción escrita de AFUCH):
   | Derecho | Acción |
   |---|---|
   | Acceso | `pnpm cli socio:exportar <rut>`: ficha, cuenta, descuentos por periodo y accesos, en JSON. |
   | Rectificación | Los datos de nómina se corrigen en la planilla de AFUCH y se reimporta el periodo. |
   | Supresión | `pnpm cli socio:eliminar <rut> --confirmar`: borra socio, cuenta y descuentos. Coordinar con AFUCH que el RUT no vuelva en la planilla (se crearía de nuevo). Los respaldos expiran según la retención. |
   | Oposición / bloqueo | Deshabilitar al socio (`socio:desactivar`). |
   | Portabilidad | Entregar la misma exportación de acceso (JSON, formato estructurado). |
4. **Respuesta** al titular por AFUCH, dentro del plazo legal, dejando registro.

## 2. Retención

| Dato | Plazo | Estado |
|---|---|---|
| Socios, cuentas y descuentos | Mientras sea socio; tras la baja, según instrucción de AFUCH | Plazo pendiente (plan P8) |
| Registro de auditoría | Igual al de los datos que traza | Pendiente (P8) |
| Respaldos | 30 días | Por defecto; confirmar (P8) |
| Planilla original | Se elimina tras importar | Vigente |
| Tokens de verificación/recuperación | Vencen en 24 h / 1 h | Vigente |

Revisión anual de la retención junto con AFUCH.

## 3. Incidentes de seguridad

Ejemplos: acceso no autorizado a `/admin`, filtración de claves o de la planilla, cuenta de
socio usada por otra persona, pérdida de respaldos.

1. **Contener** (La Palanca, de inmediato): desactivar admins comprometidos (`admin:desactivar`), rotar `NEXTAUTH_SECRET` para cerrar todas las sesiones, anular cuentas afectadas, bloquear IPs en el firewall si corresponde.
2. **Informar a AFUCH** sin demora, por escrito: qué pasó, desde cuándo, qué datos y cuántas personas podrían estar afectadas.
3. **Investigar** con `/admin/auditoria`, los logs (`dc logs web`) y los logs de Caddy.
4. **Comunicar**: AFUCH, como responsable, decide y realiza la notificación a la autoridad y a los titulares según la Ley 21.719, con la información que prepare La Palanca.
5. **Corregir y documentar**: causa, medidas tomadas y cambios para evitar que se repita.

## 4. Accesos del equipo encargado

- Alta: `pnpm cli admin:crear <email>` solo para personal designado; registrar a quién se dio acceso.
- Baja: `pnpm cli admin:desactivar <email>` el mismo día en que la persona deja el proyecto.
- Revisión trimestral de administradores activos y del registro de auditoría.
