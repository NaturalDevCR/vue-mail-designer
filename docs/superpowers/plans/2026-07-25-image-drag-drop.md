# Drag & drop de imágenes a bloque imagen y galería — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** habilitar arrastre real (no solo click) de miniaturas desde los tabs "Imágenes" (Openverse) y "Galería de medios" hacia un bloque `image` existente o un ítem individual de un bloque `gallery` en el canvas; soltar en cualquier otro punto crea fila+bloque `image` nuevo.

**Architecture:** se extiende la infraestructura de Pragmatic Drag and Drop ya usada para mover bloques/filas (`src/dnd/`) con un nuevo tipo de arrastre (`media-image`). Los tabs se refactorizan para usar un componente de miniatura arrastrable compartido; el canvas gana un composable de "drop de reemplazo" (sin edge de inserción) usado en el bloque `image` y en un nuevo componente por ítem de `gallery`; el contenedor de filas ya existente absorbe el caso de fallback (soltar fuera de cualquier bloque imagen/galería).

**Tech Stack:** Vue 3 `<script setup>`, Pinia, `@atlaskit/pragmatic-drag-and-drop`, Vitest + `@vue/test-utils`.

**Spec:** `docs/superpowers/specs/2026-07-25-image-drag-drop-design.md`

## Global Constraints

- El click-to-insert existente en `ImagesTab.vue`/`MediaLibraryTab.vue` (`selectImage`/`insert`) **no cambia** — el arrastre es una capacidad *adicional* sobre el mismo componente.
- El payload de arrastre (`DragData` kind `media-image`) transporta solo `{ src, alt }` — **no** `thumbnailUrl` (eso es solo para el preview del propio tab, no viaja en el drag).
- El preview visual de arrastre reutiliza el chip genérico ya existente (`vmd-drag-preview` / `previewLabel`) — no se construye un preview con la imagen real.
- El drop en un bloque `image` **no pisa un `alt` ya escrito** por el usuario; si estaba vacío, toma el `alt` del drag. Misma regla en el ítem de `gallery` (por índice).
- El fallback de "soltar en cualquier otro punto del canvas" (incluso sobre un bloque no-imagen) crea fila+bloque `image` nuevo, sin awareness de posición — igual que el click-to-insert de hoy siempre agrega al final. Esto es intencional, no un bug a corregir.
- Ningún gesto de arrastre HTML5 real se simula en los tests (limitación conocida de jsdom, ya documentada en el proyecto) — la lógica de aplicación del drop (`applyDrop.ts`) se testea invocando las funciones directamente con un `DragData` construido a mano, igual que los tests existentes de `dropBlock`/`dropRow`/`dropBlockOnEmptyCanvas`. La verificación del gesto real queda para el chequeo manual en browser de la Tarea 6.
- Suite + `typecheck` + `build` deben quedar verdes al final de cada tarea que toque código de producción.

---

## Task 1: Tipo de arrastre `media-image` + funciones puras de aplicación del drop

**Files:**
- Modify: `packages/email-builder/src/dnd/dragData.ts`
- Modify: `packages/email-builder/src/dnd/applyDrop.ts`
- Test: `packages/email-builder/tests/dnd.test.ts`

**Interfaces:**
- Produces: `DragData` gana el miembro `{ kind: 'media-image'; src: string; alt: string }`. `applyDrop.ts` exporta `dropMediaImageOnImageBlock(store, blockId: string, drag: Extract<DragData, { kind: 'media-image' }>): void`, `dropMediaImageOnGalleryItem(store, blockId: string, index: number, drag: Extract<DragData, { kind: 'media-image' }>): void`, `dropMediaImageOnEmptyCanvas(store, drag: Extract<DragData, { kind: 'media-image' }>): void`.

- [ ] **Step 1: Agregar el nuevo kind a `DragData`**

En `packages/email-builder/src/dnd/dragData.ts`, la unión actual es:

```ts
export type DragData =
  | { kind: 'palette-block'; create: () => Block }
  | { kind: 'palette-row'; widths: number[] }
  | { kind: 'canvas-row'; rowId: string }
  | { kind: 'canvas-block'; blockId: string; columnId: string }
```

Reemplazar por:

```ts
export type DragData =
  | { kind: 'palette-block'; create: () => Block }
  | { kind: 'palette-row'; widths: number[] }
  | { kind: 'canvas-row'; rowId: string }
  | { kind: 'canvas-block'; blockId: string; columnId: string }
  | { kind: 'media-image'; src: string; alt: string }
```

- [ ] **Step 2: Escribir los tests que fallan en `tests/dnd.test.ts`**

Agregar `import` de las tres funciones nuevas junto al import existente de `applyDrop`:

```ts
import { dropBlock, dropBlockOnEmptyCanvas, dropRow, dropMediaImageOnImageBlock, dropMediaImageOnGalleryItem, dropMediaImageOnEmptyCanvas } from '../src/dnd/applyDrop'
```

Agregar al final del archivo (después del último `describe`):

```ts
describe('applyDrop — media-image (arrastre desde los tabs de imágenes)', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('reemplaza el src de un bloque imagen existente sin pisar un alt ya escrito', () => {
    const store = useDocumentStore()
    const row = store.addRow([100])
    const block = store.addBlockToColumn(row.columns[0].id, 'image')
    store.updateBlock(block.id, { alt: 'Foto original' })
    dropMediaImageOnImageBlock(store, block.id, { kind: 'media-image', src: 'https://example.com/nueva.png', alt: 'Nueva' })
    const found = store.findBlock(block.id)!.block
    if (found.type !== 'image') throw new Error()
    expect(found.src).toBe('https://example.com/nueva.png')
    expect(found.alt).toBe('Foto original')
  })

  it('toma el alt del drag si el bloque imagen no tenía uno', () => {
    const store = useDocumentStore()
    const row = store.addRow([100])
    const block = store.addBlockToColumn(row.columns[0].id, 'image')
    dropMediaImageOnImageBlock(store, block.id, { kind: 'media-image', src: 'https://example.com/a.png', alt: 'Un gato' })
    const found = store.findBlock(block.id)!.block
    if (found.type !== 'image') throw new Error()
    expect(found.alt).toBe('Un gato')
  })

  it('no hace nada si el bloque destino no es de tipo imagen', () => {
    const store = useDocumentStore()
    const row = store.addRow([100])
    const block = store.addBlockToColumn(row.columns[0].id, 'text')
    dropMediaImageOnImageBlock(store, block.id, { kind: 'media-image', src: 'x', alt: 'y' })
    const found = store.findBlock(block.id)!.block
    expect(found.type).toBe('text')
  })

  it('fija la imagen solo en el índice soltado de una galería, sin afectar los demás ítems', () => {
    const store = useDocumentStore()
    const row = store.addRow([100])
    const block = store.addBlockToColumn(row.columns[0].id, 'gallery')
    dropMediaImageOnGalleryItem(store, block.id, 1, { kind: 'media-image', src: 'https://example.com/b.png', alt: 'B' })
    const found = store.findBlock(block.id)!.block
    if (found.type !== 'gallery') throw new Error()
    expect(found.images[0]).toEqual({ src: '', alt: '' })
    expect(found.images[1]).toMatchObject({ src: 'https://example.com/b.png', alt: 'B' })
  })

  it('no pisa el alt de un ítem de galería que ya tenía uno', () => {
    const store = useDocumentStore()
    const row = store.addRow([100])
    const block = store.addBlockToColumn(row.columns[0].id, 'gallery')
    store.updateBlock(block.id, { images: [{ src: '', alt: 'Alt original' }, { src: '', alt: '' }] })
    dropMediaImageOnGalleryItem(store, block.id, 0, { kind: 'media-image', src: 'https://example.com/c.png', alt: 'Nuevo alt' })
    const found = store.findBlock(block.id)!.block
    if (found.type !== 'gallery') throw new Error()
    expect(found.images[0]).toEqual({ src: 'https://example.com/c.png', alt: 'Alt original' })
  })

  it('no hace nada si el bloque destino no es de tipo galería', () => {
    const store = useDocumentStore()
    const row = store.addRow([100])
    const block = store.addBlockToColumn(row.columns[0].id, 'text')
    dropMediaImageOnGalleryItem(store, block.id, 0, { kind: 'media-image', src: 'x', alt: 'y' })
    const found = store.findBlock(block.id)!.block
    expect(found.type).toBe('text')
  })

  it('crea fila + bloque imagen en el canvas vacío, deshacible en un solo undo', () => {
    const store = useDocumentStore()
    const base = store.past.length
    dropMediaImageOnEmptyCanvas(store, { kind: 'media-image', src: 'https://example.com/d.png', alt: 'D' })
    expect(store.doc.rows).toHaveLength(1)
    const b = store.doc.rows[0].columns[0].blocks[0]
    if (b.type !== 'image') throw new Error()
    expect(b.src).toBe('https://example.com/d.png')
    expect(b.alt).toBe('D')
    expect(store.past.length).toBe(base + 1)
    store.undo()
    expect(store.doc.rows).toHaveLength(0)
  })
})
```

- [ ] **Step 3: Correr los tests y verificar que fallan**

Run: `cd packages/email-builder && pnpm test -- dnd.test.ts`
Expected: FAIL — `dropMediaImageOnImageBlock`/`dropMediaImageOnGalleryItem`/`dropMediaImageOnEmptyCanvas` no existen todavía (error de import/TS).

- [ ] **Step 4: Implementar las tres funciones en `applyDrop.ts`**

Agregar al final de `packages/email-builder/src/dnd/applyDrop.ts`:

```ts
/** Reemplaza el src de un bloque `image` existente; conserva el alt si ya tenía uno. */
export function dropMediaImageOnImageBlock(
  store: Store,
  blockId: string,
  drag: Extract<DragData, { kind: 'media-image' }>,
): void {
  const found = store.findBlock(blockId)
  if (!found || found.block.type !== 'image') return
  const b = found.block
  store.updateBlock(b.id, { src: drag.src, ...(b.alt ? {} : { alt: drag.alt }) })
}

/** Fija la imagen en el índice `index` de un bloque `gallery`; conserva el alt de ese ítem si ya tenía uno. */
export function dropMediaImageOnGalleryItem(
  store: Store,
  blockId: string,
  index: number,
  drag: Extract<DragData, { kind: 'media-image' }>,
): void {
  const found = store.findBlock(blockId)
  if (!found || found.block.type !== 'gallery') return
  const b = found.block
  store.updateBlock(b.id, {
    images: b.images.map((im, j) => (j === index ? { ...im, src: drag.src, alt: im.alt || drag.alt } : im)),
  })
}

/**
 * Suelta una imagen en el canvas vacío (o fuera de cualquier bloque imagen/galería existente):
 * crea una fila de 1 columna + un bloque imagen con ese src/alt. Mismo truco de fusión de
 * historial que `dropBlockOnEmptyCanvas`, generalizado a 3 commits (addRow + addBlockToColumn +
 * updateBlock): `before` se captura después de `addRow` (que ya empujó su propio commit), y el
 * `while` descarta todos los commits posteriores para que sobreviva únicamente el de `addRow`
 * — así un solo undo revierte fila+bloque+src completos.
 */
export function dropMediaImageOnEmptyCanvas(store: Store, drag: Extract<DragData, { kind: 'media-image' }>): void {
  const row = store.addRow([100])
  const before = store.past.length
  const block = store.addBlockToColumn(row.columns[0].id, 'image')
  store.updateBlock(block.id, { src: drag.src, alt: drag.alt })
  while (store.past.length > before) store.past.pop()
}
```

- [ ] **Step 5: Correr los tests y verificar que pasan**

Run: `cd packages/email-builder && pnpm test -- dnd.test.ts`
Expected: PASS (todos los tests del archivo, incluidos los preexistentes).

- [ ] **Step 6: Typecheck y commit**

Run: `cd packages/email-builder && pnpm typecheck`
Expected: sin errores.

```bash
git add packages/email-builder/src/dnd/dragData.ts packages/email-builder/src/dnd/applyDrop.ts packages/email-builder/tests/dnd.test.ts
git commit -m "feat: agrega kind media-image y funciones de drop puras (image/gallery/canvas vacío)"
```

---

## Task 2: `DraggableImageThumb.vue` + arrastre desde ambos tabs de imágenes

**Files:**
- Create: `packages/email-builder/src/components/tabs/DraggableImageThumb.vue`
- Modify: `packages/email-builder/src/components/tabs/ImagesTab.vue`
- Modify: `packages/email-builder/src/components/tabs/MediaLibraryTab.vue`
- Test: `packages/email-builder/tests/images-tab.test.ts`, `packages/email-builder/tests/media-library-tab.test.ts` (regresión, sin cambios de contenido — deben seguir pasando tal cual)

**Interfaces:**
- Consumes: `useDraggableItem` de `../../dnd/usePragmatic` (ya existe, firma sin cambios: `{ el, getData, previewLabel, canDrag?, onStart?, onDrop? }`).
- Produces: componente `DraggableImageThumb` con props `{ src: string; thumbnailUrl: string; alt: string; thumbClass: string }` y evento `click` (sin payload) — usado por `ImagesTab.vue` y `MediaLibraryTab.vue` en la Task 4/5 de este mismo plan (en este caso, Task 2 ya los deja wireados).

- [ ] **Step 1: Crear `DraggableImageThumb.vue`**

```vue
<template>
  <button ref="el" type="button" :class="thumbClass" @click="$emit('click')">
    <img :src="thumbnailUrl" :alt="alt" />
  </button>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDraggableItem } from '../../dnd/usePragmatic'

const props = defineProps<{
  src: string
  thumbnailUrl: string
  alt: string
  thumbClass: string
}>()
defineEmits<{ click: [] }>()

const el = ref<HTMLElement | null>(null)

useDraggableItem({
  el,
  getData: () => ({ kind: 'media-image', src: props.src, alt: props.alt }),
  previewLabel: () => props.alt || 'Imagen',
})
</script>
```

- [ ] **Step 2: Correr la suite existente ANTES de tocar los tabs (baseline)**

Run: `cd packages/email-builder && pnpm test -- images-tab.test.ts media-library-tab.test.ts`
Expected: PASS (todavía usan los `<button>` originales — este paso solo confirma el punto de partida).

- [ ] **Step 3: Usar `DraggableImageThumb` en `ImagesTab.vue`**

En `packages/email-builder/src/components/tabs/ImagesTab.vue`, reemplazar el bloque:

```html
    <div v-else-if="status === 'results'" class="vmd-image-grid">
      <button
        v-for="(result, i) in results"
        :key="i"
        type="button"
        class="vmd-image-result"
        @click="selectImage(result)"
      >
        <img :src="result.thumbnailUrl" :alt="result.title ?? ''" />
      </button>
    </div>
```

por:

```html
    <div v-else-if="status === 'results'" class="vmd-image-grid">
      <DraggableImageThumb
        v-for="(result, i) in results"
        :key="i"
        :src="result.url"
        :thumbnail-url="result.thumbnailUrl"
        :alt="result.title ?? ''"
        thumb-class="vmd-image-result"
        @click="selectImage(result)"
      />
    </div>
```

Y agregar el import junto a los demás (después de `import { openverseSearch, ... } from '../../imageSearch'`):

```ts
import DraggableImageThumb from './DraggableImageThumb.vue'
```

`selectImage` no cambia.

- [ ] **Step 4: Usar `DraggableImageThumb` en `MediaLibraryTab.vue`**

En `packages/email-builder/src/components/tabs/MediaLibraryTab.vue`, reemplazar solo el botón del thumbnail (dejando el resto del ítem — nombre, menú, rename, confirm delete — intacto):

```html
        <button type="button" class="vmd-media-item-thumb" @click="insert(item)">
          <img :src="item.thumbnailUrl" :alt="item.name ?? ''" />
        </button>
```

por:

```html
        <DraggableImageThumb
          :src="item.url"
          :thumbnail-url="item.thumbnailUrl"
          :alt="item.name ?? ''"
          thumb-class="vmd-media-item-thumb"
          @click="insert(item)"
        />
```

Agregar el import junto a los demás (después de `import { ICONS } from '../icons'` o cualquier otro import de componente):

```ts
import DraggableImageThumb from './DraggableImageThumb.vue'
```

`insert` no cambia.

- [ ] **Step 5: Correr la suite y verificar que sigue pasando (regresión)**

Run: `cd packages/email-builder && pnpm test -- images-tab.test.ts media-library-tab.test.ts`
Expected: PASS — mismo comportamiento de click, ahora servido por `DraggableImageThumb`. Si algún test falla por selector CSS (p.ej. buscaba `button.vmd-image-result` directamente), ajustar el selector del test para que siga apuntando al mismo elemento (el `<button>` sigue existiendo, ahora dentro del componente hijo — `@vue/test-utils` lo encuentra igual vía `wrapper.find('.vmd-image-result')` porque el DOM renderizado es idéntico).

- [ ] **Step 6: Typecheck, build y commit**

Run: `cd packages/email-builder && pnpm typecheck && pnpm build`
Expected: sin errores.

```bash
git add packages/email-builder/src/components/tabs/DraggableImageThumb.vue packages/email-builder/src/components/tabs/ImagesTab.vue packages/email-builder/src/components/tabs/MediaLibraryTab.vue
git commit -m "feat: miniaturas de imagen arrastrables en los tabs Imagenes y Galeria de medios"
```

---

## Task 3: `useMediaDropTarget` + drop sobre bloque `image` en el canvas

**Files:**
- Modify: `packages/email-builder/src/dnd/usePragmatic.ts`
- Modify: `packages/email-builder/src/components/BlockView.vue`
- Modify: `packages/email-builder/src/styles.css`
- Test: `packages/email-builder/tests/block-view.test.ts` (regresión, sin cambios de contenido)

**Interfaces:**
- Consumes: `dropMediaImageOnImageBlock` de `../dnd/applyDrop` (Task 1). `readDrag`/`DragData` de `./dragData` (ya importados en `usePragmatic.ts`).
- Produces: `useMediaDropTarget(opts: { el: Ref<HTMLElement | null>; onDrop: (drag: Extract<DragData, { kind: 'media-image' }>) => void }): { isOver: Ref<boolean> }` — usado también en la Task 4 (`GalleryItemView.vue`).

- [ ] **Step 1: Agregar `useMediaDropTarget` a `usePragmatic.ts`**

Al final de `packages/email-builder/src/dnd/usePragmatic.ts`, agregar:

```ts
/**
 * Zona de drop de "reemplazo" para imágenes arrastradas desde los tabs (kind `media-image`):
 * a diferencia de `useDropTarget`, no calcula borde de inserción — solo expone `isOver` para
 * resaltar visualmente el destino mientras el arrastre está encima.
 */
export function useMediaDropTarget(opts: {
  el: Ref<HTMLElement | null>
  onDrop: (drag: Extract<DragData, { kind: 'media-image' }>) => void
}): { isOver: Ref<boolean> } {
  const isOver = ref(false)
  let cleanup = () => {}
  onMounted(() => {
    const element = opts.el.value
    if (!element) return
    cleanup = dropTargetForElements({
      element,
      canDrop: ({ source }) => readDrag(source.data as Record<string, unknown>)?.kind === 'media-image',
      onDragEnter: () => {
        isOver.value = true
      },
      onDragLeave: () => {
        isOver.value = false
      },
      onDrop: ({ source }) => {
        isOver.value = false
        const d = readDrag(source.data as Record<string, unknown>)
        if (d?.kind === 'media-image') opts.onDrop(d)
      },
    })
  })
  onBeforeUnmount(() => cleanup())
  return { isOver }
}
```

Este composable usa el mismo `Extract<DragData, ...>` que ya está importado como tipo `DragData` en el archivo — no hace falta un import nuevo (`DragData` ya se importa en la línea existente `import { packDrag, readDrag, type DragData, type Edge } from './dragData'`).

- [ ] **Step 2: Confirmar que compila (sin tests directos del composable — ver Global Constraints)**

Run: `cd packages/email-builder && pnpm typecheck`
Expected: sin errores.

- [ ] **Step 3: Escribir el test de regresión ANTES de tocar `BlockView.vue` (baseline)**

Run: `cd packages/email-builder && pnpm test -- block-view.test.ts`
Expected: PASS (confirma el punto de partida antes del refactor de la Step 4).

- [ ] **Step 4: Wirear el drop target en el bloque `image` de `BlockView.vue`**

En `packages/email-builder/src/components/BlockView.vue`, el bloque actual (líneas ~46-54):

```html
    <!-- image -->
    <div v-else-if="block.type === 'image'" :style="{ padding: padCss(block.style.padding), textAlign: block.align }">
      <img
        v-if="block.src"
        :src="block.src"
        :alt="block.alt"
        :style="block.widthAuto ? { width: 'auto', maxWidth: '100%', display: 'inline-block' } : { width: block.widthPct + '%', display: 'inline-block' }"
      />
      <div v-else class="vmd-b-image-placeholder"><span class="vmd-ico" v-html="ICONS.image" />Selecciona una imagen en el inspector</div>
    </div>
```

reemplazar por:

```html
    <!-- image -->
    <div v-else-if="block.type === 'image'" :style="{ padding: padCss(block.style.padding), textAlign: block.align }">
      <img
        v-if="block.src"
        ref="imageDropEl"
        :src="block.src"
        :alt="block.alt"
        :class="{ 'vmd-media-drop-active': isImageOver }"
        :style="block.widthAuto ? { width: 'auto', maxWidth: '100%', display: 'inline-block' } : { width: block.widthPct + '%', display: 'inline-block' }"
      />
      <div v-else ref="imageDropEl" class="vmd-b-image-placeholder" :class="{ 'vmd-media-drop-active': isImageOver }"><span class="vmd-ico" v-html="ICONS.image" />Selecciona una imagen en el inspector</div>
    </div>
```

En el `<script setup>`, actualizar el import existente:

```ts
import { useDraggableItem, useDropTarget } from '../dnd/usePragmatic'
import { dropBlock } from '../dnd/applyDrop'
```

por:

```ts
import { useDraggableItem, useDropTarget, useMediaDropTarget } from '../dnd/usePragmatic'
import { dropBlock, dropMediaImageOnImageBlock } from '../dnd/applyDrop'
```

Y agregar, después del bloque existente `const { edge: blockEdge } = useDropTarget({...})`:

```ts
const imageDropEl = ref<HTMLElement | null>(null)
const { isOver: isImageOver } = useMediaDropTarget({
  el: imageDropEl,
  onDrop: (drag) => dropMediaImageOnImageBlock(store, props.block.id, drag),
})
```

- [ ] **Step 5: Correr la suite y verificar que sigue pasando**

Run: `cd packages/email-builder && pnpm test -- block-view.test.ts block-view-fase-b.test.ts`
Expected: PASS — el placeholder y el `<img>` siguen renderizando igual (el `ref`/clase nuevos no cambian el texto ni las clases existentes que ya se testeaban).

- [ ] **Step 6: CSS de feedback visual**

En `packages/email-builder/src/styles.css`, después de la regla existente `.vmd-column-empty.vmd-drop-active { ... }` (línea ~136-139), agregar:

```css
/* resaltado de bloque imagen / ítem de galería al recibir un arrastre de media-image */
.vmd-b-image-placeholder.vmd-media-drop-active,
.vmd-b-gallery-placeholder.vmd-media-drop-active {
  border-color: var(--vmd-accent); color: var(--vmd-accent);
  background: color-mix(in srgb, var(--vmd-accent) 8%, transparent);
}
img.vmd-media-drop-active { outline: 2px solid var(--vmd-accent); outline-offset: 2px; }
```

- [ ] **Step 7: Typecheck, build y commit**

Run: `cd packages/email-builder && pnpm typecheck && pnpm build`
Expected: sin errores.

```bash
git add packages/email-builder/src/dnd/usePragmatic.ts packages/email-builder/src/components/BlockView.vue packages/email-builder/src/styles.css
git commit -m "feat: drop de media-image sobre bloque imagen en el canvas"
```

---

## Task 4: `GalleryItemView.vue` — drop por ítem de galería

**Files:**
- Create: `packages/email-builder/src/components/GalleryItemView.vue`
- Modify: `packages/email-builder/src/components/BlockView.vue`
- Test: `packages/email-builder/tests/block-view-fase-b.test.ts` (regresión, sin cambios de contenido)
- Test: `packages/email-builder/tests/dnd.test.ts` (ya cubre la lógica pura desde la Task 1 — no hace falta agregar nada acá)

**Interfaces:**
- Consumes: `useMediaDropTarget` de `../dnd/usePragmatic` (Task 3), `dropMediaImageOnGalleryItem` de `../dnd/applyDrop` (Task 1), `GalleryBlock` de `../schema`.
- Produces: componente `GalleryItemView` con props `{ img: GalleryBlock['images'][number]; index: number; blockId: string }`, sin eventos (mutación directa vía store).

- [ ] **Step 1: Correr el test de regresión ANTES de tocar `BlockView.vue` (baseline)**

Run: `cd packages/email-builder && pnpm test -- block-view-fase-b.test.ts`
Expected: PASS — en particular `'gallery sin src muestra placeholders, uno por imagen'`.

- [ ] **Step 2: Crear `GalleryItemView.vue`**

```vue
<template>
  <img
    v-if="img.src"
    ref="el"
    :src="img.src"
    :alt="img.alt"
    :class="{ 'vmd-media-drop-active': isOver }"
    style="width: 100%; display: block"
  />
  <div
    v-else
    ref="el"
    class="vmd-b-image-placeholder vmd-b-gallery-placeholder"
    :class="{ 'vmd-media-drop-active': isOver }"
  ><span class="vmd-ico" v-html="ICONS.image" /></div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { GalleryBlock } from '../schema'
import { useDocumentStore } from '../store/document'
import { useBuilderPinia } from '../store/keys'
import { useMediaDropTarget } from '../dnd/usePragmatic'
import { dropMediaImageOnGalleryItem } from '../dnd/applyDrop'
import { ICONS } from './icons'

const props = defineProps<{
  img: GalleryBlock['images'][number]
  index: number
  blockId: string
}>()

const store = useDocumentStore(useBuilderPinia())
const el = ref<HTMLElement | null>(null)

const { isOver } = useMediaDropTarget({
  el,
  onDrop: (drag) => dropMediaImageOnGalleryItem(store, props.blockId, props.index, drag),
})
</script>
```

`isOver` se desestructura tal cual (sin renombrar) porque acá solo hay un uso; en `BlockView.vue` (Task 3) se renombra a `isImageOver` porque conviven varios `computed`/refs en el mismo scope.

- [ ] **Step 3: Usar `GalleryItemView` en `BlockView.vue`**

El bloque actual (líneas ~156-167):

```html
    <!-- gallery -->
    <div v-else-if="block.type === 'gallery'" :style="{ padding: padCss(block.style.padding) }">
      <div
        class="vmd-b-gallery"
        :style="{ display: 'grid', gridTemplateColumns: 'repeat(' + block.columns + ', 1fr)', gap: block.gap + 'px' }"
      >
        <template v-for="(img, i) in block.images" :key="i">
          <img v-if="img.src" :src="img.src" :alt="img.alt" style="width: 100%; display: block" />
          <div v-else class="vmd-b-image-placeholder vmd-b-gallery-placeholder"><span class="vmd-ico" v-html="ICONS.image" /></div>
        </template>
      </div>
    </div>
```

reemplazar por:

```html
    <!-- gallery -->
    <div v-else-if="block.type === 'gallery'" :style="{ padding: padCss(block.style.padding) }">
      <div
        class="vmd-b-gallery"
        :style="{ display: 'grid', gridTemplateColumns: 'repeat(' + block.columns + ', 1fr)', gap: block.gap + 'px' }"
      >
        <GalleryItemView
          v-for="(img, i) in block.images"
          :key="i"
          :img="img"
          :index="i"
          :block-id="block.id"
        />
      </div>
    </div>
```

Agregar el import junto a `import { ICONS } from './icons'`:

```ts
import GalleryItemView from './GalleryItemView.vue'
```

- [ ] **Step 4: Correr la suite y verificar que sigue pasando**

Run: `cd packages/email-builder && pnpm test -- block-view-fase-b.test.ts`
Expected: PASS — `wrapper.findAll('.vmd-b-gallery-placeholder')` sigue encontrando 3 elementos (ahora renderizados por `GalleryItemView`, mismo DOM resultante).

- [ ] **Step 5: Typecheck, build y commit**

Run: `cd packages/email-builder && pnpm typecheck && pnpm build`
Expected: sin errores.

```bash
git add packages/email-builder/src/components/GalleryItemView.vue packages/email-builder/src/components/BlockView.vue
git commit -m "feat: drop de media-image por item individual de un bloque galeria"
```

---

## Task 5: Fallback de canvas vacío (soltar fuera de bloque imagen/galería)

**Files:**
- Modify: `packages/email-builder/src/components/BuilderCanvas.vue`

**Interfaces:**
- Consumes: `dropMediaImageOnEmptyCanvas` de `../dnd/applyDrop` (Task 1, ya testeada ahí — esta tarea solo la conecta al drop target existente del canvas).

- [ ] **Step 1: Extender el `accept`/`onDrop` del contenedor de filas**

En `packages/email-builder/src/components/BuilderCanvas.vue`, el bloque actual:

```ts
const { edge: containerEdge } = useDropTarget({
  el: rowsEl,
  getData: () => ({ vmdRowsContainer: true }),
  accept: (d) => d.kind === 'palette-row' || d.kind === 'canvas-row' || (store.doc.rows.length === 0 && (d.kind === 'palette-block' || d.kind === 'canvas-block')),
  onDrop: (drag) => {
    if (drag.kind === 'palette-row' || drag.kind === 'canvas-row') dropRow(store, drag, null, null)
    else if (store.doc.rows.length === 0) dropBlockOnEmptyCanvas(store, drag)
  },
})
```

reemplazar por:

```ts
const { edge: containerEdge } = useDropTarget({
  el: rowsEl,
  getData: () => ({ vmdRowsContainer: true }),
  accept: (d) =>
    d.kind === 'palette-row' ||
    d.kind === 'canvas-row' ||
    d.kind === 'media-image' ||
    (store.doc.rows.length === 0 && (d.kind === 'palette-block' || d.kind === 'canvas-block')),
  onDrop: (drag) => {
    if (drag.kind === 'palette-row' || drag.kind === 'canvas-row') dropRow(store, drag, null, null)
    else if (drag.kind === 'media-image') dropMediaImageOnEmptyCanvas(store, drag)
    else if (store.doc.rows.length === 0) dropBlockOnEmptyCanvas(store, drag)
  },
})
```

A diferencia de `palette-block`/`canvas-block` (que solo se aceptan con `rows.length === 0`), `media-image` se acepta siempre — el fallback de imagen debe funcionar tanto en canvas vacío como con filas existentes (ver Task 1/spec sección 4). El target más interno (bloque `image` de la Task 3, ítem de `gallery` de la Task 4) sigue ganando cuando el drop cae exactamente ahí: el guard `isInnermost` que ya tiene `useDropTarget` (sin cambios en esta tarea) hace que `containerEdge`'s `onDrop` se ignore cuando `location.current.dropTargets[0]` es el target más específico, no `rowsEl`.

Actualizar el import existente:

```ts
import { dropBlockOnEmptyCanvas, dropRow } from '../dnd/applyDrop'
```

por:

```ts
import { dropBlockOnEmptyCanvas, dropMediaImageOnEmptyCanvas, dropRow } from '../dnd/applyDrop'
```

- [ ] **Step 2: Typecheck y build**

Run: `cd packages/email-builder && pnpm typecheck && pnpm build`
Expected: sin errores. (La lógica de `dropMediaImageOnEmptyCanvas` ya está cubierta por el test de la Task 1; esta tarea es pura conexión de wiring, sin lógica nueva que testear — ver Global Constraints sobre gestos de arrastre no simulables en jsdom.)

- [ ] **Step 3: Correr la suite completa**

Run: `cd packages/email-builder && pnpm test`
Expected: PASS (todos los tests, incluida la suite completa existente).

- [ ] **Step 4: Commit**

```bash
git add packages/email-builder/src/components/BuilderCanvas.vue
git commit -m "feat: fallback de media-image al soltar fuera de bloque imagen/galeria"
```

---

## Task 6: Verificación final en browser + cierre

**Files:** ninguno (solo verificación manual; fixes puntuales si aparece algo, en los archivos que corresponda).

- [ ] **Step 1: Suite completa, typecheck y build desde la raíz del paquete**

Run: `cd packages/email-builder && pnpm test && pnpm typecheck && pnpm build`
Expected: todo verde.

- [ ] **Step 2: Levantar la demo y verificar en browser**

Arrancar el server de la demo (`apps/demo`, ya cablea `mediaLibrary` en memoria — ver commit `b592ca4`). Con el preview abierto:

1. Ir al tab "Imágenes" (Openverse), buscar algo (ej. "coffee"), arrastrar un resultado sobre un bloque `image` ya puesto en el canvas → el `src` debe reemplazarse y verse la imagen nueva.
2. Arrastrar otro resultado sobre uno de los placeholders de un bloque `gallery` con 2+ ítems → solo ese ítem debe llenarse, el resto sigue como placeholder.
3. Ir al tab "Galería de medios", subir o usar una imagen ya presente, arrastrarla sobre el canvas vacío (sin ningún bloque `image`/`gallery` debajo del cursor) → debe crear una fila nueva con un bloque imagen; un `Cmd+Z`/`Ctrl+Z` debe deshacer fila+bloque completos en un solo paso.
4. Confirmar que el feedback visual (borde/outline de acento) aparece mientras el cursor está encima de un destino válido, y que el click-to-insert de ambos tabs sigue funcionando exactamente igual que antes (sin selección → crea bloque nuevo; con bloque `image` seleccionado → reemplaza su src).

- [ ] **Step 3: Si algo no matchea el criterio de aceptación del spec, arreglarlo y volver a Step 1**

Criterios de aceptación (spec sección 7): drop sobre bloque imagen reemplaza src preservando alt; drop sobre ítem de galería fija solo ese índice; drop en cualquier otro punto crea fila+bloque nuevo deshacible en un undo; click-to-insert sin cambios; suite+typecheck+build verdes.

- [ ] **Step 4: Commit final si hubo fixes**

```bash
git add -A
git commit -m "fix: ajustes de verificacion browser del drag&drop de imagenes"
```

(Si no hubo cambios en el Step 3, este commit no aplica — la Task 5 ya fue el último commit de código.)
