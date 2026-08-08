import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, provide } from 'vue'
import BlockView from '../src/components/BlockView.vue'
import { createBlock } from '../src/schema'
import type { Block } from '../src/schema'
import { useDocumentStore } from '../src/store/document'
import { BUILDER_PINIA_KEY } from '../src/store/keys'

function mountBlock(block: Block) {
  const pinia = createPinia()
  const Host = defineComponent({
    setup() {
      provide(BUILDER_PINIA_KEY, pinia)
      return () => h(BlockView, { block })
    },
  })
  return { wrapper: mount(Host), store: useDocumentStore(pinia) }
}

describe('BlockView', () => {
  it('button muestra el label con sus colores', () => {
    const block = createBlock('button')
    if (block.type !== 'button') throw new Error()
    block.label = 'Comprar'
    const { wrapper } = mountBlock(block)
    expect(wrapper.text()).toContain('Comprar')
    expect(wrapper.find('.vmd-b-button').attributes('style')).toContain('background')
  })

  it('text respeta style.align en el lienzo, no solo en el HTML exportado', () => {
    const block = createBlock('text')
    if (block.type !== 'text') throw new Error()
    block.style.align = 'center'
    const { wrapper } = mountBlock(block)
    expect(wrapper.find('.vmd-b-text').element.parentElement?.getAttribute('style')).toContain('text-align: center')
  })

  it('divider no deja un hueco en blanco arriba del borde (gap de inline-block sin font-size:0)', () => {
    const block = createBlock('divider')
    if (block.type !== 'divider') throw new Error()
    const { wrapper } = mountBlock(block)
    const wrap = wrapper.find('.vmd-block > div:not(.vmd-block-actions)')
    expect(wrap.attributes('style')).toContain('font-size: 0')
  })

  it('image sin src muestra placeholder', () => {
    const { wrapper } = mountBlock(createBlock('image'))
    expect(wrapper.find('.vmd-b-image-placeholder').exists()).toBe(true)
  })

  it('image aplica border-radius cuando el bloque lo tiene seteado', () => {
    const block = createBlock('image')
    if (block.type !== 'image') throw new Error()
    block.src = 'https://cdn.example.com/a.png'
    block.borderRadius = 8
    const { wrapper } = mountBlock(block)
    expect(wrapper.find('.vmd-b-image-placeholder').exists()).toBe(false)
    expect(wrapper.find('img').attributes('style')).toContain('border-radius: 8px')
  })

  it('social renderiza un círculo por red', () => {
    const block = createBlock('social')
    const { wrapper } = mountBlock(block)
    expect(wrapper.findAll('.vmd-b-social-icon')).toHaveLength(3)
  })

  it('seleccionado muestra acciones y eliminar borra del store', async () => {
    const block = createBlock('spacer')
    const { wrapper, store } = mountBlock(block)
    const row = store.addRow([100])
    store.findRow(row.id)!.columns[0].blocks.push(block)
    store.select({ kind: 'block', id: block.id })
    await wrapper.vm.$nextTick()
    await wrapper.find('.vmd-block-actions .vmd-mini-btn--danger').trigger('click')
    expect(store.findBlock(block.id)).toBeUndefined()
  })
})
