import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import EmailBuilder from '../src/components/EmailBuilder.vue'
import { PALETTE_BLOCKS, ROW_LAYOUTS } from '../src/components/palette-items'

describe('paleta y canvas', () => {
  it('la paleta lista los 10 bloques y los layouts de fila', () => {
    expect(PALETTE_BLOCKS).toHaveLength(10)
    expect(ROW_LAYOUTS.map((l) => l.key)).toContain('50-50')
    const wrapper = mount(EmailBuilder)
    expect(wrapper.findAll('.vmd-palette-item').length).toBe(PALETTE_BLOCKS.length + ROW_LAYOUTS.length)
  })

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
})
