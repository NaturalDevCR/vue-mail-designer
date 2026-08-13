import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { describe, expect, it, vi } from 'vitest'
import { en } from '../src/i18n/en'
import { I18N_KEY } from '../src/i18n/useI18n'
import AiTemplateMenu from '../src/components/AiTemplateMenu.vue'
import { BUILDER_OPTIONS_KEY, type AiTemplateOptions } from '../src/options'
import { createDocument } from '../src/schema'
import type { EmailDocument } from '../src/schema'
import { BUILDER_PINIA_KEY } from '../src/store/keys'
import { useDocumentStore } from '../src/store/document'
import { findInBody, hasInBody } from './modal-test-utils'

function mountMenu(aiTemplates?: AiTemplateOptions) {
  const pinia = createPinia()
  const wrapper = mount(AiTemplateMenu, {
    global: {
      provide: {
        [BUILDER_PINIA_KEY as symbol]: pinia,
        [BUILDER_OPTIONS_KEY as symbol]: { mergeTags: [], aiTemplates },
        [I18N_KEY as symbol]: { t: (key: string) => en[key] ?? key, locale: 'en' },
      },
    },
  })
  return { wrapper, store: useDocumentStore(pinia) }
}

function proposal(design: EmailDocument = createDocument()) {
  return { title: 'Generated design', description: 'A generated proposal.', design }
}

describe('AiTemplateMenu', () => {
  it('hides the action when template AI is not enabled', () => {
    const { wrapper } = mountMenu()
    expect(wrapper.find('[data-action="ai-template-toggle"]').exists()).toBe(false)
  })

  it('requires an explicit mode and defaults to one proposal', async () => {
    const generate = vi.fn().mockResolvedValue([])
    const { wrapper } = mountMenu({ enabled: true, generate })

    expect(wrapper.find('[data-action="ai-template-toggle"]').exists()).toBe(true)
    await wrapper.find('[data-action="ai-template-toggle"]').trigger('click')

    expect(findInBody('[data-action="ai-template-mode-create"]').exists()).toBe(true)
    expect(findInBody('[data-action="ai-template-mode-edit"]').exists()).toBe(true)
    expect(findInBody('[data-action="ai-template-run"]').attributes('disabled')).toBeDefined()

    await findInBody('[data-action="ai-template-mode-create"]').trigger('click')
    expect((findInBody('[data-field="ai-template-count"]').element as HTMLSelectElement).value).toBe('1')
    expect(findInBody('[data-action="ai-template-run"]').attributes('disabled')).toBeDefined()

    await findInBody('[data-field="ai-template-prompt"]').setValue('Create a welcome email')
    expect(findInBody('[data-action="ai-template-run"]').attributes('disabled')).toBeUndefined()
    expect(hasInBody('[data-action="ai-template-proposal-apply"]')).toBe(false)
    wrapper.unmount()
  })

  it('forwards a selected count and shows validated proposals', async () => {
    const generate = vi.fn().mockResolvedValue([{ title: 'One', design: { version: 1, settings: { contentWidth: 600, backgroundColor: '#fff', textColor: '#000', fontFamily: 'Arial', fontWeight: 'normal', preheader: '', htmlTitle: '', contentAlignment: 'center', linkColor: '#3b82f6', linkUnderline: true }, rows: [] } }])
    const { wrapper } = mountMenu({ enabled: true, generate })
    await wrapper.find('[data-action="ai-template-toggle"]').trigger('click')
    await findInBody('[data-action="ai-template-mode-create"]').trigger('click')
    await findInBody('[data-field="ai-template-prompt"]').setValue('Create a welcome email')
    await findInBody('[data-field="ai-template-count"]').setValue('3')
    await findInBody('[data-action="ai-template-run"]').trigger('click')
    await flushPromises()

    expect(generate).toHaveBeenCalledWith(expect.objectContaining({ mode: 'create', prompt: 'Create a welcome email', count: 3 }))
    expect(findInBody('[data-action="ai-template-proposal-apply"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('sends edit mode with the current design cloned and resolves context at submit time', async () => {
    let brand = 'Initial brand'
    const context = vi.fn(() => ({ brand }))
    const generate = vi.fn().mockResolvedValue([proposal()])
    const { wrapper, store } = mountMenu({ enabled: true, context, generate })
    store.doc.settings.htmlTitle = 'Current design'
    brand = 'Updated brand'

    await wrapper.find('[data-action="ai-template-toggle"]').trigger('click')
    await findInBody('[data-action="ai-template-mode-edit"]').trigger('click')
    await findInBody('[data-field="ai-template-prompt"]').setValue('Make it more elegant')
    await findInBody('[data-action="ai-template-run"]').trigger('click')
    await flushPromises()

    const request = generate.mock.calls[0]?.[0]
    expect(context).toHaveBeenCalledOnce()
    expect(request).toMatchObject({ mode: 'edit', context: { brand: 'Updated brand' } })
    expect(request.currentDesign).toEqual(store.doc)
    expect(request.currentDesign).not.toBe(store.doc)
    wrapper.unmount()
  })

  it('applies one proposal and leaves the document unchanged when discarded', async () => {
    const changed = createDocument()
    changed.settings.htmlTitle = 'Applied'
    const generate = vi.fn().mockResolvedValue([proposal(changed)])
    const { wrapper, store } = mountMenu({ enabled: true, generate })
    const original = JSON.stringify(store.doc)

    await wrapper.find('[data-action="ai-template-toggle"]').trigger('click')
    await findInBody('[data-action="ai-template-mode-create"]').trigger('click')
    await findInBody('[data-field="ai-template-prompt"]').setValue('Create a design')
    await findInBody('[data-action="ai-template-run"]').trigger('click')
    await flushPromises()
    await findInBody('[data-action="ai-template-discard"]').trigger('click')
    expect(JSON.stringify(store.doc)).toBe(original)

    await wrapper.find('[data-action="ai-template-toggle"]').trigger('click')
    await findInBody('[data-action="ai-template-mode-create"]').trigger('click')
    await findInBody('[data-field="ai-template-prompt"]').setValue('Create a design')
    await findInBody('[data-action="ai-template-run"]').trigger('click')
    await flushPromises()
    await findInBody('[data-action="ai-template-proposal-apply"]').trigger('click')
    expect(store.doc.settings.htmlTitle).toBe('Applied')
    wrapper.unmount()
  })

  it('ignores a provider result after the menu has been closed', async () => {
    let resolve!: (value: ReturnType<typeof proposal>[]) => void
    const generate = vi.fn().mockReturnValue(new Promise<ReturnType<typeof proposal>[]>((res) => { resolve = res }))
    const { wrapper } = mountMenu({ enabled: true, generate })

    await wrapper.find('[data-action="ai-template-toggle"]').trigger('click')
    await findInBody('[data-action="ai-template-mode-create"]').trigger('click')
    await findInBody('[data-field="ai-template-prompt"]').setValue('Create a design')
    await findInBody('[data-action="ai-template-run"]').trigger('click')
    await findInBody('.vmd-ai-template-header .vmd-btn--icon').trigger('click')
    resolve([proposal()])
    await flushPromises()

    expect(hasInBody('[data-action="ai-template-proposal-apply"]')).toBe(false)
    wrapper.unmount()
  })

  it('emits a generic error when the provider fails', async () => {
    const generate = vi.fn().mockRejectedValue(new Error('backend unavailable'))
    const { wrapper } = mountMenu({ enabled: true, generate })

    await wrapper.find('[data-action="ai-template-toggle"]').trigger('click')
    await findInBody('[data-action="ai-template-mode-create"]').trigger('click')
    await findInBody('[data-field="ai-template-prompt"]').setValue('Create a design')
    await findInBody('[data-action="ai-template-run"]').trigger('click')
    await flushPromises()

    expect(findInBody('[data-action="ai-template-run"]').exists()).toBe(true)
    expect(findInBody('[role="alert"]').text()).toBe('Could not generate email designs.')
    expect(wrapper.emitted('error')?.[0]?.[0]).toEqual({ operation: 'generate', error: expect.any(Error) })
    wrapper.unmount()
  })
})
