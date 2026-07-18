# Unlayer-style UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rediseñar la UI del builder al estilo Unlayer Studio (header oscuro, canvas centrado, sidebar único derecho con 4 tabs) y hacer el drag & drop fluido con forceFallback + ghost/placeholder estilizados, más tab de imágenes stock (Openverse).

**Architecture:** Se conserva el modelo de documento, store, renderer y API pública. Cambia la capa de componentes: `BuilderHeader` + `CanvasBar` reemplazan a `BuilderToolbar`; `SidePanel` (riel de 4 tabs + modo propiedades) reemplaza a `BlockPalette` + `InspectorPanel`. Schema gana 3 settings con `.default()` (sin migración). El renderer aplica alineación de contenido y estilos de links inline.

**Tech Stack:** el existente (Vue 3.5, TS, Pinia, vuedraggable, Tiptap, Zod, Vitest). Sin dependencias nuevas (Openverse via `fetch`).

**Spec:** `docs/superpowers/specs/2026-07-17-unlayer-ui-design.md`

## Global Constraints

- Strings visibles de la UI en español. El canvas del email nunca usa variables del tema.
- Todos los `<button>` con `type="button"`.
- API pública existente intacta; única prop nueva: `imageSearch?: (query: string) => Promise<ImageResult[]>`.
- DnD: vuedraggable en TODOS los draggables con `:force-fallback="true"`, `:fallback-on-body="true"`, `:animation="200"`, `:swap-threshold="0.65"`, `ghost-class="vmd-ghost"`, `fallback-class="vmd-drag-card"`. Grupos: `blocks` (clone desde ContentTab) y `rows` (clone desde BlocksTab), como hoy.
- Los data-action/data-device selectors existentes se conservan donde el control migra (`undo`, `redo`, `preview`, `templates`); tests existentes se adaptan sin perder aserciones de conducta.
- JSON v1 existentes deben importar sin migración (los settings nuevos usan `.default()` en Zod).
- Cada tarea termina con suite completa + typecheck verdes y un commit.

---

### Task 1: Settings nuevos en schema y renderer (links + alineación)

**Files:**
- Modify: `packages/email-builder/src/schema/document.ts`, `packages/email-builder/src/schema/factories.ts`, `packages/email-builder/src/render/html.ts`
- Test: `packages/email-builder/tests/render-settings.test.ts` (nuevo); snapshots regenerados

**Interfaces:**
- Consumes: schema y renderer existentes.
- Produces: `EmailSettings` gana `contentAlignment: 'left' | 'center'`, `linkColor: string`, `linkUnderline: boolean` (todos con default Zod). `RenderCtx` gana `linkColor: string; linkUnderline: boolean`. El renderer aplica `align` del contenedor y estilo inline en `<a>` de bloques de texto.

- [ ] **Step 1: Test que falla** — `packages/email-builder/tests/render-settings.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { renderHtml } from '../src/render/html'
import { createBlock, createDocument, createRow, zEmailDocument } from '../src/schema'
import type { TextBlock } from '../src/schema'

describe('settings nuevos', () => {
  it('JSON v1 sin los campos nuevos valida y recibe defaults', () => {
    const doc = createDocument() as Record<string, unknown>
    const settings = { ...(doc.settings as Record<string, unknown>) }
    delete settings.contentAlignment
    delete settings.linkColor
    delete settings.linkUnderline
    const result = zEmailDocument.safeParse({ ...doc, settings })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.settings.contentAlignment).toBe('center')
      expect(result.data.settings.linkColor).toBe('#3b82f6')
      expect(result.data.settings.linkUnderline).toBe(true)
    }
  })

  it('contentAlignment controla el align del contenedor', () => {
    const doc = createDocument()
    doc.settings.contentAlignment = 'left'
    expect(renderHtml(doc)).toContain('<td align="left"')
    doc.settings.contentAlignment = 'center'
    expect(renderHtml(doc)).toContain('<td align="center"')
  })

  it('links de texto reciben color y subrayado inline', () => {
    const doc = createDocument()
    const row = createRow([100])
    const text = createBlock('text') as TextBlock
    text.html = '<p>Ver <a href="https://example.com">oferta</a></p>'
    row.columns[0].blocks.push(text)
    doc.rows.push(row)
    doc.settings.linkColor = '#ff0000'
    doc.settings.linkUnderline = false
    const html = renderHtml(doc)
    expect(html).toContain('<a style="color:#ff0000;text-decoration:none;" href="https://example.com">')
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

```bash
pnpm --filter @vue-mail-designer/builder test tests/render-settings.test.ts
```

Expected: FAIL (campos no existen / align hardcodeado / links sin estilo).

- [ ] **Step 3: Implementar**

En `schema/document.ts`, `zEmailSettings` queda:

```ts
export const zEmailSettings = z.object({
  contentWidth: z.number().min(320).max(900),
  backgroundColor: z.string(),
  fontFamily: z.string(),
  preheader: z.string(),
  contentAlignment: z.enum(['left', 'center']).default('center'),
  linkColor: z.string().default('#3b82f6'),
  linkUnderline: z.boolean().default(true),
})
```

En `factories.ts`, `createDocument()` agrega los tres campos explícitos (`contentAlignment: 'center'`, `linkColor: '#3b82f6'`, `linkUnderline: true`).

En `render/html.ts`:

```ts
export type RenderCtx = { fontFamily: string; linkColor: string; linkUnderline: boolean }

function styleLinks(html: string, ctx: RenderCtx): string {
  return html.replace(
    /<a\s/g,
    `<a style="color:${ctx.linkColor};text-decoration:${ctx.linkUnderline ? 'underline' : 'none'};" `,
  )
}
```

- El case `text` pasa a `styleLinks(convertMergeTags(block.html), ctx)`.
- `renderHtml` construye `ctx` con los tres campos y el `<td align="center"` del contenedor pasa a `<td align="${settings.contentAlignment}"`.

- [ ] **Step 4: Regenerar snapshots y verificar** — los snapshots cambian solo si contienen `<a>` o el align (revisar el diff):

```bash
pnpm --filter @vue-mail-designer/builder exec vitest run -u
pnpm --filter @vue-mail-designer/builder test && pnpm typecheck
```

Expected: PASS todo.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: settings de alineación y estilo de links en schema y renderer"
```

---

### Task 2: UI store + BuilderHeader (header oscuro con EXPORTAR)

**Files:**
- Modify: `packages/email-builder/src/store/ui.ts`, `packages/email-builder/src/styles.css`
- Create: `packages/email-builder/src/components/BuilderHeader.vue`
- Test: `packages/email-builder/tests/header.test.ts`

**Interfaces:**
- Consumes: stores, `renderHtml`.
- Produces:
  - `useUiStore` gana `canvasDevice: Ref<'desktop' | 'mobile'>` (default `'desktop'`) y `sidebarTab: Ref<'content' | 'blocks' | 'body' | 'images'>` (default `'content'`).
  - `BuilderHeader.vue`: marca "Vue Mail Designer", botón Plantillas (`data-action="templates"`), estado "Guardado", toggle tema, botón **EXPORTAR** (`data-action="export"`) con menú (`.vmd-export-menu`): "Exportar HTML" (`data-action="export-html"`), "Exportar JSON" (`data-action="export-json"`), "Importar JSON…" (`data-action="import-json"`, input file oculto). El menú cierra al clickear fuera (listener en document, mounted/unmounted). Helper `downloadFile` local (Blob + createObjectURL + revoke). Import inválido → `window.alert(error)`.
  - Nota: `BuilderToolbar.vue` sigue existiendo hasta la Task 3; este task solo AGREGA el header (aún sin montar en EmailBuilder).

- [ ] **Step 1: Test que falla** — `packages/email-builder/tests/header.test.ts`:

```ts
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, provide } from 'vue'
import BuilderHeader from '../src/components/BuilderHeader.vue'
import { BUILDER_PINIA_KEY } from '../src/store/keys'
import { useUiStore } from '../src/store/ui'

function mountHeader() {
  const pinia = createPinia()
  const Host = defineComponent({
    setup() {
      provide(BUILDER_PINIA_KEY, pinia)
      return () => h(BuilderHeader)
    },
  })
  return { wrapper: mount(Host), ui: useUiStore(pinia) }
}

describe('BuilderHeader', () => {
  it('renderiza marca, plantillas, estado y exportar', () => {
    const { wrapper } = mountHeader()
    expect(wrapper.find('.vmd-header').exists()).toBe(true)
    expect(wrapper.text()).toContain('Plantillas')
    expect(wrapper.text()).toContain('Guardado')
    expect(wrapper.find('[data-action="export"]').text()).toContain('EXPORTAR')
  })

  it('el menú de exportar abre y cierra', async () => {
    const { wrapper } = mountHeader()
    expect(wrapper.find('.vmd-export-menu').exists()).toBe(false)
    await wrapper.find('[data-action="export"]').trigger('click')
    expect(wrapper.find('.vmd-export-menu').exists()).toBe(true)
    expect(wrapper.find('[data-action="export-html"]').exists()).toBe(true)
    expect(wrapper.find('[data-action="import-json"]').exists()).toBe(true)
  })

  it('plantillas abre la galería y el store ui tiene los campos nuevos', async () => {
    const { wrapper, ui } = mountHeader()
    expect(ui.canvasDevice).toBe('desktop')
    expect(ui.sidebarTab).toBe('content')
    await wrapper.find('[data-action="templates"]').trigger('click')
    expect(ui.galleryOpen).toBe(true)
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

```bash
pnpm --filter @vue-mail-designer/builder test tests/header.test.ts
```

- [ ] **Step 3: Implementar**

`store/ui.ts` agrega al setup store y al return:

```ts
const canvasDevice = ref<'desktop' | 'mobile'>('desktop')
const sidebarTab = ref<'content' | 'blocks' | 'body' | 'images'>('content')
```

`BuilderHeader.vue`:

```vue
<template>
  <header class="vmd-header">
    <div class="vmd-header-brand">Vue Mail Designer</div>
    <button type="button" class="vmd-header-btn" data-action="templates" @click="ui.galleryOpen = true">
      Plantillas
    </button>
    <span class="vmd-header-spacer" />
    <span class="vmd-header-status">● Guardado</span>
    <button type="button" class="vmd-header-btn" :title="ui.theme === 'dark' ? 'Tema claro' : 'Tema oscuro'" @click="ui.toggleTheme()">
      {{ ui.theme === 'dark' ? '☀' : '☾' }}
    </button>
    <div ref="exportRoot" class="vmd-export">
      <button type="button" class="vmd-btn-export" data-action="export" @click="menuOpen = !menuOpen">
        EXPORTAR ▾
      </button>
      <div v-if="menuOpen" class="vmd-export-menu">
        <button type="button" data-action="export-html" @click="exportHtmlFile">Exportar HTML</button>
        <button type="button" data-action="export-json" @click="exportJsonFile">Exportar JSON</button>
        <button type="button" data-action="import-json" @click="fileInput?.click()">Importar JSON…</button>
      </div>
    </div>
    <input ref="fileInput" type="file" accept="application/json,.json" style="display: none" @change="onFile" />
  </header>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { renderHtml } from '../render/html'
import { useDocumentStore } from '../store/document'
import { useBuilderPinia } from '../store/keys'
import { useUiStore } from '../store/ui'

const pinia = useBuilderPinia()
const store = useDocumentStore(pinia)
const ui = useUiStore(pinia)
const menuOpen = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const exportRoot = ref<HTMLElement | null>(null)

function downloadFile(name: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

function exportHtmlFile() {
  downloadFile('email.html', renderHtml(store.doc), 'text/html')
  menuOpen.value = false
}
function exportJsonFile() {
  downloadFile('email-design.json', store.exportJson(), 'application/json')
  menuOpen.value = false
}
async function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const result = store.importJson(await file.text())
  if (!result.ok) window.alert(result.error)
  ;(e.target as HTMLInputElement).value = ''
  menuOpen.value = false
}

function onDocClick(e: MouseEvent) {
  if (menuOpen.value && exportRoot.value && !exportRoot.value.contains(e.target as Node)) {
    menuOpen.value = false
  }
}
onMounted(() => document.addEventListener('click', onDocClick))
onUnmounted(() => document.removeEventListener('click', onDocClick))
</script>
```

CSS a agregar en `styles.css` (variables del header fijas — el header es oscuro en ambos temas, como Unlayer):

```css
.vmd-header {
  display: flex; align-items: center; gap: 12px; padding: 0 16px; height: 52px;
  background: #0e1a2b; color: #e5e7eb; flex-shrink: 0;
}
.vmd-header-brand { font-weight: 700; font-size: 15px; letter-spacing: .2px; }
.vmd-header-btn {
  padding: 6px 10px; border: 1px solid transparent; border-radius: 6px;
  background: transparent; color: #cbd5e1; cursor: pointer; font-size: 13px;
}
.vmd-header-btn:hover { background: rgba(255,255,255,.08); color: #fff; }
.vmd-header-spacer { flex: 1; }
.vmd-header-status { font-size: 12px; color: #7dd3a8; }
.vmd-export { position: relative; }
.vmd-btn-export {
  padding: 8px 18px; border: 0; border-radius: 6px; background: #2f9bf4; color: #fff;
  font-weight: 700; font-size: 13px; letter-spacing: .4px; cursor: pointer;
}
.vmd-btn-export:hover { background: #2589dc; }
.vmd-export-menu {
  position: absolute; right: 0; top: calc(100% + 6px); z-index: 50; min-width: 180px;
  background: var(--vmd-panel); border: 1px solid var(--vmd-border); border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,.18); padding: 4px; display: flex; flex-direction: column;
}
.vmd-export-menu button {
  text-align: left; padding: 8px 10px; border: 0; border-radius: 6px;
  background: transparent; color: var(--vmd-fg); cursor: pointer; font-size: 13px;
}
.vmd-export-menu button:hover { background: var(--vmd-bg); }
```

- [ ] **Step 4: Verificar**

```bash
pnpm --filter @vue-mail-designer/builder test && pnpm typecheck
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: header oscuro estilo Unlayer con menú EXPORTAR y estado de guardado"
```

---

### Task 3: CanvasBar, modo device y layout nuevo de EmailBuilder

**Files:**
- Create: `packages/email-builder/src/components/CanvasBar.vue`
- Delete: `packages/email-builder/src/components/BuilderToolbar.vue`
- Modify: `packages/email-builder/src/components/EmailBuilder.vue`, `packages/email-builder/src/components/BuilderCanvas.vue`, `packages/email-builder/src/styles.css`
- Test: modify `packages/email-builder/tests/email-builder.test.ts`, `packages/email-builder/tests/preview.test.ts`, `packages/email-builder/tests/public-api.test.ts`; new asserts en `tests/canvas.test.ts`

**Interfaces:**
- Consumes: `useUiStore.canvasDevice` (Task 2), stores, `PreviewDialog` existente.
- Produces:
  - `CanvasBar.vue`: izquierda undo/redo (`data-action="undo"/"redo"`, disabled por canUndo/canRedo); centro toggle `data-device="desktop"/"mobile"` que setea `ui.canvasDevice` (activo con clase `vmd-active`); derecha botón 👁 `data-action="preview"` → `ui.previewOpen = true`. Atajos ⌘Z/⌘⇧Z: el handler guardado existente (editable-element + containment `.vmd-root`) se MUEVE aquí tal cual desde BuilderToolbar.
  - `BuilderCanvas.vue`: el ancho de `.vmd-canvas-page` pasa a `ui.canvasDevice === 'mobile' ? 375 : store.doc.settings.contentWidth` px, con `transition: width .25s ease` en CSS.
  - `EmailBuilder.vue` template nuevo:

```vue
<div class="vmd-root" :class="{ 'vmd-dark': ui.theme === 'dark' }">
  <BuilderHeader />
  <div class="vmd-main">
    <section class="vmd-canvas-area">
      <CanvasBar />
      <BuilderCanvas />
    </section>
    <InspectorPanel />
  </div>
  <TemplateGallery v-if="ui.galleryOpen" />
  <PreviewDialog v-if="ui.previewOpen" />
</div>
```

  (`InspectorPanel` sigue siendo el panel derecho hasta la Task 4; `BlockPalette` deja de montarse y se elimina su import — el componente se borra en Task 4 junto con la migración de sus draggables.)
  - `PreviewDialog` se monta acá (antes vivía dentro del toolbar).

- [ ] **Step 1: Ajustar tests (fallan primero)** — en `email-builder.test.ts` reemplazar la aserción `.vmd-toolbar` por `.vmd-header`, `.vmd-canvasbar` y `.vmd-canvas-area`; quitar `.vmd-palette` (se re-asertará como sidebar en Task 4 — en este task basta con que header/canvasbar/canvas/inspector existan). En `canvas.test.ts` eliminar el test de la paleta ("la paleta lista los 10 bloques...") — se reemplaza en Task 4 por el equivalente de ContentTab/BlocksTab. Agregar en `canvas.test.ts`:

```ts
it('el toggle de device cambia el ancho del canvas', async () => {
  const wrapper = mount(EmailBuilder)
  const page = wrapper.find('.vmd-canvas-page')
  expect(page.attributes('style')).toContain('width: 600px')
  await wrapper.find('[data-device="mobile"]').trigger('click')
  expect(wrapper.find('.vmd-canvas-page').attributes('style')).toContain('width: 375px')
})
```

`preview.test.ts` y `public-api.test.ts` no cambian de aserciones (los selectores `data-action` y `.vmd-canvas-empty button` se conservan) — solo verificar que sigan pasando.

- [ ] **Step 2: Correr y ver fallar**

```bash
pnpm --filter @vue-mail-designer/builder test
```

Expected: FAIL los tests tocados.

- [ ] **Step 3: Implementar** — `CanvasBar.vue`:

```vue
<template>
  <div class="vmd-canvasbar">
    <div class="vmd-toolbar-group">
      <button type="button" class="vmd-btn" data-action="undo" :disabled="!store.canUndo" title="Deshacer (⌘Z)" @click="store.undo()">↶</button>
      <button type="button" class="vmd-btn" data-action="redo" :disabled="!store.canRedo" title="Rehacer (⌘⇧Z)" @click="store.redo()">↷</button>
    </div>
    <div class="vmd-canvasbar-center">
      <button type="button" class="vmd-btn" :class="{ 'vmd-active': ui.canvasDevice === 'desktop' }" data-device="desktop" title="Escritorio" @click="ui.canvasDevice = 'desktop'">🖥</button>
      <button type="button" class="vmd-btn" :class="{ 'vmd-active': ui.canvasDevice === 'mobile' }" data-device="mobile" title="Móvil" @click="ui.canvasDevice = 'mobile'">📱</button>
    </div>
    <div class="vmd-toolbar-group">
      <button type="button" class="vmd-btn" data-action="preview" title="Vista previa" @click="ui.previewOpen = true">👁</button>
    </div>
  </div>
</template>
```

Script: igual que el viejo toolbar (stores + handler de teclado guardado movido tal cual, con template ref en `.vmd-canvasbar` para resolver `.vmd-root`). Borrar `BuilderToolbar.vue`. `BuilderCanvas.vue`: importar `useUiStore`, usar el ancho por device. `EmailBuilder.vue`: template de arriba.

CSS:

```css
.vmd-main { display: flex; flex: 1; min-height: 0; }
.vmd-canvas-area { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.vmd-canvasbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 6px 12px; background: var(--vmd-panel); border-bottom: 1px solid var(--vmd-border);
}
.vmd-canvasbar-center { display: flex; gap: 4px; }
.vmd-canvas-page { transition: width 0.25s ease; }
```

- [ ] **Step 4: Verificar**

```bash
pnpm --filter @vue-mail-designer/builder test && pnpm typecheck
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: barra de canvas con device toggle y layout header/main estilo Unlayer"
```

---

### Task 4: SidePanel con riel de tabs, Content/Blocks/Body y modo propiedades

**Files:**
- Create: `packages/email-builder/src/components/icons.ts`, `packages/email-builder/src/components/SidePanel.vue`, `packages/email-builder/src/components/tabs/ContentTab.vue`, `packages/email-builder/src/components/tabs/BlocksTab.vue`, `packages/email-builder/src/components/tabs/BodyTab.vue`
- Rename+rework: `InspectorPanel.vue` → `packages/email-builder/src/components/PropertiesPanel.vue`
- Delete: `packages/email-builder/src/components/BlockPalette.vue`
- Modify: `EmailBuilder.vue`, `styles.css`, `tests/canvas.test.ts`, `tests/inspector.test.ts`, `tests/email-builder.test.ts`
- Test: `packages/email-builder/tests/sidepanel.test.ts` (nuevo)

**Interfaces:**
- Consumes: `ui.sidebarTab`, `store.selection`, `PALETTE_BLOCKS`/`ROW_LAYOUTS` de `palette-items.ts`, fields existentes, settings nuevos de Task 1.
- Produces:
  - `icons.ts`: `export const ICONS: Record<string, string>` — SVGs inline (strings `<svg viewBox="0 0 24 24"...>`) para: los 10 tipos de bloque + `tabContent`, `tabBlocks`, `tabBody`, `tabImages`. Trazos geométricos simples `stroke="currentColor" fill="none" stroke-width="1.6"`. Se renderizan con `v-html` (contenido estático propio, no user input).
  - `SidePanel.vue`: `aside.vmd-sidepanel` = `.vmd-sidepanel-content` + `nav.vmd-rail` (riel derecho con 4 botones `data-tab="content|blocks|body|images"`, ícono+label, activo `vmd-active`). Contenido: si `store.selection` → `<PropertiesPanel />`; si no → tab activo (`ContentTab`/`BlocksTab`/`BodyTab`; `ImagesTab` llega en Task 6 — hasta entonces el case `images` muestra `<p class="vmd-tab-placeholder">Próximamente</p>`).
  - `ContentTab.vue`: grid 3 col de `PALETTE_BLOCKS` con `ICONS[type]`, draggable clone (grupo/clone idénticos al viejo BlockPalette; incluir ya los props de DnD de Global Constraints).
  - `BlocksTab.vue`: `ROW_LAYOUTS` como miniaturas visuales — por cada layout un `.vmd-layout-thumb` (flex row de divs `.vmd-layout-cell` con `flex: widths[i]`), draggable clone grupo rows.
  - `BodyTab.vue`: fields de documento del viejo InspectorPanel (ancho, color fondo, fuente, preheader) + `AlignField`-like para `contentAlignment` (dos botones izquierda/centro), `ColorField` para `linkColor`, checkbox para `linkUnderline` (label "Subrayar links"), todos via `store.updateSettings`.
  - `PropertiesPanel.vue`: el InspectorPanel actual MENOS la rama de settings (migrada a BodyTab), MÁS header:

```vue
<div class="vmd-props-header">
  <h3>{{ title }}</h3>
  <div class="vmd-toolbar-group">
    <button type="button" class="vmd-mini-btn" title="Duplicar" data-action="props-duplicate" @click="duplicate">⧉</button>
    <button type="button" class="vmd-mini-btn vmd-mini-btn--danger" title="Eliminar" data-action="props-delete" @click="remove">🗑</button>
    <button type="button" class="vmd-mini-btn" title="Cerrar" data-action="props-close" @click="store.select(null)">✕</button>
  </div>
</div>
```

  con `title` = nombre en español del tipo (mapa local: heading→Título, text→Texto, …, row→Fila), `duplicate`/`remove` despachan a `duplicateBlock/removeBlock` o `duplicateRow/removeRow` según `selection.kind`.
  - `EmailBuilder.vue`: `<InspectorPanel />` → `<SidePanel />`.

- [ ] **Step 1: Test que falla** — `tests/sidepanel.test.ts`:

```ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import EmailBuilder from '../src/components/EmailBuilder.vue'

describe('SidePanel', () => {
  it('riel con 4 tabs; Content activo por defecto muestra los 10 bloques', () => {
    const wrapper = mount(EmailBuilder)
    expect(wrapper.findAll('.vmd-rail [data-tab]')).toHaveLength(4)
    expect(wrapper.findAll('.vmd-content-item')).toHaveLength(10)
  })

  it('tab Blocks muestra 6 miniaturas de layout', async () => {
    const wrapper = mount(EmailBuilder)
    await wrapper.find('[data-tab="blocks"]').trigger('click')
    expect(wrapper.findAll('.vmd-layout-thumb')).toHaveLength(6)
  })

  it('tab Body edita settings incluidos los nuevos', async () => {
    const wrapper = mount(EmailBuilder)
    await wrapper.find('[data-tab="body"]').trigger('click')
    expect(wrapper.text()).toContain('Preheader')
    expect(wrapper.text()).toContain('Subrayar links')
  })

  it('seleccionar un elemento muestra propiedades con acciones y cerrar vuelve al tab', async () => {
    const wrapper = mount(EmailBuilder)
    await wrapper.find('.vmd-canvas-empty button').trigger('click')
    await wrapper.find('.vmd-row').trigger('click')
    expect(wrapper.find('.vmd-props-header').exists()).toBe(true)
    expect(wrapper.text()).toContain('Fila')
    await wrapper.find('[data-action="props-close"]').trigger('click')
    expect(wrapper.find('.vmd-props-header').exists()).toBe(false)
    expect(wrapper.findAll('.vmd-content-item')).toHaveLength(10)
  })

  it('eliminar desde el header de propiedades borra la fila', async () => {
    const wrapper = mount(EmailBuilder)
    await wrapper.find('.vmd-canvas-empty button').trigger('click')
    await wrapper.find('.vmd-row').trigger('click')
    await wrapper.find('[data-action="props-delete"]').trigger('click')
    expect(wrapper.find('.vmd-row').exists()).toBe(false)
  })
})
```

Ajustar además: `inspector.test.ts` monta `PropertiesPanel` en vez de `InspectorPanel` y elimina el test "sin selección muestra settings" (reemplazado por el de BodyTab arriba); `canvas.test.ts` quita el import de `PALETTE_BLOCKS` si quedó suelto; `email-builder.test.ts` asevera `.vmd-sidepanel` en lugar de `.vmd-inspector`.

- [ ] **Step 2: Correr y ver fallar** — `pnpm --filter @vue-mail-designer/builder test`

- [ ] **Step 3: Implementar** — según Interfaces. `icons.ts` de ejemplo (patrón; completar los 14 con formas geométricas simples):

```ts
const svg = (inner: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`

export const ICONS: Record<string, string> = {
  heading: svg('<path d="M6 4v16M18 4v16M6 12h12"/>'),
  text: svg('<path d="M4 6h16M4 10h16M4 14h10"/>'),
  image: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="m5 17 4-4 3 3 4-4 3 3"/>'),
  button: svg('<rect x="3" y="8" width="18" height="8" rx="4"/><path d="M8 12h8"/>'),
  divider: svg('<path d="M4 12h16M8 6h8M8 18h8"/>'),
  spacer: svg('<path d="M12 4v4m0 8v4M8 8l4-4 4 4M8 16l4 4 4-4"/>'),
  social: svg('<circle cx="6" cy="12" r="2.5"/><circle cx="17" cy="6" r="2.5"/><circle cx="17" cy="18" r="2.5"/><path d="m8.2 10.8 6.6-3.6M8.2 13.2l6.6 3.6"/>'),
  menu: svg('<path d="M4 7h16M4 12h16M4 17h16"/>'),
  html: svg('<path d="m9 8-4 4 4 4M15 8l4 4-4 4"/>'),
  video: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m10 9 5 3-5 3z"/>'),
  tabContent: svg('<rect x="4" y="4" width="7" height="7" rx="1.5"/><circle cx="16.5" cy="7.5" r="3.5"/><path d="m5 20 3-5 3 5zM14 15h6v5h-6z"/>'),
  tabBlocks: svg('<rect x="4" y="5" width="16" height="5" rx="1"/><rect x="4" y="14" width="7" height="5" rx="1"/><rect x="13" y="14" width="7" height="5" rx="1"/>'),
  tabBody: svg('<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 9h16M9 9v11"/>'),
  tabImages: svg('<rect x="3" y="6" width="14" height="11" rx="2"/><path d="m5 15 3-3 2 2 3-3 2 2"/><path d="M19 8h2v11H8v-2"/>'),
}
```

CSS clave a agregar:

```css
.vmd-sidepanel { display: flex; flex-shrink: 0; background: var(--vmd-panel); border-left: 1px solid var(--vmd-border); }
.vmd-sidepanel-content { width: 320px; overflow-y: auto; padding: 14px; }
.vmd-rail { display: flex; flex-direction: column; border-left: 1px solid var(--vmd-border); background: var(--vmd-bg); }
.vmd-rail button {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  width: 72px; padding: 12px 0; border: 0; background: transparent; color: var(--vmd-muted);
  cursor: pointer; font-size: 11px;
}
.vmd-rail button svg { width: 22px; height: 22px; }
.vmd-rail button.vmd-active { background: var(--vmd-panel); color: var(--vmd-fg); }
.vmd-content-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.vmd-content-item {
  display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 14px 4px;
  border: 1px solid var(--vmd-border); border-radius: 8px; background: var(--vmd-panel);
  cursor: grab; font-size: 12px; color: var(--vmd-fg);
}
.vmd-content-item:hover { border-color: var(--vmd-accent); box-shadow: 0 1px 4px rgba(0,0,0,.08); }
.vmd-content-item svg { width: 24px; height: 24px; color: var(--vmd-muted); }
.vmd-layout-thumb { display: flex; gap: 3px; padding: 6px; margin-bottom: 10px; border: 1px solid var(--vmd-border); border-radius: 8px; cursor: grab; height: 56px; box-sizing: border-box; }
.vmd-layout-thumb:hover { border-color: var(--vmd-accent); }
.vmd-layout-cell { background: var(--vmd-bg); border: 1px solid var(--vmd-border); border-radius: 4px; }
.vmd-props-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.vmd-props-header h3 { margin: 0; font-size: 14px; }
.vmd-tab-placeholder { color: var(--vmd-muted); font-size: 13px; }
```

(Quitar del CSS las clases muertas `.vmd-palette*` y `.vmd-inspector` cuando se borre BlockPalette.)

- [ ] **Step 4: Verificar** — `pnpm --filter @vue-mail-designer/builder test && pnpm typecheck`

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: sidebar único con riel de tabs, Content/Blocks/Body y modo propiedades"
```

---

### Task 5: DnD fluido — forceFallback, ghost, placeholder y handles

**Files:**
- Modify: `packages/email-builder/src/components/BuilderCanvas.vue`, `RowView.vue`, `BlockView.vue`, `tabs/ContentTab.vue`, `tabs/BlocksTab.vue`, `styles.css`
- Create: `packages/email-builder/src/components/dnd.ts`
- Test: `packages/email-builder/tests/dnd.test.ts` (nuevo, verifica el contrato de opciones)

**Interfaces:**
- Produces: `dnd.ts` exporta el objeto de opciones compartido:

```ts
export const DND_OPTIONS = {
  forceFallback: true,
  fallbackOnBody: true,
  animation: 200,
  swapThreshold: 0.65,
  ghostClass: 'vmd-ghost',
  fallbackClass: 'vmd-drag-card',
} as const
```

  Todos los `<draggable>` (canvas rows, column blocks, ContentTab, BlocksTab) lo aplican con `v-bind="DND_OPTIONS"` (y conservan sus `group`/`clone`/`item-key` propios; quitar los `ghost-class`/`:animation` sueltos que queden).
- Handles: en `RowView.vue` y `BlockView.vue`, junto a duplicar/eliminar, un botón handle `✥` con clase `vmd-mini-btn vmd-drag-handle` y `title="Mover"` — visible al hover además de en selección (`.vmd-row:hover .vmd-row-actions { display: flex }` — cambiar el `v-if="isSelected"` de las actions por `v-show` + CSS hover). El elemento entero sigue arrastrable (sin `handle:` en las opciones; el ✥ es affordance visual).
- Drop highlight: `.vmd-column-empty` gana highlight cuando la columna tiene un ghost dentro (`.vmd-column-blocks:has(.vmd-ghost) + .vmd-column-empty` no aplica — más simple: la clase `.vmd-ghost` dentro de `.vmd-column-blocks` ya muestra el placeholder azul; y `.vmd-column-empty` se oculta cuando hay ghost: `.vmd-column:has(.vmd-ghost) .vmd-column-empty { display: none; }`).

- [ ] **Step 1: Test que falla** — `tests/dnd.test.ts`:

```ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import EmailBuilder from '../src/components/EmailBuilder.vue'
import { DND_OPTIONS } from '../src/components/dnd'

describe('contrato DnD', () => {
  it('opciones compartidas correctas', () => {
    expect(DND_OPTIONS.forceFallback).toBe(true)
    expect(DND_OPTIONS.animation).toBe(200)
    expect(DND_OPTIONS.ghostClass).toBe('vmd-ghost')
    expect(DND_OPTIONS.fallbackClass).toBe('vmd-drag-card')
  })

  it('los handles de mover aparecen en filas', async () => {
    const wrapper = mount(EmailBuilder)
    await wrapper.find('.vmd-canvas-empty button').trigger('click')
    await wrapper.find('.vmd-row').trigger('click')
    expect(wrapper.find('.vmd-row .vmd-drag-handle').exists()).toBe(true)
  })
})
```

- [ ] **Step 2: Correr y ver fallar**

- [ ] **Step 3: Implementar** — según Interfaces. CSS:

```css
.vmd-ghost {
  opacity: 1 !important; min-height: 36px;
  background: color-mix(in srgb, var(--vmd-accent) 12%, transparent) !important;
  border: 2px dashed var(--vmd-accent) !important; border-radius: 6px;
  outline: none;
}
.vmd-ghost > * { visibility: hidden; }
.vmd-drag-card {
  opacity: 0.92 !important; transform: scale(0.92); border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,.25); background: var(--vmd-panel);
  border: 1px solid var(--vmd-accent); cursor: grabbing !important;
}
.vmd-drag-handle { cursor: grab; }
.vmd-row-actions, .vmd-block-actions { display: none; }
.vmd-row:hover > .vmd-row-actions, .vmd-row.vmd-selected > .vmd-row-actions { display: flex; }
.vmd-block:hover > .vmd-block-actions, .vmd-block.vmd-selected > .vmd-block-actions { display: flex; }
.vmd-column:has(.vmd-ghost) .vmd-column-empty { display: none; }
```

(En RowView/BlockView cambiar `v-if="isSelected"` de las actions por render siempre + CSS de arriba, agregando el botón ✥ `vmd-drag-handle` primero en el grupo.)

- [ ] **Step 4: Verificar** — `pnpm --filter @vue-mail-designer/builder test && pnpm typecheck`

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: drag & drop fluido con forceFallback, ghost azul y handles de mover"
```

---

### Task 6: ImagesTab con Openverse y prop imageSearch

**Files:**
- Create: `packages/email-builder/src/components/tabs/ImagesTab.vue`, `packages/email-builder/src/imageSearch.ts`
- Modify: `packages/email-builder/src/options.ts`, `packages/email-builder/src/components/EmailBuilder.vue`, `packages/email-builder/src/components/SidePanel.vue` (case images), `packages/email-builder/src/index.ts`, `packages/email-builder/README.md`, `styles.css`
- Test: `packages/email-builder/tests/images-tab.test.ts`

**Interfaces:**
- Produces:
  - `imageSearch.ts`: `export type ImageResult = { url: string; thumbnailUrl: string; title?: string }` y `export async function openverseSearch(query: string): Promise<ImageResult[]>` — `fetch` a `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&license_type=commercial&page_size=20`, mapea `results[].url/thumbnail/title`, lanza `Error('No se pudo buscar imágenes.')` si `!res.ok`.
  - `BuilderOptions` gana `imageSearch?: (query: string) => Promise<ImageResult[]>`; `EmailBuilder` la acepta como prop y la incluye en el provide (getter).
  - `ImagesTab.vue`: input búsqueda (placeholder "Buscar imágenes…") con debounce 400ms; estados: inicial ("Busca imágenes gratuitas (CC) para tu email"), cargando ("Buscando…"), error, sin resultados ("Sin resultados"); grid 2 col de `<button class="vmd-image-result">` con `<img :src="thumbnailUrl">`. Click: si `store.selectedBlock?.type === 'image'` → `updateBlock(id, { src: url, alt: alt || title })`; si no → `addRow([100])` + `addBlockToColumn(colId, 'image')` + `updateBlock` con src/alt. Footer: "Imágenes de Openverse (CC)". Usa `options.imageSearch ?? openverseSearch`.
  - Export en `index.ts`: `export { openverseSearch, type ImageResult } from './imageSearch'`.
  - README: prop nueva documentada en la tabla.

- [ ] **Step 1: Test que falla** — `tests/images-tab.test.ts` (con `imageSearch` mock, sin red):

```ts
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import EmailBuilder from '../src/components/EmailBuilder.vue'

const results = [
  { url: 'https://img.example/full1.jpg', thumbnailUrl: 'https://img.example/t1.jpg', title: 'Uno' },
  { url: 'https://img.example/full2.jpg', thumbnailUrl: 'https://img.example/t2.jpg', title: 'Dos' },
]

async function searchIn(wrapper: ReturnType<typeof mount>) {
  await wrapper.find('[data-tab="images"]').trigger('click')
  const input = wrapper.find('.vmd-image-search input')
  await input.setValue('futbol')
  await new Promise((r) => setTimeout(r, 450)) // debounce
  await flushPromises()
}

describe('ImagesTab', () => {
  it('busca con la función inyectada y muestra resultados', async () => {
    const imageSearch = vi.fn().mockResolvedValue(results)
    const wrapper = mount(EmailBuilder, { props: { imageSearch } })
    await searchIn(wrapper)
    expect(imageSearch).toHaveBeenCalledWith('futbol')
    expect(wrapper.findAll('.vmd-image-result')).toHaveLength(2)
  })

  it('click sin selección inserta un bloque imagen nuevo con el src', async () => {
    const wrapper = mount(EmailBuilder, { props: { imageSearch: vi.fn().mockResolvedValue(results) } })
    await searchIn(wrapper)
    await wrapper.find('.vmd-image-result').trigger('click')
    const emitted = wrapper.emitted('update:design')
    const design = emitted![emitted!.length - 1][0] as { rows: { columns: { blocks: { type: string; src?: string }[] }[] }[] }
    const blocks = design.rows.flatMap((r) => r.columns.flatMap((c) => c.blocks))
    expect(blocks.some((b) => b.type === 'image' && b.src === 'https://img.example/full1.jpg')).toBe(true)
  })

  it('muestra error si la búsqueda falla', async () => {
    const wrapper = mount(EmailBuilder, { props: { imageSearch: vi.fn().mockRejectedValue(new Error('boom')) } })
    await searchIn(wrapper)
    expect(wrapper.find('.vmd-image-error').exists()).toBe(true)
  })
})
```

- [ ] **Step 2: Correr y ver fallar**

- [ ] **Step 3: Implementar** según Interfaces. CSS:

```css
.vmd-image-search input { width: 100%; box-sizing: border-box; padding: 8px 10px; border: 1px solid var(--vmd-border); border-radius: 8px; background: var(--vmd-bg); color: var(--vmd-fg); }
.vmd-image-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px; }
.vmd-image-result { padding: 0; border: 1px solid var(--vmd-border); border-radius: 8px; overflow: hidden; cursor: pointer; background: none; }
.vmd-image-result img { display: block; width: 100%; height: 90px; object-fit: cover; }
.vmd-image-result:hover { border-color: var(--vmd-accent); }
.vmd-image-error { color: var(--vmd-danger); font-size: 13px; margin-top: 10px; }
.vmd-image-credit { margin-top: 12px; font-size: 11px; color: var(--vmd-muted); text-align: center; }
```

- [ ] **Step 4: Verificar** — `pnpm --filter @vue-mail-designer/builder test && pnpm typecheck`

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: tab de imágenes con Openverse y prop imageSearch"
```

---

### Task 7: Verificación integral, build y cierre

**Files:**
- Modify: `packages/email-builder/README.md` (capturas de API ya hechas en Task 6; revisar limitaciones), `packages/email-builder/src/styles.css` (limpieza de clases muertas)

**Interfaces:** cierre — sin código nuevo salvo fixes.

- [ ] **Step 1: Limpieza** — grep de clases CSS sin uso (`.vmd-palette*`, `.vmd-inspector`, `.vmd-toolbar` si quedó huérfana tras CanvasBar — `.vmd-toolbar-group` SÍ se usa) y de imports muertos. `pnpm check` completo.

- [ ] **Step 2: Build + smoke**

```bash
pnpm --filter @vue-mail-designer/builder build
node -e "import('./packages/email-builder/dist/index.js').then(m => { const req = ['EmailBuilder','renderHtml','createDocument','useDocumentStore','BUILTIN_TEMPLATES','openverseSearch']; const missing = req.filter(k => !(k in m)); if (missing.length) { console.error('FALTAN:', missing); process.exit(1); } console.log('exports OK'); })"
pnpm --filter demo build
```

Expected: `exports OK`, builds limpios.

- [ ] **Step 3: Verificación en browser (la hace el controller):** layout Unlayer completo, tabs, propiedades con header, device toggle animado, EXPORT menu, Images con búsqueda real (Openverse), y **gestos de drag reales** (posibles ahora con forceFallback): arrastrar bloque de Content a una columna, arrastrar layout de Blocks al canvas, reordenar filas — verificando tarjeta que sigue el cursor + placeholder azul.

- [ ] **Step 4: Commit final**

```bash
git add -A && git commit -m "chore: limpieza de CSS muerto y verificación integral del rediseño"
```

---

## Self-Review (completado por el autor del plan)

**Cobertura del spec:** header oscuro+EXPORTAR (T2), barra canvas+device+ojo (T3), canvas centrado sin paleta (T3-T4), sidebar 4 tabs+riel (T4, Images en T6), modo propiedades con header de acciones (T4), settings nuevos schema+renderer+BodyTab (T1, T4), DnD fluido forceFallback+ghost+handles+highlight (T5), Openverse+prop imageSearch (T6), JSON v1 sin migración (T1 test), verificación browser con gestos (T7), build+README (T6-T7). ✅ completo.

**Placeholders:** los SVG de `icons.ts` se dan como patrón con 14 entradas reales de ejemplo — el implementer puede ajustar trazos, el test no depende del path exacto. El script de CanvasBar referencia "igual que el viejo toolbar... movido tal cual": el código fuente existe en el repo (BuilderToolbar.vue) y la instrucción es moverlo, no reescribirlo — aceptable.

**Consistencia de tipos:** `ImageResult` idéntico en spec/plan/`imageSearch.ts`/options; `DND_OPTIONS` nombres de sortablejs correctos vía vuedraggable (camelCase en objeto v-bind); `canvasDevice`/`sidebarTab` consistentes entre store (T2) y consumidores (T3/T4); selectores `data-action`/`data-device`/`data-tab` consistentes entre componentes y tests.

**Riesgos señalados:** (a) `:has()` en CSS requiere navegadores modernos — aceptable (builder, no email); (b) vuedraggable pasa opciones extra vía atributos kebab-case o objeto — usar `v-bind="DND_OPTIONS"` funciona porque vuedraggable reenvía props desconocidas a Sortable; si algún nombre no llega, fallback a props kebab explícitas (`:force-fallback="true"` etc.) — el implementer de T5 debe verificar en el DOM que el fallback se active (clase `.vmd-drag-card` presente al arrastrar).
