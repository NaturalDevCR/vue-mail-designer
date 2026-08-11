import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, provide } from 'vue'
import BuilderHeader from '../src/components/BuilderHeader.vue'
import { es } from '../src/i18n/es'
import { provideI18n } from '../src/i18n/useI18n'
import { BUILDER_PINIA_KEY } from '../src/store/keys'
import { useUiStore } from '../src/store/ui'

function mountHeader() {
  const pinia = createPinia()
  const Host = defineComponent({
    setup() {
      provide(BUILDER_PINIA_KEY, pinia)
      provideI18n(es)
      return () => h(BuilderHeader)
    },
  })
  return { wrapper: mount(Host), ui: useUiStore(pinia) }
}

describe('BuilderHeader', () => {
  it('uses a compact toolbar with separated brand, navigation, and actions', () => {
    const { wrapper } = mountHeader()

    expect(wrapper.find('.vmd-header-leading').exists()).toBe(true)
    expect(wrapper.find('.vmd-header-brand-mark').text()).toBe('V')
    expect(wrapper.find('.vmd-header-nav').exists()).toBe(true)
    expect(wrapper.find('.vmd-header-tab').text()).toContain('Plantillas')
    expect(wrapper.find('.vmd-header-actions').exists()).toBe(true)
    expect(wrapper.find('.vmd-header-status').exists()).toBe(true)
    expect(wrapper.find('.vmd-header-status-label').text()).toBe('Guardado')
  })

  it('renderiza marca, plantillas, estado y exportar', () => {
    const { wrapper } = mountHeader()
    expect(wrapper.find('.vmd-header').exists()).toBe(true)
    expect(wrapper.text()).toContain('Plantillas')
    expect(wrapper.text()).toContain('Guardado')
    expect(wrapper.find('[data-action="export"]').text()).toContain('EXPORTAR')
  })

  it('el menú de exportar abre y cierra', async () => {
    const { wrapper } = mountHeader()
    expect(wrapper.find('.vmd-export-menu').exists()).toBe(false)
    await wrapper.find('[data-action="export"]').trigger('click')
    expect(wrapper.find('.vmd-export-menu').exists()).toBe(true)
    expect(wrapper.find('[data-action="export-html"]').exists()).toBe(true)
    expect(wrapper.find('[data-action="import-json"]').exists()).toBe(true)
  })

  it('plantillas abre la galería y el store ui tiene los campos nuevos', async () => {
    const { wrapper, ui } = mountHeader()
    expect(ui.canvasDevice).toBe('desktop')
    expect(ui.sidebarTab).toBe('content')
    await wrapper.find('[data-action="templates"]').trigger('click')
    expect(ui.galleryOpen).toBe(true)
  })
})
