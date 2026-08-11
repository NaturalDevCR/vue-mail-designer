import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import EmailBuilder from '../src/components/EmailBuilder.vue'
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
})
