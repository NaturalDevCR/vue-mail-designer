# Fase B — Schema rico + elementos nuevos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 3 bloques nuevos (tabla, galería, timer) + propiedades ricas (ocultar por dispositivo en bloque/fila, imagen de fondo de fila, borde/radio de columna, fuente por bloque), con retrocompatibilidad total.

**Architecture:** schema Zod primero (campos nuevos opcionales/con default → JSON v1 valida sin migración), luego renderer, luego canvas (BlockView), luego inspector + paleta. El renderer envuelve cada bloque/fila con clases de ocultamiento y emite una media query fija en `<head>`.

**Tech Stack:** el existente. **Spec:** `docs/superpowers/specs/2026-07-20-fase-b-schema-rico-design.md`

## Global Constraints

- Clean-room: identidad propia (`vmd-*`), íconos SVG propios, sin assets/marcas de terceros. Strings de UI en español; `type="button"` en botones.
- Retrocompatibilidad: todo campo nuevo es `.optional()` o `.default(...)` en Zod; `zEmailDocument.safeParse` de un doc v1 (sin los campos) debe seguir dando `success: true`.
- HTML de email: solo tablas `role="presentation"`, estilos inline, sin flex/grid/position; hide desktop/mobile vía clases + media query en `<head>`.
- API pública intacta. Cada tarea: suite completa + typecheck verdes y un commit.

---

### Task 1: Schema y factories — campos ricos + 3 bloques nuevos

**Files:**
- Modify: `packages/email-builder/src/schema/document.ts`, `packages/email-builder/src/schema/factories.ts`
- Test: `packages/email-builder/tests/schema-fase-b.test.ts` (nuevo)

**Interfaces (producidas):**
- Tipo compartido `zVisibility = { hideDesktop?: boolean; hideMobile?: boolean }` fusionado en cada bloque y en `zRow` (campos opcionales sueltos, no un sub-objeto — para que el discriminated union no se rompa: se agregan `hideDesktop: z.boolean().optional()` y `hideMobile: z.boolean().optional()` a cada schema de bloque y a `zRow`).
- `zRow.style` gana `backgroundImage: z.object({ url: z.string(), repeat: z.enum(['no-repeat','repeat','repeat-x','repeat-y']), size: z.enum(['auto','cover','contain']), position: z.string() }).optional()`.
- `zColumn.style` gana `border: z.object({ width: z.number(), style: z.enum(['solid','dashed','dotted']), color: z.string() }).optional()` y `borderRadius: z.number().optional()`.
- `zHeadingBlock` y `zTextBlock` ganan `fontFamily: z.string().optional()` (nivel bloque, no dentro de style).
- Nuevos: `zTableBlock`, `zGalleryBlock`, `zTimerBlock` en el union; tipos `TableBlock`, `GalleryBlock`, `TimerBlock` exportados.
- `BLOCK_TYPES` suma `'table','gallery','timer'` al final.
- `createBlock` cubre los 3 nuevos.

- [ ] **Step 1: Test que falla** — `tests/schema-fase-b.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { BLOCK_TYPES, createBlock, createDocument, createRow, zEmailDocument } from '../src/schema'
import type { GalleryBlock, TableBlock, TimerBlock } from '../src/schema'

describe('schema fase B', () => {
  it('BLOCK_TYPES incluye los 3 nuevos', () => {
    expect(BLOCK_TYPES).toContain('table')
    expect(BLOCK_TYPES).toContain('gallery')
    expect(BLOCK_TYPES).toContain('timer')
    expect(BLOCK_TYPES).toHaveLength(13)
  })

  it('cada bloque nuevo tiene factory válida', () => {
    for (const t of ['table', 'gallery', 'timer'] as const) {
      const doc = createDocument()
      const row = createRow([100])
      row.columns[0].blocks.push(createBlock(t))
      doc.rows.push(row)
      expect(zEmailDocument.safeParse(doc).success, t).toBe(true)
    }
  })

  it('un JSON v1 sin campos nuevos valida (retrocompat)', () => {
    // documento mínimo v1 con una fila/columna/heading SIN hideDesktop/backgroundImage/border/fontFamily
    const v1 = {
      version: 1,
      settings: { contentWidth: 600, backgroundColor: '#fff', fontFamily: 'Arial', preheader: '' },
      rows: [{ id: 'r', style: { backgroundColor: '#fff', padding: { top: 0, right: 0, bottom: 0, left: 0 }, borderRadius: 0 },
        columns: [{ id: 'c', widthPct: 100, style: { backgroundColor: 'transparent', padding: { top: 0, right: 0, bottom: 0, left: 0 } },
          blocks: [{ id: 'b', type: 'heading', text: 'Hi', level: 1, style: { color: '#000', fontSize: 20, align: 'left', padding: { top: 0, right: 0, bottom: 0, left: 0 } } }] }] }],
    }
    expect(zEmailDocument.safeParse(v1).success).toBe(true)
  })

  it('hideDesktop/hideMobile son opcionales en bloque y fila', () => {
    const row = createRow([100])
    row.hideMobile = true
    const block = createBlock('text')
    block.hideDesktop = true
    row.columns[0].blocks.push(block)
    const doc = createDocument()
    doc.rows.push(row)
    expect(zEmailDocument.safeParse(doc).success).toBe(true)
  })

  it('defaults de tabla/galería/timer', () => {
    const table = createBlock('table') as TableBlock
    expect(table.rows.length).toBeGreaterThan(0)
    const gallery = createBlock('gallery') as GalleryBlock
    expect([2, 3, 4]).toContain(gallery.columns)
    const timer = createBlock('timer') as TimerBlock
    expect(typeof timer.endDate).toBe('string')
  })
})
```

- [ ] **Step 2: correr y ver fallar** — `pnpm --filter @vue-mail-designer/builder test tests/schema-fase-b.test.ts`

- [ ] **Step 3: Implementar** — en `document.ts`:

Agregar a CADA schema de bloque existente (heading, text, image, button, divider, spacer, social, menu, html, video) las dos líneas dentro del `z.object({...})`:
```ts
  hideDesktop: z.boolean().optional(),
  hideMobile: z.boolean().optional(),
```
(y a `zHeadingBlock`/`zTextBlock` además `fontFamily: z.string().optional()`.)

Nuevos schemas (antes de `zBlock`):
```ts
export const zTableBlock = z.object({
  id: z.string(),
  type: z.literal('table'),
  rows: z.array(z.array(z.string())),
  headerRow: z.boolean(),
  style: z.object({
    borderColor: z.string(),
    borderWidth: z.number(),
    cellPadding: z.number(),
    headerBackground: z.string(),
    fontSize: z.number(),
    color: z.string(),
    padding: zPadding,
  }),
  hideDesktop: z.boolean().optional(),
  hideMobile: z.boolean().optional(),
})

export const zGalleryBlock = z.object({
  id: z.string(),
  type: z.literal('gallery'),
  images: z.array(z.object({ src: z.string(), alt: z.string(), href: z.string().optional() })),
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]),
  gap: z.number(),
  style: z.object({ padding: zPadding }),
  hideDesktop: z.boolean().optional(),
  hideMobile: z.boolean().optional(),
})

export const zTimerBlock = z.object({
  id: z.string(),
  type: z.literal('timer'),
  endDate: z.string(),
  imageUrl: z.string(),
  alt: z.string(),
  widthPct: z.number().min(10).max(100),
  style: z.object({ padding: zPadding }),
  hideDesktop: z.boolean().optional(),
  hideMobile: z.boolean().optional(),
})
```
Añadir los tres a `zBlock` (discriminatedUnion) y exportar tipos `TableBlock/GalleryBlock/TimerBlock`.

`zRow` gana `hideDesktop`/`hideMobile` opcionales (sueltos, no en style) y `zRow.style` gana `backgroundImage` opcional (ver Interfaces). `zColumn.style` gana `border` y `borderRadius` opcionales.

En `factories.ts`: `BLOCK_TYPES` += `'table','gallery','timer'`. En `createBlock`, cases nuevos:
```ts
    case 'table':
      return {
        id, type,
        rows: [['Encabezado 1', 'Encabezado 2'], ['Celda', 'Celda'], ['Celda', 'Celda']],
        headerRow: true,
        style: { borderColor: '#e5e7eb', borderWidth: 1, cellPadding: 8, headerBackground: '#f4f4f5', fontSize: 14, color: '#374151', padding: pad(8, 24, 8, 24) },
      }
    case 'gallery':
      return {
        id, type,
        images: [{ src: '', alt: '' }, { src: '', alt: '' }],
        columns: 2, gap: 8,
        style: { padding: pad(8, 24, 8, 24) },
      }
    case 'timer':
      return {
        id, type,
        endDate: new Date(Date.now() + 7 * 864e5).toISOString(),
        imageUrl: '', alt: 'Cuenta regresiva', widthPct: 100,
        style: { padding: pad(8, 24, 8, 24) },
      }
```

- [ ] **Step 4: Verificar** — `pnpm --filter @vue-mail-designer/builder test && pnpm typecheck`
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: schema rico — ocultar por dispositivo, bg de fila, borde de columna, fuente por bloque y bloques tabla/galería/timer"`

---

### Task 2: Renderer — ocultamiento, bg de fila, borde de columna, fuente por bloque

**Files:**
- Modify: `packages/email-builder/src/render/html.ts`
- Test: `packages/email-builder/tests/render-fase-b.test.ts` (nuevo)

**Interfaces (producidas):**
- `wrapHidden(html: string, hideDesktop?: boolean, hideMobile?: boolean): string` — si no hay flags, devuelve `html` intacto; si hay, lo envuelve en `<div class="vmd-hide-desktop|vmd-hide-mobile" style="...">`. hideDesktop usa `display:none;max-height:0;overflow:hidden;mso-hide:all` inline. (Si ambos flags, dos clases; el estilo inline solo lo pone hideDesktop.)
- `renderBlock` aplica `wrapHidden(inner, block.hideDesktop, block.hideMobile)` al resultado de cada case (envolver en el punto de retorno común — refactor: `renderBlock` calcula `inner` y retorna `wrapHidden(inner, ...)`).
- heading/text usan `block.fontFamily ?? ctx.fontFamily`.
- `renderRow` envuelve su tabla con `wrapHidden(..., row.hideDesktop, row.hideMobile)`; el `<td>` contenedor suma bg image (atributo `background` + estilos) si `row.style.backgroundImage`; el `<td>` interno de columna suma `border`/`border-radius` si `col.style.border`/`borderRadius`.
- `renderHtml` agrega al `<style>` del head las reglas: `.vmd-hide-desktop{display:none;...}` fuera de media query NO (queda oculto por inline); dentro de `@media (max-width:480px)`: `.vmd-hide-desktop{display:block!important;max-height:none!important} .vmd-hide-mobile{display:none!important}`.

- [ ] **Step 1: Test que falla** — `tests/render-fase-b.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { renderHtml } from '../src/render/html'
import { createBlock, createDocument, createRow } from '../src/schema'
import type { HeadingBlock } from '../src/schema'

function docWith(build: (doc: ReturnType<typeof createDocument>) => void) {
  const doc = createDocument()
  build(doc)
  return renderHtml(doc)
}

describe('renderer fase B — props ricas', () => {
  it('hideMobile emite la clase y la media query', () => {
    const html = docWith((doc) => {
      const row = createRow([100])
      const b = createBlock('text'); b.hideMobile = true
      row.columns[0].blocks.push(b); doc.rows.push(row)
    })
    expect(html).toContain('vmd-hide-mobile')
    expect(html).toContain('.vmd-hide-mobile')
    expect(html).toMatch(/@media[^}]*max-width:\s*480px/)
  })

  it('hideDesktop emite inline display:none y regla de reaparición', () => {
    const html = docWith((doc) => {
      const row = createRow([100])
      const b = createBlock('text'); b.hideDesktop = true
      row.columns[0].blocks.push(b); doc.rows.push(row)
    })
    expect(html).toContain('vmd-hide-desktop')
    expect(html).toMatch(/vmd-hide-desktop[^>]*display:none/)
    expect(html).toContain('display:block !important')
  })

  it('fila con imagen de fondo emite background y estilos', () => {
    const html = docWith((doc) => {
      const row = createRow([100])
      row.style.backgroundImage = { url: 'https://cdn.x/bg.jpg', repeat: 'no-repeat', size: 'cover', position: 'center' }
      doc.rows.push(row)
    })
    expect(html).toContain('background="https://cdn.x/bg.jpg"')
    expect(html).toContain('background-image:url(https://cdn.x/bg.jpg)')
    expect(html).toContain('background-size:cover')
  })

  it('columna con borde y radio', () => {
    const html = docWith((doc) => {
      const row = createRow([100])
      row.columns[0].style.border = { width: 2, style: 'solid', color: '#ff0000' }
      row.columns[0].style.borderRadius = 8
      doc.rows.push(row)
    })
    expect(html).toContain('border:2px solid #ff0000')
    expect(html).toContain('border-radius:8px')
  })

  it('fuente por bloque sobreescribe la del documento', () => {
    const html = docWith((doc) => {
      const row = createRow([100])
      const h = createBlock('heading') as HeadingBlock; h.fontFamily = 'Georgia, serif'
      row.columns[0].blocks.push(h); doc.rows.push(row)
    })
    expect(html).toContain('font-family:Georgia, serif')
  })
})
```

- [ ] **Step 2: correr y ver fallar**
- [ ] **Step 3: Implementar** según Interfaces. `wrapHidden`:
```ts
function wrapHidden(html: string, hideDesktop?: boolean, hideMobile?: boolean): string {
  if (!hideDesktop && !hideMobile) return html
  const classes = [hideDesktop && 'vmd-hide-desktop', hideMobile && 'vmd-hide-mobile'].filter(Boolean).join(' ')
  const inline = hideDesktop ? ' style="display:none;max-height:0;overflow:hidden;mso-hide:all;"' : ''
  return `<div class="${classes}"${inline}>${html}</div>`
}
```
Refactor de `renderBlock`: cada case arma `inner` (lo que hoy retorna) y al final `return wrapHidden(inner, block.hideDesktop, block.hideMobile)`. Nota: `spacer`/`html` no tienen hideDesktop en el union porque se agregaron a todos en Task 1 — sí los tienen. heading/text usan `const fam = block.fontFamily ?? ctx.fontFamily`. En `renderRow`, calcular bg image y border/radius; envolver el return con `wrapHidden(rowTable, row.hideDesktop, row.hideMobile)`. En el `<style>` del head agregar `.vmd-hide-desktop{display:none;mso-hide:all;}` y dentro del media query las dos reglas de override.

- [ ] **Step 4: Verificar** — suite + typecheck. Revisar que los snapshots existentes (render.test, render-blocks, render-blocks2, render-settings) NO cambien (los flags nuevos son opcionales y ausentes en esos fixtures) — si cambian, investigar antes de `-u`.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: renderer — ocultar por dispositivo, bg de fila, borde de columna y fuente por bloque"`

---

### Task 3: Renderer — tabla, galería y timer

**Files:**
- Modify: `packages/email-builder/src/render/html.ts` (3 cases nuevos en `renderBlock`)
- Test: `packages/email-builder/tests/render-fase-b-blocks.test.ts` (nuevo)

**Interfaces:** cases `table`, `gallery`, `timer` en el switch (queda exhaustivo con los 13 tipos). `renderTable`, `renderGallery`, `renderTimer` como funciones internas.

- [ ] **Step 1: Test que falla** — `tests/render-fase-b-blocks.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { renderHtml } from '../src/render/html'
import { createBlock, createDocument, createRow } from '../src/schema'
import type { Block, GalleryBlock, TableBlock, TimerBlock } from '../src/schema'

function render(block: Block): string {
  const doc = createDocument(); const row = createRow([100])
  row.columns[0].blocks.push(block); doc.rows.push(row)
  return renderHtml(doc)
}

describe('renderer fase B — bloques nuevos', () => {
  it('tabla con header usa th y escapa celdas', () => {
    const t = createBlock('table') as TableBlock
    t.rows = [['A & B', 'C'], ['<x>', 'y']]; t.headerRow = true
    const html = render(t)
    expect(html).toContain('<th')
    expect(html).toContain('A &amp; B')
    expect(html).toContain('&lt;x&gt;')
  })

  it('tabla sin header solo td', () => {
    const t = createBlock('table') as TableBlock
    t.headerRow = false
    expect(render(t)).not.toContain('<th')
  })

  it('galería renderiza N imágenes en filas de `columns`', () => {
    const g = createBlock('gallery') as GalleryBlock
    g.columns = 2
    g.images = [
      { src: 'https://x/1.jpg', alt: 'uno' }, { src: 'https://x/2.jpg', alt: 'dos' },
      { src: 'https://x/3.jpg', alt: 'tres' },
    ]
    const html = render(g)
    expect((html.match(/<img/g) ?? []).length).toBe(3)
    expect(html).toContain('https://x/2.jpg')
  })

  it('timer con imageUrl renderiza img linkeable', () => {
    const t = createBlock('timer') as TimerBlock
    t.imageUrl = 'https://timers.x/abc.gif'
    const html = render(t)
    expect(html).toContain('src="https://timers.x/abc.gif"')
  })

  it('timer sin imageUrl renderiza caja estática con días restantes', () => {
    const t = createBlock('timer') as TimerBlock
    t.imageUrl = ''
    t.endDate = new Date(Date.now() + 3 * 864e5).toISOString()
    const html = render(t)
    expect(html).toMatch(/vmd-timer-static/)
  })
})
```

- [ ] **Step 2: correr y ver fallar**
- [ ] **Step 3: Implementar** — cases nuevos:
```ts
    case 'table': {
      const s = block.table // ver nota
      // helper renderTable
    }
```
Concretamente, funciones internas:
```ts
function renderTable(block: TableBlock): string {
  const s = block.style
  const rows = block.rows.map((cells, r) => {
    const tag = block.headerRow && r === 0 ? 'th' : 'td'
    const bg = block.headerRow && r === 0 ? `background-color:${s.headerBackground};` : ''
    const tds = cells.map((c) =>
      `<${tag} style="border:${s.borderWidth}px solid ${s.borderColor};padding:${s.cellPadding}px;font-size:${s.fontSize}px;color:${s.color};text-align:left;">${escapeHtml(c)}</${tag}>`,
    ).join('')
    return `<tr>${tds}</tr>`
  }).join('')
  return cellTable(
    `<tr><td style="padding:${paddingCss(s.padding)};">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">${rows}</table>` +
    `</td></tr>`,
  )
}

function renderGallery(block: GalleryBlock): string {
  const s = block.style
  const cols = block.columns
  const cellW = Math.floor(100 / cols)
  const withSrc = block.images.filter((i) => i.src)
  const cells = withSrc.map((im) => {
    const img = `<img src="${escapeHtml(im.src)}" alt="${escapeHtml(im.alt)}" width="100%" style="display:block;width:100%;max-width:100%;height:auto;border:0;">`
    const inner = im.href ? `<a href="${escapeHtml(im.href)}" target="_blank">${img}</a>` : img
    return `<td width="${cellW}%" style="padding:${block.gap / 2}px;" valign="top">${inner}</td>`
  })
  // agrupar en filas de `cols`
  const trs: string[] = []
  for (let i = 0; i < cells.length; i += cols) {
    trs.push(`<tr>${cells.slice(i, i + cols).join('')}</tr>`)
  }
  return cellTable(
    `<tr><td style="padding:${paddingCss(s.padding)};">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${trs.join('')}</table>` +
    `</td></tr>`,
  )
}

function renderTimer(block: TimerBlock): string {
  const s = block.style
  if (block.imageUrl) {
    return cellTable(
      `<tr><td align="center" style="padding:${paddingCss(s.padding)};">` +
      `<img src="${escapeHtml(block.imageUrl)}" alt="${escapeHtml(block.alt)}" width="${block.widthPct}%" style="display:block;max-width:100%;height:auto;border:0;margin:0 auto;">` +
      `</td></tr>`,
    )
  }
  const days = Math.max(0, Math.ceil((new Date(block.endDate).getTime() - Date.now()) / 864e5))
  return cellTable(
    `<tr><td align="center" class="vmd-timer-static" style="padding:${paddingCss(s.padding)};font-family:Arial,sans-serif;font-size:28px;font-weight:bold;color:#111827;">` +
    `${days} ${days === 1 ? 'día' : 'días'}` +
    `</td></tr>`,
  )
}
```
En el switch: `case 'table': return renderTable(block)` etc. (el `wrapHidden` de Task 2 se aplica igual porque `renderBlock` envuelve el resultado — asegurar que estos tres pasen por el mismo `return wrapHidden(inner, ...)`; ajustar el refactor de Task 2 para que los tres también se envuelvan). Importar los tipos nuevos.

- [ ] **Step 4: Verificar** — suite + typecheck; snapshots viejos sin cambios.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: renderer de tabla, galería y timer"`

---

### Task 4: BlockView — vista de canvas de tabla/galería/timer + badge de oculto

**Files:**
- Modify: `packages/email-builder/src/components/BlockView.vue`, `packages/email-builder/src/styles.css`
- Test: `packages/email-builder/tests/block-view-fase-b.test.ts` (nuevo)

**Interfaces:**
- BlockView agrega ramas `v-else-if` para `table` (tabla HTML con thead/tbody aproximado), `gallery` (grid CSS de miniaturas o placeholders si sin src), `timer` (si imageUrl → `<img>`; si no → caja "N días").
- Badge de oculto: cuando `block.hideMobile` y `ui.canvasDevice === 'mobile'`, o `block.hideDesktop` y `ui.canvasDevice === 'desktop'`, mostrar un pequeño `<span class="vmd-hidden-badge">Oculto aquí</span>` sobre el bloque (no lo esconde — es edición). Importa `useUiStore`.

- [ ] **Step 1: Test que falla** — `tests/block-view-fase-b.test.ts` (montar BlockView via Host con BUILDER_PINIA_KEY, patrón de `block-view.test.ts`):

```ts
// tabla muestra celdas; gallery sin src muestra placeholders; timer sin imageUrl muestra días;
// badge aparece si canvasDevice==='mobile' y block.hideMobile
```
(seguir el patrón existente de `block-view.test.ts`: Host component que provee `BUILDER_PINIA_KEY`; para el badge, setear `useUiStore(pinia).canvasDevice = 'mobile'` y el block con `hideMobile: true`.)

- [ ] **Step 2: correr y ver fallar**
- [ ] **Step 3: Implementar** — ramas nuevas en el template siguiendo el estilo de las existentes; CSS `.vmd-b-table`, `.vmd-b-gallery` (grid), `.vmd-hidden-badge` (badge absolute esquina). Timer reutiliza `.vmd-b-image-placeholder` cuando no hay imageUrl mostrando "N días".
- [ ] **Step 4: Verificar** — suite + typecheck.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: canvas de tabla/galería/timer y badge de bloque oculto"`

---

### Task 5: Inspector, paleta e íconos de los bloques nuevos + campos ricos

**Files:**
- Modify: `packages/email-builder/src/components/PropertiesPanel.vue`, `packages/email-builder/src/components/tabs/ContentTab.vue` (usa `PALETTE_BLOCKS`, ya cubre los nuevos por Task 1), `packages/email-builder/src/components/palette-items.ts` (labels de los nuevos), `packages/email-builder/src/components/icons.ts` (3 íconos), `packages/email-builder/src/components/tabs/BodyTab.vue` (no cambia), `styles.css`
- Create: `packages/email-builder/src/components/fields/CheckboxField.vue`
- Test: `packages/email-builder/tests/inspector-fase-b.test.ts` (nuevo)

**Interfaces:**
- `palette-items.ts`: agregar a `PALETTE_BLOCKS` `{ type: 'table', label: 'Tabla' }`, `{ type: 'gallery', label: 'Galería' }`, `{ type: 'timer', label: 'Timer' }` (el campo `icon` ya no se usa desde Fase 2; solo type+label).
- `icons.ts`: `ICONS.table`, `ICONS.gallery`, `ICONS.timer` (SVG propios, trazos geométricos).
- `CheckboxField.vue`: contrato `{ label: string; modelValue: boolean }` + emit `update:modelValue`.
- `PropertiesPanel.vue`:
  - Bloque `table`: editar dimensiones (agregar/quitar fila y columna), toggle `headerRow`, colores/borde/padding. (Editor de celdas: textareas o inputs por celda en una grilla compacta; mantener simple — un `<textarea>` por celda.)
  - Bloque `gallery`: lista de imágenes (URL+alt+href, agregar/quitar, reusar patrón de social/menu), `columns` (SelectField 2/3/4), `gap` (NumberField), padding.
  - Bloque `timer`: `endDate` (input datetime-local → ISO), `imageUrl` (TextField), `alt`, `widthPct`, padding.
  - **Sección "Visibilidad"** al final de CADA panel de bloque y del panel de fila: dos `CheckboxField` "Ocultar en escritorio" / "Ocultar en móvil" ligados a `hideDesktop`/`hideMobile` (via `store.updateBlock`/`store.updateRowStyle`… OJO: hide está en el bloque/fila, no en style — usar `store.updateBlock(id, { hideMobile })` y para fila una action que setee en la fila, no en style). **Nota:** `updateRowStyle` escribe en `row.style`; hide va en `row` directo → agregar mini-action `updateRow(id, patch)` al store (document.ts) o reutilizar: el store ya tiene `updateRowStyle`; agregar `updateRow(id, patch)` que hace deepMerge sobre la fila. Incluir esta action en Task 5 (es chica) y su test en el archivo de inspector.
  - Panel de fila: agregar imagen de fondo (TextField URL + selects repeat/size + TextField position) via `updateRowStyle({ backgroundImage: {...} })`.
  - Panel de columna: como no hay selección de columna independiente hoy (solo fila/bloque), el borde/radio de columna se edita en el panel de **fila** aplicando a `columns[0]`… NO — mejor: dejar el borde de columna fuera del inspector en esta fase (el schema y renderer lo soportan para import; UI de columna llega cuando haya selección de columna). Documentar: "borde/radio de columna: soportado en schema/render e import; sin UI dedicada en Fase B".
  - heading/text: agregar `SelectField` "Fuente" con opciones email-safe (Arial, Georgia, 'Times New Roman', Verdana, Tahoma, 'Courier New') + la del documento; liga a `fontFamily` (undefined = heredar → opción "Heredar").

- [ ] **Step 1: Test que falla** — `tests/inspector-fase-b.test.ts`: seleccionar un bloque table/gallery/timer muestra sus campos; toggle "Ocultar en móvil" setea `hideMobile` en el store; `store.updateRow` existe y aplica patch a la fila (no a style).

- [ ] **Step 2: correr y ver fallar**
- [ ] **Step 3: Implementar** — `updateRow` en `document.ts` (deepMerge sobre la fila, con `commit('row:'+id)`), `CheckboxField.vue`, ramas del inspector, íconos, labels de paleta, sección Visibilidad. Verificar que ContentTab ahora muestre 13 items (PALETTE_BLOCKS creció) — adaptar el test de sidepanel que asevera `toHaveLength(10)` → 13.
- [ ] **Step 4: Verificar** — suite + typecheck.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: inspector y paleta de tabla/galería/timer + visibilidad por dispositivo y fuente por bloque"`

---

### Task 6: Verificación integral, build y cierre

- [ ] **Step 1 (controller, browser):** agregar Tabla, Galería y Timer desde Contenido; editar cada uno; marcar un bloque "ocultar en móvil" y ver el badge; exportar HTML y confirmar en el texto exportado las clases `vmd-hide-mobile`/media query, `<th>` de tabla, imgs de galería, timer. Fila con bg image y fuente por bloque.
- [ ] **Step 2:** `pnpm typecheck && pnpm test` + build librería + demo (smoke de exports incluye los tipos nuevos si se exportan desde schema — ya salen por `export * from './schema'`).
- [ ] **Step 3:** commit final si hubo fixes; actualizar README con los bloques nuevos y las props (tabla de features).

---

## Self-Review

**Cobertura:** schema+factories (T1), renderer props ricas (T2), renderer bloques (T3), canvas+badge (T4), inspector+paleta+íconos+visibilidad (T5), verificación (T6). **Placeholders:** código completo en schema/renderer (T1-T3); UI (T4-T5) descrita con precisión siguiendo patrones existentes del repo. **Consistencia:** `hideDesktop/hideMobile` como campos sueltos opcionales en bloque y fila (no sub-objeto, para no romper el discriminated union) — consistente entre schema (T1), renderer wrapHidden (T2/T3), canvas badge (T4), inspector (T5). `updateRow` nueva action introducida y testeada en T5. **Riesgos señalados:** (a) borde/radio de columna sin UI en Fase B (schema+render sí) — documentado, no bloquea import; (b) el refactor de `renderBlock` para envolver con `wrapHidden` debe cubrir los 13 cases incluyendo tabla/galería/timer de T3 — T3 Step 3 lo recuerda; (c) `ContentTab` pasa de 10 a 13 items → adaptar aserción de sidepanel.test (recordado en T5 Step 3).
