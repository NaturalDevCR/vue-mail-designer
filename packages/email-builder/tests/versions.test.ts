import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, reactive } from 'vue'
import EmailBuilder from '../src/components/EmailBuilder.vue'
import { createDocument, type EmailDocument } from '../src/schema'
import { useDocumentStore } from '../src/store/document'
import { findInBody, hasInBody } from './modal-test-utils'

describe('versiones', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('guarda, carga y borra versiones nombradas', () => {
    const store = useDocumentStore()
    store.addRow([100])
    store.saveVersion('con una fila')
    expect(store.versions).toHaveLength(1)
    const id = store.versions[0].id

    // mutar y volver a la versión guardada
    store.addRow([50, 50])
    expect(store.doc.rows).toHaveLength(2)
    store.loadVersion(id)
    expect(store.doc.rows).toHaveLength(1)

    store.deleteVersion(id)
    expect(store.versions).toHaveLength(0)
  })

  it('la versión es un snapshot independiente', () => {
    const store = useDocumentStore()
    store.addRow([100])
    store.saveVersion('v1')
    store.updateSettings({ backgroundColor: '#000000' })
    expect(store.versions[0].doc.settings.backgroundColor).not.toBe('#000000')
  })
})

describe('persistent version history', () => {
  const keys = ['version-test-campaign-a', 'version-test-campaign-b']
  const [firstKey, secondKey] = keys

  afterEach(() => {
    vi.restoreAllMocks()
    for (const key of keys) {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
    }
  })

  async function openVersions(wrapper: ReturnType<typeof mount<typeof EmailBuilder>>) {
    await wrapper.get('[data-tab="export"]').trigger('click')
    await wrapper.get('[data-action="versions"]').trigger('click')
    return findInBody('.vmd-versions-box')
  }

  it('persists snapshots across mounts, restores with undo, and persists deletion', async () => {
    const props = { versionHistory: { key: firstKey } }
    const first = mount(EmailBuilder, { props })
    await first.get('.vmd-canvas-empty button').trigger('click')
    const saveDialog = await openVersions(first)
    await saveDialog.get('input').setValue('Before launch')
    await saveDialog.get('[data-action="version-save"]').trigger('click')
    first.unmount()

    const reopened = mount(EmailBuilder, { props })
    const restoreDialog = await openVersions(reopened)
    expect(restoreDialog.get('.vmd-versions-name').text()).toBe('Before launch')
    await restoreDialog.get('button[title="Load"]').trigger('click')
    const editor = reopened.vm as unknown as { getDesign: () => EmailDocument }
    expect(editor.getDesign().rows).toHaveLength(1)
    await reopened.get('[data-action="undo"]').trigger('click')
    expect(editor.getDesign().rows).toHaveLength(0)

    const deleteDialog = await openVersions(reopened)
    await deleteDialog.get('button[title="Delete"]').trigger('click')
    reopened.unmount()

    const remounted = mount(EmailBuilder, { props })
    expect((await openVersions(remounted)).find('.vmd-versions-name').exists()).toBe(false)
  })

  it('changes histories when the host mutates the configured campaign key in place', async () => {
    const versionHistory = reactive({ key: firstKey })
    const parent = mount(defineComponent({ setup: () => () => h(EmailBuilder, { versionHistory }) }))
    const builder = parent.getComponent(EmailBuilder) as ReturnType<typeof mount<typeof EmailBuilder>>
    const firstDialog = await openVersions(builder)
    await firstDialog.get('input').setValue('Campaign A')
    await firstDialog.get('[data-action="version-save"]').trigger('click')
    await firstDialog.get('input').setValue('Unsubmitted A name')

    versionHistory.key = secondKey
    await nextTick()
    expect(hasInBody('.vmd-versions-box')).toBe(false)
    const secondDialog = await openVersions(builder)
    expect(secondDialog.find('.vmd-versions-name').exists()).toBe(false)
    await secondDialog.get('input').setValue('Campaign B')
    await secondDialog.get('[data-action="version-save"]').trigger('click')

    versionHistory.key = firstKey
    await nextTick()
    const reopened = await openVersions(builder)
    expect(reopened.findAll('.vmd-versions-name').map((item) => item.text())).toEqual(['Campaign A'])
  })

  it('restores version snapshots with defaults for missing fields in older designs', async () => {
    const design = createDocument()
    design.settings.preheader = 'From an older version'
    const { fontWeight, ...legacySettings } = design.settings
    localStorage.setItem(firstKey, JSON.stringify({
      version: 1,
      versions: [{ id: 'legacy', name: 'Legacy design', at: 10, doc: { ...design, settings: legacySettings } }],
    }))
    const wrapper = mount(EmailBuilder, { props: { versionHistory: { key: firstKey } } })
    const dialog = await openVersions(wrapper)
    await dialog.get('button[title="Load"]').trigger('click')
    const editor = wrapper.vm as unknown as { getDesign: () => EmailDocument }
    expect(editor.getDesign().settings).toMatchObject({ preheader: 'From an older version', fontWeight: 'normal' })
  })

  it('reports malformed history and keeps it untouched when the user tries to save', async () => {
    const raw = '{"version":1,"versions":[{"name":"invalid"}]}'
    localStorage.setItem(firstKey, raw)
    const wrapper = mount(EmailBuilder, { props: { versionHistory: { key: firstKey } } })
    const dialog = await openVersions(wrapper)
    expect(dialog.find('[role="alert"]').exists()).toBe(true)
    await dialog.get('input').setValue('Retry')
    await dialog.get('[data-action="version-save"]').trigger('click')

    expect(localStorage.getItem(firstKey)).toBe(raw)
    expect(dialog.find('.vmd-versions-name').exists()).toBe(false)
    expect(dialog.get('input').element.value).toBe('Retry')
  })

  it('keeps the saved list unchanged after a failed write or delete using custom storage', async () => {
    const wrapper = mount(EmailBuilder, { props: { versionHistory: { key: firstKey, storage: sessionStorage } } })
    const dialog = await openVersions(wrapper)
    const name = dialog.get('input')
    const save = dialog.get('[data-action="version-save"]')
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const rejectWrite = () => { throw new Error('Storage denied') }

    setItem.mockImplementationOnce(rejectWrite)
    await name.setValue('Keep this snapshot')
    await save.trigger('click')
    expect(dialog.find('[role="alert"]').exists()).toBe(true)
    expect(dialog.find('.vmd-versions-name').exists()).toBe(false)

    await save.trigger('click')
    expect(dialog.find('[role="alert"]').exists()).toBe(false)
    expect(dialog.get('.vmd-versions-name').text()).toBe('Keep this snapshot')
    const savedValue = sessionStorage.getItem(firstKey)
    expect(savedValue).toContain('Keep this snapshot')
    expect(localStorage.getItem(firstKey)).toBeNull()

    setItem.mockImplementationOnce(rejectWrite)
    await dialog.get('button[title="Delete"]').trigger('click')
    expect(dialog.find('[role="alert"]').exists()).toBe(true)
    expect(dialog.get('.vmd-versions-name').text()).toBe('Keep this snapshot')
    expect(sessionStorage.getItem(firstKey)).toBe(savedValue)
  })
})
