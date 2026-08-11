import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, provide } from 'vue'
import PropertiesPanel from '../src/components/PropertiesPanel.vue'
import { useDocumentStore } from '../src/store/document'
import { BUILDER_PINIA_KEY } from '../src/store/keys'
import { useUiStore } from '../src/store/ui'

function mountInspector() {
  const pinia = createPinia()
  const Host = defineComponent({
    setup() {
      provide(BUILDER_PINIA_KEY, pinia)
      return () => h(PropertiesPanel)
    },
  })
  return { wrapper: mount(Host), store: useDocumentStore(pinia), ui: useUiStore(pinia) }
}

describe('PropertiesPanel — Fase B', () => {
  it('bloque table muestra sus campos', async () => {
    const { wrapper, store } = mountInspector()
    const row = store.addRow([100])
    const block = store.addBlockToColumn(row.columns[0].id, 'table')
    store.select({ kind: 'block', id: block.id })
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Header row')
    expect(wrapper.findAll('textarea.vmd-table-cell-input').length).toBeGreaterThan(0)
  })

  it('bloque gallery muestra sus campos', async () => {
    const { wrapper, store } = mountInspector()
    const row = store.addRow([100])
    const block = store.addBlockToColumn(row.columns[0].id, 'gallery')
    store.select({ kind: 'block', id: block.id })
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Columns')
    expect(wrapper.text()).toContain('Spacing')
  })

  it('bloque timer muestra sus campos', async () => {
    const { wrapper, store } = mountInspector()
    const row = store.addRow([100])
    const block = store.addBlockToColumn(row.columns[0].id, 'timer')
    store.select({ kind: 'block', id: block.id })
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Deadline date and time')
    expect(wrapper.text()).toContain('Image URL')
    expect(wrapper.text()).toContain('Card background')
    expect(wrapper.text()).toContain('Number color')
    expect(wrapper.text()).toContain('Label color')
    expect(wrapper.text()).toContain('Days label')
    expect(wrapper.text()).toContain('Font')
  })

  it('opens the unified image sources while keeping the image block selected', async () => {
    const { wrapper, store, ui } = mountInspector()
    const row = store.addRow([100])
    const block = store.addBlockToColumn(row.columns[0].id, 'image')
    store.select({ kind: 'block', id: block.id })
    await wrapper.vm.$nextTick()

    await wrapper.find('[data-action="choose-image-source"]').trigger('click')

    expect(ui.panelMode).toBe('tab')
    expect(ui.sidebarTab).toBe('images')
    expect(store.selection).toEqual({ kind: 'block', id: block.id })
  })

  it('toggle "Hide on mobile" setea hideMobile en el bloque', async () => {
    const { wrapper, store } = mountInspector()
    const row = store.addRow([100])
    const block = store.addBlockToColumn(row.columns[0].id, 'heading')
    store.select({ kind: 'block', id: block.id })
    await wrapper.vm.$nextTick()

    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    expect(checkboxes.length).toBeGreaterThanOrEqual(2)
    const mobileCheckbox = wrapper.findAll('.vmd-checkbox-field').filter((w) => w.text().includes('Hide on mobile'))[0]
    expect(mobileCheckbox).toBeTruthy()
    await mobileCheckbox!.find('input[type="checkbox"]').setValue(true)

    const found = store.findBlock(block.id)!.block
    expect(found.hideMobile).toBe(true)
    expect(found.hideDesktop).toBeFalsy()
  })

  it('store.updateRow aplica el patch a la fila, no a style', () => {
    const pinia = createPinia()
    const store = useDocumentStore(pinia)
    const row = store.addRow([100])
    store.updateRow(row.id, { hideMobile: true })
    const found = store.findRow(row.id)!
    expect(found.hideMobile).toBe(true)
    expect((found.style as unknown as { hideMobile?: boolean }).hideMobile).toBeUndefined()
  })

  it('panel de fila muestra sección de visibilidad', async () => {
    const { wrapper, store } = mountInspector()
    const row = store.addRow([100])
    store.select({ kind: 'row', id: row.id })
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Hide on desktop')
    expect(wrapper.text()).toContain('Hide on mobile')
  })

  it('heading/text exponen selector de Fuente ligado a fontFamily', async () => {
    const { wrapper, store } = mountInspector()
    const row = store.addRow([100])
    const block = store.addBlockToColumn(row.columns[0].id, 'heading')
    store.select({ kind: 'block', id: block.id })
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Font')
  })
})
