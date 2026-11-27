import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, provide } from 'vue'
import PropertiesPanel from '../src/components/PropertiesPanel.vue'
import { BUILDER_OPTIONS_KEY } from '../src/options'
import { createCustomBlock } from '../src/schema'
import { useDocumentStore } from '../src/store/document'
import { BUILDER_PINIA_KEY } from '../src/store/keys'

function mountInspector() {
  const pinia = createPinia()
  const Host = defineComponent({
    setup() {
      provide(BUILDER_PINIA_KEY, pinia)
      return () => h(PropertiesPanel)
    },
  })
  return { wrapper: mount(Host), store: useDocumentStore(pinia) }
}

describe('PropertiesPanel', () => {
  it('con bloque button seleccionado muestra sus campos y edita el label', async () => {
    const { wrapper, store } = mountInspector()
    const row = store.addRow([100])
    const block = store.addBlockToColumn(row.columns[0].id, 'button')
    store.select({ kind: 'block', id: block.id })
    await wrapper.vm.$nextTick()

    const input = wrapper.find('input[data-field="label"]')
    expect(input.exists()).toBe(true)
    await input.setValue('Nuevo texto')
    const found = store.findBlock(block.id)!.block
    expect(found.type === 'button' && found.label).toBe('Nuevo texto')
  })

  it('con fila seleccionada muestra estilo de fila', async () => {
    const { wrapper, store } = mountInspector()
    const row = store.addRow([100])
    store.select({ kind: 'row', id: row.id })
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Row')
  })

  it('reports a rejected image upload and lets the user retry', async () => {
    const pinia = createPinia()
    const store = useDocumentStore(pinia)
    const row = store.addRow([100])
    const block = store.addBlockToColumn(row.columns[0].id, 'image')
    if (block.type !== 'image') throw new Error('Expected an image block')
    const originalSrc = block.src
    store.select({ kind: 'block', id: block.id })
    const newSrc = 'https://cdn.example.com/retry.png'
    const uploadImage = vi.fn().mockRejectedValueOnce(new Error('Network failed')).mockResolvedValueOnce(newSrc)
    const wrapper = mount(PropertiesPanel, {
      global: {
        config: { errorHandler: vi.fn() },
        provide: {
          [BUILDER_PINIA_KEY as symbol]: pinia,
          [BUILDER_OPTIONS_KEY as symbol]: { mergeTags: [], uploadImage },
        },
      },
    })
    const input = wrapper.get('input[type="file"]')
    const file = new File(['image'], 'retry.png', { type: 'image/png' })
    Object.defineProperty(input.element, 'files', { value: [file], configurable: true })

    await input.trigger('change')
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('Could not upload the image')
    expect(store.findBlock(block.id)?.block).toMatchObject({ src: originalSrc })

    await input.trigger('change')
    await flushPromises()
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(store.findBlock(block.id)?.block).toMatchObject({ src: newSrc })
    wrapper.unmount()
  })

  it('shows padding controls for spacer and custom alert-style blocks', async () => {
    const { wrapper, store } = mountInspector()
    const row = store.addRow([100])
    const spacer = store.addBlockToColumn(row.columns[0].id, 'spacer')
    store.select({ kind: 'block', id: spacer.id })
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Padding')

    const custom = createCustomBlock('callout', { title: 'Title' })
    row.columns[0].blocks.push(custom)
    store.select({ kind: 'block', id: custom.id })
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Padding')
  })
})
