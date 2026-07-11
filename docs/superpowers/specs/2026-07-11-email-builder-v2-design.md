# Vue Mail Designer v2 — Diseño

**Fecha:** 2026-07-11
**Decisión de partida:** reescritura desde cero. El código actual (~13k líneas) queda como referencia pero no se conserva: tooling roto (vue-tsc 1.8 vs TS 5.9), dependencias obsoletas (@vue-email 0.0.8, Vite 4) y duplicadas (3 editores rich text, 2 librerías DnD).

## Objetivo

Un email builder visual drag & drop estilo Unlayer, empaquetado como **librería Vue 3 embebible** (componente `<EmailBuilder>`), con preview desktop/mobile del HTML real, set completo de bloques, merge tags y templates prearmados.

## Decisiones cerradas

| Tema | Decisión |
|---|---|
| Enfoque | Reescritura desde cero |
| Salidas | JSON del diseño (guardar/cargar) + HTML listo para enviar |
| Generación de HTML | Generador propio: función pura `(EmailDocument) => string` con tablas, estilos inline y hacks de Outlook. **No** se usa vue-email |
| Empaquetado | Librería npm embebible + app demo en el monorepo |
| Stack | Vue 3.5, TypeScript estricto, Vite 7 (library mode + vite-plugin-dts), Pinia 3, Tiptap 2 (único rich text), vuedraggable@next/SortableJS (único DnD), Zod, Vitest 3 |

## Estructura del repo

Monorepo pnpm (se mantiene la forma):

```
packages/email-builder     → librería publicable
apps/demo                  → app de desarrollo/demo que consume la librería
docs/superpowers/specs     → specs y planes
```

## Modelo de documento (JSON)

```
EmailDocument {
  version: number
  settings: { contentWidth, backgroundColor, fontFamily, preheader }
  rows: Row[]
}
Row    { id, style: { backgroundColor, padding, borderRadius }, columns: Column[] }
Column { id, widthPct, style, blocks: Block[] }
Block (discriminante `type`):
  heading  { text, level (h1-h3), style }
  text     { html (Tiptap output), style }
  image    { src, alt, href?, widthPct|widthPx, align, style }
  button   { label, href, align, style (bg, color, radius, padding, fontSize) }
  divider  { style (color, thickness, widthPct, padding) }
  spacer   { height }
  social   { networks: [{ kind, url }], iconSize, align, spacing }
  menu     { items: [{ label, href }], style, align, separator }
  html     { code }
  video    { thumbnailUrl, videoUrl, alt, widthPct }
```

Reglas:
- Solo `Row` en raíz; `Column` en `Row`; `Block` en `Column`.
- `widthPct` de las columnas de una fila suma 100.
- IDs únicos (`createId()`).
- Validación con **Zod**: `importJSON` rechaza documentos inválidos con errores legibles. El schema Zod es la fuente de los tipos TS (`z.infer`).
- `version` permite migraciones futuras del formato.

## Arquitectura de la librería

```
src/
  schema/     → schema Zod + tipos + factories con defaults por bloque
  store/      → useDocumentStore: documento, selección, undo/redo
                (snapshots con debounce ~300ms, límite ~50 entradas)
                useUiStore: tema UI, panel activo, device de preview
  render/     → html.ts: función pura (EmailDocument) => string
  components/
    EmailBuilder.vue    → orquestador; instancia Pinia propia aislada
    BlockPalette.vue    → bloques arrastrables + tab de layouts de fila
                          (1col, 2col, 3col, 2:1, 1:2)
    Canvas.vue          → edición visual, drop zones resaltadas, selección,
                          controles inline (duplicar/borrar/arrastrar)
    Inspector.vue       → props del elemento seleccionado por tipo +
                          settings del documento cuando no hay selección
    Toolbar.vue         → undo/redo, preview, templates, import/export, tema
    PreviewDialog.vue   → iframe con HTML real exportado; toggle
                          desktop (600px) / mobile (375px); copiar/descargar
    TemplateGallery.vue → miniaturas de templates built-in + del integrador
    blocks/             → un componente de edición por tipo de bloque
    fields/             → controles reutilizables del inspector
                          (color, spacing/padding, select, slider, align)
  templates/  → 4-5 JSON de partida (newsletter, promo, transaccional,
                bienvenida, vacío)
```

### Generador de HTML (`render/html.ts`)

- Layout con tablas anidadas (`role="presentation"`, cellpadding/cellspacing 0).
- Todos los estilos **inline**; sin flex/grid/position.
- MSO conditional comments para Outlook desktop (ghost tables para columnas).
- Botones "bulletproof" (tabla anidada + padding, fallback VML opcional en v1.x).
- Imágenes con `display:block` y width fijo.
- Preheader oculto al inicio del body.
- Columnas responsive: en mobile hacen stack vía `@media` en `<head>` +
  `display:inline-block` como base para clientes sin soporte de media queries.
- Merge tags `{{tag}}` pasan intactos al HTML final.
- Determinista y síncrono → testeable con snapshots; el preview usa exactamente
  esta salida.

## API pública

```vue
<EmailBuilder
  v-model:design="designJson"
  :merge-tags="[{ name: 'Nombre', value: '{{first_name}}' }]"
  :templates="templatesExtra"
  :upload-image="async (file) => url"
  :theme="'light' | 'dark' | 'auto'"
  @export-html="(html) => …"
  @change="(design) => …"
/>
```

Expuesto vía `defineExpose` / composable: `exportHtml()`, `exportJson()`, `loadDesign(json)`, `loadTemplate(id)`.

- **Sin persistencia automática** dentro de la librería; la app demo sí persiste en localStorage.
- `upload-image`: el integrador sube el archivo donde quiera y devuelve la URL; el bloque imagen muestra estado de carga mientras tanto. Si no se pasa la prop, el bloque solo acepta URL manual.

## Features v1

1. DnD completo: paleta → canvas, reordenar filas/columnas/bloques, mover bloques entre columnas. Ghost/placeholder visual en zonas válidas.
2. Preview desktop/mobile con HTML real en iframe, copiar HTML y descargar .html.
3. 10 bloques: heading, text, image, button, divider, spacer, social, menu, html, video (thumbnail con overlay play → link).
4. Merge tags: dropdown en la toolbar de Tiptap; se insertan como nodo atómico no editable; lista configurable vía prop.
5. Templates: galería al iniciar vacío o desde la toolbar; built-in + extras del integrador.
6. Undo/redo con ⌘Z / ⌘⇧Z.
7. Tema claro/oscuro de la UI del builder (el canvas del email no cambia).
8. Import/export JSON con validación Zod.

## Testing

- **Snapshots del HTML generado** para documentos de referencia (cada tipo de bloque + layouts multi-columna) — es el corazón del sistema.
- Unit tests del store: mutaciones, undo/redo, import con JSON inválido.
- Test de humo de `<EmailBuilder>` con @vue/test-utils (monta, agrega fila, agrega bloque, exporta).

## Fuera de alcance v1 (roadmap)

Import de HTML existente, estilos distintos por dispositivo, colaboración, AI, stock images, export a componente .vue, VML completo para fondos en Outlook.

## Criterios de aceptación

- La demo permite construir un email con filas/columnas/bloques, reordenar todo por DnD, editar propiedades, preview desktop/mobile, exportar HTML y JSON, importar JSON, aplicar templates, insertar merge tags y cambiar tema.
- El HTML exportado renderiza correctamente la estructura de columnas en clientes basados en tablas (verificado por snapshots y revisión manual del markup MSO).
- La librería compila en library mode con tipos `.d.ts` y se puede instalar en otro proyecto Vue 3 sin hacks.
- Typecheck, lint y tests verdes con `pnpm -w run check` / `test`.
