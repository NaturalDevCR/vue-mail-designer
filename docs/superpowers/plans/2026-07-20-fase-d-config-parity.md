# Fase D — Configuración y paridad de API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Props `tools` (habilitar/reordenar/limitar bloques), `appearance` (colores del builder), `locale` (i18n es/en + override), todas retrocompatibles.

**Architecture:** todo aditivo vía `BuilderOptions` + `EmailBuilder` props. i18n con un composable `useI18n()` (provide/inject) y diccionarios; `appearance` como estilo inline en `.vmd-root`; `tools` consultado por `ContentTab`.

**Tech Stack:** el existente. **Spec:** `docs/superpowers/specs/2026-07-20-fase-d-config-parity-design.md`

## Global Constraints

- Clean-room; `type="button"`. Retrocompat: sin las props nuevas, el comportamiento es idéntico (UI en español, todos los bloques, colores del tema).
- API pública solo aditiva. Cada tarea: suite completa + typecheck verdes y un commit.
- i18n: `t(key)` de una clave inexistente devuelve la clave (nunca rompe). El canvas del email nunca usa i18n ni appearance.

---

### Task 1: Infra i18n + diccionarios es/en + chrome (header, canvas bar, riel, paleta)

**Files:**
- Create: `packages/email-builder/src/i18n/keys.ts`, `es.ts`, `en.ts`, `useI18n.ts`
- Modify: `packages/email-builder/src/options.ts`, `packages/email-builder/src/components/EmailBuilder.vue`, `BuilderHeader.vue`, `CanvasBar.vue`, `SidePanel.vue`, `tabs/ContentTab.vue`, `tabs/BlocksTab.vue`, `palette-items.ts`, `packages/email-builder/src/index.ts`
- Test: `packages/email-builder/tests/i18n.test.ts`

**Interfaces (producidas):**
- `keys.ts`: `export type LocaleDict = Record<string, string>` y `export const I18N_KEYS` no es necesario; las claves son strings planos con namespaces (`header.templates`, `header.export`, `canvasbar.desktop`, `rail.content`, `palette.heading`, `layout.100`, …).
- `es.ts`/`en.ts`: `export const es: LocaleDict = {...}` con TODAS las claves del chrome de esta task; `en` con las mismas claves traducidas.
- `useI18n.ts`: `I18N_KEY: InjectionKey<{ t: (k: string) => string }>`; `provideI18n(dict: LocaleDict)` (llamado por EmailBuilder); `useI18n(): { t }` con `t(k) = dict[k] ?? k`.
- `options.ts`: `BuilderOptions` gana `locale?: 'es' | 'en' | LocaleDict`.
- `EmailBuilder.vue`: prop `locale`; resuelve a dict: si `'es'`→es, `'en'`→`{...es, ...en}` (en completa), objeto→`{...es, ...object}`; `provideI18n(dict)`.
- `palette-items.ts`: `PALETTE_BLOCKS[].label` pasa a ser una clave i18n (`labelKey: 'palette.heading'`) — renombrar `label`→`labelKey`; `ROW_LAYOUTS[].label`→`labelKey` (`layout.100`, etc.). Los consumidores usan `t(labelKey)`.
- Export en `index.ts`: `type LocaleDict`.

- [ ] **Step 1: Test que falla** — `tests/i18n.test.ts`:

```ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import EmailBuilder from '../src/components/EmailBuilder.vue'

describe('i18n', () => {
  it('por defecto en español', () => {
    const w = mount(EmailBuilder)
    expect(w.find('[data-action="templates"]').text()).toContain('Plantillas')
  })
  it("locale 'en' cambia el chrome a inglés", () => {
    const w = mount(EmailBuilder, { props: { locale: 'en' } })
    expect(w.find('[data-action="templates"]').text()).toContain('Templates')
    expect(w.find('[data-action="export"]').text().toLowerCase()).toContain('export')
  })
  it('objeto parcial sobreescribe solo esas claves', () => {
    const w = mount(EmailBuilder, { props: { locale: { 'header.templates': 'Modelos' } } })
    expect(w.find('[data-action="templates"]').text()).toContain('Modelos')
    // el resto sigue en español
    expect(w.find('[data-action="export"]').text()).toContain('EXPORTAR')
  })
  it('la paleta usa labels traducidos', () => {
    const w = mount(EmailBuilder, { props: { locale: 'en' } })
    const texts = w.findAll('.vmd-content-item').map((i) => i.text())
    expect(texts.some((t) => t.includes('Heading'))).toBe(true)
  })
})
```

- [ ] **Step 2: correr y ver fallar**
- [ ] **Step 3: Implementar** — infra + diccionarios (incluir claves: `header.templates`, `header.saved`, `header.export`, `header.exportHtml`, `header.exportJson`, `header.importJson`, `header.importUnlayer`, `header.themeLight`, `header.themeDark`; `canvasbar.undo`, `canvasbar.redo`, `canvasbar.desktop`, `canvasbar.mobile`, `canvasbar.preview`; `rail.content`, `rail.blocks`, `rail.body`, `rail.images`; `palette.<type>` ×13; `layout.<key>` ×6; `canvas.emptyHint`, `canvas.addRow`, `canvas.dropHere`). Convertir esos componentes a `t()`. `EmailBuilder` resuelve y provee.
- [ ] **Step 4: Verificar** — suite + typecheck.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: i18n del builder (es/en + override) en header, barra, riel y paleta"`

---

### Task 2: i18n de diálogos e inspector (títulos de sección + acciones)

**Files:**
- Modify: `PreviewDialog.vue`, `TemplateGallery.vue`, `UnlayerImportDialog.vue`, `PropertiesPanel.vue` (títulos de sección + tooltips de acciones + label "Visibilidad" y sus checkboxes), `BodyTab.vue` (títulos), `es.ts`, `en.ts`
- Test: ampliar `tests/i18n.test.ts`

**Interfaces:** claves nuevas para diálogos (`preview.desktop/tablet/mobile/copy/close`, `templates.title/close`, `import.*`, `props.duplicate/delete/close/visibility/hideDesktop/hideMobile`, `body.*`). Los componentes usan `t()`.

- [ ] **Step 1: Test que falla** — agregar: `locale:'en'` → el botón cerrar del preview dice "Close"; el header de propiedades de una fila muestra acciones con títulos en inglés. (Montar EmailBuilder, abrir preview / seleccionar fila.)
- [ ] **Step 2: correr y ver fallar**
- [ ] **Step 3: Implementar** — literales → `t()` en esos componentes; claves en es/en.
- [ ] **Step 4: Verificar** — suite + typecheck.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: i18n de diálogos e inspector"`

---

### Task 3: Config de herramientas (`tools`)

**Files:**
- Modify: `options.ts` (tipo `ToolConfig` + `tools?`), `EmailBuilder.vue` (prop + provide), `tabs/ContentTab.vue` (filtrar/ordenar/deshabilitar), `store/document.ts` (getter `blockTypeCounts` o helper), `styles.css`
- Test: `packages/email-builder/tests/tools-config.test.ts`

**Interfaces:**
- `ToolConfig = { enabled?: boolean; position?: number; usageLimit?: number }`; `BuilderOptions.tools?: Partial<Record<BlockType, ToolConfig>>`.
- `ContentTab`: computa la lista visible = `PALETTE_BLOCKS` filtrando `tools[type]?.enabled === false`, ordenada por `position` (los sin position después, orden original). Para cada ítem, `disabled = usageLimit != null && countInDoc(type) >= usageLimit`; si `disabled`, el ítem no es arrastrable (quitar del grupo o `:disabled`/clase `vmd-content-item--disabled` con `pointer-events:none`) y muestra `title` con el motivo (i18n `palette.limitReached`).
- Conteo: helper en el store o en ContentTab que recorre `store.doc.rows[].columns[].blocks[]` por tipo (computed reactivo).

- [ ] **Step 1: Test que falla** — `tests/tools-config.test.ts`:

```ts
// enabled:false oculta el ítem; position reordena; usageLimit deshabilita cuando el design ya tiene N
// mount(EmailBuilder, { props: { tools: { html: { enabled: false } } } }) → no hay item html (12 items)
// tools: { image: { position: 0 } } → el primer item es Imagen
// design con 1 html + tools: { html: { usageLimit: 1 } } → el item html tiene clase disabled
```

- [ ] **Step 2: correr y ver fallar**
- [ ] **Step 3: Implementar**
- [ ] **Step 4: Verificar** — suite + typecheck.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: config de herramientas — habilitar, reordenar y limitar bloques de la paleta"`

---

### Task 4: Apariencia (`appearance`)

**Files:**
- Modify: `options.ts` (tipo `Appearance` + `appearance?`), `EmailBuilder.vue` (prop + estilo inline en la raíz)
- Test: `packages/email-builder/tests/appearance.test.ts`

**Interfaces:**
- `Appearance = { accent?, panel?, border?, background?, foreground?, muted? }` (todos `string`).
- `EmailBuilder`: computa un objeto de estilo que mapea cada campo presente a su variable CSS (`accent→--vmd-accent`, `panel→--vmd-panel`, `border→--vmd-border`, `background→--vmd-bg`, `foreground→--vmd-fg`, `muted→--vmd-muted`) y lo bindea con `:style` en `.vmd-root` (junto a la clase de tema). Campos ausentes no se emiten (el tema los define).

- [ ] **Step 1: Test que falla** — `appearance: { accent: '#ff0000' }` → `.vmd-root` tiene `--vmd-accent: #ff0000` en su style; sin appearance, no hay style de variables.
- [ ] **Step 2: correr y ver fallar**
- [ ] **Step 3: Implementar**
- [ ] **Step 4: Verificar** — suite + typecheck.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: apariencia configurable del builder vía variables CSS"`

---

### Task 5: Verificación, build, README y cierre

- [ ] **Step 1 (controller, browser):** en el demo, pasar `locale:'en'` (temporal), `appearance:{accent:'#e11d48'}` y `tools:{html:{enabled:false}, image:{position:0}}` en App.vue; verificar UI en inglés, acento rojo, sin bloque HTML, Imagen primero. Revertir la demo a valores neutros (o dejar un ejemplo comentado).
- [ ] **Step 2:** `pnpm typecheck && pnpm test` + build librería (smoke exports incluye `LocaleDict`) + demo.
- [ ] **Step 3:** README: props `tools`, `appearance`, `locale` en la tabla + sección corta de i18n. Commit final.

---

## Self-Review

**Cobertura:** i18n infra+chrome (T1), i18n diálogos/inspector (T2), tools (T3), appearance (T4), verificación (T5). **Placeholders:** infra i18n con código; el resto sigue patrones del repo. **Consistencia:** `LocaleDict`/`useI18n`/`t`/`tools`/`ToolConfig`/`appearance`/`Appearance` consistentes; `labelKey` reemplaza `label` en palette-items (T1) y los consumidores usan `t(labelKey)`. **Riesgos:** (a) convertir muchos literales — se acota el alcance al chrome + diálogos + títulos de inspector; los labels de campo individuales del inspector quedan parciales (documentado); (b) `en` debe cubrir todas las claves de `es` — un test podría comparar `Object.keys(es)` ⊆ `en`, agregarlo en T2; (c) retrocompat: los tests existentes que asertan textos en español deben seguir pasando porque el default es es — si alguno rompe por un cambio de wording, ajustar la clave, no el test.
