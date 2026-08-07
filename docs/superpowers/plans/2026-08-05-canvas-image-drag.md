# Mover imágenes entre bloques del canvas por arrastre — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** permitir arrastrar una imagen que ya está en el canvas (bloque `image` o ítem de `gallery`) y soltarla sobre otro bloque `image` o ítem de `gallery`, moviéndola: el destino la recibe y el origen queda vacío.

**Architecture:** un `kind` nuevo (`canvas-image`) en la unión `DragData` transporta `{ src, alt, from: ImageSlot }`, donde `ImageSlot = { blockId, index? }` identifica un hueco de imagen (`index` ausente = bloque `image`, presente = ítem de `gallery`). Una única función pura `dropCanvasImage(store, drag, to)` cubre los 4 cruces origen×destino y fusiona los dos commits de historial en uno. Los drop targets de imagen ya existentes (`useMediaDropTarget`) pasan a aceptar los dos kinds y despachan por kind; los `<img>` del canvas ganan un `draggable` propio vía `useCanvasImageDrag`.

**Tech Stack:** Vue 3 (`<script setup>`, TS), Pinia, `@atlaskit/pragmatic-drag-and-drop`, Vitest + `@vue/test-utils` (jsdom).

**Spec:** [`docs/superpowers/specs/2026-08-05-canvas-image-drag-design.md`](../specs/2026-08-05-canvas-image-drag-design.md)

## Global Constraints

- Monorepo pnpm. Todo el trabajo ocurre en `packages/email-builder/`.
- Comandos desde la raíz del repo: tests `pnpm --filter @vue-mail-designer/builder test`, tipos `pnpm --filter @vue-mail-designer/builder typecheck`.
- TypeScript estricto: nada de `any`; el narrowing de la unión `Block` se hace con `if (b.type !== 'image') return` / `throw new Error()` en tests, tal como ya lo hace `tests/dnd.test.ts`.
- Comentarios de código, nombres de tests y mensajes de commit en **español**, siguiendo el estilo ya presente en el repo (`feat:`, `fix:`, `refactor:`).
- Solo viajan `src` y `alt`. `href`, `widthPct`, `align`, `borderRadius` y `padding` se quedan en su bloque, tanto en origen como en destino.
- El origen se **vacía** (`src: ''`, `alt: ''`); su `href` no se toca. Un ítem de galería vaciado **no se elimina** del array `images`.
- El `alt` del destino se conserva si ya tenía uno no vacío; si no, hereda el del origen.
- Soltar fuera de un destino válido, o sobre el mismo hueco, es **no-op**: ni fila nueva, ni bloque nuevo, ni origen vaciado, ni commit de historial.
- El comportamiento de `media-image` (arrastre desde los tabs) y el click-to-insert **no cambian**.

## File Structure

| Archivo | Responsabilidad | Acción |
|---|---|---|
| `src/dnd/usePragmatic.ts` | composables de arrastre/drop sobre Pragmatic DnD | modificar (Tareas 1, 3) |
| `src/dnd/dragData.ts` | unión `DragData` + tipos de payload | modificar (Tarea 2) |
| `src/dnd/applyDrop.ts` | funciones puras que aplican un drop al store | modificar (Tarea 2) |
| `src/components/BlockView.vue` | render + DnD del bloque `image` | modificar (Tarea 4) |
| `src/components/GalleryItemView.vue` | render + DnD de un ítem de galería | modificar (Tarea 4) |
| `tests/dnd.test.ts` | tests de DnD (unitarios + montaje) | modificar (Tareas 1, 2, 4) |

---

### Task 1: Re-atar los composables de DnD cuando el ref cambia de elemento

**Por qué esta tarea existe:** `BlockView.vue:47-59` y `GalleryItemView.vue:2-15` ponen `ref="imageDropEl"` / `ref="el"` en **las dos ramas** de un `v-if`/`v-else` (el `<img>` cuando hay `src`, el placeholder cuando no). Los composables de `usePragmatic.ts` se atan en `onMounted` y nunca se re-atan, así que cuando Vue intercambia el elemento el binding queda pegado al nodo viejo y descartado. Esto ya es un bug hoy (soltar una imagen sobre un bloque vacío lo llena, pero ese bloque deja de aceptar un segundo drop) y bloquea esta feature: tras mover la imagen fuera, el origen se convierte en placeholder y quedaría muerto como fuente y como destino.

**Files:**
- Modify: `packages/email-builder/src/dnd/usePragmatic.ts`
- Test: `packages/email-builder/tests/dnd.test.ts`

**Interfaces:**
- Consumes: nada de tareas anteriores.
- Produces: las firmas públicas de `useDraggableItem`, `useDropTarget` y `useMediaDropTarget` **no cambian**. Cambia solo su ciclo de vida interno: ahora siguen el elemento actual del ref.

- [ ] **Step 1: Escribir el test que falla**

Agregar al final de `packages/email-builder/tests/dnd.test.ts`:

```ts
describe('usePragmatic — re-atado al cambiar el elemento del ref', () => {
  // BlockView/GalleryItemView ponen el mismo ref en las dos ramas de un v-if/v-else
  // (<img> con src, placeholder sin src). El binding debe seguir al elemento vivo.
  const SwapItem = defineComponent({
    setup() {
      const el = ref<HTMLElement | null>(null)
      const showImg = ref(false)
      useDraggableItem({
        el,
        getData: () => ({ kind: 'canvas-image', src: 'x', alt: '', from: { blockId: 'b' } }),
        previewLabel: () => 'x',
      })
      return { el, showImg }
    },
    render() {
      return this.showImg ? h('img', { ref: 'el', class: 'swap-img' }) : h('div', { ref: 'el', class: 'swap-div' })
    },
  })

  it('el draggable se mueve al elemento nuevo cuando el v-if intercambia el nodo', async () => {
    const wrapper = mount(SwapItem)
    expect((wrapper.find('.swap-div').element as HTMLElement).draggable).toBe(true)
    wrapper.vm.showImg = true
    await nextTick()
    await nextTick()
    expect((wrapper.find('.swap-img').element as HTMLElement).draggable).toBe(true)
  })
})
```

Y ampliar los imports de la cabecera del archivo (líneas 1-7) con:

```ts
import { defineComponent, h, nextTick, ref } from 'vue'
import { useDraggableItem } from '../src/dnd/usePragmatic'
```

Nota: el test usa el kind `canvas-image`, que todavía no existe en `DragData` — `vitest run` igual ejecuta (esbuild no chequea tipos) y el test falla por el motivo correcto. La Tarea 2 agrega el kind y `typecheck` pasa a estar limpio ahí.

- [ ] **Step 2: Correr el test y verificar que falla**

```bash
pnpm --filter @vue-mail-designer/builder test -- -t "el draggable se mueve al elemento nuevo"
```

Esperado: FAIL — `expected false to be true` en la segunda aserción (el `<img>` nuevo nunca recibió el binding).

- [ ] **Step 3: Implementar el re-atado**

En `packages/email-builder/src/dnd/usePragmatic.ts`, cambiar la primera línea de imports:

```ts
import { onBeforeUnmount, ref, watch, type Ref } from 'vue'
```

Agregar este helper justo después de los imports, antes de `useDraggableItem`:

```ts
/**
 * Ata `bind(element)` al elemento actual de `el` y lo re-ata si el ref pasa a apuntar a otro nodo.
 * Necesario porque varias plantillas ponen el mismo ref en las dos ramas de un v-if/v-else
 * (p. ej. <img> con src vs. placeholder sin src): con un `onMounted` a secas el binding quedaría
 * pegado al nodo descartado. `flush: 'post'` garantiza que el DOM ya se actualizó al re-atar.
 */
function bindToElement(el: Ref<HTMLElement | null>, bind: (element: HTMLElement) => () => void): void {
  let cleanup = () => {}
  const stop = watch(
    el,
    (element) => {
      cleanup()
      cleanup = element ? bind(element) : () => {}
    },
    { immediate: true, flush: 'post' },
  )
  onBeforeUnmount(() => {
    stop()
    cleanup()
  })
}
```

En `useDraggableItem`, reemplazar el bloque `let cleanup … onBeforeUnmount(() => cleanup())` por una sola llamada: el cuerpo pasa de

```ts
  let cleanup = () => {}
  onMounted(() => {
    const element = opts.el.value
    if (!element) return
    cleanup = draggable({
      element,
```

a

```ts
  bindToElement(opts.el, (element) =>
    draggable({
      element,
```

manteniendo intacto todo el objeto de opciones de `draggable` (`dragHandle`, `canDrag`, `getInitialData`, `onGenerateDragPreview`, `onDragStart`, `onDrop`), cerrando con `}),\n  )` y **borrando** el `onBeforeUnmount(() => cleanup())` final de la función.

Aplicar exactamente la misma transformación en `useDropTarget` (envolviendo su `dropTargetForElements({ … })`, conservando el `return { edge }`) y en `useMediaDropTarget` (envolviendo su `dropTargetForElements({ … })`, conservando el `return { isOver }`).

`useDragMonitor` **no se toca**: su elemento (`scrollEl`) es el contenedor del canvas, que no se intercambia.

Si tras esto `onMounted` queda sin usarse en el archivo, quitarlo del import de `vue`.

- [ ] **Step 4: Correr los tests y verificar que pasan**

```bash
pnpm --filter @vue-mail-designer/builder test
```

Esperado: PASS, incluido el test nuevo y los de `canvas DnD (montaje)` (que verifican que el handle de fila sigue funcionando tras el refactor).

- [ ] **Step 5: Commit**

```bash
git add packages/email-builder/src/dnd/usePragmatic.ts packages/email-builder/tests/dnd.test.ts
git commit -m "fix: los composables de DnD se re-atan cuando el ref cambia de elemento"
```

---

### Task 2: `ImageSlot`, kind `canvas-image` y `dropCanvasImage`

**Files:**
- Modify: `packages/email-builder/src/dnd/dragData.ts`
- Modify: `packages/email-builder/src/dnd/applyDrop.ts`
- Test: `packages/email-builder/tests/dnd.test.ts`

**Interfaces:**
- Consumes: `store.findBlock(id)`, `store.updateBlock(id, patch)`, `store.sealHistory()`, `store.past` — todos ya expuestos por `useDocumentStore` (`src/store/document.ts`).
- Produces:
  - `export type ImageSlot = { blockId: string; index?: number }` en `dragData.ts`
  - miembro de unión `{ kind: 'canvas-image'; src: string; alt: string; from: ImageSlot }` en `DragData`
  - `export function dropCanvasImage(store: Store, drag: Extract<DragData, { kind: 'canvas-image' }>, to: ImageSlot): void` en `applyDrop.ts`

- [ ] **Step 1: Escribir los tests que fallan**

Agregar a `packages/email-builder/tests/dnd.test.ts`, antes del `describe('usePragmatic — re-atado…')`:

```ts
describe('applyDrop — canvas-image (mover imágenes dentro del canvas)', () => {
  beforeEach(() => setActivePinia(createPinia()))

  /** Bloque imagen con src/alt ya puestos. */
  function imageBlock(store: ReturnType<typeof useDocumentStore>, columnId: string, src: string, alt: string) {
    const b = store.addBlockToColumn(columnId, 'image')
    store.updateBlock(b.id, { src, alt })
    return b
  }

  it('mueve la imagen de un bloque imagen a otro y vacía el origen', () => {
    const store = useDocumentStore()
    const row = store.addRow([100])
    const col = row.columns[0].id
    const origen = imageBlock(store, col, 'https://example.com/a.png', 'A')
    const destino = store.addBlockToColumn(col, 'image')

    dropCanvasImage(
      store,
      { kind: 'canvas-image', src: 'https://example.com/a.png', alt: 'A', from: { blockId: origen.id } },
      { blockId: destino.id },
    )

    const d = store.findBlock(destino.id)!.block
    const o = store.findBlock(origen.id)!.block
    if (d.type !== 'image' || o.type !== 'image') throw new Error()
    expect(d.src).toBe('https://example.com/a.png')
    expect(d.alt).toBe('A')
    expect(o.src).toBe('')
    expect(o.alt).toBe('')
  })

  it('mueve de un bloque imagen a un ítem de galería sin tocar los demás ítems', () => {
    const store = useDocumentStore()
    const row = store.addRow([100])
    const col = row.columns[0].id
    const origen = imageBlock(store, col, 'https://example.com/b.png', 'B')
    const galeria = store.addBlockToColumn(col, 'gallery')

    dropCanvasImage(
      store,
      { kind: 'canvas-image', src: 'https://example.com/b.png', alt: 'B', from: { blockId: origen.id } },
      { blockId: galeria.id, index: 1 },
    )

    const g = store.findBlock(galeria.id)!.block
    if (g.type !== 'gallery') throw new Error()
    expect(g.images[0]).toEqual({ src: '', alt: '' })
    expect(g.images[1]).toMatchObject({ src: 'https://example.com/b.png', alt: 'B' })
  })

  it('mueve de un ítem de galería a un bloque imagen: el ítem se vacía pero sigue en el array', () => {
    const store = useDocumentStore()
    const row = store.addRow([100])
    const col = row.columns[0].id
    const galeria = store.addBlockToColumn(col, 'gallery')
    store.updateBlock(galeria.id, { images: [{ src: 'https://example.com/c.png', alt: 'C' }, { src: '', alt: '' }] })
    const destino = store.addBlockToColumn(col, 'image')
    const g0 = store.findBlock(galeria.id)!.block
    if (g0.type !== 'gallery') throw new Error()
    const total = g0.images.length

    dropCanvasImage(
      store,
      { kind: 'canvas-image', src: 'https://example.com/c.png', alt: 'C', from: { blockId: galeria.id, index: 0 } },
      { blockId: destino.id },
    )

    const g = store.findBlock(galeria.id)!.block
    const d = store.findBlock(destino.id)!.block
    if (g.type !== 'gallery' || d.type !== 'image') throw new Error()
    expect(g.images).toHaveLength(total)
    expect(g.images[0]).toEqual({ src: '', alt: '' })
    expect(d.src).toBe('https://example.com/c.png')
  })

  it('mover entre dos ítems del mismo bloque galería es un solo paso de historial', () => {
    const store = useDocumentStore()
    const row = store.addRow([100])
    const galeria = store.addBlockToColumn(row.columns[0].id, 'gallery')
    store.updateBlock(galeria.id, { images: [{ src: 'https://example.com/d.png', alt: 'D' }, { src: '', alt: '' }] })
    const base = store.past.length

    dropCanvasImage(
      store,
      { kind: 'canvas-image', src: 'https://example.com/d.png', alt: 'D', from: { blockId: galeria.id, index: 0 } },
      { blockId: galeria.id, index: 1 },
    )

    const g = store.findBlock(galeria.id)!.block
    if (g.type !== 'gallery') throw new Error()
    expect(g.images[0]).toEqual({ src: '', alt: '' })
    expect(g.images[1]).toMatchObject({ src: 'https://example.com/d.png', alt: 'D' })
    expect(store.past.length).toBe(base + 1)
  })

  it('conserva el alt del destino si ya tenía uno', () => {
    const store = useDocumentStore()
    const row = store.addRow([100])
    const col = row.columns[0].id
    const origen = imageBlock(store, col, 'https://example.com/e.png', 'Alt del origen')
    const destino = imageBlock(store, col, '', 'Alt del destino')

    dropCanvasImage(
      store,
      { kind: 'canvas-image', src: 'https://example.com/e.png', alt: 'Alt del origen', from: { blockId: origen.id } },
      { blockId: destino.id },
    )

    const d = store.findBlock(destino.id)!.block
    if (d.type !== 'image') throw new Error()
    expect(d.alt).toBe('Alt del destino')
  })

  it('no toca el href del origen ni el del destino', () => {
    const store = useDocumentStore()
    const row = store.addRow([100])
    const col = row.columns[0].id
    const origen = imageBlock(store, col, 'https://example.com/f.png', 'F')
    store.updateBlock(origen.id, { href: 'https://origen.example' })
    const destino = store.addBlockToColumn(col, 'image')
    store.updateBlock(destino.id, { href: 'https://destino.example' })

    dropCanvasImage(
      store,
      { kind: 'canvas-image', src: 'https://example.com/f.png', alt: 'F', from: { blockId: origen.id } },
      { blockId: destino.id },
    )

    const o = store.findBlock(origen.id)!.block
    const d = store.findBlock(destino.id)!.block
    if (o.type !== 'image' || d.type !== 'image') throw new Error()
    expect(o.href).toBe('https://origen.example')
    expect(d.href).toBe('https://destino.example')
  })

  it('soltar sobre el mismo hueco no cambia nada ni agrega historial', () => {
    const store = useDocumentStore()
    const row = store.addRow([100])
    const origen = imageBlock(store, row.columns[0].id, 'https://example.com/g.png', 'G')
    const base = store.past.length

    dropCanvasImage(
      store,
      { kind: 'canvas-image', src: 'https://example.com/g.png', alt: 'G', from: { blockId: origen.id } },
      { blockId: origen.id },
    )

    const o = store.findBlock(origen.id)!.block
    if (o.type !== 'image') throw new Error()
    expect(o.src).toBe('https://example.com/g.png')
    expect(store.past.length).toBe(base)
  })

  it('destino de tipo inválido: no-op, el origen queda intacto', () => {
    const store = useDocumentStore()
    const row = store.addRow([100])
    const col = row.columns[0].id
    const origen = imageBlock(store, col, 'https://example.com/h.png', 'H')
    const texto = store.addBlockToColumn(col, 'text')

    dropCanvasImage(
      store,
      { kind: 'canvas-image', src: 'https://example.com/h.png', alt: 'H', from: { blockId: origen.id } },
      { blockId: texto.id },
    )

    const o = store.findBlock(origen.id)!.block
    if (o.type !== 'image') throw new Error()
    expect(o.src).toBe('https://example.com/h.png')
    expect(store.findBlock(texto.id)!.block.type).toBe('text')
  })

  it('índice de galería fuera de rango: no-op, el origen queda intacto', () => {
    const store = useDocumentStore()
    const row = store.addRow([100])
    const col = row.columns[0].id
    const origen = imageBlock(store, col, 'https://example.com/i.png', 'I')
    const galeria = store.addBlockToColumn(col, 'gallery')

    dropCanvasImage(
      store,
      { kind: 'canvas-image', src: 'https://example.com/i.png', alt: 'I', from: { blockId: origen.id } },
      { blockId: galeria.id, index: 99 },
    )

    const o = store.findBlock(origen.id)!.block
    if (o.type !== 'image') throw new Error()
    expect(o.src).toBe('https://example.com/i.png')
  })

  it('un solo undo revierte origen y destino a la vez', () => {
    const store = useDocumentStore()
    const row = store.addRow([100])
    const col = row.columns[0].id
    const origen = imageBlock(store, col, 'https://example.com/j.png', 'J')
    const destino = store.addBlockToColumn(col, 'image')
    const base = store.past.length

    dropCanvasImage(
      store,
      { kind: 'canvas-image', src: 'https://example.com/j.png', alt: 'J', from: { blockId: origen.id } },
      { blockId: destino.id },
    )
    expect(store.past.length).toBe(base + 1)

    store.undo()

    const o = store.findBlock(origen.id)!.block
    const d = store.findBlock(destino.id)!.block
    if (o.type !== 'image' || d.type !== 'image') throw new Error()
    expect(o.src).toBe('https://example.com/j.png')
    expect(d.src).toBe('')
  })
})
```

Agregar `dropCanvasImage` al import de `applyDrop` en la línea 5 del archivo de tests.

- [ ] **Step 2: Correr los tests y verificar que fallan**

```bash
pnpm --filter @vue-mail-designer/builder test -- -t "canvas-image"
```

Esperado: FAIL con `dropCanvasImage is not a function` (o error de import) en los 10 tests nuevos.

- [ ] **Step 3: Agregar el tipo en `dragData.ts`**

En `packages/email-builder/src/dnd/dragData.ts`, agregar antes de `export type DragData`:

```ts
/** Hueco de imagen del canvas: un bloque `image`, o el ítem `index` de un bloque `gallery`. */
export type ImageSlot = { blockId: string; index?: number }
```

y sumar el miembro a la unión, después de `media-image`:

```ts
  | { kind: 'canvas-image'; src: string; alt: string; from: ImageSlot }
```

- [ ] **Step 4: Implementar `dropCanvasImage` en `applyDrop.ts`**

Cambiar la línea 2 de `packages/email-builder/src/dnd/applyDrop.ts` a:

```ts
import type { DragData, Edge, ImageSlot } from './dragData'
```

y agregar al final del archivo:

```ts
/** Lee el `src`/`alt` de un hueco, o `null` si el bloque no existe o el tipo/índice no corresponde. */
function readSlot(store: Store, slot: ImageSlot): { src: string; alt: string } | null {
  const found = store.findBlock(slot.blockId)
  if (!found) return null
  const b = found.block
  if (slot.index === undefined) {
    return b.type === 'image' ? { src: b.src, alt: b.alt } : null
  }
  if (b.type !== 'gallery') return null
  const im = b.images[slot.index]
  return im ? { src: im.src, alt: im.alt } : null
}

/** Escribe `src`/`alt` en un hueco ya validado por `readSlot`. Un `updateBlock` = un commit. */
function writeSlot(store: Store, slot: ImageSlot, src: string, alt: string): void {
  const found = store.findBlock(slot.blockId)
  if (!found) return
  const b = found.block
  if (slot.index === undefined) {
    if (b.type !== 'image') return
    store.updateBlock(b.id, { src, alt })
    return
  }
  if (b.type !== 'gallery') return
  store.updateBlock(b.id, { images: b.images.map((im, j) => (j === slot.index ? { ...im, src, alt } : im)) })
}

/**
 * Mueve una imagen que ya está en el canvas desde `drag.from` hacia el hueco `to`: el destino
 * recibe `src` (y el `alt` del origen solo si no tenía uno propio) y el origen queda vacío.
 * Solo viajan `src`/`alt` — `href`, `widthPct`, `align`, etc. son del bloque, no de la imagen.
 * Es no-op si el destino es el mismo hueco, o si origen o destino no son huecos válidos: nunca
 * se vacía un origen sin haber escrito el destino.
 */
export function dropCanvasImage(
  store: Store,
  drag: Extract<DragData, { kind: 'canvas-image' }>,
  to: ImageSlot,
): void {
  const from = drag.from
  if (from.blockId === to.blockId && from.index === to.index) return

  const target = readSlot(store, to)
  if (!target || !readSlot(store, from)) return
  const alt = target.alt || drag.alt

  // Mismo bloque galería, índices distintos: las dos escrituras caen sobre el mismo array
  // `images`, así que van en un solo updateBlock (un solo commit, sin fusión de historial).
  if (from.blockId === to.blockId) {
    const b = store.findBlock(to.blockId)!.block
    if (b.type !== 'gallery') return
    store.sealHistory()
    store.updateBlock(b.id, {
      images: b.images.map((im, j) =>
        j === to.index ? { ...im, src: drag.src, alt } : j === from.index ? { ...im, src: '', alt: '' } : im,
      ),
    })
    return
  }

  // Bloques distintos: dos updateBlock con coalesceKey distinta = dos commits. Se conserva el
  // primer snapshot (estado previo completo) y se descarta el intermedio, para que un solo undo
  // revierta origen y destino a la vez. `sealHistory` evita que el primer commit se fusione con
  // una edición reciente del mismo bloque hecha desde el inspector.
  store.sealHistory()
  writeSlot(store, to, drag.src, alt)
  const before = store.past.length
  writeSlot(store, from, '', '')
  while (store.past.length > before) store.past.pop()
}
```

- [ ] **Step 5: Correr los tests y verificar que pasan**

```bash
pnpm --filter @vue-mail-designer/builder test
```

Esperado: PASS — los 10 tests nuevos y todos los previos.

- [ ] **Step 6: Verificar tipos**

```bash
pnpm --filter @vue-mail-designer/builder typecheck
```

Esperado: sin errores.

- [ ] **Step 7: Commit**

```bash
git add packages/email-builder/src/dnd/dragData.ts packages/email-builder/src/dnd/applyDrop.ts packages/email-builder/tests/dnd.test.ts
git commit -m "feat: dropCanvasImage mueve imágenes entre huecos del canvas en un solo undo"
```

---

### Task 3: Los destinos de imagen aceptan `canvas-image`; nuevo `useCanvasImageDrag`

**Files:**
- Modify: `packages/email-builder/src/dnd/usePragmatic.ts`

**Interfaces:**
- Consumes: `ImageSlot` y el kind `canvas-image` (Tarea 2); `useDraggableItem` re-atable (Tarea 1).
- Produces:
  - `export type ImageDrag = Extract<DragData, { kind: 'media-image' | 'canvas-image' }>`
  - `useMediaDropTarget` con `onDrop: (drag: ImageDrag) => void` (antes solo `media-image`)
  - `export function useCanvasImageDrag(opts: { el: Ref<HTMLElement | null>; getData: () => { src: string; alt: string; from: ImageSlot } }): void`

Esta tarea no lleva test propio: no cambia comportamiento observable hasta que la Tarea 4 conecta los componentes, y ahí se verifica con un test de montaje. Su verificación es `typecheck` + la suite existente en verde.

- [ ] **Step 1: Ampliar el import de tipos**

En `packages/email-builder/src/dnd/usePragmatic.ts`, cambiar la línea del import de `dragData` a:

```ts
import { packDrag, readDrag, type DragData, type Edge, type ImageSlot } from './dragData'
```

- [ ] **Step 2: Hacer que `useMediaDropTarget` acepte los dos kinds**

Reemplazar el bloque de comentario + firma de `useMediaDropTarget` por:

```ts
/** Los dos arrastres que llevan una imagen: desde los tabs (copia) y desde el canvas (mueve). */
export type ImageDrag = Extract<DragData, { kind: 'media-image' | 'canvas-image' }>

function isImageDrag(d: DragData | null): d is ImageDrag {
  return d?.kind === 'media-image' || d?.kind === 'canvas-image'
}

/**
 * Zona de drop de "reemplazo" para imágenes (kinds `media-image` y `canvas-image`): a diferencia
 * de `useDropTarget`, no calcula borde de inserción — solo expone `isOver` para resaltar el
 * destino. No necesita el chequeo `isInnermost` de `useDropTarget`: el drop target de bloque
 * acepta solo `palette-block`/`canvas-block`, así que nunca hay dos targets compatibles anidados.
 */
export function useMediaDropTarget(opts: {
  el: Ref<HTMLElement | null>
  onDrop: (drag: ImageDrag) => void
}): { isOver: Ref<boolean> } {
```

y dentro del `dropTargetForElements`, cambiar `canDrop` y `onDrop` a:

```ts
      canDrop: ({ source }) => isImageDrag(readDrag(source.data as Record<string, unknown>)),
```

```ts
      onDrop: ({ source }) => {
        isOver.value = false
        const d = readDrag(source.data as Record<string, unknown>)
        if (isImageDrag(d)) opts.onDrop(d)
      },
```

- [ ] **Step 3: Agregar `useCanvasImageDrag`**

Al final de `packages/email-builder/src/dnd/usePragmatic.ts`:

```ts
/**
 * Hace arrastrable una imagen que ya está en el canvas (el <img> de un bloque `image` o de un
 * ítem de galería). Sin `handle`: arrastra el elemento entero — no choca con el arrastre del
 * bloque, que está restringido a su handle de mover. Un hueco vacío no arrastra nada.
 */
export function useCanvasImageDrag(opts: {
  el: Ref<HTMLElement | null>
  getData: () => { src: string; alt: string; from: ImageSlot }
}): void {
  useDraggableItem({
    el: opts.el,
    getData: () => ({ kind: 'canvas-image', ...opts.getData() }),
    previewLabel: () => opts.getData().alt || 'Imagen',
    canDrag: () => !!opts.getData().src,
  })
}
```

- [ ] **Step 4: Verificar tipos y tests**

```bash
pnpm --filter @vue-mail-designer/builder typecheck && pnpm --filter @vue-mail-designer/builder test
```

Esperado: typecheck sin errores; tests en verde (los callsites de `useMediaDropTarget` en `BlockView.vue`/`GalleryItemView.vue` siguen compilando porque `ImageDrag` es un supertipo del parámetro que ya usaban).

- [ ] **Step 5: Commit**

```bash
git add packages/email-builder/src/dnd/usePragmatic.ts
git commit -m "feat: los destinos de imagen aceptan canvas-image y las imágenes del canvas arrastran"
```

---

### Task 4: Conectar `BlockView.vue` y `GalleryItemView.vue`

**Files:**
- Modify: `packages/email-builder/src/components/BlockView.vue:229-233` (bloque `useMediaDropTarget`) y sus imports (líneas 201-202)
- Modify: `packages/email-builder/src/components/GalleryItemView.vue:23-39`
- Test: `packages/email-builder/tests/dnd.test.ts`

**Interfaces:**
- Consumes: `dropCanvasImage` (Tarea 2), `useCanvasImageDrag` + `useMediaDropTarget` con `ImageDrag` (Tarea 3).
- Produces: nada que consuman tareas posteriores — es la última.

- [ ] **Step 1: Escribir el test de montaje que falla**

`mount(EmailBuilder)` crea su **propia** pinia internamente (`EmailBuilder.vue:89-90`), así que un `useDocumentStore()` del test apuntaría a otro store. Se usa el patrón de host con `provide` que ya emplea `tests/block-view.test.ts:11-20`.

Agregar al final de `packages/email-builder/tests/dnd.test.ts`:

```ts
describe('BlockView — la imagen del canvas es arrastrable', () => {
  it('el <img> con src queda draggable tras reemplazar al placeholder', async () => {
    const pinia = createPinia()
    const base = createBlock('image')
    if (base.type !== 'image') throw new Error()
    const block = reactive(base)
    const Host = defineComponent({
      setup() {
        provide(BUILDER_PINIA_KEY, pinia)
        return () => h(BlockView, { block })
      },
    })
    const wrapper = mount(Host)

    // sin src se monta el placeholder; el <img> aparece recién al setear src
    expect(wrapper.find('.vmd-b-image-placeholder').exists()).toBe(true)

    block.src = 'https://example.com/k.png'
    await nextTick()
    await nextTick()

    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    // OJO: la propiedad IDL `.draggable` vale true por defecto en <img> (spec HTML, y jsdom la
    // replica), así que no discrimina nada. Pragmatic DnD setea el ATRIBUTO — eso es lo que hay
    // que assertar. Mismo aprendizaje que en el test de re-atado de la Tarea 1.
    expect(img.attributes('draggable')).toBe('true')
  })
})
```

Ampliar los imports del archivo de tests con lo que falte:

```ts
import { defineComponent, h, nextTick, provide, reactive, ref } from 'vue'
import BlockView from '../src/components/BlockView.vue'
import { BUILDER_PINIA_KEY } from '../src/store/keys'
```

(`defineComponent`, `h`, `nextTick` y `ref` ya los agregó la Tarea 1; acá se suman `provide` y `reactive`.)

Este test depende del re-atado de la Tarea 1: el `<img>` reemplaza al placeholder después del montaje, así que el binding tiene que seguir al nodo nuevo.

- [ ] **Step 2: Correr el test y verificar que falla**

```bash
pnpm --filter @vue-mail-designer/builder test -- -t "el <img> con src queda draggable"
```

Esperado: FAIL — `expected false to be true`: el `<img>` no es draggable porque nadie llamó a `useCanvasImageDrag`.

- [ ] **Step 3: Conectar `BlockView.vue`**

Cambiar las líneas 201-202 de `packages/email-builder/src/components/BlockView.vue` a:

```ts
import { useCanvasImageDrag, useDraggableItem, useDropTarget, useMediaDropTarget } from '../dnd/usePragmatic'
import { dropBlock, dropCanvasImage, dropMediaImageOnImageBlock } from '../dnd/applyDrop'
```

y reemplazar el bloque de las líneas 229-233 por:

```ts
const imageDropEl = ref<HTMLElement | null>(null)
const { isOver: isImageOver } = useMediaDropTarget({
  el: imageDropEl,
  onDrop: (drag) => {
    if (drag.kind === 'media-image') dropMediaImageOnImageBlock(store, props.block.id, drag)
    else dropCanvasImage(store, drag, { blockId: props.block.id })
  },
})
useCanvasImageDrag({
  el: imageDropEl,
  getData: () => {
    const b = props.block
    return b.type === 'image'
      ? { src: b.src, alt: b.alt, from: { blockId: b.id } }
      : { src: '', alt: '', from: { blockId: b.id } }
  },
})
```

La rama `b.type !== 'image'` existe solo para satisfacer el narrowing de la unión `Block`: `imageDropEl` únicamente se monta en la rama `v-else-if="block.type === 'image'"` de la plantilla, y `src: ''` hace que `canDrag` devuelva `false` de todos modos.

- [ ] **Step 4: Conectar `GalleryItemView.vue`**

Reemplazar las líneas 23-39 de `packages/email-builder/src/components/GalleryItemView.vue` por:

```ts
import { useCanvasImageDrag, useMediaDropTarget } from '../dnd/usePragmatic'
import { dropCanvasImage, dropMediaImageOnGalleryItem } from '../dnd/applyDrop'
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
  onDrop: (drag) => {
    if (drag.kind === 'media-image') dropMediaImageOnGalleryItem(store, props.blockId, props.index, drag)
    else dropCanvasImage(store, drag, { blockId: props.blockId, index: props.index })
  },
})

useCanvasImageDrag({
  el,
  getData: () => ({ src: props.img.src, alt: props.img.alt, from: { blockId: props.blockId, index: props.index } }),
})
```

- [ ] **Step 5: Correr toda la suite y el typecheck**

```bash
pnpm --filter @vue-mail-designer/builder test && pnpm --filter @vue-mail-designer/builder typecheck
```

Esperado: todo en verde.

- [ ] **Step 6: Verificación manual en el navegador**

Levantar el demo (`pnpm dev`) y comprobar, en este orden:

1. Arrastrar la imagen de un bloque `image` sobre otro bloque `image` → el destino la muestra, el origen queda con el placeholder "Selecciona una imagen en el inspector".
2. Un solo Ctrl/Cmd+Z devuelve las dos imágenes a su lugar de una vez.
3. Arrastrar esa misma imagen sobre un ítem de una galería → solo ese ítem cambia; el resto de la galería queda igual.
4. Arrastrar un ítem de galería hacia otro ítem de la **misma** galería → los dos huecos se actualizan y un solo undo lo revierte.
5. Soltar una imagen sobre un bloque de texto o sobre el margen del canvas → no pasa nada; la imagen sigue en su origen.
6. El placeholder de un bloque vacío no inicia arrastre.
7. El handle de mover del bloque sigue moviendo el bloque entero (no la imagen).
8. Arrastrar una miniatura desde el tab de Imágenes sigue funcionando igual que antes, incluido el fallback que crea fila+bloque al soltar fuera.

- [ ] **Step 7: Commit**

```bash
git add packages/email-builder/src/components/BlockView.vue packages/email-builder/src/components/GalleryItemView.vue packages/email-builder/tests/dnd.test.ts
git commit -m "feat: arrastrar imágenes del canvas entre bloques imagen e ítems de galería"
```
