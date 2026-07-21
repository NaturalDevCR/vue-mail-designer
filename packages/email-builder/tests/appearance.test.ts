import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import EmailBuilder from '../src/components/EmailBuilder.vue'

describe('appearance', () => {
  it('aplica las variables CSS sobre la raíz', () => {
    const w = mount(EmailBuilder, { props: { appearance: { accent: '#ff0000', panel: '#eeeeee' } } })
    const style = w.find('.vmd-root').attributes('style') ?? ''
    expect(style).toContain('--vmd-accent: #ff0000')
    expect(style).toContain('--vmd-panel: #eeeeee')
  })

  it('sin appearance no emite variables', () => {
    const w = mount(EmailBuilder)
    const style = w.find('.vmd-root').attributes('style') ?? ''
    expect(style).not.toContain('--vmd-accent')
  })
})
