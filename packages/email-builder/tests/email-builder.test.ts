import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import EmailBuilder from '../src/components/EmailBuilder.vue'

describe('EmailBuilder shell', () => {
  it('monta con pinia propio y renderiza los paneles', () => {
    const wrapper = mount(EmailBuilder)
    expect(wrapper.find('.vmd-root').exists()).toBe(true)
    expect(wrapper.find('.vmd-header').exists()).toBe(true)
    expect(wrapper.find('.vmd-canvasbar').exists()).toBe(true)
    expect(wrapper.find('.vmd-canvas-area').exists()).toBe(true)
    expect(wrapper.find('.vmd-canvas').exists()).toBe(true)
    expect(wrapper.find('.vmd-sidepanel').exists()).toBe(true)
  })

  it('no requiere pinia global (dos instancias aisladas)', () => {
    const a = mount(EmailBuilder)
    const b = mount(EmailBuilder)
    expect(a.find('.vmd-root').exists()).toBe(true)
    expect(b.find('.vmd-root').exists()).toBe(true)
  })
})
