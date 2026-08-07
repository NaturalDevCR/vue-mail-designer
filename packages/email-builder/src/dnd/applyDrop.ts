import type { useDocumentStore } from '../store/document'
import type { DragData, Edge, ImageSlot } from './dragData'

type Store = ReturnType<typeof useDocumentStore>

/** Aplica el drop de una fila (nueva o reordenada) relativo a `targetRowId`/`edge`. */
export function dropRow(store: Store, drag: DragData, targetRowId: string | null, edge: Edge | null): void {
  const rows = store.doc.rows
  const targetIdx = targetRowId ? rows.findIndex((r) => r.id === targetRowId) : rows.length
  const insertIdx = edge === 'after' ? targetIdx + 1 : targetIdx < 0 ? rows.length : targetIdx

  if (drag.kind === 'palette-row') {
    store.addRow(drag.widths, insertIdx)
  } else if (drag.kind === 'canvas-row') {
    store.moveRow(drag.rowId, insertIdx)
  }
}

/** Aplica el drop de un bloque (nuevo o movido) en `columnId` relativo a `targetBlockId`/`edge`. */
export function dropBlock(
  store: Store,
  drag: DragData,
  columnId: string,
  targetBlockId: string | null,
  edge: Edge | null,
): void {
  const found = store.findColumn(columnId)
  if (!found) return
  const blocks = found.column.blocks
  const targetIdx = targetBlockId ? blocks.findIndex((b) => b.id === targetBlockId) : blocks.length
  const insertIdx = edge === 'after' ? targetIdx + 1 : targetIdx < 0 ? blocks.length : targetIdx

  if (drag.kind === 'palette-block') {
    store.insertBlockAt(columnId, drag.create(), insertIdx)
  } else if (drag.kind === 'canvas-block') {
    store.moveBlock(drag.blockId, columnId, insertIdx)
  }
}

/**
 * Suelta un bloque en el canvas vacío: crea una fila de 1 columna y lo inserta ahí.
 * addRow + insertBlockAt/moveBlock hacen dos commits de historial separados; se fusionan
 * en uno solo para que un único undo revierta todo el drop (crear fila + insertar bloque).
 */
export function dropBlockOnEmptyCanvas(store: Store, drag: DragData): void {
  if (drag.kind !== 'palette-block' && drag.kind !== 'canvas-block') return
  const row = store.addRow([100])
  const mark = store.historyMark()
  dropBlock(store, drag, row.columns[0].id, null, null)
  store.mergeCommitsSince(mark)
}

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
 * crea una fila de 1 columna + un bloque imagen con ese src/alt. Misma fusión de historial que
 * `dropBlockOnEmptyCanvas`, acá sobre 3 commits (addRow + addBlockToColumn + updateBlock): la
 * marca se toma después de `addRow` —el commit que debe sobrevivir— y `mergeCommitsSince`
 * descarta los dos posteriores, así un solo undo revierte fila+bloque+src completos.
 */
export function dropMediaImageOnEmptyCanvas(store: Store, drag: Extract<DragData, { kind: 'media-image' }>): void {
  const row = store.addRow([100])
  const mark = store.historyMark()
  const block = store.addBlockToColumn(row.columns[0].id, 'image')
  store.updateBlock(block.id, { src: drag.src, alt: drag.alt })
  store.mergeCommitsSince(mark)
}

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
    // Defensivo e inalcanzable: para un mismo blockId, el hueco con `index` exige `gallery` y el
    // que no lo tiene exige `image`, y un bloque tiene un solo tipo — así que si ambos pasaron
    // `readSlot`, es galería. Se conserva porque TypeScript lo necesita para estrechar `b.images`.
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
  const mark = store.historyMark()
  writeSlot(store, from, '', '')
  store.mergeCommitsSince(mark)
}
