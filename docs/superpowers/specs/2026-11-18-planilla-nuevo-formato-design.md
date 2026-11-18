# Planilla de descuentos: nuevo formato de AFUCH y desglose para el socio

Fecha: 2026-11-18. Estado: aprobado por el usuario (2026-11-18).

## Intención

Desde octubre de 2026, AFUCH entrega la planilla mensual de descuentos en un formato nuevo
(«PLANILLA DESCUENTOS PAGINA WEB», hoja `Consolidado_<Mes>_<Año>`). Ese pasa a ser **el único
formato** que el admin sube en `/admin/planilla`. El lector actual (`apps/web/src/server/planilla.ts`)
solo entiende el formato antiguo (hoja `ASOCIACI`), así que hay que reemplazarlo.

El formato nuevo trae más detalle, y el usuario decidió mostrarlo al socio en «Mis descuentos»:
el reparto 60/40 de la cuota social, cada préstamo AFUCH con su fecha y monto prestado, y el gas
por tipo de vale.

## Objetivos

1. El admin sube la planilla nueva y la vista previa, la importación y la auditoría funcionan como hoy.
2. «Mis descuentos» muestra, desde octubre de 2026, el desglose de cuota social, préstamos AFUCH y gas.
3. Los meses ya importados (agosto y septiembre de 2026, formato antiguo) se siguen viendo como hoy.

## No objetivos

- Mantener el lector del formato antiguo. Un archivo antiguo se rechaza con un error claro.
- Vistas nuevas en el admin. La vista previa sigue mostrando el total por concepto.
- Usar las columnas que no se muestran: SEXO, INGRESO, GRADO, TIP_CUO, DESCRIPCION, `anterior`,
  ASOCIAC, SESENTA, la columna 6 sin encabezado (un BUSCARV), «fecha asignacion» del gas y los
  totales intermedios (`TOTAL EXTRA AFSC…`).

## Antiobjetivos

- Que se importe un mes con montos equivocados sin que nadie lo note. Cada fila se valida contra
  el total que trae la planilla.
- Romper o reinterpretar los datos ya guardados de agosto y septiembre.
- Requerir una migración de base de datos (el VPS aún no tiene el respaldo automático configurado).

## Restricciones (de CLAUDE.md y decisiones vigentes)

- La planilla real no entra al repo ni a bases de desarrollo; los tests usan una planilla ficticia.
- D6: importar nunca deshabilita socios. D7: no hay descargas. D12: Go Optic y Reintegro bono de
  invierno se ocultan (en el formato nuevo ya no vienen; los enum se mantienen por el historial).
- La auditoría no lleva datos personales.
- No inventar contenido institucional: los textos del 60/40 ya existen en `content/asociacion.ts` (`CUOTAS`).

## El formato nuevo (verificado sobre el archivo de octubre, solo estructura)

- Una hoja visible. Su nombre cambia cada mes, así que **se identifica por sus encabezados, no por su nombre**.
- Fila 1: títulos de grupo (se ignoran). **Fila 2: encabezados.** Datos desde la fila 3.
- **Una fila por socio** (antes venían dos, por tipo de cuota; ahora vienen unidas). 855 filas
  con RUT, sin RUT repetidos. Al final hay una fila de totales y otra con basura, ambas sin RUT
  numérico: se ignoran como hoy.
- Columnas, por encabezado normalizado (mayúsculas, espacios colapsados):

| Encabezado | Uso |
|---|---|
| NOMBRE, RUT, DV, FACULTAD | Igual que hoy (DV puede venir en minúscula o como número). |
| FECHA, MES | Periodo (año y mes). Un solo periodo por archivo. |
| TOTAL DESCUENTO AFUCHSCEN | Total de la fila, para validar. Aparece **dos veces** (cols. 7 y 50, con el mismo valor); se usa la primera. |
| TOTAL CUOTA SOCIAL 0,5% SUELDO BASE | Concepto CUOTA_SOCIAL (monto). Equivale al antiguo «CUOTA SOCIO». |
| CUOTA SOCIAL AFUCHSCEN 60% / CUOTA SOCIAL FENAFUCH 40% | Desglose de la cuota social. Traen decimales (714 filas). |
| FONDO SOLIDARIO 0,8% | FONDO_SOLIDARIO. |
| COOPEUCH ACCIONES | ACCIONES_COOPEUCH. |
| COOPEUCH PRESTAMOS | PRESTAMO_COOPEUCH. |
| COOPEUCH LIB. AHORRO | LIBRETA_AHORRO. |
| FUND.LOPEZ PEREZ. | SEGURO_ONCOLOGICO_FALP. |
| GAS05N, GAS11N, GAS15N, GAS45N | Desglose del gas por tipo de vale (5, 11, 15 y 45 kg), en pesos. |
| TOTAL COSTO VALES DE GAS | GAS_ABASTIBLE (monto). |
| TOTAL VALES DE GAS | Cantidad total de vales (se muestra). |
| Bloques de préstamo (ver abajo) | PRESTAMO_AFUCH y su desglose. |
| TOTAL DESC PRESTAMOS OCTUBRE (…) | Total de préstamos AFUCH de la fila; su encabezado cambia con el mes. |

- **Préstamos AFUCH:** vienen en bloques consecutivos de 4 columnas, uno por mes de otorgamiento
  (en octubre: SEPT, AGOSTO, JULIO y «MESES ANTERIORES»). Cada bloque es
  `FECHA PRESTAMO <x>`, `MONTO PRESTAMO <y>`, `CUOTAS PRESTAMO <y>`, `CUOTA DE <MES>`.
  Los nombres cambian cada mes y no son confiables (el bloque «MESES ANTERIORES» dice «MAYO» pero
  trae préstamos de abril y mayo), y «CUOTA DE OCTUBRE» se repite 4 veces. Por eso **los bloques
  se detectan por posición**: cada columna que empieza con `FECHA PRESTAMO` abre un bloque, y las
  tres siguientes deben empezar con `MONTO PRESTAMO`, `CUOTAS PRESTAMO` y `CUOTA DE`; si no, es
  un error de formato. La cantidad de bloques puede variar de un mes a otro.
  `CUOTAS` es texto `"n-m"` = cuota n de m (ej. `"2-3"`). Un bloque cuenta para la fila si su
  cuota del mes es distinta de 0.
- Verificado en octubre: en las 855 filas, TOTAL DESCUENTO AFUCHSCEN = cuota social 0,5 % + fondo
  solidario + 3 de Coopeuch + FALP + total gas + suma de cuotas de préstamos del mes. Además,
  60 % + 40 % = 0,5 % en todas las filas, y la suma de las cuotas de préstamo = total de préstamos.
  Los 4 tipos de gas suman el total de gas en 854 de las 855 filas.

## Enfoques considerados

1. **Reusar la columna JSON existente (elegido).** `LineaDescuento.detalleCuotas` (tipo `Json?`)
   pasa a llamarse `detalle` en Prisma con `@map("detalleCuotas")`, así que **la base no cambia**.
   Ahí se guarda el desglose de cada concepto. Sin migración, sin riesgo para los datos actuales,
   despliegue igual que hoy. El costo es que el nombre de la columna en la base queda antiguo.
2. Columna nueva con migración: nombres limpios, pero hay que leer dos columnas y la migración pide
   respaldo, que hoy no existe en el VPS.
3. Tablas nuevas (préstamos, gas): datos más estructurados, pero mucho más trabajo y una migración
   mayor para información que solo se muestra.

El usuario eligió el 1 porque evita la migración mientras el respaldo no esté configurado.

## Diseño

### Detalle por línea (contrato)

El JSON de `detalle` se valida con Zod al escribir y al leer (schema en `apps/web/src/server/`,
porque solo lo usa el servidor). Forma:

- **Formato antiguo (agosto y septiembre, ya guardado):** un arreglo `[{ cuota, total }]` en
  PRESTAMO_AFUCH. Se sigue leyendo y mostrando como hoy («cuota 2 de 3»).
- **Formato nuevo**, un objeto con discriminante `tipo`:
  - `{ tipo: 'cuotaSocial', afuchscen: number, fenafuch: number }`: pesos enteros. `afuchscen` =
    redondeo del 60 % y `fenafuch` = total − `afuchscen`, para que siempre sumen el monto de la línea.
  - `{ tipo: 'prestamosAfuch', prestamos: [{ fecha: 'AAAA-MM-DD' | null, montoPrestado: number, cuota: number, totalCuotas: number, montoCuota: number }] }`,
    en el orden de la planilla.
  - `{ tipo: 'gas', porTipo: [{ kilos: 5 | 11 | 15 | 45, monto: number }], vales: number | null }`:
    solo los tipos con monto distinto de 0.
- Un JSON que no calce con ninguna forma se ignora al leer (se muestra el monto sin detalle).

### Lectura de la planilla (`planilla.ts`, se reescribe)

- Busca, entre las hojas, la primera cuyas filas 1 a 5 contengan una fila con todos los encabezados
  obligatorios. Si ninguna calza: error «No se encontró la hoja de descuentos…», con la lista de
  columnas faltantes de la hoja más parecida. Si el archivo trae la hoja `ASOCIACI`, el error lo
  dice: «Es el formato antiguo de la planilla; AFUCH ahora entrega otro.»
- Encabezados obligatorios: NOMBRE, FECHA, MES, RUT, DV, FACULTAD, TOTAL DESCUENTO AFUCHSCEN, los
  de la cuota social (tres), los de cada concepto fijo, los 4 de gas, TOTAL COSTO VALES DE GAS,
  TOTAL VALES DE GAS y al menos un bloque de préstamo.
- Se mantienen las reglas actuales: fila sin RUT se ignora; DV inválido → advertencia y fila
  excluida; periodo único; montos no numéricos → error; decimales → se redondea con advertencia
  (**excepto** las columnas 60 %/40 %, que traen decimales siempre y se reparten como arriba, sin advertencia).
- **Monto de PRESTAMO_AFUCH** = suma de las cuotas del mes de sus bloques. La columna
  `TOTAL DESC PRESTAMOS …` (se busca por ese prefijo) es **opcional**: si está y no calza con la
  suma, advertencia; si falta, no pasa nada. Decisión de Claude: los bloques son la fuente con más
  detalle, y el total de la fila igual se valida contra TOTAL DESCUENTO AFUCHSCEN.
- **RUT repetido → error que bloquea la importación**, indicando las filas. Decisión de Claude: en
  el formato nuevo cada socio viene en una sola fila, así que un repetido es un error de la planilla,
  y sumar dos filas con desglose (60/40, préstamos, gas) sería adivinar.
- Validaciones nuevas, todas como **advertencia** (no bloquean, igual que hoy el MONTO):
  - TOTAL DESCUENTO AFUCHSCEN ≠ suma de conceptos de la fila.
  - Gas por tipo ≠ total de gas (se guarda el total; el desglose se guarda igual).
  - Cuotas de préstamo con texto que no es `n-m` válido (se guarda el préstamo sin cuota n de m).
- `SocioLeido.lineas[]` lleva `detalle` (la forma nueva) en vez de `detalleCuotas`.
- `ResultadoPlanilla` y el resumen (`totalPorConcepto`, `total`) no cambian de forma.

### Guardado y lectura

- `importacion.ts`: guarda `detalle` en vez de `detalleCuotas`. Nada más cambia.
- `descuentos.ts`: `LineaVisible` cambia `cuotas` por un `detalle` ya interpretado (forma antigua
  o nueva). Orden y conceptos ocultos (D12), sin cambios.
- `administracion.ts` (exportación del socio, derecho de acceso): exporta `detalle` en vez de `cuotas`.

### Lo que ve el socio («Mis descuentos»)

Bajo el nombre del concepto, en letra pequeña (como hoy las cuotas):

```
Cuota social                                    $7.134
   AFUCH Servicios Centrales (60%) $4.280 · FENAFUCH (40%) $2.854
Préstamo AFUCH                                 $40.000
   Préstamo del 12-09-2026 por $60.000: cuota 1 de 3, $20.000
   Préstamo del 05-08-2026 por $60.000: cuota 2 de 3, $20.000
Vales de gas Abastible                         $57.591
   11 kg: $19.197 · 15 kg: $38.394 (3 vales en total)
```

- Con un solo préstamo se muestra igual (una línea).
- Sin fecha de préstamo: «Préstamo por $60.000: cuota 1 de 3, $20.000».
- Los nombres de destino del 60/40 salen de `CUOTAS.cuotaSocial.reparto` (no se escriben a mano).
- El párrafo actual que explica el 60/40 se mantiene.
- Meses con formato antiguo: igual que hoy.

### Planilla ficticia y tests

- `fixtures/planilla-ficticia.ts` se reescribe al formato nuevo: fila 1 de títulos, fila 2 de
  encabezados (con «TOTAL DESCUENTO AFUCHSCEN» y «CUOTA DE <MES>» repetidos, como el real), una fila
  por socio, bloques de préstamo con fechas, fila de totales sin RUT al final y una hoja vecina que
  se debe ignorar. El nombre de la hoja sigue el patrón `Consolidado_<Mes>_<Año>`.
- `FilaFicticia` pierde `tipoCuota`/`cuotaInicial`/`cuotaTermino` y gana montos por concepto, gas
  por tipo y préstamos `{ fecha, monto, cuotas: 'n-m', cuotaMes }`.
- Se ajustan los que la usan: `base-de-prueba.ts` (sin Go Optic ni bono de invierno, que ya no
  vienen), `e2e/semilla.ts`, `scripts/cli.ts` (`planilla:ficticia`) y los tests de
  `planilla`, `importacion`, `descuentos`, `administracion`, `cuentas`, `correos-socios` y `rotacion-claves`.
- Se mantiene un test que comprueba que una línea guardada con el arreglo antiguo `[{cuota,total}]`
  se sigue mostrando como «cuota n de m».
- Tests nuevos del lector: hoja con otro nombre, encabezados en fila 2, bloques de préstamo
  variables (1 y 4 bloques), «CUOTA DE» repetido, 60/40 con decimales, cada advertencia nueva y el
  rechazo del formato antiguo.
- E2E: el socio de la semilla ve el desglose de cuota social, préstamo y gas.
- Verificación con el archivo real: correr la vista previa por la CLI
  (`pnpm cli planilla:importar <archivo>`, **sin** `--confirmar`, que solo lee) sobre `info/PLANILLA DESCUENTOS PAGINA WEB OCTUBRE2026.xlsx` y reportar **solo
  conteos y totales**, sin importar a ninguna base.

### Documentación

- Actualizar `docs/superpowers/plans/2026-09-23-plan-cierre-propuesta.md` §5.1 con una nota que
  apunte a este documento como el formato vigente, y el README/CLAUDE.md donde mencionen `ASOCIACI`.

## Lo que queda al criterio de quien lo construya

- Nombres de funciones y tipos, respetando las convenciones del repo (español).
- Cómo detectar la fila de encabezados dentro de las primeras filas.
- La redacción exacta de errores y advertencias.
- El diseño visual fino del desglose, dentro del patrón actual de la tabla.

## Decisiones tomadas en la conversación

- Formato nuevo único, sin compatibilidad con el antiguo (usuario).
- Opción B: mostrar el desglose al socio (usuario).
- Gas con desglose completo por tipo; se muestran montos por tipo y total de vales, no cantidades
  por tipo, porque la planilla no trae precios unitarios (usuario aprobó la propuesta).
- Sin migración, reusando la columna JSON (usuario).
- Préstamos identificados por su fecha, no por el título del bloque (propuesta aprobada).
- 60/40 redondeado al peso, con el total 0,5 % como monto de la línea (propuesta aprobada).
- Admin sin vistas nuevas: la vista previa sigue con totales por concepto y advertencias (confirmado por el usuario).
