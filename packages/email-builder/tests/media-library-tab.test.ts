import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { type DOMWrapper, flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import EmailBuilder from '../src/components/EmailBuilder.vue'
import { readDrag } from '../src/dnd/dragData'
import type { MediaItem } from '../src/mediaLibrary'
import { createBlock, createDocument, createRow } from '../src/schema'

const items: MediaItem[] = [
  { id: 'a', url: 'https://img.example/a.jpg', thumbnailUrl: 'https://img.example/a-thumb.jpg', name: 'Foto A' },
  { id: 'b', url: 'https://img.example/b.jpg', thumbnailUrl: 'https://img.example/b-thumb.jpg', name: 'Foto B' },
]

const UI = {
  empty: 'You have not uploaded images yet.',
  uploadError: 'Could not upload the image.',
  loadMoreError: 'Could not load more images.',
  delete: 'Delete',
  confirm: 'Confirm',
  cancel: 'Cancel',
  deleteError: 'Could not delete the image.',
  rename: 'Rename',
  renameError: 'Could not rename the image.',
  reloadComplete: 'Reload full gallery',
} as const

function makeMediaLibrary(
  overrides: Partial<{
    list: ReturnType<typeof vi.fn>
    upload: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
    rename: ReturnType<typeof vi.fn>
  }> = {},
) {
  return {
    list: overrides.list ?? vi.fn().mockResolvedValue({ items }),
    upload: overrides.upload ?? vi.fn(),
    delete: overrides.delete ?? vi.fn(),
    rename: overrides.rename ?? vi.fn(),
  }
}

async function openMediaTab(wrapper: ReturnType<typeof mount>) {
  await wrapper.find('[data-tab="images"]').trigger('click')
  const galleryTab = wrapper.find('[data-subtab="gallery"]')
  expect(galleryTab.exists()).toBe(true)
  await galleryTab.trigger('click')
  await flushPromises()
}

function endDragSession() {
  const end = new Event('dragend', { bubbles: true, cancelable: true })
  Object.defineProperty(end, 'clientX', { value: 1 })
  Object.defineProperty(end, 'clientY', { value: 1 })
  window.dispatchEvent(end)
}

function fireDragStart(el: Element): Event {
  const ev = new Event('dragstart', { bubbles: true, cancelable: true })
  Object.defineProperty(ev, 'dataTransfer', {
    value: { types: [], items: [], setData: () => {}, getData: () => '', setDragImage: () => {} },
  })
  Object.defineProperty(ev, 'clientX', { value: 1 })
  Object.defineProperty(ev, 'clientY', { value: 1 })
  el.dispatchEvent(ev)
  return ev
}

async function captureDragData(el: Element) {
  await nextTick()
  endDragSession()
  let captured: ReturnType<typeof readDrag> = null
  const cleanup = monitorForElements({
    onGenerateDragPreview: ({ source }) => {
      captured = readDrag(source.data as Record<string | symbol, unknown>)
    },
  })
  const ev = fireDragStart(el)
  cleanup()
  if (!ev.defaultPrevented) endDragSession()
  return captured
}

function findButtonWithText(root: DOMWrapper<Element>, text: string) {
  const btn = root.findAll('button').find((b) => b.text().trim() === text)
  if (!btn) throw new Error(`No se encontró el botón "${text}"`)
  return btn
}

describe('MediaLibraryTab', () => {
  it('oculta la subpestaña Gallery sin la prop mediaLibrary', async () => {
    const wrapper = mount(EmailBuilder)
    await wrapper.find('[data-tab="images"]').trigger('click')
    expect(wrapper.find('[data-subtab="gallery"]').exists()).toBe(false)
  })

  it('lista los ítems al abrir la subpestaña Gallery', async () => {
    const mediaLibrary = makeMediaLibrary()
    const wrapper = mount(EmailBuilder, { props: { mediaLibrary } })
    await openMediaTab(wrapper)
    expect(mediaLibrary.list).toHaveBeenCalledWith()
    expect(wrapper.findAll('.vmd-media-item')).toHaveLength(2)
    expect(wrapper.findAll('.vmd-media-item-thumb')[0]?.attributes('draggable')).toBe('true')
    expect(wrapper.findAll('.vmd-media-item-thumb')[0]?.find('img').attributes('src')).toBe(
      'https://img.example/a-thumb.jpg',
    )
  })

  it('expone en el drag payload el src completo del ítem de Gallery', async () => {
    const wrapper = mount(EmailBuilder, {
      attachTo: document.body,
      props: { mediaLibrary: makeMediaLibrary() },
    })
    await openMediaTab(wrapper)
    const thumb = wrapper.findAll('.vmd-media-item-thumb')[0]
    expect(thumb?.attributes('draggable')).toBe('true')

    const drag = await captureDragData(thumb!.element)

    expect(drag).toMatchObject({ kind: 'media-image', src: 'https://img.example/a.jpg', alt: 'Foto A' })
  })

  it('abre preview desde Gallery y solo inserta al presionar Add', async () => {
    const wrapper = mount(EmailBuilder, { props: { mediaLibrary: makeMediaLibrary() } })
    await openMediaTab(wrapper)
    await wrapper.find('.vmd-media-item-thumb').trigger('click')
    expect(wrapper.find('.vmd-image-preview-dialog').exists()).toBe(true)
    expect(wrapper.emitted('update:design')).toBeUndefined()

    await wrapper.find('[data-action="image-preview-add"]').trigger('click')

    const emitted = wrapper.emitted('update:design')
    const design = emitted![emitted!.length - 1][0] as {
      rows: { columns: { blocks: { type: string; src?: string; alt?: string }[] }[] }[]
    }
    const blocks = design.rows.flatMap((r) => r.columns.flatMap((c) => c.blocks))
    const image = blocks.find((b) => b.type === 'image')
    expect(image?.src).toBe('https://img.example/a.jpg')
    expect(image?.alt).toBe('Foto A')
  })

  it('preserva el alt existente al agregar desde Gallery sobre un bloque seleccionado', async () => {
    const design = createDocument()
    const row = createRow([100])
    const img = createBlock('image')
    if (img.type !== 'image') throw new Error()
    img.src = 'x'
    img.alt = 'Mi alt'
    row.columns[0].blocks.push(img)
    design.rows.push(row)

    const wrapper = mount(EmailBuilder, { props: { design, mediaLibrary: makeMediaLibrary() } })
    await wrapper.find('.vmd-block').trigger('click')
    await openMediaTab(wrapper)
    await wrapper.find('.vmd-media-item-thumb').trigger('click')
    expect(wrapper.emitted('update:design')).toBeUndefined()

    await wrapper.find('[data-action="image-preview-add"]').trigger('click')

    const emitted = wrapper.emitted('update:design')
    const doc = emitted![emitted!.length - 1][0] as {
      rows: { columns: { blocks: { type: string; src?: string; alt?: string }[] }[] }[]
    }
    const blocks = doc.rows.flatMap((r) => r.columns.flatMap((c) => c.blocks))
    const image = blocks.find((b) => b.type === 'image')
    expect(image?.src).toBe('https://img.example/a.jpg')
    expect(image?.alt).toBe('Mi alt')
  })

  it('cerrar el preview de Gallery no muta el diseño', async () => {
    const wrapper = mount(EmailBuilder, { props: { mediaLibrary: makeMediaLibrary() } })
    await openMediaTab(wrapper)
    await wrapper.find('.vmd-media-item-thumb').trigger('click')

    await wrapper.find('[data-action="image-preview-cancel"]').trigger('click')
    expect(wrapper.find('.vmd-image-preview-dialog').exists()).toBe(false)
    expect(wrapper.emitted('update:design')).toBeUndefined()
  })

  it('muestra error y permite reintentar si list falla', async () => {
    const list = vi.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce({ items })
    const wrapper = mount(EmailBuilder, { props: { mediaLibrary: makeMediaLibrary({ list }) } })
    await openMediaTab(wrapper)
    expect(wrapper.find('.vmd-media-tab .vmd-image-error').exists()).toBe(true)

    await wrapper.find('.vmd-media-tab .vmd-mini-btn--text').trigger('click')
    await flushPromises()
    expect(wrapper.findAll('.vmd-media-item')).toHaveLength(2)
  })

  it('muestra estado vacío si list devuelve 0 ítems', async () => {
    const wrapper = mount(EmailBuilder, {
      props: { mediaLibrary: makeMediaLibrary({ list: vi.fn().mockResolvedValue({ items: [] }) }) },
    })
    await openMediaTab(wrapper)
    expect(wrapper.find('.vmd-tab-placeholder').text()).toContain(UI.empty)
  })

  it('sube un archivo y antepone el ítem al grid sin volver a listar', async () => {
    const newItem: MediaItem = {
      id: 'c',
      url: 'https://img.example/c.jpg',
      thumbnailUrl: 'https://img.example/c-thumb.jpg',
      name: 'Foto C',
    }
    const upload = vi.fn().mockResolvedValue(newItem)
    const list = vi.fn().mockResolvedValue({ items })
    const wrapper = mount(EmailBuilder, { props: { mediaLibrary: makeMediaLibrary({ list, upload }) } })
    await openMediaTab(wrapper)

    const input = wrapper.find('.vmd-media-tab input[type="file"]')
    const file = new File(['x'], 'c.jpg', { type: 'image/jpeg' })
    Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
    await input.trigger('change')
    await flushPromises()

    expect(upload).toHaveBeenCalledWith(file)
    expect(list).toHaveBeenCalledTimes(1)
    expect(wrapper.findAll('.vmd-media-item')).toHaveLength(3)
    expect(wrapper.findAll('.vmd-media-item-thumb')[0].find('img').attributes('src')).toBe(
      'https://img.example/c-thumb.jpg',
    )
  })

  it('muestra error inline si falla la subida', async () => {
    const upload = vi.fn().mockRejectedValue(new Error('boom'))
    const wrapper = mount(EmailBuilder, { props: { mediaLibrary: makeMediaLibrary({ upload }) } })
    await openMediaTab(wrapper)

    const input = wrapper.find('.vmd-media-tab input[type="file"]')
    const file = new File(['x'], 'c.jpg', { type: 'image/jpeg' })
    Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
    await input.trigger('change')
    await flushPromises()

    expect(wrapper.find('.vmd-media-tab .vmd-image-error').text()).toContain(UI.uploadError)
    expect(wrapper.findAll('.vmd-media-item')).toHaveLength(2)
  })

  it('muestra "Cargar más" solo cuando hay nextCursor y concatena la página siguiente', async () => {
    const page2: MediaItem[] = [
      { id: 'c', url: 'https://img.example/c.jpg', thumbnailUrl: 'https://img.example/c-thumb.jpg', name: 'Foto C' },
    ]
    const list = vi
      .fn()
      .mockResolvedValueOnce({ items, nextCursor: 'cursor-1' })
      .mockResolvedValueOnce({ items: page2 })
    const wrapper = mount(EmailBuilder, { props: { mediaLibrary: makeMediaLibrary({ list }) } })
    await openMediaTab(wrapper)

    expect(wrapper.find('.vmd-media-loadmore').exists()).toBe(true)

    await wrapper.find('.vmd-media-loadmore').trigger('click')
    await flushPromises()

    expect(list).toHaveBeenNthCalledWith(2, 'cursor-1')
    expect(wrapper.findAll('.vmd-media-item')).toHaveLength(3)
    expect(wrapper.find('.vmd-media-loadmore').exists()).toBe(false)
  })

  it('si falla "Cargar más" conserva los ítems ya cargados y permite reintentar', async () => {
    const list = vi
      .fn()
      .mockResolvedValueOnce({ items, nextCursor: 'cursor-1' })
      .mockRejectedValueOnce(new Error('boom'))
    const wrapper = mount(EmailBuilder, { props: { mediaLibrary: makeMediaLibrary({ list }) } })
    await openMediaTab(wrapper)

    await wrapper.find('.vmd-media-loadmore').trigger('click')
    await flushPromises()

    expect(wrapper.findAll('.vmd-media-item')).toHaveLength(2)
    expect(wrapper.find('.vmd-media-tab .vmd-image-error').text()).toContain(UI.loadMoreError)
    expect(wrapper.find('.vmd-media-loadmore').exists()).toBe(true)
  })

  it('borra un ítem tras confirmar', async () => {
    const del = vi.fn().mockResolvedValue(undefined)
    const wrapper = mount(EmailBuilder, { props: { mediaLibrary: makeMediaLibrary({ delete: del }) } })
    await openMediaTab(wrapper)

    const firstItem = wrapper.findAll('.vmd-media-item')[0]
    await firstItem.find('.vmd-media-item-menu-btn').trigger('click')
    await findButtonWithText(firstItem, UI.delete).trigger('click')
    expect(del).not.toHaveBeenCalled()

    await findButtonWithText(firstItem, UI.confirm).trigger('click')
    await flushPromises()

    expect(del).toHaveBeenCalledWith('a')
    expect(wrapper.findAll('.vmd-media-item')).toHaveLength(1)
  })

  it('cancelar el popover de borrado no llama a delete', async () => {
    const del = vi.fn()
    const wrapper = mount(EmailBuilder, { props: { mediaLibrary: makeMediaLibrary({ delete: del }) } })
    await openMediaTab(wrapper)

    const firstItem = wrapper.findAll('.vmd-media-item')[0]
    await firstItem.find('.vmd-media-item-menu-btn').trigger('click')
    await findButtonWithText(firstItem, UI.delete).trigger('click')
    await findButtonWithText(firstItem, UI.cancel).trigger('click')

    expect(del).not.toHaveBeenCalled()
    expect(wrapper.findAll('.vmd-media-item')).toHaveLength(2)
  })

  it('si delete falla, el ítem permanece y se ve el error', async () => {
    const del = vi.fn().mockRejectedValue(new Error('boom'))
    const wrapper = mount(EmailBuilder, { props: { mediaLibrary: makeMediaLibrary({ delete: del }) } })
    await openMediaTab(wrapper)

    const firstItem = wrapper.findAll('.vmd-media-item')[0]
    await firstItem.find('.vmd-media-item-menu-btn').trigger('click')
    await findButtonWithText(firstItem, UI.delete).trigger('click')
    await findButtonWithText(firstItem, UI.confirm).trigger('click')
    await flushPromises()

    expect(wrapper.findAll('.vmd-media-item')).toHaveLength(2)
    expect(firstItem.find('.vmd-image-error').text()).toContain(UI.deleteError)
  })

  it('renombra un ítem con Enter y actualiza el nombre mostrado', async () => {
    const updated: MediaItem = { ...items[0], name: 'Nuevo nombre' }
    const rename = vi.fn().mockResolvedValue(updated)
    const wrapper = mount(EmailBuilder, { props: { mediaLibrary: makeMediaLibrary({ rename }) } })
    await openMediaTab(wrapper)

    const firstItem = wrapper.findAll('.vmd-media-item')[0]
    await firstItem.find('.vmd-media-item-menu-btn').trigger('click')
    await findButtonWithText(firstItem, UI.rename).trigger('click')

    const input = firstItem.find('.vmd-media-item-name-input')
    await input.setValue('Nuevo nombre')
    await input.trigger('keydown', { key: 'Enter' })
    await flushPromises()

    expect(rename).toHaveBeenCalledWith('a', 'Nuevo nombre')
    expect(firstItem.find('.vmd-media-item-name').text()).toBe('Nuevo nombre')
  })

  it('Escape cancela el renombrado sin llamar a rename', async () => {
    const rename = vi.fn()
    const wrapper = mount(EmailBuilder, { props: { mediaLibrary: makeMediaLibrary({ rename }) } })
    await openMediaTab(wrapper)

    const firstItem = wrapper.findAll('.vmd-media-item')[0]
    await firstItem.find('.vmd-media-item-menu-btn').trigger('click')
    await findButtonWithText(firstItem, UI.rename).trigger('click')

    const input = firstItem.find('.vmd-media-item-name-input')
    await input.setValue('Otro nombre')
    await input.trigger('keydown', { key: 'Escape' })
    await flushPromises()

    expect(rename).not.toHaveBeenCalled()
    expect(firstItem.find('.vmd-media-item-name').text()).toBe('Foto A')
  })

  it('si falla el renombrado muestra un error inline y no sale del modo edición', async () => {
    const rename = vi.fn().mockRejectedValue(new Error('boom'))
    const wrapper = mount(EmailBuilder, { props: { mediaLibrary: makeMediaLibrary({ rename }) } })
    await openMediaTab(wrapper)

    const firstItem = wrapper.findAll('.vmd-media-item')[0]
    await firstItem.find('.vmd-media-item-menu-btn').trigger('click')
    await findButtonWithText(firstItem, UI.rename).trigger('click')

    const input = firstItem.find('.vmd-media-item-name-input')
    await input.setValue('Nuevo nombre')
    await input.trigger('keydown', { key: 'Enter' })
    await flushPromises()

    expect(rename).toHaveBeenCalledWith('a', 'Nuevo nombre')
    expect(firstItem.find('.vmd-image-error').text()).toContain(UI.renameError)
    expect(firstItem.find('.vmd-media-item-name-input').exists()).toBe(true)
  })

  it('el input de renombrar recibe foco y selecciona el texto al iniciar', async () => {
    const wrapper = mount(EmailBuilder, {
      attachTo: document.body,
      props: { mediaLibrary: makeMediaLibrary() },
    })
    await openMediaTab(wrapper)

    const firstItem = wrapper.findAll('.vmd-media-item')[0]
    await firstItem.find('.vmd-media-item-menu-btn').trigger('click')
    await findButtonWithText(firstItem, UI.rename).trigger('click')
    await flushPromises()

    const input = firstItem.find('.vmd-media-item-name-input').element as HTMLInputElement
    expect(document.activeElement).toBe(input)
    expect(input.selectionStart).toBe(0)
    expect(input.selectionEnd).toBe(input.value.length)
    wrapper.unmount()
  })

  it('tras un fallo de renombrado, el input recupera el foco', async () => {
    const rename = vi.fn().mockRejectedValue(new Error('boom'))
    const wrapper = mount(EmailBuilder, {
      attachTo: document.body,
      props: { mediaLibrary: makeMediaLibrary({ rename }) },
    })
    await openMediaTab(wrapper)

    const firstItem = wrapper.findAll('.vmd-media-item')[0]
    await firstItem.find('.vmd-media-item-menu-btn').trigger('click')
    await findButtonWithText(firstItem, UI.rename).trigger('click')
    await flushPromises()

    const input = firstItem.find('.vmd-media-item-name-input')
    await input.setValue('Nuevo nombre')
    ;(input.element as HTMLInputElement).blur()
    await input.trigger('keydown', { key: 'Enter' })
    await flushPromises()

    expect(rename).toHaveBeenCalledWith('a', 'Nuevo nombre')
    expect(document.activeElement).toBe(firstItem.find('.vmd-media-item-name-input').element)
    wrapper.unmount()
  })

  it('muestra opacidad reducida en el ítem mientras se está borrando', async () => {
    function deferred<T>() {
      let resolve!: (v: T) => void
      const promise = new Promise<T>((r) => (resolve = r))
      return { promise, resolve }
    }
    const pending = deferred<void>()
    const del = vi.fn().mockReturnValue(pending.promise)
    const wrapper = mount(EmailBuilder, { props: { mediaLibrary: makeMediaLibrary({ delete: del }) } })
    await openMediaTab(wrapper)

    const firstItem = wrapper.findAll('.vmd-media-item')[0]
    await firstItem.find('.vmd-media-item-menu-btn').trigger('click')
    await findButtonWithText(firstItem, UI.delete).trigger('click')
    await findButtonWithText(firstItem, UI.confirm).trigger('click')

    expect(firstItem.classes()).toContain('vmd-media-item--busy')

    pending.resolve()
    await flushPromises()
  })

  it('si la prop mediaLibrary se vuelve undefined con el tab abierto, el tab desaparece sin quedar colgado', async () => {
    const wrapper = mount(EmailBuilder, { props: { mediaLibrary: makeMediaLibrary() } })
    await openMediaTab(wrapper)
    expect(wrapper.find('.vmd-media-tab').exists()).toBe(true)

    await wrapper.setProps({ mediaLibrary: undefined })

    expect(wrapper.find('[data-subtab="gallery"]').exists()).toBe(false)
    expect(wrapper.find('.vmd-media-tab').exists()).toBe(false)
  })

  it('tras subir con éxito después de un error de list, se puede recargar la galería completa', async () => {
    const list = vi.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce({ items })
    const newItem: MediaItem = {
      id: 'c',
      url: 'https://img.example/c.jpg',
      thumbnailUrl: 'https://img.example/c-thumb.jpg',
      name: 'Foto C',
    }
    const upload = vi.fn().mockResolvedValue(newItem)
    const wrapper = mount(EmailBuilder, { props: { mediaLibrary: makeMediaLibrary({ list, upload }) } })
    await openMediaTab(wrapper)
    expect(wrapper.find('.vmd-media-tab .vmd-image-error').exists()).toBe(true)

    const input = wrapper.find('.vmd-media-tab input[type="file"]')
    const file = new File(['x'], 'c.jpg', { type: 'image/jpeg' })
    Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
    await input.trigger('change')
    await flushPromises()

    expect(wrapper.findAll('.vmd-media-item')).toHaveLength(1)
    const reloadBtn = wrapper.findAll('button').find((b) => b.text().trim() === UI.reloadComplete)
    expect(reloadBtn).toBeTruthy()

    await reloadBtn!.trigger('click')
    await flushPromises()

    expect(list).toHaveBeenCalledTimes(2)
    expect(wrapper.findAll('.vmd-media-item')).toHaveLength(2)
    expect(wrapper.findAll('button').some((b) => b.text().trim() === UI.reloadComplete)).toBe(false)
  })

  it('deshabilita el input de renombrado mientras rename está en curso', async () => {
    function deferred<T>() {
      let resolve!: (v: T) => void
      const promise = new Promise<T>((r) => (resolve = r))
      return { promise, resolve }
    }
    const pending = deferred<MediaItem>()
    const rename = vi.fn().mockReturnValue(pending.promise)
    const wrapper = mount(EmailBuilder, { props: { mediaLibrary: makeMediaLibrary({ rename }) } })
    await openMediaTab(wrapper)

    const firstItem = wrapper.findAll('.vmd-media-item')[0]
    await firstItem.find('.vmd-media-item-menu-btn').trigger('click')
    await findButtonWithText(firstItem, UI.rename).trigger('click')

    const input = firstItem.find('.vmd-media-item-name-input')
    await input.setValue('Nuevo nombre')
    await input.trigger('keydown', { key: 'Enter' })

    expect(firstItem.find('.vmd-media-item-name-input').attributes('disabled')).toBeDefined()
    expect(rename).toHaveBeenCalledTimes(1)

    pending.resolve({ ...items[0], name: 'Nuevo nombre' })
    await flushPromises()

    expect(firstItem.find('.vmd-media-item-name-input').exists()).toBe(false)
    expect(firstItem.find('.vmd-media-item-name').text()).toBe('Nuevo nombre')
  })
})
