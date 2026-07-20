import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import EmailBuilder from '../src/components/EmailBuilder.vue'

describe('paleta y canvas', () => {
  it('canvas vacío muestra hint; agregar fila renderiza RowView con columnas', async () => {
    const wrapper = mount(EmailBuilder)
    expect(wrapper.find('.vmd-canvas-empty').exists()).toBe(true)
    // botón de "agregar fila" del empty state agrega una fila 100%
    await wrapper.find('.vmd-canvas-empty button').trigger('click')
    expect(wrapper.find('.vmd-row').exists()).toBe(true)
    expect(wrapper.findAll('.vmd-column')).toHaveLength(1)
  })

  it('click en fila la selecciona visualmente', async () => {
    const wrapper = mount(EmailBuilder)
    await wrapper.find('.vmd-canvas-empty button').trigger('click')
    await wrapper.find('.vmd-row').trigger('click')
    expect(wrapper.find('.vmd-row.vmd-selected').exists()).toBe(true)
  })

  it('el toggle de device cambia el ancho del canvas', async () => {
    const wrapper = mount(EmailBuilder)
    const page = wrapper.find('.vmd-canvas-page')
    expect(page.attributes('style')).toContain('width: 600px')
    await wrapper.find('[data-device="mobile"]').trigger('click')
    expect(wrapper.find('.vmd-canvas-page').attributes('style')).toContain('width: 375px')
  })
})
