# Fase A — Pulido core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** DnD sin selección de texto y con targets/animaciones/autoscroll decentes; precedencia de tabs del riel; preview con tamaños; garantías de undo/redo (un drag = un paso).

**Architecture:** solo `useUiStore` (campos `isDragging`, `panelMode`, `previewWidth` que reemplaza `previewDevice`), `DND_OPTIONS`, componentes de UI y CSS. Nada de schema/renderer/API pública. El "sellado" de historial es una action nueva del document store (`sealHistory`).

**Tech Stack:** el existente. **Spec:** `docs/superpowers/specs/2026-07-20-fase-a-pulido-core-design.md`

## Global Constraints

- Clean-room: identidad propia (`vmd-*`), sin assets/marcas de terceros. Strings de UI en español; `type="button"` en botones.
- API pública intacta. `ui.previewDevice` desaparece (interno, no exportado — verificar que no esté en `index.ts`).
- Todos los `<draggable>` siguen usando `v-bind="DND_OPTIONS"` + sus `group/clone/item-key/sort` propios; los handlers `@start/@end` se agregan en los 4.
- Cada tarea: suite completa + typecheck verdes y un commit.

---

### Task 1: DnD — opciones ampliadas, estado isDragging y CSS de feedback

**Files:**
- Modify: `packages/email-builder/src/components/dnd.ts`, `packages/email-builder/src/store/ui.ts`, `packages/email-builder/src/components/EmailBuilder.vue`, `BuilderCanvas.vue`, `RowView.vue`, `tabs/ContentTab.vue`, `tabs/BlocksTab.vue`, `packages/email-builder/src/styles.css`
- Test: `packages/email-builder/tests/dnd.test.ts` (ampliar)

**Interfaces:**
- `DND_OPTIONS` gana: `easing: 'cubic-bezier(0.2, 0, 0, 1)'`, `fallbackTolerance: 5`, `emptyInsertThreshold: 24`, `scroll: true`, `scrollSensitivity: 80`, `scrollSpeed: 12`, `bubbleScroll: true`, `direction: 'vertical'`.
- `useUiStore` gana `isDragging: Ref<boolean>` (default false).
- Los 4 `<draggable>` agregan `@start="ui.isDragging = true"` y `@end="ui.isDragging = false"` (ContentTab/BlocksTab importan `useUiStore(useBuilderPinia())` — hoy no lo tienen).
- `EmailBuilder.vue` raíz: `:class="{ 'vmd-dark': ..., 'vmd-is-dragging': ui.isDragging }"`.

- [ ] **Step 1: Test que falla** — ampliar `tests/dnd.test.ts`:

```ts
it('opciones ampliadas de fluidez', () => {
  expect(DND_OPTIONS.fallbackTolerance).toBe(5)
  expect(DND_OPTIONS.emptyInsertThreshold).toBe(24)
  expect(DND_OPTIONS.scroll).toBe(true)
  expect(DND_OPTIONS.easing).toBe('cubic-bezier(0.2, 0, 0, 1)')
})

it('el drag activa la clase vmd-is-dragging en la raíz', async () => {
  const wrapper = mount(EmailBuilder)
  await wrapper.find('.vmd-canvas-empty button').trigger('click')
  const drag = wrapper.findComponent({ name: 'draggable' })
  drag.vm.$emit('start')
  await wrapper.vm.$nextTick()
  expect(wrapper.find('.vmd-root.vmd-is-dragging').exists()).toBe(true)
  drag.vm.$emit('end')
  await wrapper.vm.$nextTick()
  expect(wrapper.find('.vmd-root.vmd-is-dragging').exists()).toBe(false)
})
```

- [ ] **Step 2: correr y ver fallar** — `pnpm --filter @vue-mail-designer/builder test tests/dnd.test.ts`

- [ ] **Step 3: Implementar** — según Interfaces. CSS a agregar:

```css
.vmd-root.vmd-is-dragging { user-select: none; -webkit-user-select: none; cursor: grabbing; }
.vmd-root.vmd-is-dragging .vmd-column-blocks { min-height: 36px; }
.vmd-root.vmd-is-dragging .vmd-column { outline: 1px dashed var(--vmd-border); outline-offset: -1px; }
.vmd-block, .vmd-row { transition: transform 0.15s ease; }
```

- [ ] **Step 4: Verificar** — `pnpm --filter @vue-mail-designer/builder test && pnpm typecheck`
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: DnD fluido — autoscroll, tolerancia, targets visibles y sin selección de texto"`

---

### Task 2: Precedencia de tabs (panelMode)

**Files:**
- Modify: `packages/email-builder/src/store/ui.ts`, `packages/email-builder/src/components/SidePanel.vue`, `PropertiesPanel.vue` (sin cambios de template; el ✕ ya llama `select(null)`)
- Test: `packages/email-builder/tests/sidepanel.test.ts` (ampliar/adaptar)

**Interfaces:**
- `useUiStore` gana `panelMode: Ref<'tab' | 'props'>` (default `'tab'`).
- `SidePanel.vue`: (a) watcher de `store.selection`: si pasa a no-null → `ui.panelMode = 'props'`; si pasa a null → `'tab'`; (b) click de tab del riel → `ui.sidebarTab = t; ui.panelMode = 'tab'`; (c) render: `<PropertiesPanel v-if="store.selection && ui.panelMode === 'props'" />`, si no el tab activo — ELIMINAR el caso especial del tab images (la regla general lo cubre); (d) riel: clase activa solo si `ui.panelMode === 'tab' && ui.sidebarTab === t`.

- [ ] **Step 1: Tests que fallan** — en `sidepanel.test.ts` agregar:

```ts
it('con selección activa, click en un tab toma precedencia', async () => {
  const wrapper = mount(EmailBuilder)
  await wrapper.find('.vmd-canvas-empty button').trigger('click')
  await wrapper.find('.vmd-row').trigger('click')
  expect(wrapper.find('.vmd-props-header').exists()).toBe(true)
  await wrapper.find('[data-tab="body"]').trigger('click')
  expect(wrapper.find('.vmd-props-header').exists()).toBe(false)
  expect(wrapper.text()).toContain('Preheader')
})

it('re-seleccionar un elemento vuelve a propiedades', async () => {
  const wrapper = mount(EmailBuilder)
  await wrapper.find('.vmd-canvas-empty button').trigger('click')
  await wrapper.find('.vmd-row').trigger('click')
  await wrapper.find('[data-tab="content"]').trigger('click')
  expect(wrapper.find('.vmd-props-header').exists()).toBe(false)
  // clickear el MISMO elemento otra vez debe re-abrir propiedades
  await wrapper.find('.vmd-row').trigger('click')
  expect(wrapper.find('.vmd-props-header').exists()).toBe(true)
})
```

Nota de implementación para el segundo test: si el elemento ya está seleccionado, `store.selection` no cambia y el watcher no dispara — `RowView`/`BlockView` llaman `store.select(...)` igual; para cubrir el caso, el watcher en SidePanel debe observar con `{ flush: 'sync' }`… no alcanza. Solución robusta: mover la regla al lado de la selección — `select()` en el store NO conoce la UI; entonces `RowView`/`BlockView` tras `store.select(...)` también setean `ui.panelMode = 'props'` (importan `useUiStore`). El watcher de SidePanel queda solo para selección→null → `'tab'`. Implementar así.

- [ ] **Step 2: correr y ver fallar**
- [ ] **Step 3: Implementar** (regla en RowView/BlockView + watcher null→tab en SidePanel + render y riel según Interfaces). Verificar que el test previo del round-trip ("cerrar vuelve al tab") siga pasando.
- [ ] **Step 4: Verificar** — suite + typecheck.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: los tabs del riel toman precedencia sobre el panel de propiedades"`

---

### Task 3: Preview con tamaños (presets + custom)

**Files:**
- Modify: `packages/email-builder/src/store/ui.ts` (quitar `previewDevice`, agregar `previewWidth: Ref<number>` default 1000), `packages/email-builder/src/components/PreviewDialog.vue`
- Test: `packages/email-builder/tests/preview.test.ts` (adaptar)

**Interfaces:**
- `PreviewDialog.vue` barra: tres botones preset `data-preset="desktop|tablet|mobile"` (1000/768/375, íconos 🖥/💻/📱 con title en español), activo si `previewWidth` coincide; `<input type="number" class="vmd-preview-width" min="320" max="1400">` bindeado a `previewWidth`; el iframe usa `:style="{ width: ui.previewWidth + 'px' }"` (mantener transición CSS).
- Grep de `previewDevice` en src y tests: no debe quedar ninguna referencia.

- [ ] **Step 1: Adaptar tests (fallan primero)** — en `preview.test.ts` reemplazar el test del toggle por:

```ts
it('presets y ancho custom cambian el iframe', async () => {
  const wrapper = mount(EmailBuilder)
  await wrapper.find('[data-action="preview"]').trigger('click')
  await wrapper.find('[data-preset="mobile"]').trigger('click')
  expect(wrapper.find('iframe.vmd-preview-frame').attributes('style')).toContain('375px')
  await wrapper.find('[data-preset="tablet"]').trigger('click')
  expect(wrapper.find('iframe.vmd-preview-frame').attributes('style')).toContain('768px')
  const custom = wrapper.find('input.vmd-preview-width')
  await custom.setValue('500')
  expect(wrapper.find('iframe.vmd-preview-frame').attributes('style')).toContain('500px')
})
```

- [ ] **Step 2: correr y ver fallar**
- [ ] **Step 3: Implementar** según Interfaces. CSS: `.vmd-preview-width { width: 72px; }` + reutilizar `.vmd-field-input`.
- [ ] **Step 4: Verificar** — suite + typecheck; grep `previewDevice` → 0 resultados.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: preview con presets de tamaño y ancho custom"`

---

### Task 4: Garantías de undo/redo (sealHistory)

**Files:**
- Modify: `packages/email-builder/src/store/document.ts` (action `sealHistory()`), `packages/email-builder/src/components/BuilderCanvas.vue` + `RowView.vue` (en `@end`, además de `isDragging=false`, llamar `store.sealHistory()`)
- Test: `packages/email-builder/tests/history.test.ts` (ampliar)

**Interfaces:**
- `sealHistory(): void` — `lastCommitKey = null` (nada más); exportada en el return del store. Llamada en `@end` de los draggables del canvas (rows y blocks; los tabs clone-only no la necesitan pero no daña — dejarla solo en canvas/rowview).

- [ ] **Step 1: Tests que fallan** — en `history.test.ts`:

```ts
it('un drag entre columnas (dos replaceColumnBlocks seguidos) es un solo undo', () => {
  const store = useDocumentStore()
  const row = store.addRow([50, 50])
  const [colA, colB] = row.columns
  const block = store.addBlockToColumn(colA.id, 'text')
  const stepsBefore = store.past.length
  // simulación del gesto: sortable dispara update en origen y destino
  store.replaceColumnBlocks(colA.id, [])
  store.replaceColumnBlocks(colB.id, [block])
  expect(store.past.length).toBe(stepsBefore + 1)
  store.undo()
  expect(store.findRow(row.id)!.columns[0].blocks).toHaveLength(1)
})

it('dos drags separados por sealHistory son dos undos', () => {
  const store = useDocumentStore()
  const row = store.addRow([50, 50])
  const block = store.addBlockToColumn(row.columns[0].id, 'text')
  const base = store.past.length
  store.replaceColumnBlocks(row.columns[0].id, [])
  store.replaceColumnBlocks(row.columns[1].id, [block])
  store.sealHistory()
  store.replaceColumnBlocks(row.columns[1].id, [])
  store.replaceColumnBlocks(row.columns[0].id, [block])
  expect(store.past.length).toBe(base + 2)
})

it('mutaciones de bloques distintos no coalescen', () => {
  const store = useDocumentStore()
  const row = store.addRow([100])
  const a = store.addBlockToColumn(row.columns[0].id, 'heading')
  const b = store.addBlockToColumn(row.columns[0].id, 'heading')
  const base = store.past.length
  store.updateBlock(a.id, { text: 'A' })
  store.updateBlock(b.id, { text: 'B' })
  expect(store.past.length).toBe(base + 2)
})
```

- [ ] **Step 2: correr y ver fallar** (el primero puede pasar ya — confirmar cuáles fallan y por qué; el de sealHistory falla porque no existe).
- [ ] **Step 3: Implementar** — `sealHistory` en el store + llamadas en `@end` del canvas/rowview (combinar con `isDragging=false`: `@end="onDragEnd"` con método local que hace ambas).
- [ ] **Step 4: Verificar** — suite + typecheck. Confirmar además (grep) que ninguna action de `useUiStore` toca `past/future`.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: sellado de historial por gesto — un drag, un undo"`

---

### Task 5: Verificación integral en browser y cierre

**Files:** fixes que surjan; ledger.

- [ ] **Step 1 (controller, browser):** con gestos sintéticos: (a) drag Contenido→columna y verificar `window.getSelection().isCollapsed === true` al final; (b) drag entre columnas de una fila 50/50; (c) `vmd-is-dragging` presente durante el gesto y outline de columnas visible; (d) precedencia de tabs con un bloque seleccionado; (e) preview presets + custom; (f) un drag → un click de deshacer lo revierte.
- [ ] **Step 2:** `pnpm typecheck && pnpm test` + build librería + demo.
- [ ] **Step 3:** Commit final si hubo fixes.

---

## Self-Review

**Cobertura del spec:** DnD (T1), precedencia (T2), preview sizes (T3), undo (T4), verificación (T5) — completa. **Placeholders:** ninguno; el código está inline. **Consistencia:** `isDragging/panelMode/previewWidth/sealHistory` consistentes entre tareas; el riesgo del watcher de selección repetida está resuelto en la nota de T2 (regla en RowView/BlockView). **Riesgo:** `emptyInsertThreshold` + `:has()` outline puede sentirse ruidoso — T5 lo evalúa visualmente y ajusta valores si hace falta.
