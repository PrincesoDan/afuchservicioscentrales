# Planilla en el nuevo formato de AFUCH: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que el admin suba la planilla mensual en el formato nuevo de AFUCH y que el socio vea en «Mis descuentos» el desglose de cuota social (60/40), préstamos AFUCH y gas.

**Architecture:** Se reescribe el lector `apps/web/src/server/planilla.ts` (puro, sin base) para el formato nuevo. El desglose de cada línea se guarda en la columna JSON existente de `LineaDescuento`, renombrada a `detalle` solo en Prisma (`@map("detalleCuotas")`), así que no hay migración. Un módulo nuevo valida ese JSON con Zod e interpreta tanto la forma antigua (`[{cuota,total}]`) como la nueva.

**Tech Stack:** Next.js 15 (App Router), Prisma 7.10, ExcelJS, Zod, Vitest, Playwright. Todo en español.

**Spec:** `docs/superpowers/specs/2026-11-18-planilla-nuevo-formato-design.md` (léelo antes de empezar; trae la tabla de columnas del formato nuevo).

## Global Constraints

- La planilla real (`info/*.xlsx`) no entra al repo ni a bases de desarrollo, y su contenido no se imprime (solo conteos, números de fila y estructura). Los tests usan `crearPlanillaFicticia`.
- **Sin migración**: `packages/db/prisma/migrations/` no cambia. El único cambio de schema es el `@map`.
- No se ejecuta `prisma migrate reset` ni nada que borre bases.
- D6: importar nunca deshabilita socios. D12: OPTICA_GO_OPTIC y REINTEGRO_BONO_INVIERNO se ocultan al socio. Los enum se mantienen.
- Auditoría sin datos personales. Los mensajes de error y advertencia del lector **no incluyen RUT ni nombres** (solo número de fila, encabezados y montos).
- Los nombres de destino del 60/40 salen de `CUOTAS.cuotaSocial.reparto` (`apps/web/src/content/asociacion.ts`), no se escriben a mano.
- Código, nombres y commits en español; TypeScript estricto sin `any`; Prettier (comillas simples, coma final, 100 columnas).
- Antes de cerrar: `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build` y `pnpm e2e`. Postgres de desarrollo: `docker compose -f infra/docker-compose.dev.yml up -d`.

## Review Focus

1. **Un mes con más o menos bloques de préstamo** (p. ej. noviembre con 5 bloques, o solo 1): se espera que el lector los detecte por posición sin cambiar código. Test en Task 3: `lee 1 bloque y 4 bloques de préstamo`.
2. **«CUOTA DE <MES>» repetido y «TOTAL DESCUENTO AFUCHSCEN» repetido** en los encabezados: el mapa de encabezados no debe tomar la columna equivocada. Test en Task 3: la planilla ficticia los repite siempre, y el test de montos lo cubre.
3. **El admin sube por error una planilla antigua** (hoja `ASOCIACI`): se espera un error que lo diga claramente, no «faltan columnas». Test en Task 3: `rechaza el formato antiguo`.
4. **Meses antiguos ya guardados** (agosto y septiembre, detalle `[{cuota,total}]`): se siguen viendo como «Préstamo 1: cuota 1 de 3 · …». Test en Task 1 (`interpretarDetalle`) y Task 4 (`detallePeriodo` con línea antigua insertada a mano).
5. **Celdas de fecha de préstamo como fecha de Excel, vacías o como texto**: fecha `null` y se muestra «Préstamo por $…». Test en Task 3: `préstamo sin fecha`.

---

### Task 1: Detalle de línea (contrato) y renombre en Prisma

**Files:**
- Create: `apps/web/src/lib/detalle-descuento.ts` (lógica pura con Zod, sin `server-only`: también la usa la página; el spec lo ubicaba en `server/`)
- Test: `apps/web/src/lib/detalle-descuento.test.ts`
- Modify: `packages/db/prisma/schema.prisma:104-105`
- Modify: `apps/web/src/server/importacion.ts:79`, `apps/web/src/server/descuentos.ts`, `apps/web/src/server/administracion.ts:201`, `apps/web/src/server/planilla.ts` (solo el nombre del campo), `apps/web/src/app/socios/(privado)/descuentos/page.tsx` (solo adaptar al nuevo `LineaVisible`), y los tests que leen `detalleCuotas` (`importacion.test.ts`)

**Interfaces:**
- Produces (en `apps/web/src/lib/detalle-descuento.ts`):
  ```ts
  export type PrestamoDetalle = {
    fecha: string | null;          // 'AAAA-MM-DD'
    montoPrestado: number;
    cuota: number | null;          // null si «n-m» no se pudo interpretar
    totalCuotas: number | null;
    montoCuota: number;
  };
  export type DetalleDescuento =
    | { tipo: 'cuotaSocial'; afuchscen: number; fenafuch: number }
    | { tipo: 'prestamosAfuch'; prestamos: PrestamoDetalle[] }
    | { tipo: 'gas'; porTipo: { kilos: 5 | 11 | 15 | 45; monto: number }[]; vales: number | null };
  /** Lo que la vista recibe: la forma nueva, o la antigua de agosto/septiembre. */
  export type DetalleInterpretado =
    | DetalleDescuento
    | { tipo: 'cuotasAntiguas'; cuotas: { cuota: number; total: number }[] };
  export const detalleDescuentoSchema: z.ZodType<DetalleDescuento>;
  export function interpretarDetalle(valor: unknown): DetalleInterpretado | null;
  ```
- Produces (en `descuentos.ts`): `LineaVisible = { concepto; nombre; monto; detalle: DetalleInterpretado | null }` (reemplaza `cuotas`).
- Produces (Prisma): el campo `LineaDescuento.detalle` (`Json?`) mapeado a la columna `detalleCuotas`.

- [ ] **Step 1: Escribir los tests de `interpretarDetalle`** (unitarios, sin base):
  - `[{ cuota: 1, total: 3 }, { cuota: 2, total: 3 }]` → `{ tipo: 'cuotasAntiguas', cuotas: [...] }`.
  - `{ tipo: 'cuotaSocial', afuchscen: 2558, fenafuch: 1705 }` → el mismo objeto.
  - `{ tipo: 'prestamosAfuch', prestamos: [{ fecha: '2026-07-12', montoPrestado: 60000, cuota: 1, totalCuotas: 3, montoCuota: 20000 }] }` → el mismo objeto.
  - `{ tipo: 'gas', porTipo: [{ kilos: 11, monto: 19197 }], vales: 1 }` → el mismo objeto.
  - `null`, `undefined`, `'x'`, `{ tipo: 'otro' }`, `[{ cuota: 'a' }]` → `null`.
- [ ] **Step 2: Correr y ver que fallan.** `cd apps/web && pnpm exec vitest run src/lib/detalle-descuento.test.ts` → FAIL (módulo no existe).
- [ ] **Step 3: Implementar `detalle-descuento.ts`** con Zod (`z.discriminatedUnion('tipo', …)` para la forma nueva y un `z.array` aparte para la antigua; montos `z.number().int()`).
- [ ] **Step 4: Correr y ver que pasan.**
- [ ] **Step 5: Renombrar en Prisma.** En `schema.prisma` cambia la línea por
  `detalle Json? @map("detalleCuotas")` con el comentario `/// Desglose de la línea (ver apps/web/src/lib/detalle-descuento.ts). La columna conserva el nombre antiguo para no migrar.`
  Luego `pnpm --filter @afuch/db build`.
- [ ] **Step 6: Comprobar que no hay migración.**
  Run: `cd packages/db && DATABASE_URL=<la de apps/web/.env> pnpm exec prisma migrate diff --from-migrations prisma/migrations --to-schema prisma/schema.prisma --script`
  Expected: una migración vacía (`-- This is an empty migration.`). Si los flags de Prisma 7 difieren, usa `prisma migrate diff --help`; el resultado esperado es el mismo. **No crees ninguna migración.**
- [ ] **Step 7: Adaptar los usos del campo.** `importacion.ts` escribe `detalle: l.detalle ?? undefined`; en `planilla.ts` renombra `LineaLeida.detalleCuotas` a `detalle`, tipado por ahora como `DetalleDescuento | CuotaPrestamo[]` porque el lector antiguo aún produce `[{cuota,total}]` (Task 3 lo deja en `DetalleDescuento`). `descuentos.ts` usa `interpretarDetalle(l.detalle)`. `administracion.ts` exporta `detalle: l.detalle` en vez de `cuotas`. La página de descuentos muestra las cuotas cuando `detalle?.tipo === 'cuotasAntiguas'` (mismo texto que hoy). En `importacion.test.ts`, `prestamo.detalleCuotas` → `prestamo.detalle`.
- [ ] **Step 8: Verificar.** `pnpm typecheck && pnpm test` → todo en verde (incluye el e2e de texto «Préstamo 1: cuota 1 de 3 · Préstamo 2: cuota 2 de 3» si corres `pnpm e2e`).
- [ ] **Step 9: Commit.** `git commit -m "Descuentos: detalle de línea validado y campo detalle sin migración"`

---

### Task 2: Planilla ficticia en el formato nuevo

**Files:**
- Modify (reescritura): `apps/web/src/server/fixtures/planilla-ficticia.ts` (mantén `rutFicticio`, `crearListaCorreosFicticia` y `FilaCorreoFicticia` sin cambios)
- Test: `apps/web/src/server/fixtures/planilla-ficticia.test.ts` (nuevo)

**Interfaces:**
- Produces:
  ```ts
  export type PrestamoFicticio = {
    bloque: number;               // índice en `bloquesPrestamo`
    fecha: string | null;         // 'AAAA-MM-DD'; se escribe como Date de Excel
    monto: number;
    cuotas: string;               // texto «n-m» tal cual (puede ser inválido para probar advertencias)
    cuotaMes: number;
  };
  export type FilaFicticia = {
    nombre: string;
    cuerpoRut: string;
    facultad: string;
    cuotaSocial?: number;         // el 60 % y 40 % se escriben con decimales: cuotaSocial*0.6 y *0.4
    fondoSolidario?: number;
    accionesCoopeuch?: number;
    prestamoCoopeuch?: number;
    libretaAhorro?: number;
    falp?: number;
    gas?: Partial<Record<5 | 11 | 15 | 45, number>>;
    totalGas?: number;            // por defecto, la suma de `gas`
    valesGas?: number;
    prestamos?: PrestamoFicticio[];
    totalForzado?: number;        // por defecto, la suma de conceptos
    dvForzado?: string;
  };
  export const FILAS_EJEMPLO: FilaFicticia[];
  export function encabezadosPlanilla(mes: number, bloquesPrestamo: readonly string[]): string[];
  export async function crearPlanillaFicticia(opciones?: {
    filas?: FilaFicticia[];
    anio?: number;                // 2026
    mes?: number;                 // 8 (los e2e esperan «agosto 2026»)
    nombreHoja?: string;          // `Consolidado_${NombreMes}_${anio}`, p. ej. «Consolidado_Agosto_2026»
    bloquesPrestamo?: readonly string[]; // ['SEPT', 'AGOSTO', 'JULIO', 'MESES ANTERIORES']
    omitirColumnas?: readonly string[];  // encabezados normalizados a quitar, para probar errores
    formatoAntiguo?: boolean;     // true: solo una hoja «ASOCIACI» con los encabezados antiguos
  }): Promise<Buffer>;
  ```
- Estructura del libro (reproduce el real, ver la tabla del spec): una hoja vecina «RENUNCIA» que se ignora; en la hoja de descuentos, fila 1 con títulos de grupo, **fila 2 con encabezados**, una fila por socio desde la fila 3, al final una fila de totales con `'TOTALES'` en NOMBRE y sin RUT. Orden de columnas: `NOMBRE, FECHA, MES, RUT, DV, (sin encabezado), TOTAL DESCUENTO AFUCHSCEN, SESENTA, TIP_CUO (1+2), INGRESO, SEXO, ASOCIAC, FACULTAD, TOTAL CUOTA SOCIAL 0,5% SUELDO BASE, CUOTA SOCIAL AFUCHSCEN 60%, CUOTA SOCIAL FENAFUCH 40%, FONDO  SOLIDARIO 0,8%` (con doble espacio, como el real) `, COOPEUCH ACCIONES, COOPEUCH PRESTAMOS, COOPEUCH LIB. AHORRO, FUND.LOPEZ PEREZ., GRADO, DESCRIPCION, anterior, GAS05N, GAS11N, GAS15N, GAS45N, TOTAL COSTO VALES DE GAS, total vales de gas, fecha asignacion`, luego por cada bloque `b` y su etiqueta `x`: `FECHA PRESTAMO x, MONTO PRESTAMO x, CUOTAS PRESTAMO x, CUOTA DE <MES EN MAYÚSCULAS>`, y al final `TOTAL DESC PRESTAMOS <MES> (…)`, `TOTAL EXTRA AFSC (…)`, `TOTAL DESCUENTO AFUCHSCEN` (repetido). FECHA = año (número), MES = número.
- `FILAS_EJEMPLO` (los demás tests cuentan con estos valores):
  1. `PRUEBA UNO SOCIA`, `11111111`, `FACULTAD DE ARTES`: cuotaSocial 4263, fondoSolidario 6794, gas `{ 11: 19197, 15: 23909 }`, valesGas 2, prestamos `[{ bloque: 0, fecha: '2026-07-12', monto: 60000, cuotas: '1-3', cuotaMes: 20000 }, { bloque: 1, fecha: '2026-06-05', monto: 60000, cuotas: '2-3', cuotaMes: 20000 }]`. Total 94163.
  2. `PRUEBA DOS SOCIO ` (con espacio final), `12222222`, `FACULTAD DE DERECHO`: cuotaSocial 3565, fondoSolidario 5382, falp 9900, accionesCoopeuch 3680. Total 22527.
  3. `PRUEBA TRES SIN DESCUENTOS`, `13333333`, `FACULTAD DE CIENCIAS`: sin montos. Total 0.

- [ ] **Step 1: Tests de la planilla ficticia** (leyendo el buffer con ExcelJS, sin el lector):
  - `hoja de descuentos con encabezados en la fila 2`: `worksheets[1].name === 'Consolidado_Agosto_2026'`, fila 2 incluye `'TOTAL DESCUENTO AFUCHSCEN'` dos veces y `'CUOTA DE AGOSTO'` cuatro veces.
  - `una fila por socio y fila de totales sin RUT`: filas 3..5 con RUT 11111111, 12222222, 13333333; fila 6 con `'TOTALES'` y RUT vacío.
  - `escribe el 60/40 con decimales y el total de la fila`: fila 3 tiene `2557.8` en «CUOTA SOCIAL AFUCHSCEN 60%» y `94163` en la primera «TOTAL DESCUENTO AFUCHSCEN».
  - `formatoAntiguo: true` produce una hoja `ASOCIACI` con `NOMBRE` en la fila 1.
- [ ] **Step 2: Correr y ver que fallan.** `cd apps/web && pnpm exec vitest run src/server/fixtures/planilla-ficticia.test.ts`
- [ ] **Step 3: Reescribir `planilla-ficticia.ts`** según la interfaz y la estructura de arriba. Las fechas de préstamo van como `new Date('AAAA-MM-DDT00:00:00Z')`.
- [ ] **Step 4: Correr y ver que pasan.** (El resto de la suite queda rota hasta el Task 3; no hagas commit todavía.)

> Tasks 2 y 3 van en **un solo commit** al final del Task 3: la planilla ficticia y el lector cambian de formato juntos y la suite no queda verde entre medio.

---

### Task 3: Lector del formato nuevo y sus consumidores

**Files:**
- Modify (reescritura): `apps/web/src/server/planilla.ts`
- Modify (reescritura): `apps/web/src/server/planilla.test.ts`
- Modify: `apps/web/src/server/base-de-prueba.ts:96-118` (`filasDe`), `apps/web/src/server/descuentos.test.ts`, `apps/web/src/server/importacion.test.ts`, `apps/web/src/server/administracion.test.ts`, `apps/web/src/server/cuentas.test.ts`, `apps/web/src/server/correos-socios.test.ts`, `apps/web/src/server/rotacion-claves.test.ts`, `apps/web/e2e/semilla.ts` (solo si algo deja de calzar)

**Interfaces:**
- Consumes: `DetalleDescuento` (Task 1), `crearPlanillaFicticia`/`FILAS_EJEMPLO`/`PrestamoFicticio` (Task 2).
- Produces (forma pública que no cambia, salvo `detalle`):
  ```ts
  export type LineaLeida = { concepto: ConceptoDescuento; monto: number; detalle?: DetalleDescuento };
  export type SocioLeido = { rut: string; nombre: string; facultad: string | null; lineas: LineaLeida[] };
  export type ResultadoPlanilla = { periodo; socios; errores; advertencias; resumen: { filasLeidas; totalPorConcepto; total } }; // igual que hoy
  export async function leerPlanilla(archivo: ArrayBuffer | Buffer): Promise<ResultadoPlanilla>;
  export function interpretarCuotaPrestamo(texto: string): { cuota: number; total: number } | null; // «2-3» → {2,3}; «957», «4-3», «a-b», «» → null
  // Se mantienen exportados: normalizarEncabezado, valor, texto (los usa base-de-prueba.ts y correos-socios.ts).
  ```
  `interpretarCuotas`, `HOJA_SOCIOS` y `COLUMNAS_CONCEPTO` desaparecen; si algo fuera de los tests los importa, adáptalo.
- Columnas fijas → concepto (encabezados ya normalizados con `normalizarEncabezado`, que colapsa espacios):
  `TOTAL CUOTA SOCIAL 0,5% SUELDO BASE`→CUOTA_SOCIAL, `FONDO SOLIDARIO 0,8%`→FONDO_SOLIDARIO, `COOPEUCH ACCIONES`→ACCIONES_COOPEUCH, `COOPEUCH PRESTAMOS`→PRESTAMO_COOPEUCH, `COOPEUCH LIB. AHORRO`→LIBRETA_AHORRO, `FUND.LOPEZ PEREZ.`→SEGURO_ONCOLOGICO_FALP, `TOTAL COSTO VALES DE GAS`→GAS_ABASTIBLE. Gas por tipo: `GAS05N`→5, `GAS11N`→11, `GAS15N`→15, `GAS45N`→45. Otros obligatorios: `NOMBRE, FECHA, MES, RUT, DV, FACULTAD, TOTAL DESCUENTO AFUCHSCEN, CUOTA SOCIAL AFUCHSCEN 60%, CUOTA SOCIAL FENAFUCH 40%, TOTAL VALES DE GAS`. Si un encabezado se repite, vale la primera aparición.
- Reglas (las del spec, con estos textos exactos):
  - Hoja: la primera cuyas filas 1–5 tengan una fila con `NOMBRE`, `RUT` y `TOTAL DESCUENTO AFUCHSCEN`. Si ninguna y existe una hoja `ASOCIACI`: error `Es el formato antiguo de la planilla. AFUCH ahora entrega la «PLANILLA DESCUENTOS PAGINA WEB»; sube esa.` Si ninguna: `No se encontró la hoja de descuentos (una fila con las columnas NOMBRE, RUT y TOTAL DESCUENTO AFUCHSCEN).`
  - Faltan obligatorios: `Faltan columnas en la fila <n> de "<hoja>": <lista>.` Sin bloques de préstamo: `No se encontraron las columnas de préstamos AFUCH (FECHA PRESTAMO…).` Bloque incompleto (las 3 columnas siguientes a `FECHA PRESTAMO…` no empiezan con `MONTO PRESTAMO`, `CUOTAS PRESTAMO`, `CUOTA DE`): `Las columnas del préstamo que empieza en la columna <letra> no siguen el orden FECHA, MONTO, CUOTAS, CUOTA DEL MES.`
  - Fila sin RUT numérico o texto vacío: se ignora. DV inválido: advertencia actual (mismo texto) y fila excluida. Periodo inválido o mezclado: errores actuales. Sin socios: `La hoja "<hoja>" no tiene filas con RUT.`
  - RUT repetido: error `RUT repetido en las filas <a> y <b>.` (sin el RUT).
  - Montos no numéricos: error `Fila <n>: "<encabezado>" no es un número.` Decimales: redondeo + advertencia actual, **salvo** las columnas 60 % y 40 %, que no advierten.
  - Línea CUOTA_SOCIAL (si monto ≠ 0): `detalle = { tipo: 'cuotaSocial', afuchscen: Math.round(col60), fenafuch: monto - Math.round(col60) }`.
  - Línea GAS_ABASTIBLE (si total ≠ 0): monto = total de gas; `detalle = { tipo: 'gas', porTipo: tipos con monto ≠ 0 en orden 5,11,15,45, vales: TOTAL VALES DE GAS si > 0, si no null }`. Si la suma por tipo ≠ total: advertencia `Fila <n>: los vales de gas por tipo (<suma>) no suman el total de gas (<total>).`
  - Línea PRESTAMO_AFUCH: un bloque cuenta si su cuota del mes ≠ 0. Monto = suma de esas cuotas. `detalle.prestamos` en orden de bloques: `fecha` (celda Date → `toISOString().slice(0,10)`; otra cosa → null), `montoPrestado`, `cuota`/`totalCuotas` de `interpretarCuotaPrestamo` (si da null: ambos null y advertencia `Fila <n>: las cuotas del préstamo «<texto>» no se pudieron interpretar; se muestra sin cuota n de m.`), `montoCuota`. Si existe una columna que empieza con `TOTAL DESC PRESTAMOS` y su valor ≠ suma: advertencia `Fila <n>: el total de préstamos AFUCH (<x>) no coincide con la suma de sus cuotas (<y>).`
  - Total de la fila: si `TOTAL DESCUENTO AFUCHSCEN` ≠ suma de los montos de todas las líneas de la fila: advertencia `Fila <n>: TOTAL DESCUENTO AFUCHSCEN (<x>) no coincide con la suma de conceptos (<y>).`
  - `resumen.filasLeidas` cuenta las filas con RUT (incluidas las excluidas por DV, como hoy).

- [ ] **Step 1: Reescribir `planilla.test.ts`** con estos tests (valores de `FILAS_EJEMPLO`):
  - `interpretarCuotaPrestamo`: `'2-3'`→`{cuota:2,total:3}`, `' 6 - 10 '`→`{6,10}`; `'957'`, `'4-3'`, `'0-3'`, `'a-b'`, `''` → null.
  - `lee socios, periodo y desglose`: sin errores ni advertencias; periodo `{anio:2026, mes:8}`; `filasLeidas` 3; 3 socios; la socia 11111111 tiene exactamente:
    `[{ concepto:'CUOTA_SOCIAL', monto:4263, detalle:{ tipo:'cuotaSocial', afuchscen:2558, fenafuch:1705 } }, { concepto:'FONDO_SOLIDARIO', monto:6794 }, { concepto:'GAS_ABASTIBLE', monto:43106, detalle:{ tipo:'gas', porTipo:[{kilos:11,monto:19197},{kilos:15,monto:23909}], vales:2 } }, { concepto:'PRESTAMO_AFUCH', monto:40000, detalle:{ tipo:'prestamosAfuch', prestamos:[{ fecha:'2026-07-12', montoPrestado:60000, cuota:1, totalCuotas:3, montoCuota:20000 }, { fecha:'2026-06-05', montoPrestado:60000, cuota:2, totalCuotas:3, montoCuota:20000 }] } }]`.
  - `recorta espacios del nombre` (12222222 → `'PRUEBA DOS SOCIO'`) e `incluye a socios sin descuentos` (13333333 con `lineas: []`).
  - `calcula totales por concepto`: `CUOTA_SOCIAL` = 4263+3565; `total` = 94163+22527.
  - `encuentra la hoja aunque cambie de nombre`: `nombreHoja: 'Consolidado_Noviembre_2026'` → sin errores.
  - `lee 1 bloque y 4 bloques de préstamo`: con `bloquesPrestamo: ['OCTUBRE']` y un préstamo en el bloque 0 → un préstamo; con el valor por defecto y préstamos en los bloques 0 y 3 → dos préstamos, en ese orden.
  - `préstamo sin fecha`: `fecha: null` → `fecha: null` en el detalle, sin advertencias.
  - `advierte cuotas de préstamo ilegibles sin bloquear`: `cuotas: '957'` → sin errores, 1 advertencia, préstamo con `cuota: null, totalCuotas: null` y el monto igual.
  - `advierte cuando el total de la fila no cuadra`: `totalForzado: 1` → 1 advertencia que contiene `TOTAL DESCUENTO AFUCHSCEN (1)`.
  - `advierte cuando el gas por tipo no suma el total`: `gas: {11: 19197}, totalGas: 20000` → advertencia de gas; línea con monto 20000. (Con `totalForzado` coherente para no sumar una segunda advertencia.)
  - `excluye y advierte filas con DV inválido`: una fila con `dvForzado: '9'` → errores `['La hoja "Consolidado_Agosto_2026" no tiene filas con RUT.']`, advertencia `Fila 3: RUT con dígito verificador inválido; fila excluida (pedir corrección a AFUCH).`
  - `bloquea RUT repetido`: dos filas con `11111111` → error `RUT repetido en las filas 3 y 4.`
  - `falla si falta una columna`: `omitirColumnas: ['GAS11N']` → el primer error contiene `GAS11N`.
  - `rechaza el formato antiguo`: `formatoAntiguo: true` → error `Es el formato antiguo de la planilla. …` (texto completo de arriba).
  - `falla con un archivo que no es Excel` (igual que hoy).
- [ ] **Step 2: Correr y ver que fallan.** `cd apps/web && pnpm exec vitest run src/server/planilla.test.ts`
- [ ] **Step 3: Reescribir `planilla.ts`** según las reglas. Lee los encabezados como arreglo `(columna, encabezado normalizado)` en orden (no solo un `Map`) para detectar los bloques de préstamo por posición; el `Map` de primera aparición sirve para las columnas fijas. Mantén el comentario del porqué de la regla del DV.
- [ ] **Step 4: Correr y ver que pasan.**
- [ ] **Step 5: Adaptar consumidores.**
  - `base-de-prueba.ts` `filasDe`: una fila por persona con `cuotaSocial: 4000 + indice*250`, `fondoSolidario: 6500 + indice*300`, `gas: { 15: 18000 + extra }`, `valesGas: 1`; pares con `prestamos: [{ bloque: 0, fecha: '2026-07-01', monto: 60000, cuotas: `${mes === 9 ? 2 : 1}-3`, cuotaMes: 20000 }]`, impares con `falp: 9900`. Ya no lleva Go Optic ni bono de invierno.
  - `descuentos.test.ts` (D12): importa una planilla con `cuotaSocial: 4000` y `gas: {15: 20000}`, y luego **inserta a mano** con `db().lineaDescuento.createMany` una línea OPTICA_GO_OPTIC (15000) y una REINTEGRO_BONO_INVIERNO (30000) en ese periodo y socio. Mismas expectativas que hoy (total 24000, conceptos `['CUOTA_SOCIAL', 'GAS_ABASTIBLE']`, 2 ocultas en la base). Agrega `muestra las cuotas de una línea antigua`: inserta una línea PRESTAMO_AFUCH con `detalle: [{ cuota: 1, total: 3 }]` → `detallePeriodo` la devuelve con `detalle: { tipo: 'cuotasAntiguas', cuotas: [{ cuota: 1, total: 3 }] }`.
  - `importacion.test.ts`: las líneas pasan de 8 a 8 (4 + 4: socia 1 con cuota, fondo, gas, préstamo; socio 2 con cuota, fondo, falp, acciones). El préstamo guardado ahora tiene `detalle` con `tipo: 'prestamosAfuch'` y dos préstamos.
  - El resto (`administracion`, `cuentas`, `correos-socios`, `rotacion-claves`, `e2e/semilla.ts`): ajusta solo lo que use `tipoCuota`, `montos`, `cuotaInicial`/`cuotaTermino` o los conteos que cambien.
- [ ] **Step 6: Verificar.** `pnpm typecheck && pnpm test` → verde.
- [ ] **Step 7: Commit** (incluye el Task 2). `git commit -m "Planilla: lector del nuevo formato de AFUCH con desglose de cuota social, préstamos y gas"`

---

### Task 4: «Mis descuentos» muestra el desglose

**Files:**
- Create: `apps/web/src/components/socios/detalle-descuento.tsx`
- Modify: `apps/web/src/lib/detalle-descuento.ts` y su test (agrega `lineasDeDetalle`)
- Modify: `apps/web/src/app/socios/(privado)/descuentos/page.tsx`
- Modify: `apps/web/e2e/socios.spec.ts:36-40`

**Interfaces:**
- Consumes: `DetalleInterpretado` (Task 1, en `apps/web/src/lib/detalle-descuento.ts`).
- Produces: `export function lineasDeDetalle(detalle: DetalleInterpretado, reparto: readonly { destino: string; parte: string }[]): string[]` — los textos a mostrar bajo el concepto, uno por renglón.

- [ ] **Step 1: Tests de `lineasDeDetalle`** con `reparto = CUOTAS.cuotaSocial.reparto`:
  - cuota social `{2558, 1705}` → `['AFUCH Servicios Centrales (60%) $2.558 · FENAFUCH (40%) $1.705']`.
  - préstamos (los dos de `FILAS_EJEMPLO`) → `['Préstamo del 12-07-2026 por $60.000: cuota 1 de 3, $20.000', 'Préstamo del 05-06-2026 por $60.000: cuota 2 de 3, $20.000']`.
  - préstamo sin fecha y sin cuotas `{ fecha: null, montoPrestado: 60000, cuota: null, totalCuotas: null, montoCuota: 20000 }` → `['Préstamo por $60.000: $20.000']`.
  - gas `{ porTipo: [{11,19197},{15,23909}], vales: 2 }` → `['11 kg: $19.197 · 15 kg: $23.909 (2 vales en total)']`; con `vales: 1` → `'(1 vale en total)'`; con `vales: null` → sin paréntesis.
  - cuotas antiguas `[{1,3},{2,3}]` → `['Préstamo 1: cuota 1 de 3 · Préstamo 2: cuota 2 de 3']`; una sola → `['cuota 1 de 3']` (el texto de hoy).
- [ ] **Step 2: Correr y ver que fallan.** `cd apps/web && pnpm exec vitest run src/lib/detalle-descuento.test.ts`
- [ ] **Step 3: Implementar `lineasDeDetalle`** con `formatearClp` (`@/lib/convenios`). La fecha `AAAA-MM-DD` se da vuelta con `split('-')`, sin `Date`.
- [ ] **Step 4: Correr y ver que pasan.**
- [ ] **Step 5: Componente y página.** `DetalleDescuento({ detalle })` renderiza cada texto de `lineasDeDetalle(detalle, CUOTAS.cuotaSocial.reparto)` como `<span className="mt-1 block text-xs font-normal text-slate-500">`, dentro del `<th>` del concepto (mismo estilo que hoy). La página reemplaza el bloque de cuotas por `{linea.detalle ? <DetalleDescuento detalle={linea.detalle} /> : null}`.
- [ ] **Step 6: E2E.** En `socios.spec.ts`, reemplaza la expectativa de cuotas por:
  `tabla.getByText('AFUCH Servicios Centrales (60%) $2.558 · FENAFUCH (40%) $1.705')`, `tabla.getByText('Préstamo del 12-07-2026 por $60.000: cuota 1 de 3, $20.000')`, `tabla.getByText('11 kg: $19.197 · 15 kg: $23.909 (2 vales en total)')`, todas visibles, y el total `'$94.163'`. El socio del e2e es `PRUEBA UNO SOCIA` (RUT `11111111`): su total actual en el e2e, $75.249, es la suma de su fila en la planilla ficticia de hoy.
- [ ] **Step 7: Verificar.** `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm e2e` → todo en verde.
- [ ] **Step 8: Commit.** `git commit -m "Mis descuentos: desglose de cuota social, préstamos AFUCH y gas"`

---

### Task 5: Verificación con la planilla real y documentación

**Files:**
- Modify: `docs/superpowers/plans/2026-09-23-plan-cierre-propuesta.md` (§5.1: nota al inicio que apunta al spec nuevo como formato vigente)
- Modify: `README.md` y `CLAUDE.md` donde mencionen la hoja `ASOCIACI` (en CLAUDE.md: «`planilla.ts` lee la hoja de descuentos del formato nuevo (encabezados en la fila 2; ver spec 2026-11-18)»)

- [ ] **Step 1: Vista previa del archivo real, sin importar.**
  Run: `cd apps/web && pnpm cli planilla:importar "../../info/PLANILLA DESCUENTOS PAGINA WEB OCTUBRE2026.xlsx" 2>&1 | grep -v '^ADVERTENCIA' ; pnpm cli planilla:importar "../../info/PLANILLA DESCUENTOS PAGINA WEB OCTUBRE2026.xlsx" 2>&1 | grep -c '^ADVERTENCIA'`
  **Sin `--confirmar`.** Expected: `Periodo: 10/2026`, `Filas: 855`, `Socios` = 855 menos las filas con DV inválido (cada una deja su advertencia), ningún `ERROR`, y pocas advertencias (se espera al menos la del gas por tipo en una fila). Informa solo esos conteos y totales; no pegues advertencias que contengan montos individuales.
- [ ] **Step 2: Documentación** (los tres archivos de arriba).
- [ ] **Step 3: Verificación final.** `pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build`.
- [ ] **Step 4: Commit.** `git commit -m "Docs: la planilla de descuentos usa el formato nuevo de AFUCH"`
