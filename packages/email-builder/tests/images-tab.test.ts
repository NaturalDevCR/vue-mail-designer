import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import EmailBuilder from '../src/components/EmailBuilder.vue'

const results = [
  { url: 'https://img.example/full1.jpg', thumbnailUrl: 'https://img.example/t1.jpg', title: 'Uno' },
  { url: 'https://img.example/full2.jpg', thumbnailUrl: 'https://img.example/t2.jpg', title: 'Dos' },
]

async function searchIn(wrapper: ReturnType<typeof mount>) {
  await wrapper.find('[data-tab="images"]').trigger('click')
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
  })

  it('click sin selección inserta un bloque imagen nuevo con el src', async () => {
    const wrapper = mount(EmailBuilder, { props: { imageSearch: vi.fn().mockResolvedValue(results) } })
    await searchIn(wrapper)
    await wrapper.find('.vmd-image-result').trigger('click')
    const emitted = wrapper.emitted('update:design')
    const design = emitted![emitted!.length - 1][0] as { rows: { columns: { blocks: { type: string; src?: string }[] }[] }[] }
    const blocks = design.rows.flatMap((r) => r.columns.flatMap((c) => c.blocks))
    expect(blocks.some((b) => b.type === 'image' && b.src === 'https://img.example/full1.jpg')).toBe(true)
  })

  it('muestra error si la búsqueda falla', async () => {
    const wrapper = mount(EmailBuilder, { props: { imageSearch: vi.fn().mockRejectedValue(new Error('boom')) } })
    await searchIn(wrapper)
    expect(wrapper.find('.vmd-image-error').exists()).toBe(true)
  })
})
