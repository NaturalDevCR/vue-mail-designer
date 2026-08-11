import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import EmailBuilder from '../src/components/EmailBuilder.vue'

describe('SidePanel', () => {
  it('riel con 4 tabs; Content activo por defecto muestra los 13 bloques', () => {
    const wrapper = mount(EmailBuilder)
    expect(wrapper.findAll('.vmd-rail [data-tab]')).toHaveLength(4)
    expect(wrapper.findAll('.vmd-content-item')).toHaveLength(13)
  })

  it('tab Blocks muestra 6 miniaturas de layout', async () => {
    const wrapper = mount(EmailBuilder)
    await wrapper.find('[data-tab="blocks"]').trigger('click')
    expect(wrapper.findAll('.vmd-layout-thumb')).toHaveLength(6)
  })

  it('tab Body edita settings incluidos los nuevos', async () => {
    const wrapper = mount(EmailBuilder)
    await wrapper.find('[data-tab="body"]').trigger('click')
    expect(wrapper.text()).toContain('Texto del preheader')
    expect(wrapper.text()).toContain('Subrayado')
  })

  it('seleccionar un elemento muestra propiedades con acciones y cerrar vuelve al tab', async () => {
    const wrapper = mount(EmailBuilder)
    await wrapper.find('.vmd-canvas-empty button').trigger('click')
    await wrapper.find('.vmd-row').trigger('click')
    expect(wrapper.find('.vmd-props-header').exists()).toBe(true)
    expect(wrapper.text()).toContain('Fila')
    await wrapper.find('[data-action="props-close"]').trigger('click')
    expect(wrapper.find('.vmd-props-header').exists()).toBe(false)
    expect(wrapper.findAll('.vmd-content-item')).toHaveLength(13)
  })

  it('eliminar desde el header de propiedades borra la fila', async () => {
    const wrapper = mount(EmailBuilder)
    await wrapper.find('.vmd-canvas-empty button').trigger('click')
    await wrapper.find('.vmd-row').trigger('click')
    await wrapper.find('[data-action="props-delete"]').trigger('click')
    expect(wrapper.find('.vmd-row').exists()).toBe(false)
  })

  it('con selección activa, click en un tab toma precedencia', async () => {
    const wrapper = mount(EmailBuilder)
    await wrapper.find('.vmd-canvas-empty button').trigger('click')
    await wrapper.find('.vmd-row').trigger('click')
    expect(wrapper.find('.vmd-props-header').exists()).toBe(true)
    await wrapper.find('[data-tab="body"]').trigger('click')
    expect(wrapper.find('.vmd-props-header').exists()).toBe(false)
    expect(wrapper.text()).toContain('Texto del preheader')
  })

  it('re-seleccionar un elemento vuelve a propiedades', async () => {
    const wrapper = mount(EmailBuilder)
    await wrapper.find('.vmd-canvas-empty button').trigger('click')
    await wrapper.find('.vmd-row').trigger('click')
    await wrapper.find('[data-tab="content"]').trigger('click')
    expect(wrapper.find('.vmd-props-header').exists()).toBe(false)
    // clickear el MISMO elemento otra vez debe re-abrir propiedades
    await wrapper.find('.vmd-row').trigger('click')
    expect(wrapper.find('.vmd-props-header').exists()).toBe(true)
  })

  it('usa un solo tab Images con subtabs Search y Gallery opcional', async () => {
    const mediaLibrary = {
      list: async () => ({ items: [] }),
      upload: async () => {
        throw new Error('unused')
      },
      delete: async () => {
        throw new Error('unused')
      },
      rename: async () => {
        throw new Error('unused')
      },
    }
    const wrapper = mount(EmailBuilder, { props: { mediaLibrary } })

    await wrapper.find('[data-tab="images"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-subtab="search"]').exists()).toBe(true)
    expect(wrapper.find('[data-subtab="gallery"]').exists()).toBe(true)
    expect(wrapper.find('[data-tab="media"]').exists()).toBe(false)
  })
})
