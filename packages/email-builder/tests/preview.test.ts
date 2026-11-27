import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import EmailBuilder from '../src/components/EmailBuilder.vue'
import { createBlock, createDocument, createRow } from '../src/schema'
import { findInBody } from './modal-test-utils'

describe('toolbar y preview', () => {
  it('deshacer está deshabilitado sin historial y se habilita al mutar', async () => {
    const wrapper = mount(EmailBuilder)
    const undoBtn = wrapper.find('[data-action="undo"]')
    expect(undoBtn.attributes('disabled')).toBeDefined()
    await wrapper.find('.vmd-canvas-empty button').trigger('click')
    expect(wrapper.find('[data-action="undo"]').attributes('disabled')).toBeUndefined()
  })

  it('abrir preview monta el iframe con srcdoc', async () => {
    const wrapper = mount(EmailBuilder)
    await wrapper.find('[data-action="preview"]').trigger('click')
    const iframe = findInBody('iframe.vmd-preview-frame')
    expect(iframe.exists()).toBe(true)
    expect(iframe.attributes('srcdoc')).toContain('<!doctype html>')
    expect(iframe.attributes('sandbox')).toBe('')
    expect(iframe.attributes('srcdoc')).toContain("default-src 'none'")
  })

  it('presets y ancho custom cambian el iframe', async () => {
    const wrapper = mount(EmailBuilder)
    await wrapper.find('[data-action="preview"]').trigger('click')
    await findInBody('[data-preset="mobile"]').trigger('click')
    expect(findInBody('iframe.vmd-preview-frame').attributes('style')).toContain('375px')
    await findInBody('[data-preset="tablet"]').trigger('click')
    expect(findInBody('iframe.vmd-preview-frame').attributes('style')).toContain('768px')
    const custom = findInBody('input.vmd-preview-width')
    await custom.setValue('500')
    expect(findInBody('iframe.vmd-preview-frame').attributes('style')).toContain('500px')
  })

  it('displays imported HTML without active links and preserves the original export', async () => {
    const design = createDocument()
    const row = createRow([100])
    const block = createBlock('html')
    if (block.type !== 'html') throw new Error('Expected an HTML block')
    block.code = '<p><a href="https://example.com/guide">Guide</a><img alt="Example" src="data:image/png;base64,AA=="></p>'
    row.columns[0].blocks.push(block)
    design.rows.push(row)
    const wrapper = mount(EmailBuilder, { props: { design } })
    await wrapper.get('[data-action="preview"]').trigger('click')
    const srcdoc = findInBody('iframe.vmd-preview-frame').attributes('srcdoc') ?? ''
    const preview = new DOMParser().parseFromString(srcdoc, 'text/html')

    expect(preview.querySelector('a')?.textContent).toBe('Guide')
    expect(preview.querySelector('a')?.hasAttribute('href')).toBe(false)
    expect(preview.querySelector('img')?.getAttribute('src')).toBe('data:image/png;base64,AA==')
    expect(wrapper.vm.exportHtml()).toContain(block.code)
    expect(wrapper.vm.getDesign().rows[0].columns[0].blocks[0]).toEqual(block)
  })
})
