import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useDocumentStore } from '../src/store/document'
import { useUiStore } from '../src/store/ui'

describe('undo/redo e import/export', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('undo revierte y redo reaplica', () => {
    const store = useDocumentStore()
    store.addRow([100])
    expect(store.doc.rows).toHaveLength(1)
    expect(store.canUndo).toBe(true)

    store.undo()
    expect(store.doc.rows).toHaveLength(0)
    expect(store.canRedo).toBe(true)

    store.redo()
    expect(store.doc.rows).toHaveLength(1)
  })

  it('una mutación nueva limpia el stack de redo', () => {
    const store = useDocumentStore()
    store.addRow([100])
    store.undo()
    store.addRow([50, 50])
    expect(store.canRedo).toBe(false)
  })

  it('exportJson → importJson es round-trip', () => {
    const store = useDocumentStore()
    const row = store.addRow([100])
    store.addBlockToColumn(row.columns[0].id, 'heading')
    const json = store.exportJson()

    const store2 = useDocumentStore()
    store2.loadDesign(JSON.parse(json))
    const result = store2.importJson(json)
    expect(result.ok).toBe(true)
    expect(store2.doc.rows[0].columns[0].blocks[0].type).toBe('heading')
  })

  it('importJson rechaza JSON inválido y no toca el documento', () => {
    const store = useDocumentStore()
    store.addRow([100])
    const bad = store.importJson('{"version":1,"rows":"x"}')
    expect(bad.ok).toBe(false)
    if (!bad.ok) expect(bad.error.length).toBeGreaterThan(0)
    expect(store.doc.rows).toHaveLength(1)

    const notJson = store.importJson('esto no es json')
    expect(notJson.ok).toBe(false)
  })

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

  it('mutaciones de UI no crecen el historial del documento', () => {
    const store = useDocumentStore()
    const ui = useUiStore()
    const base = store.past.length

    ui.previewWidth = 500
    ui.sidebarTab = 'blocks'
    ui.toggleTheme()
    ui.canvasDevice = 'mobile'

    expect(store.past.length).toBe(base)
  })
})
