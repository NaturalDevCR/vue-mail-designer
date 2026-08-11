import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import PaddingField from '../src/components/fields/PaddingField.vue'

const uniform = { top: 10, right: 10, bottom: 10, left: 10 }
const mixed = { top: 10, right: 20, bottom: 30, left: 40 }

describe('PaddingField', () => {
  it('con los 4 valores iguales, monta vinculado: un solo input, sin el grid de 4', () => {
    const wrapper = mount(PaddingField, { props: { label: 'Padding', modelValue: uniform } })
    expect(wrapper.findAll('input')).toHaveLength(1)
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('10')
  })

  it('con valores distintos, monta desvinculado: los 4 campos, sin el input único', () => {
    const wrapper = mount(PaddingField, { props: { label: 'Padding', modelValue: mixed } })
    const inputs = wrapper.findAll('input')
    expect(inputs).toHaveLength(4)
    expect(inputs.map((i) => (i.element as HTMLInputElement).value)).toEqual(['10', '20', '30', '40'])
  })

  it('vinculado, escribir en el campo único emite los 4 lados con ese valor', async () => {
    const wrapper = mount(PaddingField, { props: { label: 'Padding', modelValue: uniform } })
    await wrapper.find('input').setValue('25')
    expect(wrapper.emitted('update:modelValue')).toEqual([[{ top: 25, right: 25, bottom: 25, left: 25 }]])
  })

  it('click en la cadena vinculado (valores iguales) pasa a los 4 campos sin emitir', async () => {
    const wrapper = mount(PaddingField, { props: { label: 'Padding', modelValue: uniform } })
    await wrapper.find('button').trigger('click')
    expect(wrapper.findAll('input')).toHaveLength(4)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('click en la cadena desvinculado con valores ya iguales pasa al campo único sin emitir', async () => {
    const wrapper = mount(PaddingField, { props: { label: 'Padding', modelValue: uniform } })
    await wrapper.find('button').trigger('click') // vinculado → desvinculado
    await wrapper.find('button').trigger('click') // desvinculado → vinculado (ya eran iguales)
    expect(wrapper.findAll('input')).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('click en la cadena desvinculado con valores distintos iguala los 4 a "top" y colapsa', async () => {
    const wrapper = mount(PaddingField, { props: { label: 'Padding', modelValue: mixed } })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[{ top: 10, right: 10, bottom: 10, left: 10 }]])
    expect(wrapper.findAll('input')).toHaveLength(1)
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('10')
  })

  it('desvinculado, editar un lado individual sigue funcionando (regresión)', async () => {
    const wrapper = mount(PaddingField, { props: { label: 'Padding', modelValue: mixed } })
    const inputs = wrapper.findAll('input')
    await inputs[1].setValue('99') // right
    expect(wrapper.emitted('update:modelValue')).toEqual([[{ top: 10, right: 99, bottom: 30, left: 40 }]])
  })

  it('el botón muestra el ícono y title correctos según el modo', async () => {
    const wrapper = mount(PaddingField, { props: { label: 'Padding', modelValue: uniform } })
    expect(wrapper.find('button').attributes('title')).toBe('Link sides')
    await wrapper.find('button').trigger('click')
    expect(wrapper.find('button').attributes('title')).toBe('Independent sides')
  })
})
