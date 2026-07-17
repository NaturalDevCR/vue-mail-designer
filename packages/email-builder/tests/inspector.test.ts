import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, provide } from 'vue'
import InspectorPanel from '../src/components/InspectorPanel.vue'
import { useDocumentStore } from '../src/store/document'
import { BUILDER_PINIA_KEY } from '../src/store/keys'

function mountInspector() {
  const pinia = createPinia()
  const Host = defineComponent({
    setup() {
      provide(BUILDER_PINIA_KEY, pinia)
      return () => h(InspectorPanel)
    },
  })
  return { wrapper: mount(Host), store: useDocumentStore(pinia) }
}

describe('InspectorPanel', () => {
  it('sin selección muestra settings del documento', () => {
    const { wrapper } = mountInspector()
    expect(wrapper.text()).toContain('Documento')
    expect(wrapper.text()).toContain('Preheader')
  })

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
    expect(wrapper.text()).toContain('Fila')
  })
})
