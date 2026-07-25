import { flushPromises, mount } from '@vue/test-utils'
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
})
