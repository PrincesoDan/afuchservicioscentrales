# Instrucciones de tratamiento de datos personales

**Borrador para revisión legal.** No reemplaza la asesoría de un abogado. Debe revisarse y
firmarse junto con la propuesta (propuesta §8, paso 3).

| | |
|---|---|
| Responsable del tratamiento | AFUCH Servicios Centrales (Asociación de Funcionarios de la Universidad de Chile — Servicios Centrales) |
| Encargado del tratamiento | Agencia La Palanca |
| Marco | Ley 21.719 sobre protección de datos personales |
| Plataforma | Sitio web institucional y área privada de socios (`afuchscen.cl`) |

## 1. Objeto

AFUCH Servicios Centrales instruye a Agencia La Palanca para tratar los datos personales de
sus socias y socios con el único fin de operar el sitio web y el área privada descritos en la
propuesta de agosto de 2026, en los términos de este documento.

## 2. Datos tratados

| Categoría | Datos | Origen |
|---|---|---|
| Identificación | RUT, nombre, unidad o facultad | Planilla mensual entregada por AFUCH (hoja `ASOCIACI`) |
| Afiliación sindical (sensible) | Pertenencia a la nómina de socios | Planilla mensual |
| Descuentos por planilla (sensible) | Monto mensual por concepto (cuota social, Fondo Solidario, convenios, préstamos) y cuotas del préstamo AFUCH | Planilla mensual |
| Cuenta | Correo electrónico, contraseña (solo hash Argon2id), fechas de registro y verificación | El propio socio |
| Registro de accesos | Fecha, acción, IP | Generado por el sistema |
| Contacto | Nombre, correo, RUT y unidad (opcionales), mensaje | Formulario público; no se almacena, solo se reenvía por correo |

## 3. Finalidades

1. Permitir a cada socio consultar sus descuentos por planilla y la rendición de cuentas.
2. Verificar que solo socios de la nómina accedan al área privada.
3. Responder consultas del formulario de contacto.
4. Mantener la seguridad y trazabilidad de la plataforma.

Queda prohibido usar los datos para cualquier otra finalidad, cederlos o comunicarlos a terceros.

## 4. Instrucciones al encargado

1. Tratar los datos solo según estas instrucciones y las que AFUCH entregue por escrito.
2. Cargar la planilla mensual y los documentos de rendición que AFUCH entregue, sin modificarlos.
3. No conservar copias de la planilla fuera del sistema: el archivo se elimina tras importarlo.
4. Deshabilitar socios o anular cuentas solo por instrucción de AFUCH o ante un reclamo verificado del titular.
5. Limitar el acceso a `/admin` al personal designado de La Palanca, con contraseña y segundo factor (TOTP), y dar de baja los accesos de quien deje de participar.
6. Mantener la confidencialidad sin límite de tiempo (propuesta §7.7).
7. Al terminar el servicio, entregar a AFUCH la base de datos y los documentos, y eliminar las copias en poder de La Palanca, dejando constancia escrita.

## 5. Medidas de seguridad implementadas

- Conexión cifrada (HTTPS con certificado automático).
- RUT, nombre y correo cifrados en la base de datos con AES-256-GCM; búsqueda por RUT mediante índice ciego (HMAC). Claves fuera de la base y de los respaldos.
- Contraseñas con hash Argon2id; nadie, ni el administrador, puede verlas.
- Registro de accesos y de acciones administrativas (auditoría) consultable en `/admin/auditoria`.
- Límite de intentos (rate limiting) y bloqueo temporal de cuentas tras intentos fallidos.
- Base de datos sin acceso desde Internet.
- Respaldo diario cifrado, con copia fuera del servidor y prueba de restauración mensual.
- Cada socio ve solo sus propios datos; los documentos de rendición se entregan solo con sesión válida.

## 6. Subencargados

| Proveedor | Servicio | Datos a los que accede |
|---|---|---|
| Resend | Envío de correos transaccionales | Correo del destinatario y contenido del mensaje (enlaces de verificación y recuperación, mensajes de contacto) |
| Proveedor de VPS (pendiente, plan P11) | Alojamiento | Datos cifrados en disco y base de datos |
| Proveedor de almacenamiento de respaldos (pendiente) | Copia externa de respaldos | Respaldos cifrados (sin la clave) |

Todo cambio de subencargado se informa previamente a AFUCH.

## 7. Conservación

- Datos de socios y descuentos: mientras la persona sea socia; tras la baja, hasta que AFUCH instruya su eliminación. **Plazo a definir por AFUCH (plan P8).**
- Respaldos: 30 días por defecto. **A confirmar por AFUCH (plan P8).**
- Mensajes de contacto: no se almacenan en la plataforma.

## 8. Derechos de los titulares

Las solicitudes de acceso, rectificación, supresión, oposición y portabilidad se reciben en
`contacto@afuchscen.cl`. La Palanca asiste a AFUCH según
`docs/cumplimiento/procedimientos.md` §1, dentro del plazo legal.

## 9. Incidentes de seguridad

La Palanca informa a AFUCH sin demora ante cualquier incidente que afecte datos personales,
según `docs/cumplimiento/procedimientos.md` §3. La comunicación a la autoridad y a los
titulares corresponde a AFUCH como responsable, con la asistencia de La Palanca.

---

Firmas: ______________________ (AFUCH Servicios Centrales) · ______________________ (Agencia La Palanca)
