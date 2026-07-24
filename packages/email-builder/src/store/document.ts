import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Block, BlockType, Column, EmailDocument, EmailSettings, Row } from '../schema'
import { createBlock, createId, createDocument, createRow, zEmailDocument } from '../schema'

export type Selection = { kind: 'row' | 'block'; id: string }

const HISTORY_LIMIT = 50
const COALESCE_MS = 600

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T
}

export const useDocumentStore = defineStore('vmd-document', () => {
  const doc = ref<EmailDocument>(createDocument())
  const selection = ref<Selection | null>(null)
  const past = ref<string[]>([])
  const future = ref<string[]>([])

  let lastCommitKey: string | null = null
  let lastCommitAt = 0

  /** Guarda snapshot ANTES de mutar. `coalesceKey` agrupa ráfagas (p.ej. tipeo). */
  function commit(coalesceKey?: string) {
    const now = Date.now()
    if (coalesceKey && coalesceKey === lastCommitKey && now - lastCommitAt < COALESCE_MS) {
      lastCommitAt = now
      return
    }
    past.value.push(JSON.stringify(doc.value))
    if (past.value.length > HISTORY_LIMIT) past.value.shift()
    future.value = []
    lastCommitKey = coalesceKey ?? null
    lastCommitAt = now
  }

  function findRow(id: string): Row | undefined {
    return doc.value.rows.find((r) => r.id === id)
  }

  function findColumn(columnId: string): { row: Row; column: Column } | undefined {
    for (const row of doc.value.rows) {
      const column = row.columns.find((c) => c.id === columnId)
      if (column) return { row, column }
    }
    return undefined
  }

  function findBlock(id: string): { row: Row; column: Column; index: number; block: Block } | undefined {
    for (const row of doc.value.rows) {
      for (const column of row.columns) {
        const index = column.blocks.findIndex((b) => b.id === id)
        if (index !== -1) return { row, column, index, block: column.blocks[index] }
      }
    }
    return undefined
  }

  const selectedBlock = computed<Block | null>(() =>
    selection.value?.kind === 'block' ? (findBlock(selection.value.id)?.block ?? null) : null,
  )
  const selectedRow = computed<Row | null>(() =>
    selection.value?.kind === 'row' ? (findRow(selection.value.id) ?? null) : null,
  )

  function addRow(widths: number[], index?: number): Row {
    commit()
    const row = createRow(widths)
    doc.value.rows.splice(index ?? doc.value.rows.length, 0, row)
    return row
  }

  function removeRow(id: string) {
    commit()
    doc.value.rows = doc.value.rows.filter((r) => r.id !== id)
    clearDanglingSelection()
  }

  function duplicateRow(id: string) {
    const idx = doc.value.rows.findIndex((r) => r.id === id)
    if (idx === -1) return
    commit()
    const copy = clone(doc.value.rows[idx])
    copy.id = createId('row')
    for (const col of copy.columns) {
      col.id = createId('col')
      for (const b of col.blocks) b.id = createId('blk')
    }
    doc.value.rows.splice(idx + 1, 0, copy)
  }

  function replaceRows(rows: Row[]) {
    commit('dnd-rows')
    doc.value.rows = rows
  }

  /** Mueve una fila a `toIndex` (índice en la lista final tras quitarla). Un solo paso de historial. */
  function moveRow(rowId: string, toIndex: number) {
    const from = doc.value.rows.findIndex((r) => r.id === rowId)
    if (from === -1) return
    commit()
    const [row] = doc.value.rows.splice(from, 1)
    const clamped = Math.max(0, Math.min(toIndex, doc.value.rows.length))
    doc.value.rows.splice(clamped, 0, row)
  }

  function addBlockToColumn(columnId: string, type: BlockType, index?: number): Block {
    const found = findColumn(columnId)
    if (!found) throw new Error(`Columna no encontrada: ${columnId}`)
    commit()
    const block = createBlock(type)
    found.column.blocks.splice(index ?? found.column.blocks.length, 0, block)
    return block
  }

  /** Inserta un bloque ya construido (se le asigna id nuevo) en `columnId` en `index`. */
  function insertBlockAt(columnId: string, block: Block, index?: number): Block | undefined {
    const found = findColumn(columnId)
    if (!found) return undefined
    commit()
    const copy = clone(block)
    copy.id = createId('blk')
    found.column.blocks.splice(index ?? found.column.blocks.length, 0, copy)
    return copy
  }

  function removeBlock(id: string) {
    const found = findBlock(id)
    if (!found) return
    commit()
    found.column.blocks.splice(found.index, 1)
    clearDanglingSelection()
  }

  function duplicateBlock(id: string) {
    const found = findBlock(id)
    if (!found) return
    commit()
    const copy = clone(found.block)
    copy.id = createId('blk')
    found.column.blocks.splice(found.index + 1, 0, copy)
  }

  function replaceColumnBlocks(columnId: string, blocks: Block[]) {
    const found = findColumn(columnId)
    if (!found) return
    commit('dnd-blocks')
    found.column.blocks = blocks
  }

  /** Mueve un bloque a otra (o la misma) columna en `toIndex`. Un solo paso de historial. */
  function moveBlock(blockId: string, toColumnId: string, toIndex: number) {
    const src = findBlock(blockId)
    const dst = findColumn(toColumnId)
    if (!src || !dst) return
    commit()
    src.column.blocks.splice(src.index, 1)
    // si es la misma columna y el destino estaba después del origen, el índice se corrió al quitar
    let idx = toIndex
    if (src.column === dst.column && toIndex > src.index) idx -= 1
    dst.column.blocks.splice(Math.max(0, Math.min(idx, dst.column.blocks.length)), 0, src.block)
  }

  function updateBlock(id: string, patch: Record<string, unknown>) {
    const found = findBlock(id)
    if (!found) return
    commit(`block:${id}`)
    deepMerge(found.block as unknown as Record<string, unknown>, patch)
  }

  function updateRowStyle(id: string, patch: Record<string, unknown>) {
    const row = findRow(id)
    if (!row) return
    commit(`row:${id}`)
    deepMerge(row.style as unknown as Record<string, unknown>, patch)
  }

  function updateRow(id: string, patch: Record<string, unknown>) {
    const row = findRow(id)
    if (!row) return
    commit(`row:${id}`)
    deepMerge(row as unknown as Record<string, unknown>, patch)
  }

  function updateColumn(columnId: string, patch: Record<string, unknown>) {
    const found = findColumn(columnId)
    if (!found) return
    commit(`col:${columnId}`)
    deepMerge(found.column as unknown as Record<string, unknown>, patch)
  }

  function updateSettings(patch: Partial<EmailSettings>) {
    commit('settings')
    Object.assign(doc.value.settings, patch)
  }

  function select(sel: Selection | null) {
    selection.value = sel
  }

  function clearDanglingSelection() {
    if (!selection.value) return
    const { kind, id } = selection.value
    const exists = kind === 'row' ? Boolean(findRow(id)) : Boolean(findBlock(id))
    if (!exists) selection.value = null
  }

  function loadDesign(next: EmailDocument) {
    commit()
    doc.value = clone(next)
    selection.value = null
  }

  // versiones nombradas (en memoria)
  const versions = ref<{ id: string; name: string; at: number; doc: EmailDocument }[]>([])
  function saveVersion(name: string) {
    versions.value.push({ id: createId('ver'), name, at: Date.now(), doc: clone(doc.value) })
  }
  function loadVersion(id: string) {
    const v = versions.value.find((x) => x.id === id)
    if (v) loadDesign(v.doc)
  }
  function deleteVersion(id: string) {
    versions.value = versions.value.filter((x) => x.id !== id)
  }

  const canUndo = computed(() => past.value.length > 0)
  const canRedo = computed(() => future.value.length > 0)

  function undo() {
    const prev = past.value.pop()
    if (prev === undefined) return
    future.value.push(JSON.stringify(doc.value))
    doc.value = JSON.parse(prev) as EmailDocument
    lastCommitKey = null
    clearDanglingSelection()
  }

  function redo() {
    const next = future.value.pop()
    if (next === undefined) return
    past.value.push(JSON.stringify(doc.value))
    doc.value = JSON.parse(next) as EmailDocument
    lastCommitKey = null
    clearDanglingSelection()
  }

  function resetHistory() {
    past.value = []
    future.value = []
    lastCommitKey = null
  }

  /** Corta la coalescencia sin tocar past/future: el próximo commit(coalesceKey) no fusiona con el anterior. */
  function sealHistory() {
    lastCommitKey = null
  }

  function exportJson(): string {
    return JSON.stringify(doc.value, null, 2)
  }

  function importJson(text: string): { ok: true } | { ok: false; error: string } {
    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      return { ok: false, error: 'El archivo no es JSON válido.' }
    }
    const result = zEmailDocument.safeParse(parsed)
    if (!result.success) {
      const issues = result.error.issues
        .slice(0, 3)
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ')
      return { ok: false, error: `El diseño no es válido — ${issues}` }
    }
    loadDesign(result.data)
    return { ok: true }
  }

  return {
    doc, selection, past, future,
    selectedBlock, selectedRow,
    commit, findRow, findColumn, findBlock,
    addRow, removeRow, duplicateRow, replaceRows, moveRow,
    addBlockToColumn, insertBlockAt, removeBlock, duplicateBlock, replaceColumnBlocks, moveBlock,
    updateBlock, updateRowStyle, updateRow, updateColumn, updateSettings,
    select, loadDesign,
    canUndo, canRedo, undo, redo, resetHistory, sealHistory, exportJson, importJson,
    versions, saveVersion, loadVersion, deleteVersion,
  }
})

function deepMerge(target: Record<string, unknown>, patch: Record<string, unknown>) {
  for (const [key, value] of Object.entries(patch)) {
    const current = target[key]
    if (
      value && typeof value === 'object' && !Array.isArray(value) &&
      current && typeof current === 'object' && !Array.isArray(current)
    ) {
      deepMerge(current as Record<string, unknown>, value as Record<string, unknown>)
    } else {
      target[key] = value as unknown
    }
  }
}
