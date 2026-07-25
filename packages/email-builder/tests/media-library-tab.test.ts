import { type DOMWrapper, flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import EmailBuilder from '../src/components/EmailBuilder.vue'
import type { MediaItem } from '../src/mediaLibrary'
import { createBlock, createDocument, createRow } from '../src/schema'

const items: MediaItem[] = [
  { id: 'a', url: 'https://img.example/a.jpg', thumbnailUrl: 'https://img.example/a-thumb.jpg', name: 'Foto A' },
  { id: 'b', url: 'https://img.example/b.jpg', thumbnailUrl: 'https://img.example/b-thumb.jpg', name: 'Foto B' },
]

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
  await wrapper.find('[data-tab="media"]').trigger('click')
  await flushPromises()
}

function findButtonWithText(root: DOMWrapper<Element>, text: string) {
  const btn = root.findAll('button').find((b) => b.text().trim() === text)
  if (!btn) throw new Error(`No se encontró el botón "${text}"`)
  return btn
}

describe('MediaLibraryTab', () => {
  it('no aparece la pestaña sin la prop mediaLibrary', () => {
    const wrapper = mount(EmailBuilder)
    expect(wrapper.find('[data-tab="media"]').exists()).toBe(false)
  })

  it('lista los ítems al abrir la pestaña', async () => {
    const mediaLibrary = makeMediaLibrary()
    const wrapper = mount(EmailBuilder, { props: { mediaLibrary } })
    await openMediaTab(wrapper)
    expect(mediaLibrary.list).toHaveBeenCalledWith()
    expect(wrapper.findAll('.vmd-media-item')).toHaveLength(2)
  })

  it('click sin selección inserta un bloque imagen nuevo con el src y el name', async () => {
    const wrapper = mount(EmailBuilder, { props: { mediaLibrary: makeMediaLibrary() } })
    await openMediaTab(wrapper)
    await wrapper.find('.vmd-media-item-thumb').trigger('click')

    const emitted = wrapper.emitted('update:design')
    const design = emitted![emitted!.length - 1][0] as {
      rows: { columns: { blocks: { type: string; src?: string; alt?: string }[] }[] }[]
    }
    const blocks = design.rows.flatMap((r) => r.columns.flatMap((c) => c.blocks))
    const image = blocks.find((b) => b.type === 'image')
    expect(image?.src).toBe('https://img.example/a.jpg')
    expect(image?.alt).toBe('Foto A')
  })

  it('no pisa el alt existente al cambiar la imagen de un bloque seleccionado', async () => {
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

    const emitted = wrapper.emitted('update:design')
    const doc = emitted![emitted!.length - 1][0] as {
      rows: { columns: { blocks: { type: string; src?: string; alt?: string }[] }[] }[]
    }
    const blocks = doc.rows.flatMap((r) => r.columns.flatMap((c) => c.blocks))
    const image = blocks.find((b) => b.type === 'image')
    expect(image?.src).toBe('https://img.example/a.jpg')
    expect(image?.alt).toBe('Mi alt')
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
    expect(wrapper.find('.vmd-tab-placeholder').text()).toContain('Todavía no subiste imágenes')
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

    expect(wrapper.find('.vmd-media-tab .vmd-image-error').text()).toContain('No se pudo subir la imagen')
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
    expect(wrapper.find('.vmd-media-tab .vmd-image-error').text()).toContain('No se pudo cargar más imágenes')
    expect(wrapper.find('.vmd-media-loadmore').exists()).toBe(true)
  })

  it('borra un ítem tras confirmar', async () => {
    const del = vi.fn().mockResolvedValue(undefined)
    const wrapper = mount(EmailBuilder, { props: { mediaLibrary: makeMediaLibrary({ delete: del }) } })
    await openMediaTab(wrapper)

    const firstItem = wrapper.findAll('.vmd-media-item')[0]
    await firstItem.find('.vmd-media-item-menu-btn').trigger('click')
    await findButtonWithText(firstItem, 'Borrar').trigger('click')
    expect(del).not.toHaveBeenCalled()

    await findButtonWithText(firstItem, 'Confirmar').trigger('click')
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
    await findButtonWithText(firstItem, 'Borrar').trigger('click')
    await findButtonWithText(firstItem, 'Cancelar').trigger('click')

    expect(del).not.toHaveBeenCalled()
    expect(wrapper.findAll('.vmd-media-item')).toHaveLength(2)
  })

  it('si delete falla, el ítem permanece y se ve el error', async () => {
    const del = vi.fn().mockRejectedValue(new Error('boom'))
    const wrapper = mount(EmailBuilder, { props: { mediaLibrary: makeMediaLibrary({ delete: del }) } })
    await openMediaTab(wrapper)

    const firstItem = wrapper.findAll('.vmd-media-item')[0]
    await firstItem.find('.vmd-media-item-menu-btn').trigger('click')
    await findButtonWithText(firstItem, 'Borrar').trigger('click')
    await findButtonWithText(firstItem, 'Confirmar').trigger('click')
    await flushPromises()

    expect(wrapper.findAll('.vmd-media-item')).toHaveLength(2)
    expect(firstItem.find('.vmd-image-error').text()).toContain('No se pudo borrar la imagen')
  })

  it('renombra un ítem con Enter y actualiza el nombre mostrado', async () => {
    const updated: MediaItem = { ...items[0], name: 'Nuevo nombre' }
    const rename = vi.fn().mockResolvedValue(updated)
    const wrapper = mount(EmailBuilder, { props: { mediaLibrary: makeMediaLibrary({ rename }) } })
    await openMediaTab(wrapper)

    const firstItem = wrapper.findAll('.vmd-media-item')[0]
    await firstItem.find('.vmd-media-item-menu-btn').trigger('click')
    await findButtonWithText(firstItem, 'Renombrar').trigger('click')

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
    await findButtonWithText(firstItem, 'Renombrar').trigger('click')

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
    await findButtonWithText(firstItem, 'Renombrar').trigger('click')

    const input = firstItem.find('.vmd-media-item-name-input')
    await input.setValue('Nuevo nombre')
    await input.trigger('keydown', { key: 'Enter' })
    await flushPromises()

    expect(rename).toHaveBeenCalledWith('a', 'Nuevo nombre')
    expect(firstItem.find('.vmd-image-error').text()).toContain('No se pudo renombrar la imagen')
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
    await findButtonWithText(firstItem, 'Renombrar').trigger('click')
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
    await findButtonWithText(firstItem, 'Renombrar').trigger('click')
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
    await findButtonWithText(firstItem, 'Borrar').trigger('click')
    await findButtonWithText(firstItem, 'Confirmar').trigger('click')

    expect(firstItem.classes()).toContain('vmd-media-item--busy')

    pending.resolve()
    await flushPromises()
  })

  it('si la prop mediaLibrary se vuelve undefined con el tab abierto, el tab desaparece sin quedar colgado', async () => {
    const wrapper = mount(EmailBuilder, { props: { mediaLibrary: makeMediaLibrary() } })
    await openMediaTab(wrapper)
    expect(wrapper.find('.vmd-media-tab').exists()).toBe(true)

    await wrapper.setProps({ mediaLibrary: undefined })

    expect(wrapper.find('[data-tab="media"]').exists()).toBe(false)
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
    const reloadBtn = wrapper.findAll('button').find((b) => b.text().trim() === 'Recargar galería completa')
    expect(reloadBtn).toBeTruthy()

    await reloadBtn!.trigger('click')
    await flushPromises()

    expect(list).toHaveBeenCalledTimes(2)
    expect(wrapper.findAll('.vmd-media-item')).toHaveLength(2)
    expect(wrapper.findAll('button').some((b) => b.text().trim() === 'Recargar galería completa')).toBe(false)
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
    await findButtonWithText(firstItem, 'Renombrar').trigger('click')

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
