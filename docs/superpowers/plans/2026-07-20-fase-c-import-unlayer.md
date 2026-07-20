# Fase C — Import de Unlayer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Importar diseños de Unlayer a nuestro `EmailDocument`, por JSON pegado o por URL del studio, con reporte de advertencias y sin fallar nunca.

**Architecture:** conversor puro (`src/import/unlayer.ts`) probado con fixtures sintéticos propios; loader de URL con fetch inyectable (`src/import/unlayerUrl.ts`); diálogo de UI; proxy en la demo. Clean-room: importamos el formato de datos, no código/assets de Unlayer.

**Tech Stack:** el existente. **Spec:** `docs/superpowers/specs/2026-07-20-fase-c-import-unlayer-design.md`

## Global Constraints

- Clean-room: sin código/assets/marcas de terceros; fixtures de test escritos por nosotros (no plantillas reales de Unlayer). Strings UI en español; `type="button"`.
- El conversor NUNCA lanza por contenido inesperado: tipos/campos desconocidos → advertencia + omisión; solo `extractUnlayerDesign` lanza (JSON con forma irreconocible) y el llamador lo captura.
- El resultado de `unlayerToDocument` DEBE pasar `zEmailDocument.parse` (con defaults) antes de devolverse.
- API pública: solo aditiva — nueva prop `unlayerFetch?` y nuevos exports. Nada removido.
- Cada tarea: suite completa + typecheck verdes y un commit.

---

### Task 1: Helpers de parseo + conversor core (settings, filas, columnas, bloques comunes)

**Files:**
- Create: `packages/email-builder/src/import/unlayer.ts`
- Modify: `packages/email-builder/src/index.ts`
- Test: `packages/email-builder/tests/unlayer-import.test.ts`

**Interfaces (producidas):**
- `parseShorthandPadding(s: string | undefined): Padding` — CSS shorthand 1/2/3/4 valores en px; `undefined`/`''` → `{0,0,0,0}`.
- `parsePx(s: string | number | undefined, fallback = 0): number` — "14px"→14, 600→600, "20%"→20, undefined→fallback.
- `stripTags(html: string): string` — quita etiquetas, colapsa espacios, decodifica `&nbsp;`→espacio y `&amp;`→&.
- `extractUnlayerDesign(json: unknown): { rows: unknown[]; values: Record<string, unknown> }` — acepta `{body:{rows,values}}`, `{rows,values}`, `{design:{body:...}}`; si no reconoce, `throw new Error('No se reconoce el formato de Unlayer.')`.
- `unlayerToDocument(json: unknown): { document: EmailDocument; warnings: string[] }` — conversor; valida con `zEmailDocument.parse`. En esta task cubre settings + filas (cells→widthPct, bg, bg image, padding, hideDesktop) + columnas (bg, borderRadius, padding; border uniforme desde el lado superior) + bloques `text`, `heading`, `image`, `button`, `divider`, `html`. Tipos aún no soportados (social, menu, y los desconocidos) → push a `warnings` y omitir (social/menu los agrega Task 2).
- Exports en `index.ts`: `unlayerToDocument`, `parseShorthandPadding`.

- [ ] **Step 1: Test que falla** — `tests/unlayer-import.test.ts` (fixtures PROPIOS, no de Unlayer):

```ts
import { describe, expect, it } from 'vitest'
import { parseShorthandPadding, unlayerToDocument } from '../src/import/unlayer'
import { zEmailDocument } from '../src/schema'

describe('parseShorthandPadding', () => {
  it('1/2/4 valores', () => {
    expect(parseShorthandPadding('10px')).toEqual({ top: 10, right: 10, bottom: 10, left: 10 })
    expect(parseShorthandPadding('10px 20px')).toEqual({ top: 10, right: 20, bottom: 10, left: 20 })
    expect(parseShorthandPadding('5px 10px 15px 20px')).toEqual({ top: 5, right: 10, bottom: 15, left: 20 })
    expect(parseShorthandPadding(undefined)).toEqual({ top: 0, right: 0, bottom: 0, left: 0 })
  })
})

const design = {
  body: {
    values: { contentWidth: '600px', backgroundColor: '#f1f1ec', contentAlign: 'center',
      fontFamily: { value: "'Raleway',sans-serif" }, preheaderText: 'Hola' },
    rows: [
      { cells: [1], values: { backgroundColor: '#ffffff', padding: '0px', hideDesktop: false },
        columns: [{ values: { backgroundColor: '#ffffff', padding: '0px', borderRadius: '0px' }, contents: [
          { type: 'heading', values: { text: '<strong>Título</strong>', headingType: 'h2', fontSize: '26px', textAlign: 'left', containerPadding: '10px 20px', fontFamily: { value: 'Georgia' } } },
          { type: 'text', values: { text: '<p>Hola <a href="#">link</a></p>', fontSize: '14px', lineHeight: '140%', textAlign: 'left', containerPadding: '10px 60px' } },
          { type: 'button', values: { text: '<span>Comprar</span>', href: { values: { href: 'https://x.com', target: '_blank' } }, buttonColors: { color: '#fff', backgroundColor: '#ae2328' }, borderRadius: '4px', padding: '10px 20px', fontSize: '14px', textAlign: 'center', containerPadding: '10px' } },
          { type: 'divider', values: { width: '20%', border: { borderTopColor: '#ae2328', borderTopStyle: 'solid', borderTopWidth: '5px' }, containerPadding: '5px 20px' } },
          { type: 'image', values: { src: { url: 'https://cdn.templates.unlayer.com/a.png' }, altText: 'foto', action: { values: { href: 'https://y.com' } }, textAlign: 'center', containerPadding: '0px' } },
          { type: 'html', values: { html: '<div>crudo</div>' } },
        ] }] },
      { cells: [60, 40], values: { padding: '0px' }, columns: [
        { values: { padding: '0px' }, contents: [] },
        { values: { padding: '0px' }, contents: [] },
      ] },
    ],
  },
}

describe('unlayerToDocument', () => {
  it('mapea settings, filas, columnas y bloques comunes; valida el schema', () => {
    const { document, warnings } = unlayerToDocument(design)
    expect(zEmailDocument.safeParse(document).success).toBe(true)
    expect(document.settings.contentWidth).toBe(600)
    expect(document.settings.fontFamily).toBe("'Raleway',sans-serif")
    expect(document.settings.preheader).toBe('Hola')
    expect(document.settings.contentAlignment).toBe('center')

    const r0 = document.rows[0]
    const blocks = r0.columns[0].blocks
    expect(blocks.map((b) => b.type)).toEqual(['heading', 'text', 'button', 'divider', 'image', 'html'])
    const heading = blocks[0]
    expect(heading.type === 'heading' && heading.level).toBe(2)
    expect(heading.type === 'heading' && heading.text).toBe('Título') // tags eliminadas
    expect(heading.type === 'heading' && heading.fontFamily).toBe('Georgia')
    const button = blocks[2]
    expect(button.type === 'button' && button.label).toBe('Comprar')
    expect(button.type === 'button' && button.href).toBe('https://x.com')
    expect(button.type === 'button' && button.style.backgroundColor).toBe('#ae2328')
    const image = blocks[4]
    expect(image.type === 'image' && image.src).toBe('https://cdn.templates.unlayer.com/a.png')
    expect(image.type === 'image' && image.href).toBe('https://y.com')

    // fila 2: dos columnas con ratios 60/40
    expect(document.rows[1].columns.map((c) => c.widthPct)).toEqual([60, 40])
  })

  it('nota legal sobre imágenes de Unlayer cuando hay cdn.templates.unlayer.com', () => {
    const { warnings } = unlayerToDocument(design)
    expect(warnings.some((w) => w.toLowerCase().includes('imágenes') && w.includes('Unlayer'))).toBe(true)
  })

  it('tipo desconocido genera advertencia y se omite', () => {
    const d = { rows: [{ cells: [1], values: {}, columns: [{ values: {}, contents: [{ type: 'carousel', values: {} }] }] }], values: {} }
    const { document, warnings } = unlayerToDocument(d)
    expect(document.rows[0].columns[0].blocks).toHaveLength(0)
    expect(warnings.some((w) => w.includes('carousel'))).toBe(true)
  })

  it('JSON irreconocible lanza error legible', () => {
    expect(() => unlayerToDocument({ foo: 1 })).toThrow(/Unlayer/)
  })
})
```

- [ ] **Step 2: correr y ver fallar** — `pnpm --filter @vue-mail-designer/builder test tests/unlayer-import.test.ts`

- [ ] **Step 3: Implementar** — `src/import/unlayer.ts`. Estructura sugerida: helpers arriba; `unlayerToDocument` empieza con `createDocument()`, aplica settings, itera filas construyendo `createRow(widths)` y reemplazando estilos, mapea cada content con un `switch(type)` a `createBlock(mappedType)` + overrides; acumula `warnings` (usar un `Set` para no duplicar la nota legal). Al final `zEmailDocument.parse(doc)`. Mapear el nombre de red social en Task 2. Cubrir en el switch text/heading/image/button/divider/html; `default` → `warnings.push('Bloque tipo "'+type+'" no soportado, omitido.')`. La nota legal se agrega si algún `image.src.url` (o cualquier url) incluye `unlayer.com`.

Agregar a `index.ts`: `export { unlayerToDocument, parseShorthandPadding } from './import/unlayer'`.

- [ ] **Step 4: Verificar** — suite + typecheck; snapshots sin cambios.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: conversor de diseños Unlayer — settings, filas, columnas y bloques comunes"`

---

### Task 2: Conversor — social, menu y advertencias refinadas

**Files:**
- Modify: `packages/email-builder/src/import/unlayer.ts`
- Test: ampliar `packages/email-builder/tests/unlayer-import.test.ts`

**Interfaces:**
- `switch` cubre `social` (`icons.icons[]` `{url,name}` → `networks[]`, mapeando `name` con `UNLAYER_SOCIAL_MAP: Record<string, SocialNetworkKind>` — Facebook→facebook, Twitter/X→x, LinkedIn→linkedin, Instagram→instagram, YouTube→youtube, TikTok→tiktok, WhatsApp→whatsapp, otros→web; `spacing`, `align`) y `menu` (si `menu.items[]` o `values.menu` trae `{text/label, link/href}` → items; si no reconoce → advertencia).
- Advertencias adicionales (una vez cada una, dedupe): si algún bloque/fila trae `_override` → "Estilos móviles específicos de Unlayer no se importaron."; si trae `displayCondition` no nulo → "Condiciones de visualización no soportadas."; si algún `fontFamily.url` presente → "Fuentes de Google referenciadas; cárgalas en tu plataforma."; si algún `column.border` tiene lados distintos → "Bordes de columna por-lado colapsados a uniforme."

- [ ] **Step 1: Tests que fallan** — agregar al archivo:

```ts
it('social mapea íconos por nombre a nuestras redes', () => {
  const d = { rows: [{ cells: [1], values: {}, columns: [{ values: {}, contents: [
    { type: 'social', values: { align: 'center', spacing: 12, icons: { icons: [
      { url: 'https://facebook.com/x', name: 'Facebook' },
      { url: 'https://twitter.com/x', name: 'Twitter' },
      { url: 'https://unknown.com/x', name: 'Threads' },
    ] } } },
  ] }] }], values: {} }
  const { document } = unlayerToDocument(d)
  const b = document.rows[0].columns[0].blocks[0]
  expect(b.type).toBe('social')
  if (b.type === 'social') {
    expect(b.networks.map((n) => n.kind)).toEqual(['facebook', 'x', 'web'])
    expect(b.networks[0].url).toBe('https://facebook.com/x')
  }
})

it('advierte sobre _override, displayCondition y fuentes de Google', () => {
  const d = { rows: [{ cells: [1], values: { displayCondition: { type: 'x' } }, columns: [{ values: {}, contents: [
    { type: 'text', values: { text: '<p>hi</p>', _override: { mobile: { containerPadding: '5px' } }, fontFamily: { value: 'Roboto', url: 'https://fonts.googleapis.com/x' } } },
  ] }] }], values: {} }
  const { warnings } = unlayerToDocument(d)
  expect(warnings.some((w) => w.toLowerCase().includes('móviles'))).toBe(true)
  expect(warnings.some((w) => w.toLowerCase().includes('visualización'))).toBe(true)
  expect(warnings.some((w) => w.toLowerCase().includes('fuentes'))).toBe(true)
})
```

- [ ] **Step 2: correr y ver fallar**
- [ ] **Step 3: Implementar** — cases social/menu + detección de advertencias (recorrer `values` de filas/columnas/bloques buscando `_override`, `displayCondition`, `fontFamily.url`). Dedupe con Set.
- [ ] **Step 4: Verificar** — suite + typecheck.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: conversor Unlayer — social, menu y advertencias de pérdida refinadas"`

---

### Task 3: Loader por URL + prop unlayerFetch + proxy de la demo

**Files:**
- Create: `packages/email-builder/src/import/unlayerUrl.ts`
- Modify: `packages/email-builder/src/index.ts`, `packages/email-builder/src/options.ts`, `packages/email-builder/src/components/EmailBuilder.vue`, `apps/demo/vite.config.ts`, `apps/demo/src/App.vue`
- Test: `packages/email-builder/tests/unlayer-url.test.ts`

**Interfaces:**
- `unlayerSlugFromUrl(input: string): string | null` — de `https://studio.unlayer.com/create/valentines-day-flowers` → `valentines-day-flowers`; de un slug pelado (`^[a-z0-9-]+$`) → ese slug; si no → null.
- `type UnlayerFetch = (slug: string) => Promise<unknown>`.
- `defaultUnlayerFetch: UnlayerFetch` — POST a `https://studio.unlayer.com/api/v1/graphql` con la query `StockTemplateLoad(slug)`; devuelve `data.StockTemplate.StockTemplatePages[0].design`. Doc-comment: falla por CORS desde el browser salvo proxy.
- `BuilderOptions` gana `unlayerFetch?: UnlayerFetch`; `EmailBuilder` la acepta como prop y la incluye en el provide (getter). Export en `index.ts`: `unlayerSlugFromUrl`, `defaultUnlayerFetch`, tipo `UnlayerFetch`.
- Demo: proxy `/unlayer-api` → `https://studio.unlayer.com/api/v1/graphql` en `vite.config.ts`; App pasa `:unlayer-fetch` que hace POST a `/unlayer-api` con la query y devuelve el design.

- [ ] **Step 1: Tests que fallan** — `tests/unlayer-url.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'
import { unlayerSlugFromUrl } from '../src/import/unlayerUrl'

describe('unlayerSlugFromUrl', () => {
  it('extrae slug de la URL del studio', () => {
    expect(unlayerSlugFromUrl('https://studio.unlayer.com/create/valentines-day-flowers')).toBe('valentines-day-flowers')
  })
  it('acepta un slug pelado', () => {
    expect(unlayerSlugFromUrl('summer-sale')).toBe('summer-sale')
  })
  it('rechaza basura', () => {
    expect(unlayerSlugFromUrl('no es una url')).toBeNull()
    expect(unlayerSlugFromUrl('https://otro.com/x')).toBeNull()
  })
})
```
(el fetch por URL end-to-end se prueba en la UI de Task 4 con mock; `defaultUnlayerFetch` real no se testea unitariamente — red.)

- [ ] **Step 2: correr y ver fallar**
- [ ] **Step 3: Implementar** — `unlayerUrl.ts`; prop/provide en options+EmailBuilder (getter, como `imageSearch`); proxy y `unlayerFetch` de demo. `defaultUnlayerFetch` con `fetch` global.
- [ ] **Step 4: Verificar** — suite + typecheck.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: import de Unlayer por URL — slug, fetch inyectable y proxy de la demo"`

---

### Task 4: UI — diálogo "Importar de Unlayer"

**Files:**
- Create: `packages/email-builder/src/components/UnlayerImportDialog.vue`
- Modify: `packages/email-builder/src/components/BuilderHeader.vue` (item de menú + montar diálogo), `packages/email-builder/src/store/ui.ts` (`unlayerImportOpen: boolean`), `styles.css`
- Test: `packages/email-builder/tests/unlayer-dialog.test.ts`

**Interfaces:**
- `useUiStore` gana `unlayerImportOpen: Ref<boolean>` (default false).
- `BuilderHeader`: en el menú EXPORTAR, item "Importar de Unlayer…" (`data-action="import-unlayer"`) que abre `ui.unlayerImportOpen = true`; monta `<UnlayerImportDialog v-if="ui.unlayerImportOpen" />`.
- `UnlayerImportDialog.vue`: modal con dos modos — textarea "Pegar JSON de Unlayer" y input "URL de la plantilla"; botón "Cargar". Al cargar:
  - Si hay URL: `unlayerSlugFromUrl` → si válido, `options.unlayerFetch(slug)` (o `defaultUnlayerFetch`), luego `unlayerToDocument`. Si slug inválido o fetch falla → error en el diálogo.
  - Si hay JSON: `JSON.parse` + `unlayerToDocument`. Errores capturados → mensaje.
  - Éxito: mostrar la lista de `warnings` (si hay) + botón "Aplicar" que hace `store.loadDesign(document)` y cierra. Botón cerrar ✕.
- Usa `useDocumentStore`, `useUiStore`, `useBuilderOptions`.

- [ ] **Step 1: Test que falla** — `tests/unlayer-dialog.test.ts` (montar EmailBuilder, abrir menú, click import-unlayer, pegar JSON válido en el textarea, click Cargar, ver warnings, click Aplicar, verificar `emitted('update:design')` o que el canvas tiene filas). Un caso: JSON inválido muestra `.vmd-import-error`. Un caso: URL con `unlayerFetch` mock (pasar prop) resuelve y convierte.

```ts
// esbozo: mount(EmailBuilder, { props: { unlayerFetch: vi.fn().mockResolvedValue(<design fixture>) } })
// abrir menú export → [data-action="import-unlayer"] → textarea.setValue(JSON.stringify(design)) → [data-action="unlayer-load"] → await → esperar .vmd-import-warnings o botón aplicar → [data-action="unlayer-apply"] → assert canvas tiene .vmd-row
```

- [ ] **Step 2: correr y ver fallar**
- [ ] **Step 3: Implementar** — diálogo + wiring. CSS reutiliza `.vmd-modal`/`.vmd-modal-box`. Clases `.vmd-import-warnings`, `.vmd-import-error`.
- [ ] **Step 4: Verificar** — suite + typecheck.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: diálogo Importar de Unlayer (pegar JSON o URL) con reporte de advertencias"`

---

### Task 5: Verificación integral, build y cierre

- [ ] **Step 1 (controller, browser):** en el demo, abrir EXPORTAR → Importar de Unlayer; pegar un JSON de Unlayer (usar uno real del studio, solo para la prueba manual — NO commitear) y verificar que se convierte, muestra advertencias y al Aplicar llena el canvas. Probar la URL con el proxy de la demo (`studio.unlayer.com/create/valentines-day-flowers`). Verificar la nota legal de imágenes.
- [ ] **Step 2:** `pnpm typecheck && pnpm test` + build librería (smoke: exports incluyen `unlayerToDocument`, `unlayerSlugFromUrl`) + demo.
- [ ] **Step 3:** README: sección "Importar de Unlayer" (JSON/URL, prop `unlayerFetch`, nota CORS y de assets). Commit final.

---

## Self-Review

**Cobertura:** conversor core (T1), social/menu/warnings (T2), URL+fetch+proxy (T3), UI (T4), verificación+docs (T5). **Placeholders:** conversor con tests concretos y fixtures propios; UI descrita con selectores `data-action` precisos. **Consistencia:** `unlayerToDocument`/`unlayerSlugFromUrl`/`UnlayerFetch`/`unlayerFetch` (prop) consistentes T1-T4; el resultado siempre validado con `zEmailDocument`. **Clean-room:** fixtures propios, no plantillas de Unlayer; nota legal de imágenes emitida por el conversor. **Riesgos:** (a) CORS del fetch real — mitigado con prop inyectable + proxy de demo, documentado; (b) HTML de texto de Unlayer puede traer ruido (spans figma/merge tags) — se conserva tal cual (nuestro renderer lo pasa), aceptable; (c) `zEmailDocument.parse` con defaults debe tolerar los settings nuevos de Fase B ausentes en el input — ya son `.default()`.
