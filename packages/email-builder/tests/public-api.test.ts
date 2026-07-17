import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import EmailBuilder from '../src/components/EmailBuilder.vue'
import { createDocument, createRow } from '../src/schema'

describe('API pública de EmailBuilder', () => {
  it('carga la prop design al montar', () => {
    const design = createDocument()
    design.rows.push(createRow([100]))
    const wrapper = mount(EmailBuilder, { props: { design } })
    expect(wrapper.find('.vmd-row').exists()).toBe(true)
  })

  it('emite update:design y change al mutar', async () => {
    const wrapper = mount(EmailBuilder)
    await wrapper.find('.vmd-canvas-empty button').trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('update:design')).toBeTruthy()
    expect(wrapper.emitted('change')).toBeTruthy()
  })

  it('expone exportHtml/exportJson/loadDesign/getDesign', async () => {
    const wrapper = mount(EmailBuilder)
    const vm = wrapper.vm as unknown as {
      exportHtml: () => string
      exportJson: () => string
      getDesign: () => unknown
      loadDesign: (d: unknown) => void
    }
    expect(typeof vm.exportHtml).toBe('function')
    expect(vm.exportHtml()).toContain('<!doctype html>')
    expect(vm.exportJson()).toContain('"version"')
    const d = createDocument()
    d.rows.push(createRow([50, 50]))
    vm.loadDesign(d)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.vmd-row').exists()).toBe(true)
  })

  it('aplica el theme de la prop', () => {
    const wrapper = mount(EmailBuilder, { props: { theme: 'dark' } })
    expect(wrapper.find('.vmd-root.vmd-dark').exists()).toBe(true)
  })
})
