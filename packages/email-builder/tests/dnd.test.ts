import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, provide, reactive, ref } from 'vue'
import BlockView from '../src/components/BlockView.vue'
import EmailBuilder from '../src/components/EmailBuilder.vue'
import GalleryItemView from '../src/components/GalleryItemView.vue'
import { dropBlock, dropBlockOnEmptyCanvas, dropRow, dropMediaImageOnImageBlock, dropMediaImageOnGalleryItem, dropMediaImageOnEmptyCanvas, dropCanvasImage } from '../src/dnd/applyDrop'
import { useDraggableItem } from '../src/dnd/usePragmatic'
import { createBlock } from '../src/schema'
import { HISTORY_LIMIT, useDocumentStore } from '../src/store/document'
import { BUILDER_PINIA_KEY } from '../src/store/keys'

/**
 * Monta `block` dentro de un host que provee el pinia del builder, como en block-view.test.ts.
 * `attachTo: document.body` es necesario para los tests de `canDrag`: Pragmatic escucha
 * `dragstart` a nivel de `document` (delegación de eventos), así que un nodo desmontado del
 * árbol del documento nunca hace burbujear el evento hasta ese listener.
 */
function mountBlockHost(block: ReturnType<typeof createBlock>) {
  const pinia = createPinia()
  const reactiveBlock = reactive(block)
  const Host = defineComponent({
    setup() {
      provide(BUILDER_PINIA_KEY, pinia)
      return () => h(BlockView, { block: reactiveBlock })
    },
  })
  return { wrapper: mount(Host, { attachTo: document.body }), store: useDocumentStore(pinia) }
}

/** Bloque imagen con src/alt ya puestos, agregado a `columnId`. */
function imageBlockWithSrc(store: ReturnType<typeof useDocumentStore>, columnId: string, src: string, alt: string) {
  const b = store.addBlockToColumn(columnId, 'image')
  store.updateBlock(b.id, { src, alt })
  return b
}

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

describe('applyDrop — canvas-image (mover imágenes dentro del canvas)', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('mueve la imagen de un bloque imagen a otro y vacía el origen', () => {
    const store = useDocumentStore()
    const row = store.addRow([100])
    const col = row.columns[0].id
    const origen = imageBlockWithSrc(store, col, 'https://example.com/a.png', 'A')
    const destino = store.addBlockToColumn(col, 'image')

    dropCanvasImage(
      store,
      { kind: 'canvas-image', src: 'https://example.com/a.png', alt: 'A', from: { blockId: origen.id } },
      { blockId: destino.id },
    )

    const d = store.findBlock(destino.id)!.block
    const o = store.findBlock(origen.id)!.block
    if (d.type !== 'image' || o.type !== 'image') throw new Error()
    expect(d.src).toBe('https://example.com/a.png')
    expect(d.alt).toBe('A')
    expect(o.src).toBe('')
    expect(o.alt).toBe('')
  })

  it('mueve de un bloque imagen a un ítem de galería sin tocar los demás ítems', () => {
    const store = useDocumentStore()
    const row = store.addRow([100])
    const col = row.columns[0].id
    const origen = imageBlockWithSrc(store, col, 'https://example.com/b.png', 'B')
    const galeria = store.addBlockToColumn(col, 'gallery')

    dropCanvasImage(
      store,
      { kind: 'canvas-image', src: 'https://example.com/b.png', alt: 'B', from: { blockId: origen.id } },
      { blockId: galeria.id, index: 1 },
    )

    const g = store.findBlock(galeria.id)!.block
    if (g.type !== 'gallery') throw new Error()
    expect(g.images[0]).toEqual({ src: '', alt: '' })
    expect(g.images[1]).toMatchObject({ src: 'https://example.com/b.png', alt: 'B' })
  })

  it('mueve de un ítem de galería a un bloque imagen: el ítem se vacía pero sigue en el array', () => {
    const store = useDocumentStore()
    const row = store.addRow([100])
    const col = row.columns[0].id
    const galeria = store.addBlockToColumn(col, 'gallery')
    store.updateBlock(galeria.id, { images: [{ src: 'https://example.com/c.png', alt: 'C' }, { src: '', alt: '' }] })
    const destino = store.addBlockToColumn(col, 'image')
    const g0 = store.findBlock(galeria.id)!.block
    if (g0.type !== 'gallery') throw new Error()
    const total = g0.images.length

    dropCanvasImage(
      store,
      { kind: 'canvas-image', src: 'https://example.com/c.png', alt: 'C', from: { blockId: galeria.id, index: 0 } },
      { blockId: destino.id },
    )

    const g = store.findBlock(galeria.id)!.block
    const d = store.findBlock(destino.id)!.block
    if (g.type !== 'gallery' || d.type !== 'image') throw new Error()
    expect(g.images).toHaveLength(total)
    expect(g.images[0]).toEqual({ src: '', alt: '' })
    expect(d.src).toBe('https://example.com/c.png')
  })

  it('mover entre dos ítems del mismo bloque galería es un solo paso de historial', () => {
    const store = useDocumentStore()
    const row = store.addRow([100])
    const galeria = store.addBlockToColumn(row.columns[0].id, 'gallery')
    store.updateBlock(galeria.id, { images: [{ src: 'https://example.com/d.png', alt: 'D' }, { src: '', alt: '' }] })
    const base = store.past.length

    dropCanvasImage(
      store,
      { kind: 'canvas-image', src: 'https://example.com/d.png', alt: 'D', from: { blockId: galeria.id, index: 0 } },
      { blockId: galeria.id, index: 1 },
    )

    const g = store.findBlock(galeria.id)!.block
    if (g.type !== 'gallery') throw new Error()
    expect(g.images[0]).toEqual({ src: '', alt: '' })
    expect(g.images[1]).toMatchObject({ src: 'https://example.com/d.png', alt: 'D' })
    expect(store.past.length).toBe(base + 1)
  })

  it('conserva el alt del destino si ya tenía uno', () => {
    const store = useDocumentStore()
    const row = store.addRow([100])
    const col = row.columns[0].id
    const origen = imageBlockWithSrc(store, col, 'https://example.com/e.png', 'Alt del origen')
    const destino = imageBlockWithSrc(store, col, '', 'Alt del destino')

    dropCanvasImage(
      store,
      { kind: 'canvas-image', src: 'https://example.com/e.png', alt: 'Alt del origen', from: { blockId: origen.id } },
      { blockId: destino.id },
    )

    const d = store.findBlock(destino.id)!.block
    if (d.type !== 'image') throw new Error()
    expect(d.alt).toBe('Alt del destino')
  })

  it('no toca el href del origen ni el del destino', () => {
    const store = useDocumentStore()
    const row = store.addRow([100])
    const col = row.columns[0].id
    const origen = imageBlockWithSrc(store, col, 'https://example.com/f.png', 'F')
    store.updateBlock(origen.id, { href: 'https://origen.example' })
    const destino = store.addBlockToColumn(col, 'image')
    store.updateBlock(destino.id, { href: 'https://destino.example' })

    dropCanvasImage(
      store,
      { kind: 'canvas-image', src: 'https://example.com/f.png', alt: 'F', from: { blockId: origen.id } },
      { blockId: destino.id },
    )

    const o = store.findBlock(origen.id)!.block
    const d = store.findBlock(destino.id)!.block
    if (o.type !== 'image' || d.type !== 'image') throw new Error()
    expect(o.href).toBe('https://origen.example')
    expect(d.href).toBe('https://destino.example')
  })

  it('soltar sobre el mismo hueco no cambia nada ni agrega historial', () => {
    const store = useDocumentStore()
    const row = store.addRow([100])
    const origen = imageBlockWithSrc(store, row.columns[0].id, 'https://example.com/g.png', 'G')
    const base = store.past.length

    dropCanvasImage(
      store,
      { kind: 'canvas-image', src: 'https://example.com/g.png', alt: 'G', from: { blockId: origen.id } },
      { blockId: origen.id },
    )

    const o = store.findBlock(origen.id)!.block
    if (o.type !== 'image') throw new Error()
    expect(o.src).toBe('https://example.com/g.png')
    expect(store.past.length).toBe(base)
  })

  it('destino de tipo inválido: no-op, el origen queda intacto', () => {
    const store = useDocumentStore()
    const row = store.addRow([100])
    const col = row.columns[0].id
    const origen = imageBlockWithSrc(store, col, 'https://example.com/h.png', 'H')
    const texto = store.addBlockToColumn(col, 'text')

    dropCanvasImage(
      store,
      { kind: 'canvas-image', src: 'https://example.com/h.png', alt: 'H', from: { blockId: origen.id } },
      { blockId: texto.id },
    )

    const o = store.findBlock(origen.id)!.block
    if (o.type !== 'image') throw new Error()
    expect(o.src).toBe('https://example.com/h.png')
    expect(store.findBlock(texto.id)!.block.type).toBe('text')
  })

  it('índice de galería fuera de rango: no-op, el origen queda intacto', () => {
    const store = useDocumentStore()
    const row = store.addRow([100])
    const col = row.columns[0].id
    const origen = imageBlockWithSrc(store, col, 'https://example.com/i.png', 'I')
    const galeria = store.addBlockToColumn(col, 'gallery')

    dropCanvasImage(
      store,
      { kind: 'canvas-image', src: 'https://example.com/i.png', alt: 'I', from: { blockId: origen.id } },
      { blockId: galeria.id, index: 99 },
    )

    const o = store.findBlock(origen.id)!.block
    if (o.type !== 'image') throw new Error()
    expect(o.src).toBe('https://example.com/i.png')
  })

  it('un solo undo revierte origen y destino a la vez', () => {
    const store = useDocumentStore()
    const row = store.addRow([100])
    const col = row.columns[0].id
    const origen = imageBlockWithSrc(store, col, 'https://example.com/j.png', 'J')
    const destino = store.addBlockToColumn(col, 'image')
    const base = store.past.length

    dropCanvasImage(
      store,
      { kind: 'canvas-image', src: 'https://example.com/j.png', alt: 'J', from: { blockId: origen.id } },
      { blockId: destino.id },
    )
    expect(store.past.length).toBe(base + 1)

    store.undo()

    const o = store.findBlock(origen.id)!.block
    const d = store.findBlock(destino.id)!.block
    if (o.type !== 'image' || d.type !== 'image') throw new Error()
    expect(o.src).toBe('https://example.com/j.png')
    expect(d.src).toBe('')
  })

  it('mueve una imagen hacia el índice 0 de una galería (Hallazgo 3: destino índice 0)', () => {
    const store = useDocumentStore()
    const row = store.addRow([100])
    const col = row.columns[0].id
    const origen = imageBlockWithSrc(store, col, 'https://example.com/idx0.png', 'Idx0')
    const galeria = store.addBlockToColumn(col, 'gallery')

    dropCanvasImage(
      store,
      { kind: 'canvas-image', src: 'https://example.com/idx0.png', alt: 'Idx0', from: { blockId: origen.id } },
      { blockId: galeria.id, index: 0 },
    )

    const o = store.findBlock(origen.id)!.block
    const g = store.findBlock(galeria.id)!.block
    if (o.type !== 'image' || g.type !== 'gallery') throw new Error()
    expect(g.images[0]).toMatchObject({ src: 'https://example.com/idx0.png', alt: 'Idx0' })
    expect(g.images[1]).toEqual({ src: '', alt: '' })
    expect(o.src).toBe('')
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

describe('BlockView — la imagen del canvas es arrastrable', () => {
  it('el <img> con src queda draggable tras reemplazar al placeholder', async () => {
    const pinia = createPinia()
    const base = createBlock('image')
    if (base.type !== 'image') throw new Error()
    const block = reactive(base)
    const Host = defineComponent({
      setup() {
        provide(BUILDER_PINIA_KEY, pinia)
        return () => h(BlockView, { block })
      },
    })
    const wrapper = mount(Host)

    // sin src se monta el placeholder; el <img> aparece recién al setear src
    expect(wrapper.find('.vmd-b-image-placeholder').exists()).toBe(true)

    block.src = 'https://example.com/k.png'
    await nextTick()
    await nextTick()

    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    // OJO: la propiedad IDL `.draggable` vale true por defecto en <img> (spec HTML, y jsdom la
    // replica), así que no discrimina nada. Pragmatic DnD setea el ATRIBUTO — eso es lo que hay
    // que assertar. Mismo aprendizaje que en el test de re-atado de la Tarea 1.
    expect(img.attributes('draggable')).toBe('true')
  })
})

describe('applyDrop — fusión de historial al llegar al límite (Hallazgo 1)', () => {
  beforeEach(() => setActivePinia(createPinia()))

  /**
   * Agrega commits distintos entre sí (cada `addRow` cambia el contenido del documento) hasta
   * que `past` llegue exactamente a `HISTORY_LIMIT`, simulando ~50 ediciones previas del
   * usuario. Con contenido único por commit, buscar `marker` por valor en `mergeCommitsSince`
   * no se puede confundir con otra entrada.
   */
  function fillHistoryToLimit(store: ReturnType<typeof useDocumentStore>) {
    while (store.past.length < HISTORY_LIMIT) store.addRow([100])
  }

  it('dropCanvasImage: con el historial al límite, un solo undo revierte origen y destino', () => {
    const store = useDocumentStore()
    const row = store.addRow([100])
    const col = row.columns[0].id
    const origen = imageBlockWithSrc(store, col, 'https://example.com/limite.png', 'Límite')
    const destino = store.addBlockToColumn(col, 'image')
    fillHistoryToLimit(store)
    expect(store.past.length).toBe(HISTORY_LIMIT)

    dropCanvasImage(
      store,
      { kind: 'canvas-image', src: 'https://example.com/limite.png', alt: 'Límite', from: { blockId: origen.id } },
      { blockId: destino.id },
    )
    // antes del fix: el push+shift del segundo commit hace que `while (past.length > before)`
    // ya no vea crecimiento en el tope, así que ningún commit se descarta — quedan DOS entradas
    // nuevas en vez de una.
    store.undo()

    const o = store.findBlock(origen.id)!.block
    const d = store.findBlock(destino.id)!.block
    if (o.type !== 'image' || d.type !== 'image') throw new Error()
    // un solo undo debe restaurar los dos extremos a la vez: el origen recupera su imagen y el
    // destino vuelve a estar vacío. Con el bug, el undo solo deshace el segundo commit interno
    // y el destino se queda con la imagen ya escrita — aparece en ambos huecos a la vez.
    expect(o.src).toBe('https://example.com/limite.png')
    expect(d.src).toBe('')
  })

  it('dropBlockOnEmptyCanvas: con el historial al límite, un solo undo revierte fila y bloque', () => {
    const store = useDocumentStore()
    fillHistoryToLimit(store)
    expect(store.past.length).toBe(HISTORY_LIMIT)
    const rowsBefore = store.doc.rows.length

    dropBlockOnEmptyCanvas(store, { kind: 'palette-block', create: () => createBlock('heading') })
    store.undo()

    expect(store.doc.rows).toHaveLength(rowsBefore)
  })

  it('dropMediaImageOnEmptyCanvas: con el historial al límite, un solo undo revierte fila y bloque', () => {
    const store = useDocumentStore()
    fillHistoryToLimit(store)
    expect(store.past.length).toBe(HISTORY_LIMIT)
    const rowsBefore = store.doc.rows.length

    dropMediaImageOnEmptyCanvas(store, { kind: 'media-image', src: 'https://example.com/limite2.png', alt: 'L' })
    store.undo()

    expect(store.doc.rows).toHaveLength(rowsBefore)
  })
})

describe('useCanvasImageDrag — canDrag rechaza huecos vacíos (Hallazgo 2)', () => {
  /**
   * Dispara un `dragstart` real sobre `el` y devuelve si Pragmatic llamó a
   * `event.preventDefault()`. Pragmatic evalúa `canDrag` dentro de su propio listener de
   * `dragstart` —antes de mirar el drag handle— y llama a `preventDefault()` cuando `canDrag`
   * rechaza el arrastre: `defaultPrevented === true` ⇒ `canDrag` rechazó.
   *
   * Cuando `canDrag` SÍ permite el arrastre, Pragmatic arranca una sesión de drag real y marca
   * un estado global (módulo `lifecycle-manager`) como activo hasta recibir `dragend`/`drop` en
   * `window`. Sin ese evento el estado queda "pegado" activo y el siguiente `dragstart` de OTRO
   * test ve `canStart() === false` — su listener retorna antes de evaluar `canDrag`, así que
   * `defaultPrevented` queda en `false` pase lo que pase (falso negativo que no depende del bug
   * real). Por eso disparamos `dragend` para cerrar la sesión y no filtrar estado entre tests.
   */
  function fireDragStart(el: Element): boolean {
    const ev = new Event('dragstart', { bubbles: true, cancelable: true })
    Object.defineProperty(ev, 'dataTransfer', {
      value: { types: [], items: [], setData: () => {}, getData: () => '', setDragImage: () => {} },
    })
    Object.defineProperty(ev, 'clientX', { value: 1 })
    Object.defineProperty(ev, 'clientY', { value: 1 })
    el.dispatchEvent(ev)
    const rejected = ev.defaultPrevented
    if (!rejected) {
      const end = new Event('dragend', { bubbles: true, cancelable: true })
      Object.defineProperty(end, 'clientX', { value: 1 })
      Object.defineProperty(end, 'clientY', { value: 1 })
      window.dispatchEvent(end)
    }
    return rejected
  }

  // Se desmontan tras cada test (ver afterEach) para no acumular nodos en document.body.
  const mounted: { unmount: () => void }[] = []
  afterEach(() => {
    while (mounted.length) mounted.pop()!.unmount()
  })

  /**
   * `attachTo: document.body` es necesario aquí: Pragmatic escucha `dragstart` a nivel de
   * `document` (delegación de eventos), así que un nodo desmontado del árbol del documento
   * nunca hace burbujear el evento hasta ese listener y `canDrag` jamás llega a evaluarse.
   */
  function mountGalleryItem(img: { src: string; alt: string }) {
    const pinia = createPinia()
    const Host = defineComponent({
      setup() {
        provide(BUILDER_PINIA_KEY, pinia)
        return () => h(GalleryItemView, { img, index: 0, blockId: 'blk-galeria' })
      },
    })
    const wrapper = mount(Host, { attachTo: document.body })
    mounted.push(wrapper)
    return wrapper
  }

  it('GalleryItemView: ítem sin imagen rechaza el drag', async () => {
    const wrapper = mountGalleryItem({ src: '', alt: '' })
    // bindToElement usa flush:'post': hay que esperar el próximo tick para que el draggable
    // ya esté atado antes de disparar el dragstart.
    await nextTick()
    const el = wrapper.find('.vmd-b-gallery-placeholder').element
    expect(fireDragStart(el)).toBe(true)
  })

  it('GalleryItemView: ítem con imagen permite el drag', async () => {
    const wrapper = mountGalleryItem({ src: 'https://example.com/gal.png', alt: 'Galería' })
    await nextTick()
    const el = wrapper.find('img').element
    expect(fireDragStart(el)).toBe(false)
  })

  it('BlockView: bloque imagen vacío rechaza el drag', async () => {
    const { wrapper } = mountBlockHost(createBlock('image'))
    mounted.push(wrapper)
    await nextTick()
    const el = wrapper.find('.vmd-b-image-placeholder').element
    expect(fireDragStart(el)).toBe(true)
  })

  it('BlockView: bloque imagen con src permite el drag', async () => {
    const base = createBlock('image')
    if (base.type !== 'image') throw new Error()
    base.src = 'https://example.com/bloque.png'
    const { wrapper } = mountBlockHost(base)
    mounted.push(wrapper)
    await nextTick()
    const el = wrapper.find('img').element
    expect(fireDragStart(el)).toBe(false)
  })
})
