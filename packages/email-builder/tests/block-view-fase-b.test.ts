import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, provide } from 'vue'
import BlockView from '../src/components/BlockView.vue'
import { createBlock } from '../src/schema'
import type { Block } from '../src/schema'
import { useDocumentStore } from '../src/store/document'
import { BUILDER_PINIA_KEY } from '../src/store/keys'
import { useUiStore } from '../src/store/ui'

function mountBlock(block: Block) {
  const pinia = createPinia()
  const Host = defineComponent({
    setup() {
      provide(BUILDER_PINIA_KEY, pinia)
      return () => h(BlockView, { block })
    },
  })
  return { wrapper: mount(Host), store: useDocumentStore(pinia), ui: useUiStore(pinia) }
}

describe('BlockView — Fase B', () => {
  it('table muestra el texto de sus celdas', () => {
    const block = createBlock('table')
    if (block.type !== 'table') throw new Error()
    block.rows = [['Encabezado 1', 'Encabezado 2'], ['a', 'b']]
    const { wrapper } = mountBlock(block)
    expect(wrapper.find('.vmd-b-table').exists()).toBe(true)
    expect(wrapper.text()).toContain('Encabezado 1')
    expect(wrapper.text()).toContain('a')
  })

  it('gallery sin src muestra placeholders, uno por imagen', () => {
    const block = createBlock('gallery')
    if (block.type !== 'gallery') throw new Error()
    block.images = [{ src: '', alt: '' }, { src: '', alt: '' }, { src: '', alt: '' }]
    const { wrapper } = mountBlock(block)
    expect(wrapper.findAll('.vmd-b-gallery-placeholder')).toHaveLength(3)
  })

  it('timer sin imageUrl muestra un countdown segmentado', () => {
    const block = createBlock('timer')
    if (block.type !== 'timer') throw new Error()
    block.imageUrl = ''
    block.endDate = new Date(Date.now() + 3 * 864e5).toISOString()
    const { wrapper } = mountBlock(block)
    expect(wrapper.find('.vmd-b-image-placeholder').exists()).toBe(false)
    expect(wrapper.find('.vmd-b-timer').exists()).toBe(true)
    expect(wrapper.findAll('.vmd-timer-unit')).toHaveLength(4)
    expect(wrapper.text()).toContain('days')
    expect(wrapper.text()).toContain('hours')
    expect(wrapper.text()).toContain('minutes')
    expect(wrapper.text()).toContain('seconds')
  })

  it('timer con imageUrl muestra un img', () => {
    const block = createBlock('timer')
    if (block.type !== 'timer') throw new Error()
    block.imageUrl = 'https://example.com/timer.png'
    const { wrapper } = mountBlock(block)
    expect(wrapper.find('img').exists()).toBe(true)
    expect(wrapper.find('img').attributes('src')).toBe('https://example.com/timer.png')
  })

  it('badge de oculto aparece en mobile cuando hideMobile está activo', () => {
    const block = createBlock('text')
    block.hideMobile = true
    const { wrapper, ui } = mountBlock(block)
    ui.canvasDevice = 'mobile'
    return wrapper.vm.$nextTick().then(() => {
      expect(wrapper.find('.vmd-hidden-badge').exists()).toBe(true)
    })
  })

  it('badge de oculto aparece en desktop cuando hideDesktop está activo', () => {
    const block = createBlock('text')
    block.hideDesktop = true
    const { wrapper, ui } = mountBlock(block)
    ui.canvasDevice = 'desktop'
    return wrapper.vm.$nextTick().then(() => {
      expect(wrapper.find('.vmd-hidden-badge').exists()).toBe(true)
    })
  })

  it('badge de oculto no aparece si el dispositivo no coincide', () => {
    const block = createBlock('text')
    block.hideMobile = true
    const { wrapper, ui } = mountBlock(block)
    ui.canvasDevice = 'desktop'
    return wrapper.vm.$nextTick().then(() => {
      expect(wrapper.find('.vmd-hidden-badge').exists()).toBe(false)
    })
  })
})
