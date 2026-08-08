import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import NumberField from '../src/components/fields/NumberField.vue'

describe('NumberField', () => {
  it('con min y max, renderiza un range y un number, ambos con el valor actual', () => {
    const wrapper = mount(NumberField, { props: { label: 'Ancho %', modelValue: 50, min: 10, max: 100 } })
    const range = wrapper.find('input[type="range"]')
    const number = wrapper.find('input[type="number"]')
    expect(range.exists()).toBe(true)
    expect(number.exists()).toBe(true)
    expect((range.element as HTMLInputElement).value).toBe('50')
    expect((number.element as HTMLInputElement).value).toBe('50')
  })

  it('mover el range emite update:modelValue con el valor nuevo', async () => {
    const wrapper = mount(NumberField, { props: { label: 'Ancho %', modelValue: 50, min: 10, max: 100 } })
    const range = wrapper.find('input[type="range"]')
    await range.setValue('75')
    expect(wrapper.emitted('update:modelValue')).toEqual([[75]])
  })

  it('escribir en el number emite update:modelValue con el valor nuevo', async () => {
    const wrapper = mount(NumberField, { props: { label: 'Ancho %', modelValue: 50, min: 10, max: 100 } })
    const number = wrapper.find('input[type="number"]')
    await number.setValue('30')
    expect(wrapper.emitted('update:modelValue')).toEqual([[30]])
  })

  it('sin min/max, no renderiza ningún range — solo el number de ancho completo', () => {
    const wrapper = mount(NumberField, { props: { label: 'Cantidad', modelValue: 3 } })
    expect(wrapper.find('input[type="range"]').exists()).toBe(false)
    const number = wrapper.find('input[type="number"]')
    expect(number.exists()).toBe(true)
    expect(number.classes()).not.toContain('vmd-field-range-number')
    expect((number.element as HTMLInputElement).value).toBe('3')
  })

  it('el label apunta (for) al id del number, y el range tiene el mismo texto en aria-label', () => {
    const wrapper = mount(NumberField, { props: { label: 'Ancho %', modelValue: 50, min: 10, max: 100 } })
    const label = wrapper.find('label')
    const number = wrapper.find('input[type="number"]')
    const range = wrapper.find('input[type="range"]')
    expect(label.attributes('for')).toBe(number.attributes('id'))
    expect(range.attributes('aria-label')).toBe('Ancho %')
  })

  it('step se propaga a ambos inputs', () => {
    const wrapper = mount(NumberField, { props: { label: 'Interlineado', modelValue: 1.4, min: 1, max: 3, step: 0.1 } })
    expect(wrapper.find('input[type="range"]').attributes('step')).toBe('0.1')
    expect(wrapper.find('input[type="number"]').attributes('step')).toBe('0.1')
  })
})
