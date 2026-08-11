import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import EmailBuilder from '../src/components/EmailBuilder.vue'
import { createBlock, createDocument, createRow } from '../src/schema'

const results = [
  { url: 'https://img.example/full1.jpg', thumbnailUrl: 'https://img.example/t1.jpg', title: 'Uno' },
  { url: 'https://img.example/full2.jpg', thumbnailUrl: 'https://img.example/t2.jpg', title: 'Dos' },
]

async function searchIn(wrapper: ReturnType<typeof mount>) {
  await wrapper.find('[data-tab="images"]').trigger('click')
  expect(wrapper.find('[data-subtab="search"]').exists()).toBe(true)
  const input = wrapper.find('.vmd-image-search input')
  await input.setValue('futbol')
  await new Promise((r) => setTimeout(r, 450)) // debounce
  await flushPromises()
}

describe('ImagesTab', () => {
  it('busca con la función inyectada y muestra resultados', async () => {
    const imageSearch = vi.fn().mockResolvedValue(results)
    const wrapper = mount(EmailBuilder, { props: { imageSearch } })
    await searchIn(wrapper)
    expect(imageSearch).toHaveBeenCalledWith('futbol')
    expect(wrapper.findAll('.vmd-image-result')).toHaveLength(2)
    expect(wrapper.findAll('.vmd-image-result')[0]?.attributes('draggable')).toBe('true')
    expect(wrapper.findAll('.vmd-image-result')[0]?.find('img').attributes('src')).toBe('https://img.example/t1.jpg')
  })

  it('abre preview sin insertar hasta presionar Add', async () => {
    const wrapper = mount(EmailBuilder, { props: { imageSearch: vi.fn().mockResolvedValue(results) } })
    await searchIn(wrapper)
    await wrapper.find('.vmd-image-result').trigger('click')
    expect(wrapper.find('.vmd-image-preview-dialog').exists()).toBe(true)
    expect(wrapper.emitted('update:design')).toBeUndefined()

    await wrapper.find('[data-action="image-preview-add"]').trigger('click')

    const emitted = wrapper.emitted('update:design')
    const design = emitted![emitted!.length - 1][0] as { rows: { columns: { blocks: { type: string; src?: string }[] }[] }[] }
    const blocks = design.rows.flatMap((r) => r.columns.flatMap((c) => c.blocks))
    expect(blocks.some((b) => b.type === 'image' && b.src === 'https://img.example/full1.jpg')).toBe(true)
    expect(wrapper.find('.vmd-image-preview-dialog').exists()).toBe(false)
  })

  it('muestra error si la búsqueda falla', async () => {
    const wrapper = mount(EmailBuilder, { props: { imageSearch: vi.fn().mockRejectedValue(new Error('boom')) } })
    await searchIn(wrapper)
    expect(wrapper.find('.vmd-image-error').exists()).toBe(true)
  })

  it('preserva el alt existente al agregar desde preview sobre un bloque seleccionado', async () => {
    const design = createDocument()
    const row = createRow([100])
    const img = createBlock('image')
    if (img.type !== 'image') throw new Error()
    img.src = 'x'
    img.alt = 'Mi alt'
    row.columns[0].blocks.push(img)
    design.rows.push(row)

    const wrapper = mount(EmailBuilder, {
      props: { design, imageSearch: vi.fn().mockResolvedValue(results) },
    })
    await wrapper.find('.vmd-block').trigger('click') // selecciona el bloque imagen
    await searchIn(wrapper)
    await wrapper.find('.vmd-image-result').trigger('click')
    expect(wrapper.emitted('update:design')).toBeUndefined()

    await wrapper.find('[data-action="image-preview-add"]').trigger('click')

    const emitted = wrapper.emitted('update:design')
    const doc = emitted![emitted!.length - 1][0] as {
      rows: { columns: { blocks: { type: string; src?: string; alt?: string }[] }[] }[]
    }
    const blocks = doc.rows.flatMap((r) => r.columns.flatMap((c) => c.blocks))
    const image = blocks.find((b) => b.type === 'image')
    expect(image?.src).toBe('https://img.example/full1.jpg')
    expect(image?.alt).toBe('Mi alt')
  })

  it('cerrar o cancelar el preview no muta el diseño', async () => {
    const wrapper = mount(EmailBuilder, { props: { imageSearch: vi.fn().mockResolvedValue(results) } })
    await searchIn(wrapper)
    await wrapper.find('.vmd-image-result').trigger('click')

    await wrapper.find('[data-action="image-preview-cancel"]').trigger('click')
    expect(wrapper.find('.vmd-image-preview-dialog').exists()).toBe(false)
    expect(wrapper.emitted('update:design')).toBeUndefined()

    await wrapper.find('.vmd-image-result').trigger('click')
    await wrapper.find('[data-action="image-preview-close"]').trigger('click')
    expect(wrapper.find('.vmd-image-preview-dialog').exists()).toBe(false)
    expect(wrapper.emitted('update:design')).toBeUndefined()
  })

  it('descarta respuestas fuera de orden', async () => {
    function deferred<T>() {
      let resolve!: (v: T) => void
      const promise = new Promise<T>((r) => (resolve = r))
      return { promise, resolve }
    }
    const first = deferred<typeof results>()
    const second = deferred<typeof results>()
    const imageSearch = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    const wrapper = mount(EmailBuilder, { props: { imageSearch } })

    await wrapper.find('[data-tab="images"]').trigger('click')
    const input = wrapper.find('.vmd-image-search input')
    await input.setValue('a')
    await new Promise((r) => setTimeout(r, 450)) // dispara la búsqueda 'a' (queda pendiente)
    await input.setValue('b')
    await new Promise((r) => setTimeout(r, 450)) // dispara la búsqueda 'b'
    expect(imageSearch).toHaveBeenCalledTimes(2)

    second.resolve(results) // la nueva resuelve primero, con 2 resultados
    await flushPromises()
    first.resolve([results[0]]) // la vieja llega tarde, con 1 resultado: se descarta
    await flushPromises()

    expect(wrapper.findAll('.vmd-image-result')).toHaveLength(2)
  })
})
