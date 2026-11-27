import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { createSSRApp, defineComponent, h, nextTick, provide } from 'vue'
import { renderToString } from 'vue/server-renderer'
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

  it('text hereda el color de link del body en el lienzo cuando el bloque no tiene el suyo', () => {
    const block = createBlock('text')
    if (block.type !== 'text') throw new Error()
    block.html = '<p>Hola <a href="https://x.com">link</a></p>'
    const { wrapper, store } = mountBlock(block)
    store.updateSettings({ linkColor: '#f0dc00' })
    return wrapper.vm.$nextTick().then(() => {
      const a = wrapper.find('.vmd-b-text a')
      expect((a.element as HTMLElement).style.color).toBe('rgb(240, 220, 0)')
    })
  })

  it('text usa su propio linkColor en el lienzo si lo tiene, ignorando el del body', () => {
    const block = createBlock('text')
    if (block.type !== 'text') throw new Error()
    block.html = '<p>Hola <a href="https://x.com">link</a></p>'
    block.linkColor = '#ff0000'
    const { wrapper, store } = mountBlock(block)
    store.updateSettings({ linkColor: '#f0dc00' })
    return wrapper.vm.$nextTick().then(() => {
      const a = wrapper.find('.vmd-b-text a')
      expect((a.element as HTMLElement).style.color).toBe('rgb(255, 0, 0)')
    })
  })

  it('text respeta style.align en el lienzo, no solo en el HTML exportado', () => {
    const block = createBlock('text')
    if (block.type !== 'text') throw new Error()
    block.style.align = 'center'
    const { wrapper } = mountBlock(block)
    expect(wrapper.find('.vmd-b-text').element.parentElement?.getAttribute('style')).toContain('text-align: center')
  })

  it('renders imported rich text with email formatting but without host identifiers and styles', async () => {
    const block = createBlock('text')
    if (block.type !== 'text') throw new Error('Expected a text block')
    block.html = '<p id="sample" class="sample" style="text-align:right;outline:1px solid gray"><strong>Sample</strong> <a href="{{unsubscribe_url}}">Unsubscribe</a> <span class="vmd-mt sample" data-mt="{{first_name}}">First name</span></p>'
    const { wrapper } = mountBlock(block)
    await wrapper.vm.$nextTick()
    const paragraph = wrapper.get('.vmd-b-text p')
    expect(paragraph.attributes('id')).toBeUndefined()
    expect(paragraph.attributes('class')).toBeUndefined()
    expect((paragraph.element as HTMLElement).style.textAlign).toBe('right')
    expect((paragraph.element as HTMLElement).style.outline).toBe('')
    expect(paragraph.get('strong').text()).toBe('Sample')
    expect(paragraph.get('a').attributes('href')).toBe('{{unsubscribe_url}}')
    expect(paragraph.get('.vmd-mt').attributes('data-mt')).toBe('{{first_name}}')
    expect(paragraph.get('.vmd-mt').classes()).toEqual(['vmd-mt'])
    wrapper.unmount()
  })

  it('keeps raw email markup in a sandboxed canvas frame while the block remains selectable', async () => {
    const block = createBlock('html')
    if (block.type !== 'html') throw new Error('Expected an HTML block')
    block.code = '<table><tr><td id="sample-cell">Example body</td></tr></table>'
    const { wrapper, store } = mountBlock(block)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('#sample-cell').exists()).toBe(false)
    const frame = wrapper.get('iframe')
    expect(frame.attributes('sandbox')).toBe('allow-same-origin')
    expect(frame.attributes('srcdoc')).toContain('Example body')
    expect(frame.attributes('srcdoc')).toContain("default-src 'none'")
    expect((frame.element as HTMLElement).style.pointerEvents).toBe('none')
    await wrapper.get('.vmd-block').trigger('click')
    expect(store.selection).toEqual({ kind: 'block', id: block.id })
    wrapper.unmount()
  })

  it('hydrates rich text after the client mounts', async () => {
    const block = createBlock('text')
    if (block.type !== 'text') throw new Error('Expected a text block')
    block.html = '<p><strong>Hydrated sample</strong></p>'
    const Host = defineComponent({
      setup() {
        provide(BUILDER_PINIA_KEY, createPinia())
        return () => h(BlockView, { block })
      },
    })
    const container = document.createElement('div')
    container.innerHTML = await renderToString(createSSRApp(Host))
    expect(container.querySelector('.vmd-b-text')?.textContent).toBe('')

    const app = createSSRApp(Host)
    app.mount(container)
    await nextTick()
    expect(container.querySelector('.vmd-b-text strong')?.textContent).toBe('Hydrated sample')
    app.unmount()
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
