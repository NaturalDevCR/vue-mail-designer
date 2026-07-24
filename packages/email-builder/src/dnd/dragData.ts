import type { Block } from '../schema'

// Datos que viajan con cada arrastre (Pragmatic Drag and Drop; se mantienen en memoria,
// así que pueden incluir funciones/objetos, no solo strings serializables).
export type DragData =
  | { kind: 'palette-block'; create: () => Block }
  | { kind: 'palette-row'; widths: number[] }
  | { kind: 'canvas-row'; rowId: string }
  | { kind: 'canvas-block'; blockId: string; columnId: string }

const KEY = 'vmd-drag'

export function packDrag(data: DragData): Record<string | symbol, unknown> {
  return { [KEY]: data }
}

export function readDrag(record: Record<string | symbol, unknown>): DragData | null {
  const d = record[KEY]
  return d && typeof d === 'object' ? (d as DragData) : null
}

// posición de inserción relativa a un elemento objetivo
export type Edge = 'before' | 'after'
