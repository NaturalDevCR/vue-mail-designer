import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import EmailBuilder from '../src/components/EmailBuilder.vue'
import { dropBlock, dropRow } from '../src/dnd/applyDrop'
import { createBlock } from '../src/schema'
import { useDocumentStore } from '../src/store/document'

describe('applyDrop — filas', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('palette-row inserta una fila nueva en la posición del borde', () => {
    const store = useDocumentStore()
    const a = store.addRow([100])
    store.addRow([100])
    // soltar una fila nueva "antes" de la primera → queda al inicio
    dropRow(store, { kind: 'palette-row', widths: [50, 50] }, a.id, 'before')
    expect(store.doc.rows[0].columns).toHaveLength(2)
    expect(store.doc.rows[0].id).not.toBe(a.id)
  })

  it('canvas-row reordena la fila', () => {
    const store = useDocumentStore()
    const a = store.addRow([100])
    const b = store.addRow([100])
    // mover b antes de a
    dropRow(store, { kind: 'canvas-row', rowId: b.id }, a.id, 'before')
    expect(store.doc.rows.map((r) => r.id)).toEqual([b.id, a.id])
  })
})

describe('applyDrop — bloques', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('palette-block inserta un bloque nuevo en la columna', () => {
    const store = useDocumentStore()
    const row = store.addRow([100])
    const col = row.columns[0].id
    dropBlock(store, { kind: 'palette-block', create: () => createBlock('button') }, col, null, null)
    expect(store.findColumn(col)!.column.blocks.map((b) => b.type)).toEqual(['button'])
  })

  it('canvas-block se mueve entre columnas', () => {
    const store = useDocumentStore()
    const row = store.addRow([50, 50])
    const [colA, colB] = row.columns
    const block = store.addBlockToColumn(colA.id, 'text')
    dropBlock(store, { kind: 'canvas-block', blockId: block.id, columnId: colA.id }, colB.id, null, null)
    expect(store.findColumn(colA.id)!.column.blocks).toHaveLength(0)
    expect(store.findColumn(colB.id)!.column.blocks[0].id).toBe(block.id)
  })

  it('un movimiento entre columnas es un solo paso de undo', () => {
    const store = useDocumentStore()
    const row = store.addRow([50, 50])
    const [colA, colB] = row.columns
    const block = store.addBlockToColumn(colA.id, 'text')
    const base = store.past.length
    store.moveBlock(block.id, colB.id, 0)
    expect(store.past.length).toBe(base + 1)
    store.undo()
    expect(store.findColumn(colA.id)!.column.blocks[0].id).toBe(block.id)
  })
})

describe('canvas DnD (montaje)', () => {
  it('el handle de mover aparece en las filas', async () => {
    const wrapper = mount(EmailBuilder)
    await wrapper.find('.vmd-canvas-empty button').trigger('click')
    await wrapper.find('.vmd-row').trigger('click')
    expect(wrapper.find('.vmd-row .vmd-drag-handle').exists()).toBe(true)
  })
})
