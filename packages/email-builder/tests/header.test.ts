import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, provide } from 'vue'
import BuilderHeader from '../src/components/BuilderHeader.vue'
import EmailBuilder from '../src/components/EmailBuilder.vue'
import { es } from '../src/i18n/es'
import { provideI18n } from '../src/i18n/useI18n'
import { BUILDER_PINIA_KEY } from '../src/store/keys'
import { useUiStore } from '../src/store/ui'

enableAutoUnmount(afterEach)

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
    expect(wrapper.find('.vmd-header-status').exists()).toBe(false)
  })

  it('renders brand and templates without duplicating Export navigation', () => {
    const { wrapper } = mountHeader()
    expect(wrapper.find('.vmd-header').exists()).toBe(true)
    expect(wrapper.text()).toContain('Plantillas')
    expect(wrapper.find('[data-action="export"]').exists()).toBe(false)
  })

  it('shows a save as successful only when the storage adapter succeeds', async () => {
    let fail = false
    const wrapper = mount(EmailBuilder, {
      props: {
        locale: 'es',
        autosave: {
          enabled: true,
          mode: 'change',
          storage: { type: 'custom', save: () => { if (fail) throw new Error('Storage unavailable') } },
        },
      },
    })
    const status = () => wrapper.get('[role="status"]').text()
    await flushPromises()
    expect(status()).toBe('Guardado automático activo')

    await wrapper.get('.vmd-canvas-empty button').trigger('click')
    await flushPromises()
    expect(status()).toBe('Guardado')

    fail = true
    await wrapper.get('.vmd-row-add--bottom').trigger('click')
    await flushPromises()
    expect(status()).toBe('Error al guardar')
  })

  it('keeps export actions in the side rail rather than the header', async () => {
    const { wrapper } = mountHeader()
    expect(wrapper.find('.vmd-export-menu').exists()).toBe(false)
    expect(wrapper.find('[data-action="export-html"]').exists()).toBe(false)
    expect(wrapper.find('[data-action="import-json"]').exists()).toBe(false)
  })

  it('plantillas abre la galería y el store ui tiene los campos nuevos', async () => {
    const { wrapper, ui } = mountHeader()
    expect(ui.canvasDevice).toBe('desktop')
    expect(ui.sidebarTab).toBe('content')
    await wrapper.find('[data-action="templates"]').trigger('click')
    expect(ui.galleryOpen).toBe(true)
  })
})
