# Mover imágenes entre bloques del canvas por arrastre — Diseño

**Fecha:** 2026-08-05
**Contexto:** el spec [2026-07-25](2026-07-25-image-drag-drop-design.md) agregó arrastre de imágenes **desde los tabs** (`kind: 'media-image'`) hacia un bloque `image` o un ítem de `gallery`. Reporte del usuario: una imagen que **ya está en el canvas** no se puede arrastrar a otro elemento de imagen. Hoy el `<img>` renderizado en el canvas no es fuente de arrastre: el único `draggable` del bloque está restringido al handle de mover (`BlockView.vue:215`, `dragHandle: handle`) y mueve el bloque entero como `canvas-block`. Los destinos de imagen (`useMediaDropTarget`) aceptan exclusivamente `media-image`.

**Alcance acordado con el usuario:**

- **Semántica: mover**, no copiar ni intercambiar. El destino recibe la imagen y el origen queda vacío (placeholder).
- **Fuente:** bloque `image` **e** ítem individual de `gallery`. **Destino:** los mismos dos. Los 4 cruces funcionan.
- **Fallback:** soltar fuera de un destino válido es **no-op** — no crea fila ni bloque, y no vacía el origen. Esto difiere a propósito del fallback de `media-image` (`dropMediaImageOnEmptyCanvas`, commit `ab6048b`): ahí el drop es no destructivo, aquí un fallo de puntería costaría la imagen de origen.

El arrastre desde los tabs y el click-to-insert no cambian.

## 1. Tipo de arrastre nuevo

`src/dnd/dragData.ts`, un miembro más de la unión `DragData`:

```ts
| { kind: 'canvas-image'; src: string; alt: string; from: ImageSlot }
```

con un tipo compartido, exportado desde el mismo archivo, que identifica un "hueco de imagen" del documento:

```ts
/** Hueco de imagen del canvas: un bloque `image`, o el ítem `index` de un bloque `gallery`. */
export type ImageSlot = { blockId: string; index?: number }
```

`index` ausente = bloque `image`; `index` presente = ítem de `gallery`. El mismo tipo se usa para el origen (`from`) y para el destino en `applyDrop`, así que los 4 cruces son un solo camino de código y no cuatro handlers.

**Por qué un kind nuevo y no un campo `from?` opcional dentro de `media-image`:** el kind es lo que distingue una escritura no destructiva (copiar desde el tab) de una destructiva (mover dentro del canvas). Con un campo opcional, todo handler tendría que acordarse de mirarlo, y olvidarlo duplicaría la imagen en silencio en vez de moverla. El costo es una rama más en cada `canDrop`.

## 2. Qué viaja con la imagen

Viajan **`src` y `alt`, nada más**. `href`, `widthPct`, `align`, `borderRadius`, `padding` y demás son configuración del bloque contenedor, no de la imagen, y se quedan donde están — tanto en el origen como en el destino.

Reglas de escritura, en detalle:

- **Destino:** recibe `src`. El `alt` sigue la regla ya establecida por `dropMediaImageOnImageBlock`/`dropMediaImageOnGalleryItem`: si el destino ya tiene un `alt` no vacío se conserva; si no, hereda el `alt` del origen.
- **Origen:** `src` y `alt` pasan a `''`. Se limpia también el `alt` porque describe una imagen que ya no está ahí; dejarlo produciría un `alt` mentiroso en el HTML exportado. El `href` del origen **no** se toca.
- **Galería:** el ítem de origen se **vacía, no se elimina** del array `images`. La cantidad de ítems y el layout de columnas quedan estables; el hueco vacío renderiza el placeholder que ya existe (`GalleryItemView.vue`, rama `v-else`).

## 3. Escritura y transacción: `dropCanvasImage`

`src/dnd/applyDrop.ts`, función pura sobre el store, hermana de las tres `dropMediaImage*` existentes:

```ts
export function dropCanvasImage(
  store: Store,
  drag: Extract<DragData, { kind: 'canvas-image' }>,
  to: ImageSlot,
): void
```

Casos, en orden de evaluación:

1. **Mismo hueco** (`from.blockId === to.blockId && from.index === to.index`) → no-op, sin commit de historial. Cubre el drop sobre sí mismo, que ocurre siempre porque el elemento arrastrado también es zona de drop.
2. **Destino inválido** — el bloque no existe, o su `type` no es `image`/`gallery`, o `to.index` está fuera del rango de `images` → no-op. El origen queda intacto: nunca se vacía un origen sin haber escrito el destino.
3. **Mismo bloque `gallery`, índices distintos** → un solo `updateBlock` que reemplaza el array `images` con ambos ítems ya modificados. Un solo commit, sin fusión.
4. **Bloques distintos** → escribir destino, luego vaciar origen, y fusionar los dos commits en uno (§4).

## 4. Historial: un solo undo

`commit()` guarda el snapshot **antes** de mutar y coalesce por `coalesceKey` dentro de `COALESCE_MS` (`store/document.ts:25`). `updateBlock(id, …)` usa la key `block:${id}`, así que dos bloques distintos = dos keys distintas = dos commits. Sin intervención, deshacer un movimiento requeriría dos undos y el estado intermedio (imagen duplicada en origen y destino) sería visible.

El caso 4 hace:

1. `store.sealHistory()` — corta la coalescencia sin tocar `past`/`future`. Sin esto, si el usuario acababa de editar el bloque destino desde el inspector (misma key `block:${id}`, dentro de `COALESCE_MS`), el commit del drop se fusionaría con esa edición y el undo revertiría de más.
2. `updateBlock(destino, …)` → empuja el snapshot **previo al movimiento**.
3. Capturar `store.past.length`, `updateBlock(origen, …)` → empuja un snapshot intermedio.
4. `while (store.past.length > before) store.past.pop()` — descarta el intermedio; sobrevive solo el snapshot previo al movimiento.

Es el mismo patrón de fusión que `dropBlockOnEmptyCanvas` y `dropMediaImageOnEmptyCanvas`: se conserva el primer snapshot —el único que representa el estado anterior completo— y se descartan los posteriores.

## 5. Fuente de arrastre: `useCanvasImageDrag`

`src/dnd/usePragmatic.ts`, envoltorio delgado sobre `useDraggableItem`:

```ts
export function useCanvasImageDrag(opts: {
  el: Ref<HTMLElement | null>
  getData: () => { src: string; alt: string; from: ImageSlot }
}): void
```

- Sin `handle`: el elemento entero (el `<img>`) arrastra.
- `canDrag: () => !!opts.getData().src` — un placeholder vacío no arrastra nada.
- `previewLabel: () => alt || 'Imagen'`, reutilizando el chip `vmd-drag-preview` existente. No se construye un preview con la imagen real, por la misma razón que en el spec anterior.

**Anidamiento con el draggable del bloque:** no hay conflicto. El `draggable` de `BlockView` tiene `dragHandle: handle`, así que solo se activa desde el handle de mover; arrastrar el `<img>` produce siempre `canvas-image`.

## 6. Destinos: `useMediaDropTarget` acepta ambos kinds

La firma pasa de aceptar solo `media-image` a la unión de los dos kinds de imagen:

```ts
type ImageDrag = Extract<DragData, { kind: 'media-image' | 'canvas-image' }>

export function useMediaDropTarget(opts: {
  el: Ref<HTMLElement | null>
  onDrop: (drag: ImageDrag) => void
}): { isOver: Ref<boolean> }
```

`canDrop` filtra por `kind === 'media-image' || kind === 'canvas-image'`. El resaltado `isOver` → clase `.vmd-media-drop-active` no cambia.

No hace falta el chequeo `isInnermost` que sí tiene `useDropTarget`: el drop target de bloque de `BlockView` acepta solo `palette-block`/`canvas-block`, así que un arrastre `canvas-image` nunca tiene dos targets compatibles anidados.

Los dos callsites (`BlockView.vue:230`, `GalleryItemView.vue:36`) despachan por kind: `media-image` → los `dropMediaImage*` de hoy, sin cambios; `canvas-image` → `dropCanvasImage(store, drag, to)`.

## 7. Componentes

**`BlockView.vue`** — `imageDropEl` (el `<img>` / placeholder del bloque `image`) suma `useCanvasImageDrag({ el: imageDropEl, getData: () => ({ src: block.src, alt: block.alt, from: { blockId: block.id } }) })`.

**`GalleryItemView.vue`** — el mismo `el` que ya es drop target suma `useCanvasImageDrag({ el, getData: () => ({ src: img.src, alt: img.alt, from: { blockId: props.blockId, index: props.index } }) })`.

Ninguno de los dos componentes gana estado propio: siguen siendo una plantilla más composables.

## 8. Tests

`packages/email-builder/tests/dnd.test.ts`, nuevo `describe('applyDrop — canvas-image (mover imágenes dentro del canvas)')`:

1. Bloque `image` → bloque `image`: destino recibe `src`, origen queda con `src`/`alt` vacíos.
2. Bloque `image` → ítem de `gallery`: solo el índice soltado cambia; los demás ítems intactos.
3. Ítem de `gallery` → bloque `image`: el ítem de origen se vacía pero **sigue en el array** (`images.length` no cambia).
4. Ítem → ítem del **mismo** bloque `gallery`: un solo commit de historial.
5. `alt`: se conserva el del destino si ya tenía uno; se hereda el del origen si no.
6. `href` del origen y del destino intactos tras el movimiento.
7. Drop sobre el mismo hueco: documento y `past.length` sin cambios.
8. Destino inválido (bloque de tipo `text`, e índice fuera de rango en una galería): no-op, origen intacto.
9. Un solo undo revierte origen y destino simultáneamente.
