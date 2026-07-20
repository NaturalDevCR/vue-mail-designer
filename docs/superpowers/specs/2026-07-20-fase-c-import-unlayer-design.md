# Fase C — Import de Unlayer — Diseño

**Fecha:** 2026-07-20
**Contexto:** tercera fase del roadmap. Principio transversal: **clean-room** — implementación propia, sin código/assets/marcas de terceros. Aquí importamos el **formato de datos** de Unlayer (un formato de datos no es copyrighteable) a nuestro modelo; no reproducimos su código ni empaquetamos sus plantillas.

## Objetivo

Poder cargar un diseño creado en Unlayer, ya sea:
1. **Pegando el JSON** de diseño de Unlayer (el objeto `{ body: { rows, values } }` o `{ rows, values }`).
2. **Con la URL** de una plantilla del studio (ej. `https://studio.unlayer.com/create/valentines-day-flowers`).

El resultado es un `EmailDocument` nuestro válido, más un **reporte de advertencias** con todo lo que no se pudo mapear (nunca falla silenciosamente ni rompe).

## Mapeo del formato Unlayer → nuestro modelo

Basado en el formato real (verificado contra plantillas del studio):

**Documento (`body.values`):**
- `contentWidth` (número o `"600px"`) → `settings.contentWidth`.
- `fontFamily.value` (ej. `"'Raleway',sans-serif"`) → `settings.fontFamily`.
- `preheaderText` → `settings.preheader`.
- `backgroundColor` → `settings.backgroundColor`.
- `contentAlign` (`left|center`) → `settings.contentAlignment`.
- `linkStyle.linkColor`/`linkUnderline` → `settings.linkColor`/`linkUnderline` (si existen).

**Fila (`row`):**
- `cells` (ratios, ej. `[59.83, 40.17]`, `[1,1,1]`) → `columns[].widthPct` (cada ratio / suma × 100, redondeado).
- `values.backgroundColor` → `row.style.backgroundColor`.
- `values.backgroundImage` `{url,size,repeat,position}` → `row.style.backgroundImage`.
- `values.padding` (shorthand CSS) → `row.style.padding`.
- `values.hideDesktop` (bool) → `row.hideDesktop`. (Unlayer no tiene `hideMobile` a nivel fila estándar; `_override.mobile` → advertencia.)

**Columna (`column.values`):**
- `backgroundColor` → `column.style.backgroundColor`.
- `border` (por-lado) → `column.style.border` **uniforme** tomando el lado superior; si los 4 lados difieren → advertencia.
- `borderRadius` (`"0px"`) → `column.style.borderRadius`.
- `padding` → `column.style.padding`.

**Bloques (`contents[].type`):** `containerPadding` (shorthand) → `style.padding` en todos.
- `text` → `text` (mantiene el HTML; `fontFamily.value` → `fontFamily`; `fontSize`, `lineHeight` (`"140%"`→1.4), `color`, `textAlign`→align via wrapper? nuestro text no tiene align propio, va en el HTML — se conserva el HTML tal cual).
- `heading` → `heading` (`headingType` h1/h2/h3 → level 1/2/3; `text` HTML → texto plano; `fontSize`, `color`, `textAlign`→`style.align`, `fontFamily.value`→`fontFamily`).
- `image` → `image` (`src.url`→`src`, `altText`→`alt`, `action.values.href`→`href`, `textAlign`→`align`; `width` en % no viene explícito → `widthPct` 100).
- `button` → `button` (`text` HTML→label plano; `href.values.href`→`href`; `buttonColors.backgroundColor`/`color`→style; `borderRadius`; `padding` interno→`innerPaddingX/Y`; `fontSize`; `textAlign`→align).
- `divider` → `divider` (`border.borderTopColor/Width`→color/thickness; `width` `"20%"`→`widthPct`).
- `html` → `html` (`html`→`code`).
- `social` → `social` (`icons.icons[]` `{url,name}`→`networks[]` mapeando el nombre a nuestra red; `spacing`; `align`).
- `menu` → `menu` (si el shape trae items con label+href; si no, advertencia).
- Tipos no soportados (`form`, `timer` dinámico de Unlayer, `qr`, `sticker`, `carousel`, `video` no estándar, etc.) → **omitidos con advertencia** por tipo.

**Siempre a advertencias:** `_override.mobile` (estilos móviles específicos), `displayCondition`, fuentes de Google (`fontFamily.url`: se conserva el nombre pero el integrador debe cargar la fuente), bordes de columna por-lado colapsados a uniforme, y una **nota legal**: "Las imágenes provienen de plantillas de Unlayer (cdn.templates.unlayer.com) y les pertenecen; reemplázalas por tus propios assets."

## Arquitectura

- **`src/import/unlayer.ts`** (pura, testeable):
  - `parseShorthandPadding(s: string): Padding` — "10px 60px" / "5px 10px 10px 20px" / "0px".
  - `parsePx(s: string | number): number`, `parsePct(s): number`.
  - `stripTags(html: string): string`.
  - `extractUnlayerDesign(json: unknown): UnlayerDesign` — normaliza `{body:{rows,values}}` | `{rows,values}` | `{design:{...}}` a `{ rows, values }`; lanza error legible si no reconoce.
  - `unlayerToDocument(json: unknown): { document: EmailDocument; warnings: string[] }` — el conversor; valida el resultado con `zEmailDocument.parse` (con defaults) antes de devolver.
- **`src/import/unlayerUrl.ts`**:
  - `unlayerSlugFromUrl(url: string): string | null` — extrae el slug de una URL del studio o acepta un slug pelado.
  - `type UnlayerFetch = (slug: string) => Promise<unknown>` y `defaultUnlayerFetch` (POST a su GraphQL `StockTemplateLoad`; devuelve el `design` de la primera página). Documenta la limitación CORS.
- **API pública**: nueva prop `unlayerFetch?: UnlayerFetch` (si no se pasa, el import por URL usa `defaultUnlayerFetch`, que probablemente falle por CORS salvo proxy). Nuevos exports: `unlayerToDocument`, `unlayerSlugFromUrl`, tipos.
- **UI**: entrada "Importar de Unlayer…" en el menú EXPORTAR del header → `UnlayerImportDialog.vue`: textarea para pegar JSON **o** input de URL + botón "Cargar"; corre el conversor; muestra la lista de advertencias; botón "Aplicar" que hace `store.loadDesign(document)`. Errores (JSON inválido, formato no reconocido, fetch fallido) se muestran en el diálogo, no rompen.
- **Demo**: `apps/demo/vite.config.ts` agrega un proxy `/unlayer-api` → `https://studio.unlayer.com/api/v1/graphql` para sortear CORS en desarrollo; el demo pasa un `unlayerFetch` que usa ese proxy.

## Testing

- Conversor con **fixtures sintéticos propios** (no plantillas de Unlayer) que ejercitan cada mapeo: settings, filas multi-columna con ratios, bg image, hide, columnas con borde/radio, y cada tipo de bloque soportado; documento resultante pasa `zEmailDocument`.
- Advertencias: tipo desconocido genera warning y se omite; `_override.mobile`/`displayCondition`/fuente Google/nota de imágenes aparecen.
- Helpers: `parseShorthandPadding` (1/2/4 valores), `parsePx`, `unlayerSlugFromUrl` (URL del studio, slug pelado, URL inválida).
- `unlayerToDocument` con JSON basura → error legible, no crash.
- UI: pegar JSON válido → advertencias + Aplicar carga el diseño; JSON inválido → mensaje de error; el fetch por URL usa el `unlayerFetch` inyectado (mock en test).
- Suite + typecheck + build verdes.

## Fuera de alcance

Estilos responsive por-dispositivo de Unlayer (`_override`), display conditions, tipos avanzados (form/qr/carousel/timer dinámico), carga automática de Google Fonts, VML de fondos. Todos → advertencias, no soporte.

## Criterios de aceptación

- Pegar el JSON de una plantilla de Unlayer produce un diseño editable equivalente (estructura de filas/columnas/bloques, colores, textos, imágenes, botones) + una lista de advertencias de lo no mapeado.
- Cargar por URL del studio funciona con el proxy del demo; la librería expone `unlayerFetch` para que el integrador provea el suyo.
- Un JSON inválido o un tipo desconocido nunca rompe: se reporta.
- La nota legal sobre las imágenes de Unlayer aparece siempre que el diseño traiga imágenes de su CDN.
- Suite + typecheck + build de librería y demo verdes.
