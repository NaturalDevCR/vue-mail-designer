import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import EmailBuilder from '../src/components/EmailBuilder.vue'

describe('configuración del builder', () => {
  it('muestra el header por defecto y permite ocultarlo', () => {
    const visible = mount(EmailBuilder)
    expect(visible.find('.vmd-header').exists()).toBe(true)

    const hidden = mount(EmailBuilder, { props: { showHeader: false } })
    expect(hidden.find('.vmd-header').exists()).toBe(false)
  })

  it('aplica el tema inicial y reacciona a cambios de la prop', async () => {
    const wrapper = mount(EmailBuilder, { props: { theme: 'dark' } })
    expect(wrapper.find('.vmd-root').classes()).toContain('vmd-dark')

    await wrapper.setProps({ theme: 'light' })
    expect(wrapper.find('.vmd-root').classes()).not.toContain('vmd-dark')
  })

  it('mantiene la apariencia plana compatible', () => {
    const wrapper = mount(EmailBuilder, {
      props: { appearance: { accent: '#123456', panel: '#abcdef' } },
    })
    const root = wrapper.find('.vmd-root').element as HTMLElement
    expect(root.style.getPropertyValue('--vmd-accent')).toBe('#123456')
    expect(root.style.getPropertyValue('--vmd-panel')).toBe('#abcdef')
  })

  it('selecciona la rama light o dark activa', async () => {
    const wrapper = mount(EmailBuilder, {
      props: {
        appearance: {
          light: { accent: '#111111', panel: '#eeeeee' },
          dark: { accent: '#eeeeff', panel: '#111122' },
        },
      },
    })
    const root = () => wrapper.find('.vmd-root').element as HTMLElement

    expect(root().style.getPropertyValue('--vmd-accent')).toBe('#111111')
    expect(root().style.getPropertyValue('--vmd-panel')).toBe('#eeeeee')

    await wrapper.setProps({ theme: 'dark' })
    expect(root().style.getPropertyValue('--vmd-accent')).toBe('#eeeeff')
    expect(root().style.getPropertyValue('--vmd-panel')).toBe('#111122')
  })
})
