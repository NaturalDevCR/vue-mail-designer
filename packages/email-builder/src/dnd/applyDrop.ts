import type { useDocumentStore } from '../store/document'
import type { DragData, Edge } from './dragData'

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
  const before = store.past.length
  dropBlock(store, drag, row.columns[0].id, null, null)
  if (store.past.length === before + 1) store.past.pop()
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
