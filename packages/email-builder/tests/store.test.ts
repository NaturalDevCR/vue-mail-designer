import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { createDocument } from '../src/schema'
import { useDocumentStore } from '../src/store/document'

describe('useDocumentStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('agrega filas con columnas según layout', () => {
    const store = useDocumentStore()
    store.addRow([50, 50])
    expect(store.doc.rows).toHaveLength(1)
    expect(store.doc.rows[0].columns.map((c) => c.widthPct)).toEqual([50, 50])
  })

  it('inserta fila en un índice específico', () => {
    const store = useDocumentStore()
    const a = store.addRow([100])
    store.addRow([100])
    const inserted = store.addRow([50, 50], 1)
    expect(store.doc.rows[0].id).toBe(a.id)
    expect(store.doc.rows[1].id).toBe(inserted.id)
  })

  it('agrega, duplica y elimina bloques', () => {
    const store = useDocumentStore()
    const row = store.addRow([100])
    const colId = row.columns[0].id
    const block = store.addBlockToColumn(colId, 'button')
    expect(store.findBlock(block.id)?.block.type).toBe('button')

    store.duplicateBlock(block.id)
    expect(store.findRow(row.id)!.columns[0].blocks).toHaveLength(2)
    const ids = store.findRow(row.id)!.columns[0].blocks.map((b) => b.id)
    expect(new Set(ids).size).toBe(2)

    store.removeBlock(block.id)
    expect(store.findBlock(block.id)).toBeUndefined()
  })

  it('duplicateRow clona con ids nuevos en profundidad', () => {
    const store = useDocumentStore()
    const row = store.addRow([100])
    store.addBlockToColumn(row.columns[0].id, 'text')
    store.duplicateRow(row.id)
    expect(store.doc.rows).toHaveLength(2)
    expect(store.doc.rows[1].id).not.toBe(row.id)
    expect(store.doc.rows[1].columns[0].id).not.toBe(row.columns[0].id)
    expect(store.doc.rows[1].columns[0].blocks[0].id).not.toBe(row.columns[0].blocks[0].id)
  })

  it('updateBlock aplica un patch parcial', () => {
    const store = useDocumentStore()
    const row = store.addRow([100])
    const block = store.addBlockToColumn(row.columns[0].id, 'heading')
    store.updateBlock(block.id, { text: 'Hola' })
    const found = store.findBlock(block.id)!.block
    expect(found.type === 'heading' && found.text).toBe('Hola')
  })

  it('selección apunta a bloque y se limpia al borrarlo', () => {
    const store = useDocumentStore()
    const row = store.addRow([100])
    const block = store.addBlockToColumn(row.columns[0].id, 'text')
    store.select({ kind: 'block', id: block.id })
    expect(store.selectedBlock?.id).toBe(block.id)
    store.removeBlock(block.id)
    expect(store.selection).toBeNull()
  })

  it('updateBlock reemplaza arrays completos (no merge por índice)', () => {
    const store = useDocumentStore()
    const row = store.addRow([100])
    const block = store.addBlockToColumn(row.columns[0].id, 'social')
    store.updateBlock(block.id, { networks: [{ kind: 'web', url: 'https://a.com' }] })
    const found = store.findBlock(block.id)!.block
    expect(found.type).toBe('social')
    if (found.type === 'social') {
      expect(found.networks).toHaveLength(1)
      expect(found.networks[0].url).toBe('https://a.com')
    }
  })

  it('replaceColumnBlocks reemplaza la lista de bloques de la columna', () => {
    const store = useDocumentStore()
    const row = store.addRow([100])
    const colId = row.columns[0].id
    store.addBlockToColumn(colId, 'text')
    store.addBlockToColumn(colId, 'button')
    store.replaceColumnBlocks(colId, [])
    expect(store.findRow(row.id)!.columns[0].blocks).toHaveLength(0)
  })

  it('loadDesign reemplaza el documento y limpia la selección', () => {
    const store = useDocumentStore()
    const row = store.addRow([100])
    store.select({ kind: 'row', id: row.id })
    store.loadDesign(createDocument())
    expect(store.doc.rows).toHaveLength(0)
    expect(store.selection).toBeNull()
  })
})
