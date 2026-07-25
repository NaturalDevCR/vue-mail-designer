# Drag & drop de imágenes a bloque imagen y galería — Diseño

**Fecha:** 2026-07-25
**Contexto:** hoy los dos tabs de imágenes (`ImagesTab.vue` con búsqueda Openverse/`imageSearch`, y `MediaLibraryTab.vue` con la [[galería de medios]] del integrador) solo soportan click para insertar: `selectImage()`/`insert()` pisan el `src` del bloque `image` seleccionado, o si no hay selección crean fila+bloque nuevo. Reporte del usuario: **no hay forma de arrastrar** una miniatura desde ninguno de los dos tabs, ni de soltarla sobre un ítem de un bloque `gallery` (que hoy solo se edita tipeando URL en el inspector). Este spec agrega arrastre real, reutilizando la infraestructura de Pragmatic Drag and Drop (`src/dnd/`) ya usada para mover bloques/filas.

**Alcance acordado con el usuario:** arrastre habilitado hacia (a) un bloque `image` existente y (b) un ítem individual de un bloque `gallery`; soltar en cualquier otro punto del canvas crea fila+bloque `image` nuevo (paridad con el fallback del click de hoy, sin awareness de posición). El click-to-insert existente no cambia.

## 1. Tipo de arrastre nuevo

`src/dnd/dragData.ts`: se agrega un miembro a la unión `DragData`:

```ts
| { kind: 'media-image'; src: string; alt: string }
```

`src` y `alt` son suficientes — no se transporta `thumbnailUrl` (solo se usa para el preview visual del propio tab, no para el drop).

## 2. Fuente de arrastre: `DraggableImageThumb.vue`

Nuevo componente en `src/components/tabs/`, mismo patrón que `PaletteItem.vue`/`LayoutThumb.vue` (única forma de usar `useDraggableItem`, que exige un `el: Ref` propio por instancia montada — no sirve dentro de un `v-for` inline).

Props: `{ src: string; thumbnailUrl: string; alt: string }`. Emite `click`. Internamente:
- Renderiza el mismo `<button>` + `<img>` que hoy tienen `ImagesTab`/`MediaLibraryTab` (misma clase CSS del `<button>` la pasa el padre vía prop o slot, para no duplicar estilos — decisión de implementación libre mientras el HTML resultante sea idéntico al actual).
- `useDraggableItem({ el, getData: () => ({ kind: 'media-image', src, alt }), previewLabel: () => alt || 'Imagen' })`.
- El preview de arrastre reutiliza el chip existente (`vmd-drag-preview`, ver `usePragmatic.ts`) — no se construye un preview con la imagen real, para no reinventar `onGenerateDragPreview` por caso de uso.

**`ImagesTab.vue`**: el `<button class="vmd-image-result">` del `v-for` se reemplaza por `<DraggableImageThumb :src="result.url" :thumbnail-url="result.thumbnailUrl" :alt="result.title ?? ''" @click="selectImage(result)" />`. `selectImage` no cambia.

**`MediaLibraryTab.vue`**: solo el `<button class="vmd-media-item-thumb">` se reemplaza (el resto del ítem — nombre, menú ⋮, renombrar, confirmar borrado — sigue igual, fuera del componente nuevo). `<DraggableImageThumb :src="item.url" :thumbnail-url="item.thumbnailUrl" :alt="item.name ?? ''" @click="insert(item)" />`. `insert` no cambia.

## 3. Destino de arrastre: `useMediaDropTarget`

Nuevo composable en `src/dnd/usePragmatic.ts`, hermano de `useDropTarget` pero sin cálculo de borde (closest-edge) — es un reemplazo de contenido, no una inserción/reordenamiento:

```ts
export function useMediaDropTarget(opts: {
  el: Ref<HTMLElement | null>
  onDrop: (drag: Extract<DragData, { kind: 'media-image' }>) => void
}): { isOver: Ref<boolean> }
```

Implementación: `dropTargetForElements` con `canDrop` que acepta solo `kind === 'media-image'` (vía `readDrag`), `onDragEnter`/`onDragLeave` alternan `isOver`, `onDrop` limpia `isOver` y llama `opts.onDrop(drag)`. Sin necesidad del guard `isInnermost` que tiene `useDropTarget`: cada instancia de este target vive en un elemento distinto (un bloque `image`, o un ítem de `gallery`) y no hay anidamiento entre dos targets de este mismo kind, así que no hay doble disparo que evitar.

### 3.1 Bloque `image` (`BlockView.vue`)

El wrapper que hoy renderiza `<img>`/placeholder para `block.type === 'image'` se envuelve con `useMediaDropTarget`:

```ts
onDrop: (drag) => {
  const b = props.block
  if (b.type !== 'image') return
  store.updateBlock(b.id, { src: drag.src, ...(b.alt ? {} : { alt: drag.alt }) })
}
```

Misma regla que el click de hoy: no pisa un `alt` ya escrito por el usuario.

### 3.2 Ítem de `gallery` (`BlockView.vue`)

Dentro del `v-for="(img, i) in block.images"` que hoy renderiza `<img v-if="img.src">`/placeholder, cada ítem (imagen o placeholder) se envuelve individualmente con `useMediaDropTarget`, con `i` capturado en el closure:

```ts
onDrop: (drag) => {
  const b = props.block
  if (b.type !== 'gallery') return
  store.updateBlock(b.id, {
    images: b.images.map((im, j) => (j === i ? { ...im, src: drag.src, alt: im.alt || drag.alt } : im)),
  })
}
```

Misma lógica que `setGalleryImage()` de `PropertiesPanel.vue` (parchea solo ese índice del array), pero disparada por drop en vez de por el campo de texto del inspector.

### 3.3 Feedback visual

Nueva clase CSS reutilizando el patrón existente de `.vmd-column-empty.vmd-drop-active` (borde + fondo con `--vmd-accent`), aplicada al wrapper de imagen/placeholder mientras `isOver` es `true`. Placeholders de imagen y de galería (`.vmd-b-image-placeholder`, `.vmd-b-gallery-placeholder`) reciben la variante `.vmd-drop-active`; sobre una imagen ya cargada (no placeholder) se aplica un `outline` del mismo color de acento para no depender de fondo/padding que una imagen real no tiene.

## 4. Fallback: soltar fuera de un bloque `image`/ítem de `gallery`

El drop target contenedor de `BuilderCanvas.vue` (`rowsEl`, hoy limitado a `palette-block`/`canvas-block` cuando `store.doc.rows.length === 0`, y siempre a `palette-row`/`canvas-row`) agrega aceptación incondicional del kind `media-image`:

```ts
accept: (d) => d.kind === 'palette-row' || d.kind === 'canvas-row'
  || (store.doc.rows.length === 0 && (d.kind === 'palette-block' || d.kind === 'canvas-block'))
  || d.kind === 'media-image',
onDrop: (drag) => {
  if (drag.kind === 'palette-row' || drag.kind === 'canvas-row') dropRow(store, drag, null, null)
  else if (drag.kind === 'media-image') dropMediaImageOnEmptyCanvas(store, drag)
  else if (store.doc.rows.length === 0) dropBlockOnEmptyCanvas(store, drag)
},
```

Nueva función en `src/dnd/applyDrop.ts`:

```ts
export function dropMediaImageOnEmptyCanvas(store: Store, drag: Extract<DragData, { kind: 'media-image' }>): void {
  const row = store.addRow([100])
  const before = store.past.length
  const block = store.addBlockToColumn(row.columns[0].id, 'image')
  store.updateBlock(block.id, { src: drag.src, alt: drag.alt })
  while (store.past.length > before + 1) store.past.pop()
}
```

Mismo truco de fusión de historial que `dropBlockOnEmptyCanvas` (aquí son 2 commits post-`addRow` a fusionar: `addBlockToColumn` + `updateBlock`), para que un solo undo revierta fila+bloque+src.

**Nota de comportamiento (no position-aware):** como el `rowsEl` es ancestro de todo bloque/columna/fila existentes y ninguno de esos targets internos acepta `media-image`, soltar una miniatura *sobre* un bloque no-imagen (texto, botón, etc.) también cae en este fallback y agrega una fila nueva al final — no reemplaza nada del bloque sobre el que se soltó. Es la misma falta de awareness de posición que ya tiene el click-to-insert hoy (siempre `addRow` al final); se documenta explícitamente para no sorprender en review.

## 5. Fuera de alcance

- Reordenar imágenes ya puestas en un bloque `gallery` arrastrando entre sí sus propios ítems (swap interno) — no pedido, el reporte es sobre arrastrar *desde los tabs*.
- Arrastrar archivos del sistema operativo directamente sobre el canvas (drop de `File`, no de un `MediaItem`/`ImageResult`) — tema aparte, ya anotado como fuera de alcance en el spec de la galería de medios.
- Hacer el click-to-insert existente consciente del bloque `gallery` (hoy si hay un `gallery` seleccionado y se hace click en un thumbnail, se ignora la selección y se crea fila+bloque nuevo, igual que si no hubiera selección) — no se toca, fuera del pedido original.
- Preview de arrastre con la imagen real en vez del chip genérico de texto.

## 6. Testing

Extiende `tests/images-tab.test.ts`/`tests/media-library-tab.test.ts` y agrega casos en el test de `BlockView`/canvas existente (el que cubra bloques `image`/`gallery`):

- `DraggableImageThumb` expone los datos de arrastre correctos (`kind: 'media-image'`, `src`, `alt`) — test unitario simple del `getData()` pasado a `useDraggableItem` (mock), sin depender de gestos DOM reales (igual criterio que el resto de tests de bloques/filas: el `onDrop` se testea invocando el callback directamente, no simulando el gesto HTML5 completo, que no es reproducible en jsdom).
- Drop de `media-image` sobre un bloque `image` existente actualiza `src`; si el bloque ya tenía `alt`, no lo pisa; si no tenía, toma el `alt` del drag.
- Drop de `media-image` sobre el ítem `i` de un `gallery` actualiza solo `block.images[i]`, dejando el resto intacto.
- `dropMediaImageOnEmptyCanvas`: crea una fila con un bloque `image` con el `src`/`alt` del drag, y un solo `undo()` revierte fila+bloque completos.
- El fallback de canvas vacío también acepta `media-image` cuando `store.doc.rows.length > 0` (a diferencia de `palette-block`/`canvas-block`, que solo lo aceptan con canvas vacío).

## 7. Criterios de aceptación

- Arrastrar una miniatura desde el tab "Imágenes" o desde "Galería de medios" y soltarla sobre un bloque `image` en el canvas reemplaza su `src` (preservando `alt` existente).
- Arrastrar una miniatura y soltarla sobre un ítem específico de un bloque `gallery` fija esa imagen en ese slot exacto, sin afectar los demás ítems del array.
- Soltar en cualquier otro punto del canvas crea una fila nueva con un bloque `image` con esa imagen, deshacible en un solo `undo()`.
- El click-to-insert existente en ambos tabs sigue funcionando exactamente igual que hoy.
- Suite + typecheck + build verdes.
