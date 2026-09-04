# Sitio AFUCH Servicios Centrales — Fase 1: sitio público

**Fecha:** 2026-09-04
**Estado:** aprobado (diseño)
**Alcance:** Fase 1 — sitio público completo. El área privada de socios es Fase 2.

---

## 1. Contexto

AFUCH Servicios Centrales necesita presencia digital con dos funciones: una cara
pública que comunique quiénes son y difunda convenios y noticias, y un espacio
privado donde cada socio consulte sus descuentos y la rendición de cuentas.

Este spec cubre **solo la cara pública**. El área privada queda reservada en la
navegación (`/socios`, placeholder) para que la promesa sea visible desde el
primer entregable, pero no se implementa aquí.

Fuente de requisitos: `info/Propuesta-AFUCH-Sitio-Web-La-Palanca-1.pdf`
(sección 2.1) y `info/BENEFICIOS AFUCH.pdf`.

### Decisiones ya tomadas

| Decisión | Resuelto |
|---|---|
| Alcance F1 | Sitio público completo (5 páginas + legales + placeholder socios) |
| Tipografía | Inter Variable, con stack Helvetica/Arial de respaldo |
| Stack | Next.js + NestJS, pnpm workspaces + Turborepo |
| Backend F1 | Scaffold + endpoint de contacto. Sin base de datos. |
| Convenios FENAFUCH | Se publican como convenios de AFUCH, sin distinguir origen |
| Acento dorado | Aprobado |

---

## 2. Arquitectura

### 2.1 Estructura del monorepo

```
afuchservicioscentrales/
├── apps/
│   ├── web/                    # Next.js 15 · App Router · TS · Tailwind 4
│   │   ├── src/
│   │   │   ├── app/            # rutas
│   │   │   ├── components/     # componentes de UI
│   │   │   ├── content/        # datos tipados: convenios, noticias, sede
│   │   │   └── lib/            # utilidades (formato CLP, filtros, fetch)
│   │   └── public/             # logos SVG, OG images, estatutos
│   └── api/                    # NestJS 11 · TS
│       └── src/
│           ├── contact/        # único módulo con lógica en F1
│           └── health/
├── packages/
│   ├── contracts/              # Zod schemas + tipos compartidos + validarRut
│   └── tsconfig/               # configuración TS base
├── info/                       # material fuente entregado por AFUCH
├── docs/superpowers/specs/
├── pnpm-workspace.yaml
├── turbo.json
└── docker-compose.yml          # Postgres, disponible pero sin uso en F1
```

**No hay `packages/ui`.** Con un solo frontend, un paquete de componentes
compartidos es abstracción prematura. Los componentes viven en
`apps/web/src/components/`. Si el área privada de F2 justifica separarlos, se
separan entonces.

**`packages/contracts` sí se justifica desde F1:** el schema del formulario de
contacto lo valida el navegador y lo revalida el servidor. Una sola definición,
sin riesgo de que las dos validaciones se separen con el tiempo.

### 2.2 Límites entre unidades

| Unidad | Qué hace | De qué depende |
|---|---|---|
| `packages/contracts` | Define schemas Zod, tipos derivados y `validarRut`. Cero I/O, cero dependencias de framework. | Solo `zod` |
| `apps/web` | Renderiza el sitio público. Lee contenido local; envía el formulario al API. | `contracts` |
| `apps/api` | Recibe, revalida y despacha el mensaje de contacto por correo. | `contracts` |

`contracts` no importa nada de `web` ni de `api`. Esa dirección única es lo que
permite cambiar el origen de los datos en F2 sin tocar las vistas.

### 2.3 Flujo de datos en F1

- **Contenido (convenios, noticias, sede):** archivos TS en
  `apps/web/src/content/`, validados en tiempo de build contra los schemas de
  `contracts`. Se renderiza estático.
- **Formulario de contacto:** navegador → `POST /api/contact` → validación →
  correo. Sin persistencia.

En F2 el contenido pasa a servirse desde el API. Como los datos ya cumplen el
mismo schema, migrar significa cambiar el origen, no reescribir componentes.

---

## 3. Sistema de diseño

### 3.1 Color

Azul institucional extraído del logo original: **`#00205C`**.

| Token | Valor | Uso |
|---|---|---|
| `navy-900` | `#00153D` | Footer, overlays sobre imagen |
| `navy-800` | `#00205C` | **Color de marca.** Navbar, hero, botones primarios |
| `navy-600` | `#1B4189` | Hover de botones, links en texto |
| `navy-50` | `#EEF2F9` | Fondos de sección alternos |
| `gold-500` | `#D4A72C` | Acento único: badges, destacados del Fondo Solidario |
| `slate-900…50` | escala neutra | Texto, bordes, superficies |

Disciplina monocromática navy/blanco/gris, con el dorado como único acento. El
dorado **no** se usa para texto de cuerpo ni para botones primarios: su valor es
que aparece poco.

**Paleta de categorías** (chips del catálogo, todas verificadas a contraste AA
sobre blanco): Salud, Ahorro y crédito, Solidaridad, Gas, Funeraria, Educación.
Cada una recibe un par `{fondo, texto}` propio. Es lo que hace que un catálogo
de 11 fichas se lea de un vistazo.

### 3.2 Tipografía

```css
font-family: 'Inter Variable', 'Helvetica Neue', Helvetica, Arial, sans-serif;
```

Inter es la sustituta libre más cercana a Helvetica en color de texto y la mejor
renderizada en pantalla. Si falla la carga, cae a Helvetica real en macOS y a
Arial en el resto — nunca a un serif del sistema.

**Gesto de marca:** el logo usa mayúsculas con tracking abierto. Se replica en
los *eyebrows* de sección (`text-xs uppercase tracking-[0.18em]`). Es el detalle
que amarra la identidad impresa al sitio.

Escala tipográfica y espaciado sobre base de 8px.

### 3.3 Logos

Los cuatro archivos `.ai` de `info/` son PDF y se convierten con
`pdftocairo -svg`, luego se optimizan con `svgo`.

| Archivo | Destino |
|---|---|
| `Banner Blanco.ai` | Navbar (sobre navy) |
| `Banner Azul.ai` | Navbar en scroll (sobre blanco), documentos |
| `Logo Blanco.ai` | Hero, footer |
| `Logo Azul.ai` | Favicon, OG image, versiones sobre blanco |

**Riesgo conocido:** el SVG crudo del banner pesa 531 KB con 195 paths — la
fachada de la Casa Central tiene mucho detalle. Si tras `svgo` sigue sobre
~60 KB, el navbar usa WebP 2x y el SVG se reserva para el hero y el favicon,
donde el escalado sí importa. La decisión se toma con el peso real medido, no
antes.

---

## 4. Sitio público

### 4.1 Rutas

| Ruta | Contenido |
|---|---|
| `/` | Hero, propósito, beneficios destacados, bloque Fondo Solidario, últimas noticias, CTA contacto |
| `/quienes-somos` | Historia, misión, directiva (foto + cargo), estatutos descargables |
| `/beneficios` | Catálogo filtrable por categoría, con buscador |
| `/beneficios/[slug]` | Ficha: descripción, beneficios, forma de acceso, forma de pago, vigencia |
| `/noticias` | Listado paginado, filtro por categoría, buscador |
| `/noticias/[slug]` | Nota individual |
| `/contacto` | Formulario, datos de sede, horarios |
| `/privacidad` | Política de tratamiento de datos (Ley 21.719) |
| `/socios` | Placeholder "Próximamente" — reserva el lugar del área privada de F2 |

Navegación: `Inicio · Quiénes somos · Convenios y beneficios · Noticias ·
Contacto` + botón destacado **Acceso socios**.

**La home no duplica el catálogo.** Muestra 4 convenios marcados `destacado` y
el bloque del Fondo Solidario, y deriva a `/beneficios`. Un solo lugar donde se
mantiene el contenido.

### 4.2 Página de privacidad

Obligatoria desde F1 porque el formulario de contacto ya recolecta datos
personales. Declara: qué se recolecta, para qué, quién es responsable (AFUCH),
quién es encargado (Agencia La Palanca), cuánto se conserva y cómo se ejercen
los derechos ARCO bajo Ley 21.719.

---

## 5. Modelo de contenido

Los tipos viven en `packages/contracts` como schemas Zod; los datos en
`apps/web/src/content/` como TS validado en build.

### 5.1 Convenio

```
slug                     identificador en URL
nombre                   nombre público del convenio
categoria                salud | ahorro-credito | solidaridad | gas | funeraria | educacion
resumen                  1-2 líneas para la card
descripcion              párrafo para la ficha
beneficios               lista de bullets
formaDeAcceso            cómo lo solicita el socio
formaDePago              opcional: "descuento por planilla en 4 cuotas"
extensivoGrupoFamiliar   booleano
destacado                aparece en la home
vigencia                 'permanente' | { desde?, hasta? }
logo                     opcional: { src, alt }
contacto                 opcional: { web?, telefono?, email? }
```

`extensivoGrupoFamiliar` es campo de primer nivel, no un bullet más: aparece en
la mayoría de los convenios de salud, es el dato que más pesa en la decisión del
socio, y como campo permite mostrarlo como chip en la card y filtrar por él.

El modelo admite además las categorías `recreacion` y `comercio` que menciona la
propuesta original. El filtro del catálogo muestra **solo las categorías con al
menos un convenio cargado**, de modo que hoy se ven 6 y las otras dos aparecen
solas cuando AFUCH entregue convenios de ese tipo.

### 5.2 Catálogo inicial — 11 convenios

Fuente: `info/BENEFICIOS AFUCH.pdf` y las piezas gráficas de `info/`.

| # | Convenio | Categoría | Datos clave |
|---|---|---|---|
| 1 | Préstamos de consumo Coopeuch | Ahorro y crédito | Tasas preferentes, descuento por planilla |
| 2 | Vales digitales Abastible | Gas | Balones 5/11/15/45 kg bajo precio de recarga; hasta 3 vales al mes (dos de misma carga, uno distinto); una cuota por planilla al mes siguiente; valores varían semanalmente |
| 3 | Préstamo Solidario | Solidaridad | Tope $60.000, hasta 3 cuotas, sin intereses; transferencia directa a la entidad adeudada |
| 4 | Seguro Oncológico FALP | Salud | Individual $9.900 / grupo familiar $19.800 mensual por planilla |
| 5 | Fondo Solidario | Solidaridad | Cuota voluntaria 0,8% del sueldo base; asesoría legal laboral gratuita; 9 bonos por una vez; bono de invierno anual sujeto a fondos |
| 6 | Funeraria Juan Antonio Solar | Funeraria | 20% dcto., sala velatoria gratuita 24/7, terapias de duelo, Pet Funeral |
| 7 | Librería Dimeiggs | Educación | 20% dcto. presencial y online; requiere cupón solicitado en AFUCH |
| 8 | Caja de Ahorros de Empleados Públicos | Ahorro y crédito | 1% de haberes por planilla para ahorro; créditos a baja tasa; teleorientación médica, médico a domicilio, traslado; asistencia veterinaria |
| 9 | Óptica Bethel | Salud | 10% dcto.; operativo oftalmológico gratuito por compra de lentes; hasta 4 meses por planilla; grupo familiar; FONASA/Isapres/Bienestar U. de Chile |
| 10 | Clínica Dental Alto Valle | Salud | 20% dcto.; cuotas por planilla; grupo familiar |
| 11 | Óptica Mugello | Salud | Operativo oftalmológico gratuito por compra de lentes; por planilla; grupo familiar; FONASA/Isapres/Bienestar U. de Chile |

**Nota de consolidación:** Abastible aparecía en dos fuentes (el PDF de
beneficios y una pieza gráfica). Se fusionaron en un solo convenio con los
detalles de ambas.

Los 9 bonos del Fondo Solidario (nacimiento $25.000, matrimonio o AUC $25.000,
fallecimiento del socio $100.000, fallecimiento de hijo/cónyuge/padres $50.000
c/u, enfermedad catastrófica $50.000, accidente $10.000, accidente de
locomoción $10.000) se renderizan como tabla dentro de su ficha, con la nota de
que todos requieren acreditación con certificados.

**Destacados en la home:** Fondo Solidario, Vales Abastible, Préstamo Solidario,
Seguro Oncológico FALP.

### 5.3 Noticia

```
slug · titulo · bajada · fecha · categoria · portada? · cuerpo (MDX) · autor?
```

### 5.4 Datos de sede

Archivo único con dirección, horarios, teléfono y correo. Consumido por el
footer, `/contacto` y el JSON-LD. Un solo lugar que corregir cuando AFUCH los
entregue.

---

## 6. Backend (Fase 1)

`apps/api` — NestJS con un solo módulo con lógica.

| Endpoint | Descripción |
|---|---|
| `POST /api/contact` | Valida con el schema compartido, aplica honeypot y rate limiting, despacha correo vía Resend |
| `GET /health` | Healthcheck para el hosting |

**Sin base de datos y sin persistir mensajes.** Un mensaje de contacto con RUT es
dato personal: almacenarlo en F1 abre obligaciones de Ley 21.719 (cifrado,
retención, respaldo, derechos de acceso y supresión) sin ningún beneficio, dado
que el mensaje igual llega por correo. Postgres queda declarado en
`docker-compose.yml` y Prisma entra en F2, junto con el área privada, que es
donde la base de datos sí se necesita.

**Schema de contacto** (`packages/contracts`):

```
nombre     2-80 caracteres
email      correo válido
rut        opcional, validado con dígito verificador
unidad     opcional, unidad o facultad
asunto     enum: convenios | afiliacion | descuentos | otro
mensaje    10-2000 caracteres
website    honeypot: debe venir vacío
```

`validarRut` vive en `contracts` porque el registro de socios de F2 necesita
exactamente la misma validación. Se escribe una vez.

### 6.1 Seguridad F1

- Rate limiting por IP en `/api/contact` (`@nestjs/throttler`).
- Honeypot invisible contra bots.
- CORS restringido al dominio del sitio.
- Cabeceras vía `helmet`.
- Secretos solo por variables de entorno; `.env.example` versionado, `.env` no.
- Dockerfile, para que AFUCH elija hosting sin quedar amarrada a un proveedor.

---

## 7. Calidad

### 7.1 Testing

TDD en la lógica con reglas reales: `validarRut`, validación del schema de
contacto, filtros y buscador del catálogo, formato de montos CLP.

| Capa | Herramienta | Cobertura |
|---|---|---|
| `contracts` | Vitest | Casos válidos, inválidos, límites; RUT con DV correcto, incorrecto, con K, con y sin formato |
| `web` | Vitest + Testing Library | Filtros y búsqueda, render de fichas, estados del formulario |
| `api` | Vitest + supertest | Contacto: éxito, payload inválido, honeypot activado, rate limit excedido |
| e2e | Playwright | Navegación completa; filtrar beneficios por categoría; enviar contacto |

### 7.2 Accesibilidad

Objetivo WCAG 2.1 AA. Contraste verificado en todos los pares de la paleta,
navegación completa por teclado con foco visible, landmarks y jerarquía de
encabezados correcta, `alt` descriptivos, formulario con labels asociados y
errores anunciados. Es un sitio institucional público: no es opcional.

### 7.3 SEO y rendimiento

Metadata por página, `sitemap.xml`, `robots.txt`, JSON-LD `Organization`,
imágenes OG. Renderizado estático, `next/image`, fuente con `display: swap`.
Objetivo Lighthouse ≥ 95 en Rendimiento y Accesibilidad.

### 7.4 Tooling

Turborepo cachea `lint`, `typecheck`, `test` y `build`. ESLint + Prettier.
TypeScript en modo estricto, sin `any` — donde el tipo sea desconocido se usa
`unknown` y se estrecha. Commits convencionales. Suite completa antes de cada
push.

---

## 8. Fuera de alcance en Fase 1

Autenticación y área privada de socios, panel de administración autogestionado,
base de datos y modelos Prisma, carga de la planilla de descuentos, rendición de
cuentas, mailing mensual y piezas de WhatsApp. Todo eso corresponde a la Fase 2
según la propuesta comercial.

---

## 9. Contenido pendiente de AFUCH

Se construye con placeholder visiblemente marcado y se entrega un checklist:

1. Textos de historia y misión institucional.
2. Fotos y cargos de la directiva actual.
3. Estatutos en PDF.
4. Dirección de la sede, horarios de atención, teléfono y correo.
5. Dos o tres noticias iniciales.
6. Vigencia y valores actualizados de cada convenio — los montos de este spec
   provienen de documentos de septiembre 2026 y deben confirmarse antes de
   publicar.
7. Confirmación del texto del convenio Dimeiggs: la pieza original indica
   solicitar el cupón "a FENAFUCH o Asociación de base"; aquí se redacta como
   solicitud en AFUCH Servicios Centrales.

---

## 10. Criterios de aceptación

1. Las 9 rutas de la sección 4.1 responden y son navegables en móvil, tablet y
   escritorio.
2. El catálogo muestra los 11 convenios, filtra por las 6 categorías y busca por
   nombre y resumen.
3. El formulario de contacto valida en cliente y servidor con el mismo schema,
   y entrega el correo.
4. Ningún par de colores del sitio baja del contraste AA.
5. Todo el sitio es navegable por teclado.
6. Lighthouse ≥ 95 en Rendimiento y Accesibilidad en la home y en `/beneficios`.
7. `pnpm lint && pnpm typecheck && pnpm test && pnpm build` pasa en limpio.
8. `/socios` existe y comunica que el acceso llega en la siguiente etapa.
