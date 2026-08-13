import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import {
  EmailBuilder,
  type AiLanguage,
  type AiOptions,
  type AiTemplateOptions,
  type AutosaveErrorPayload,
  type AutosaveMode,
  type AutosaveOptions,
  type AutosaveRestoredPayload,
  type AutosaveSavedPayload,
  type AutosaveStatus,
  type AutosaveStatusPayload,
  type AutosaveStorage,
} from '../src'
import { createBlock, createDocument, createRow } from '../src/schema'
import type { TimerBlock } from '../src/schema'
import { findInBody } from './modal-test-utils'

const packageRootAiLanguage: AiLanguage = { code: 'es', label: 'Spanish' }
const packageRootAiOptions: AiOptions = { enabled: true, languages: [packageRootAiLanguage] }
const packageRootAiTemplateOptions: AiTemplateOptions = {
  enabled: true,
  generate: async () => [{ title: 'Generated', design: createDocument() }],
}
const packageRootAutosaveStorage: AutosaveStorage = { type: 'custom', save: async () => {} }
const packageRootAutosaveMode: AutosaveMode = 'change'
const packageRootAutosaveOptions: AutosaveOptions = {
  enabled: true,
  storage: packageRootAutosaveStorage,
  mode: packageRootAutosaveMode,
}
const packageRootAutosaveStatusPayload: AutosaveStatusPayload = { status: 'idle' }
const packageRootAutosaveSavedPayload: AutosaveSavedPayload = {
  design: designWithMarker('saved'),
  savedAt: 1,
}
const packageRootAutosaveRestoredPayload: AutosaveRestoredPayload = {
  design: designWithMarker('restored'),
  restoredAt: 2,
}
const packageRootAutosaveErrorPayload: AutosaveErrorPayload = {
  operation: 'save',
  error: new Error('save failed'),
}

function designWithMarker(marker: string) {
  const design = createDocument()
  return {
    ...design,
    settings: {
      ...design.settings,
      preheader: marker,
    },
  }
}

describe('API pública de EmailBuilder', () => {
  it('carga la prop design al montar', () => {
    const design = createDocument()
    design.rows.push(createRow([100]))
    const wrapper = mount(EmailBuilder, { props: { design } })
    expect(wrapper.find('.vmd-row').exists()).toBe(true)
  })

  it('montar con design no deja historial de undo espurio', () => {
    const design = createDocument()
    design.rows.push(createRow([100]))
    const wrapper = mount(EmailBuilder, { props: { design } })
    const undoBtn = wrapper.find('[data-action="undo"]')
    expect(undoBtn.attributes('disabled')).toBeDefined()
  })

  it('emite update:design y change al mutar', async () => {
    const wrapper = mount(EmailBuilder)
    await wrapper.find('.vmd-canvas-empty button').trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('update:design')).toBeTruthy()
    expect(wrapper.emitted('change')).toBeTruthy()
  })

  it('expone exportHtml/exportJson/loadDesign/getDesign', async () => {
    const wrapper = mount(EmailBuilder)
    const vm = wrapper.vm as unknown as {
      exportHtml: () => string
      exportJson: () => string
      getDesign: () => unknown
      getAutosaveStatus: () => AutosaveStatus
      loadDesign: (d: unknown) => void
    }
    expect(typeof vm.exportHtml).toBe('function')
    expect(vm.exportHtml()).toContain('<!doctype html>')
    expect(vm.exportJson()).toContain('"version"')
    expect(typeof vm.getAutosaveStatus).toBe('function')
    const d = createDocument()
    d.rows.push(createRow([50, 50]))
    vm.loadDesign(d)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.vmd-row').exists()).toBe(true)
  })

  it('uses the timer image builder when exporting email HTML', () => {
    const design = createDocument()
    const row = createRow([100])
    const timer = createBlock('timer') as TimerBlock
    timer.imageUrl = ''
    row.columns[0].blocks.push(timer)
    design.rows.push(row)

    const wrapper = mount(EmailBuilder, {
      props: {
        design,
        timerImageUrlBuilder: () => 'https://timers.example/live.gif',
      },
    })
    const vm = wrapper.vm as unknown as { exportHtml: () => string }

    expect(vm.exportHtml()).toContain('src="https://timers.example/live.gif"')
  })

  it('acepta autosave y expone el estado inicial del autosave', async () => {
    const save = vi.fn()
    const wrapper = mount(EmailBuilder, {
      props: {
        autosave: {
          enabled: true,
          storage: { type: 'custom', save },
          mode: 'change',
        },
      },
    })

    await flushPromises()

    const vm = wrapper.vm as unknown as { getAutosaveStatus: () => AutosaveStatus }
    expect(vm.getAutosaveStatus()).toBe('idle')
  })

  it('aplica el theme de la prop', () => {
    const wrapper = mount(EmailBuilder, { props: { theme: 'dark' } })
    expect(wrapper.find('.vmd-root.vmd-dark').exists()).toBe(true)
  })

  it('re-exporta AiOptions y AiLanguage desde el package root', () => {
    expect(packageRootAiOptions).toEqual({
      enabled: true,
      languages: [{ code: 'es', label: 'Spanish' }],
    })
  })

  it('re-exporta y emite errores del generador de plantillas', async () => {
    expect(packageRootAiTemplateOptions.enabled).toBe(true)
    const generate = vi.fn().mockRejectedValue(new Error('backend unavailable'))
    const wrapper = mount(EmailBuilder, { props: { aiTemplates: { enabled: true, generate } } })

    await wrapper.find('[data-action="ai-template-toggle"]').trigger('click')
    await findInBody('[data-action="ai-template-mode-create"]').trigger('click')
    await findInBody('[data-field="ai-template-prompt"]').setValue('Create a design')
    await findInBody('[data-action="ai-template-run"]').trigger('click')
    await flushPromises()

    expect(wrapper.emitted('ai-templates-error')?.[0]?.[0]).toEqual({ operation: 'generate', error: expect.any(Error) })
    expect(generate).toHaveBeenCalledOnce()
  })

  it('re-exporta la superficie pública de autosave desde el package root', () => {
    expect(packageRootAutosaveOptions.mode).toBe('change')
    expect(packageRootAutosaveStatusPayload.status).toBe('idle')
    expect(packageRootAutosaveSavedPayload.design.settings.preheader).toBe('saved')
    expect(packageRootAutosaveRestoredPayload.design.settings.preheader).toBe('restored')
    expect(packageRootAutosaveErrorPayload.operation).toBe('save')
  })
})
