import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import EmailBuilder from '../src/components/EmailBuilder.vue'

describe('SidePanel', () => {
  it('rail has five tabs; Content is active by default and shows the 13 blocks', () => {
    const wrapper = mount(EmailBuilder)
    expect(wrapper.findAll('.vmd-rail [data-tab]')).toHaveLength(5)
    expect(wrapper.findAll('.vmd-content-item')).toHaveLength(13)
  })

  it('Export tab exposes all native export and import actions', async () => {
    const wrapper = mount(EmailBuilder)
    await wrapper.find('[data-tab="export"]').trigger('click')

    expect(wrapper.find('.vmd-export-panel').exists()).toBe(true)
    expect(wrapper.findAll('.vmd-export-action')).toHaveLength(6)
    expect(wrapper.find('[data-action="export-html"]').exists()).toBe(true)
    expect(wrapper.find('[data-action="export-json"]').exists()).toBe(true)
    expect(wrapper.find('[data-action="import-json"]').exists()).toBe(true)
    expect(wrapper.find('[data-action="import-unlayer"]').exists()).toBe(true)
    expect(wrapper.find('[data-action="export-image"]').exists()).toBe(true)
    expect(wrapper.find('[data-action="versions"]').exists()).toBe(true)
  })

  it('tab Blocks muestra 6 miniaturas de layout', async () => {
    const wrapper = mount(EmailBuilder)
    await wrapper.find('[data-tab="blocks"]').trigger('click')
    expect(wrapper.findAll('.vmd-layout-thumb')).toHaveLength(6)
  })

  it('tab Body edita settings incluidos los nuevos', async () => {
    const wrapper = mount(EmailBuilder)
    await wrapper.find('[data-tab="body"]').trigger('click')
    expect(wrapper.text()).toContain('Preheader text')
    expect(wrapper.text()).toContain('Underline')
  })

  it('seleccionar un elemento muestra propiedades con acciones y cerrar vuelve al tab', async () => {
    const wrapper = mount(EmailBuilder)
    await wrapper.find('.vmd-canvas-empty button').trigger('click')
    await wrapper.find('.vmd-row').trigger('click')
    expect(wrapper.find('.vmd-props-header').exists()).toBe(true)
    expect(wrapper.text()).toContain('Row')
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
    expect(wrapper.text()).toContain('Preheader text')
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

  it('puts Gallery first and selects it by default when a media library is configured', async () => {
    const mediaLibrary = {
      list: async () => ({ items: [] }),
      upload: async () => { throw new Error('unused') },
      delete: async () => { throw new Error('unused') },
      rename: async () => { throw new Error('unused') },
    }
    const wrapper = mount(EmailBuilder, { props: { mediaLibrary } })

    await wrapper.find('[data-tab="images"]').trigger('click')
    await flushPromises()

    expect(wrapper.findAll('.vmd-images-subtab').map((tab) => tab.attributes('data-subtab'))).toEqual(['gallery', 'search'])
    expect(wrapper.find('[data-subtab="gallery"]').classes()).toContain('vmd-active')
    expect(wrapper.find('[data-subtab="search"]').classes()).not.toContain('vmd-active')
  })

  it('localiza las etiquetas de subtabs de imágenes desde locale', async () => {
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
    const wrapper = mount(EmailBuilder, { props: { mediaLibrary, locale: 'es' } })

    await wrapper.find('[data-tab="images"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-subtab="search"]').text()).toBe('Buscar')
    expect(wrapper.find('[data-subtab="gallery"]').text()).toBe('Galería')
  })
})
