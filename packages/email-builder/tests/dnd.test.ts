import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import EmailBuilder from '../src/components/EmailBuilder.vue'
import { dropBlock, dropBlockOnEmptyCanvas, dropRow, dropMediaImageOnImageBlock, dropMediaImageOnGalleryItem, dropMediaImageOnEmptyCanvas } from '../src/dnd/applyDrop'
import { useDraggableItem } from '../src/dnd/usePragmatic'
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

  it('palette-block en canvas vacío crea una fila de 1 columna y un solo paso de undo', () => {
    const store = useDocumentStore()
    const base = store.past.length
    dropBlockOnEmptyCanvas(store, { kind: 'palette-block', create: () => createBlock('heading') })
    expect(store.doc.rows).toHaveLength(1)
    expect(store.doc.rows[0].columns[0].blocks.map((b) => b.type)).toEqual(['heading'])
    expect(store.past.length).toBe(base + 1)
    store.undo()
    expect(store.doc.rows).toHaveLength(0)
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

describe('setRowColumns — estructura de columnas', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('aumenta columnas conservando el contenido en la primera', () => {
    const store = useDocumentStore()
    const row = store.addRow([100])
    store.addBlockToColumn(row.columns[0].id, 'heading')
    store.addBlockToColumn(row.columns[0].id, 'button')
    store.setRowColumns(row.id, [50, 50])
    const r = store.doc.rows[0]
    expect(r.columns.map((c) => c.widthPct)).toEqual([50, 50])
    expect(r.columns[0].blocks).toHaveLength(2)
    expect(r.columns[1].blocks).toHaveLength(0)
  })

  it('reduce columnas fusionando los bloques sobrantes en la última', () => {
    const store = useDocumentStore()
    const row = store.addRow([50, 50])
    store.addBlockToColumn(row.columns[0].id, 'heading')
    store.addBlockToColumn(row.columns[1].id, 'text')
    store.setRowColumns(row.id, [100])
    const r = store.doc.rows[0]
    expect(r.columns).toHaveLength(1)
    expect(r.columns[0].blocks.map((b) => b.type)).toEqual(['heading', 'text'])
  })

  it('es un solo paso de historial y se puede deshacer', () => {
    const store = useDocumentStore()
    const row = store.addRow([100])
    const base = store.past.length
    store.setRowColumns(row.id, [33, 34, 33])
    expect(store.past.length).toBe(base + 1)
    store.undo()
    expect(store.doc.rows[0].columns).toHaveLength(1)
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

describe('applyDrop — media-image (arrastre desde los tabs de imágenes)', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('reemplaza el src de un bloque imagen existente sin pisar un alt ya escrito', () => {
    const store = useDocumentStore()
    const row = store.addRow([100])
    const block = store.addBlockToColumn(row.columns[0].id, 'image')
    store.updateBlock(block.id, { alt: 'Foto original' })
    dropMediaImageOnImageBlock(store, block.id, { kind: 'media-image', src: 'https://example.com/nueva.png', alt: 'Nueva' })
    const found = store.findBlock(block.id)!.block
    if (found.type !== 'image') throw new Error()
    expect(found.src).toBe('https://example.com/nueva.png')
    expect(found.alt).toBe('Foto original')
  })

  it('toma el alt del drag si el bloque imagen no tenía uno', () => {
    const store = useDocumentStore()
    const row = store.addRow([100])
    const block = store.addBlockToColumn(row.columns[0].id, 'image')
    dropMediaImageOnImageBlock(store, block.id, { kind: 'media-image', src: 'https://example.com/a.png', alt: 'Un gato' })
    const found = store.findBlock(block.id)!.block
    if (found.type !== 'image') throw new Error()
    expect(found.alt).toBe('Un gato')
  })

  it('no hace nada si el bloque destino no es de tipo imagen', () => {
    const store = useDocumentStore()
    const row = store.addRow([100])
    const block = store.addBlockToColumn(row.columns[0].id, 'text')
    dropMediaImageOnImageBlock(store, block.id, { kind: 'media-image', src: 'x', alt: 'y' })
    const found = store.findBlock(block.id)!.block
    expect(found.type).toBe('text')
  })

  it('fija la imagen solo en el índice soltado de una galería, sin afectar los demás ítems', () => {
    const store = useDocumentStore()
    const row = store.addRow([100])
    const block = store.addBlockToColumn(row.columns[0].id, 'gallery')
    dropMediaImageOnGalleryItem(store, block.id, 1, { kind: 'media-image', src: 'https://example.com/b.png', alt: 'B' })
    const found = store.findBlock(block.id)!.block
    if (found.type !== 'gallery') throw new Error()
    expect(found.images[0]).toEqual({ src: '', alt: '' })
    expect(found.images[1]).toMatchObject({ src: 'https://example.com/b.png', alt: 'B' })
  })

  it('no pisa el alt de un ítem de galería que ya tenía uno', () => {
    const store = useDocumentStore()
    const row = store.addRow([100])
    const block = store.addBlockToColumn(row.columns[0].id, 'gallery')
    store.updateBlock(block.id, { images: [{ src: '', alt: 'Alt original' }, { src: '', alt: '' }] })
    dropMediaImageOnGalleryItem(store, block.id, 0, { kind: 'media-image', src: 'https://example.com/c.png', alt: 'Nuevo alt' })
    const found = store.findBlock(block.id)!.block
    if (found.type !== 'gallery') throw new Error()
    expect(found.images[0]).toEqual({ src: 'https://example.com/c.png', alt: 'Alt original' })
  })

  it('no hace nada si el bloque destino no es de tipo galería', () => {
    const store = useDocumentStore()
    const row = store.addRow([100])
    const block = store.addBlockToColumn(row.columns[0].id, 'text')
    dropMediaImageOnGalleryItem(store, block.id, 0, { kind: 'media-image', src: 'x', alt: 'y' })
    const found = store.findBlock(block.id)!.block
    expect(found.type).toBe('text')
  })

  it('crea fila + bloque imagen en el canvas vacío, deshacible en un solo undo', () => {
    const store = useDocumentStore()
    const base = store.past.length
    dropMediaImageOnEmptyCanvas(store, { kind: 'media-image', src: 'https://example.com/d.png', alt: 'D' })
    expect(store.doc.rows).toHaveLength(1)
    const b = store.doc.rows[0].columns[0].blocks[0]
    if (b.type !== 'image') throw new Error()
    expect(b.src).toBe('https://example.com/d.png')
    expect(b.alt).toBe('D')
    expect(store.past.length).toBe(base + 1)
    store.undo()
    expect(store.doc.rows).toHaveLength(0)
  })
})

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
    // bindToElement usa flush:'post': el ató inicial no queda listo hasta el próximo tick,
    // a diferencia de onMounted (que corría en el mismo mount() síncrono).
    await nextTick()
    // usamos getAttribute en vez de la propiedad IDL `.draggable`: pragmatic-dnd ata
    // fijando el atributo `draggable="true"`, mientras que la propiedad IDL de <img>
    // ya es `true` por defecto en el DOM (sin atributo), lo que enmascararía el bug.
    expect((wrapper.find('.swap-div').element as HTMLElement).getAttribute('draggable')).toBe('true')
    wrapper.vm.showImg = true
    await nextTick()
    await nextTick()
    expect((wrapper.find('.swap-img').element as HTMLElement).getAttribute('draggable')).toBe('true')
  })
})
