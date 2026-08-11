import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { en } from '../src/i18n/en'
import { es } from '../src/i18n/es'
import { I18N_KEY } from '../src/i18n/useI18n'
import { BUILDER_OPTIONS_KEY } from '../src/options'
import AiMenu from '../src/components/AiMenu.vue'
import * as chromeAi from '../src/ai/chromeAi'
import { findInBody, hasInBody } from './modal-test-utils'

const editors: Editor[] = []
const deferred = <T>() => {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function makeEditor(content = '<p>Hello world</p>', selectAll = true) {
  const editor = new Editor({ extensions: [StarterKit], content })
  if (selectAll) editor.commands.selectAll()
  else editor.commands.setTextSelection(1)
  editors.push(editor)
  return editor
}

function setAvailability({
  rewrite = false,
  write = false,
  summarize = false,
  translate = false,
}: {
  rewrite?: boolean
  write?: boolean
  summarize?: boolean
  translate?: boolean
}) {
  vi.spyOn(chromeAi, 'isRewriterAvailable').mockReturnValue(rewrite)
  vi.spyOn(chromeAi, 'isWriterAvailable').mockReturnValue(write)
  vi.spyOn(chromeAi, 'isSummarizerAvailable').mockReturnValue(summarize)
  vi.spyOn(chromeAi, 'isTranslatorAvailable').mockReturnValue(translate)
}

function mountMenu(
  editor: Editor,
  {
    ai = { enabled: true, languages: [{ code: 'es', label: 'Spanish' }] },
    locale = 'en',
  }: {
    ai?: { enabled: boolean; languages?: { code: string; label: string }[] }
    locale?: 'en' | 'es'
  } = {},
) {
  const dict = locale === 'es' ? es : en
  return mount(AiMenu, {
    props: { editor },
    global: {
      provide: {
        [BUILDER_OPTIONS_KEY as symbol]: { mergeTags: [], ai },
        [I18N_KEY as symbol]: {
          t: (key: string) => dict[key] ?? key,
          locale,
        },
      },
    },
  })
}

function ai(selector: string) {
  return findInBody(`.vmd-ai-popover ${selector}`)
}

function aiText(): string {
  return findInBody('.vmd-ai-popover').text()
}

beforeEach(() => {
  vi.restoreAllMocks()
  setAvailability({ rewrite: true, write: true, summarize: true, translate: true })
  vi.spyOn(chromeAi, 'translateAvailability').mockResolvedValue('readily')
})

afterEach(() => {
  vi.restoreAllMocks()
  for (const editor of editors.splice(0)) editor.destroy()
})

describe('AiMenu', () => {
  it('renders its popover above overflow containers with viewport positioning', async () => {
    const wrapper = mountMenu(makeEditor())
    const toggle = wrapper.find('[data-action="ai-menu-toggle"]').element as HTMLElement
    vi.spyOn(toggle, 'getBoundingClientRect').mockReturnValue({
      top: 72,
      bottom: 108,
      left: 120,
      right: 220,
      width: 100,
      height: 36,
      x: 120,
      y: 72,
      toJSON: () => ({}),
    })

    await wrapper.find('[data-action="ai-menu-toggle"]').trigger('click')

    const popover = findInBody('.vmd-ai-popover').element as HTMLElement
    expect(popover).not.toBeNull()
    expect(popover?.style.position).toBe('fixed')
    expect(popover?.style.zIndex).toBe('2000')
    expect(popover?.style.top).toBe('116px')
    expect(popover.closest('.vmd-root')).toBeNull()

    wrapper.unmount()
  })

  it('disables rewrite, summarize, and translate when no text is selected', async () => {
    const wrapper = mountMenu(makeEditor('<p>Hello</p>', false))

    await wrapper.find('[data-action="ai-menu-toggle"]').trigger('click')

    expect(ai('[data-action="ai-item-rewrite"]').attributes('disabled')).toBeDefined()
    expect(ai('[data-action="ai-item-summarize"]').attributes('disabled')).toBeDefined()
    expect(ai('[data-action="ai-item-translate"]').attributes('disabled')).toBeDefined()
    expect(ai('[data-action="ai-item-write"]').attributes('disabled')).toBeUndefined()
  })

  it('disables translate when no target languages are configured', async () => {
    const wrapper = mountMenu(makeEditor(), { ai: { enabled: true } })

    await wrapper.find('[data-action="ai-menu-toggle"]').trigger('click')

    const translateButton = ai('[data-action="ai-item-translate"]')
    expect(translateButton.attributes('disabled')).toBeDefined()
    expect(translateButton.attributes('title')).toContain('No languages configured')
  })

  it('prevents Generate for an unsupported translate language pair and shows a localized unavailable error', async () => {
    vi.spyOn(chromeAi, 'detectLanguage').mockResolvedValue('en')
    vi.spyOn(chromeAi, 'translateAvailability').mockResolvedValue('no')

    const wrapper = mountMenu(makeEditor('<p>Hello world</p>'), {
      ai: { enabled: true, languages: [{ code: 'es', label: 'Spanish' }] },
      locale: 'en',
    })

    await wrapper.find('[data-action="ai-menu-toggle"]').trigger('click')
    await ai('[data-action="ai-item-translate"]').trigger('click')
    await flushPromises()

    expect(ai('.vmd-ai-error').text()).toContain('AI is not available in this browser.')
    expect(ai('[data-action="ai-run"]').attributes('disabled')).toBeDefined()
  })

  it('ignores stale translate availability results when the target language changes', async () => {
    vi.spyOn(chromeAi, 'detectLanguage').mockResolvedValue('en')

    const pendingByTarget = new Map<string, Array<ReturnType<typeof deferred<chromeAi.AiAvailability>>>>()
    vi.spyOn(chromeAi, 'translateAvailability').mockImplementation(async (_source, target) => {
      const pending = deferred<chromeAi.AiAvailability>()
      pendingByTarget.set(target, [...(pendingByTarget.get(target) ?? []), pending])
      return pending.promise
    })

    const wrapper = mountMenu(makeEditor('<p>Hello world</p>'), {
      ai: {
        enabled: true,
        languages: [
          { code: 'es', label: 'Spanish' },
          { code: 'fr', label: 'French' },
        ],
      },
      locale: 'en',
    })

    await wrapper.find('[data-action="ai-menu-toggle"]').trigger('click')
    await ai('[data-action="ai-item-translate"]').trigger('click')
    await flushPromises()

    expect((pendingByTarget.get('es') ?? []).length).toBeGreaterThan(0)

    await ai('[data-field="ai-target-lang"]').setValue('fr')
    await wrapper.vm.$nextTick()

    const frenchRequests = pendingByTarget.get('fr') ?? []
    expect(frenchRequests.length).toBeGreaterThan(0)

    for (const request of frenchRequests) {
      request.resolve('readily')
    }
    await flushPromises()

    expect(ai('[data-action="ai-run"]').attributes('disabled')).toBeUndefined()
    expect(hasInBody('.vmd-ai-error')).toBe(false)

    for (const request of pendingByTarget.get('es') ?? []) {
      request.resolve('no')
    }
    await flushPromises()

    expect(ai('[data-action="ai-run"]').attributes('disabled')).toBeUndefined()
    expect(hasInBody('.vmd-ai-error')).toBe(false)
  })

  it('clears stale translate availability errors after a later successful availability result', async () => {
    vi.spyOn(chromeAi, 'detectLanguage').mockResolvedValue('en')

    const pendingByTarget = new Map<string, Array<ReturnType<typeof deferred<chromeAi.AiAvailability>>>>()
    vi.spyOn(chromeAi, 'translateAvailability').mockImplementation(async (_source, target) => {
      const pending = deferred<chromeAi.AiAvailability>()
      pendingByTarget.set(target, [...(pendingByTarget.get(target) ?? []), pending])
      return pending.promise
    })

    const wrapper = mountMenu(makeEditor('<p>Hello world</p>'), {
      ai: {
        enabled: true,
        languages: [
          { code: 'es', label: 'Spanish' },
          { code: 'fr', label: 'French' },
        ],
      },
      locale: 'en',
    })

    await wrapper.find('[data-action="ai-menu-toggle"]').trigger('click')
    await ai('[data-action="ai-item-translate"]').trigger('click')
    await flushPromises()

    for (const request of pendingByTarget.get('es') ?? []) {
      request.reject(new Error('boom'))
    }
    await flushPromises()

    expect(ai('.vmd-ai-error').text()).toContain('AI request failed.')
    expect(ai('[data-action="ai-run"]').attributes('disabled')).toBeDefined()

    await ai('[data-field="ai-target-lang"]').setValue('fr')
    await wrapper.vm.$nextTick()

    for (const request of pendingByTarget.get('fr') ?? []) {
      request.resolve('readily')
    }
    await flushPromises()

    expect(hasInBody('.vmd-ai-error')).toBe(false)
    expect(ai('[data-action="ai-run"]').attributes('disabled')).toBeUndefined()
  })

  it('ignores late detectLanguage failures after the menu closes', async () => {
    const pendingDetect = deferred<string | undefined>()
    vi.spyOn(chromeAi, 'detectLanguage').mockImplementation(async () => pendingDetect.promise)

    const wrapper = mountMenu(makeEditor('<p>Hello world</p>'), {
      ai: { enabled: true, languages: [{ code: 'es', label: 'Spanish' }] },
      locale: 'en',
    })

    await wrapper.find('[data-action="ai-menu-toggle"]').trigger('click')
    await ai('[data-action="ai-item-translate"]').trigger('click')
    await wrapper.vm.$nextTick()
    await wrapper.find('[data-action="ai-menu-toggle"]').trigger('click')

    pendingDetect.reject({ code: 'language-detection-failed', message: 'Language detection failed.' })
    await flushPromises()

    expect(hasInBody('.vmd-ai-popover')).toBe(false)

    await wrapper.find('[data-action="ai-menu-toggle"]').trigger('click')

    expect(hasInBody('.vmd-ai-error')).toBe(false)
  })

  it('disables only the unavailable browser capability', async () => {
    setAvailability({ rewrite: false, write: true, summarize: true, translate: true })
    const wrapper = mountMenu(makeEditor())

    await wrapper.find('[data-action="ai-menu-toggle"]').trigger('click')

    const rewriteButton = ai('[data-action="ai-item-rewrite"]')
    expect(rewriteButton.attributes('disabled')).toBeDefined()
    expect(rewriteButton.attributes('title')).toContain('Not available in this browser')
    expect(ai('[data-action="ai-item-write"]').attributes('disabled')).toBeUndefined()
  })

  it('keeps progress visible during a request and clears it when the request finishes', async () => {
    let resolveRewrite!: (value: string) => void
    vi.spyOn(chromeAi, 'rewrite').mockImplementation(
      (_text: string, _options?: chromeAi.RewriteOptions, onProgress?: (pct: number) => void) =>
        new Promise<string>((resolve) => {
          onProgress?.(42)
          resolveRewrite = resolve
        }),
    )

    const editor = makeEditor('<p>Hello world</p>')
    const wrapper = mountMenu(editor)

    await wrapper.find('[data-action="ai-menu-toggle"]').trigger('click')
    await ai('[data-action="ai-item-rewrite"]').trigger('click')
    await ai('[data-action="ai-run"]').trigger('click')
    await wrapper.vm.$nextTick()

    expect(aiText()).toContain('Downloading AI model… 42%')
    expect(editor.getHTML()).toContain('Hello world')

    resolveRewrite('Rewritten copy')
    await flushPromises()

    expect(aiText()).not.toContain('Downloading AI model… 42%')
    expect(editor.getHTML()).toContain('Hello world')
  })

  it('applies the generated result only after Apply is pressed', async () => {
    vi.spyOn(chromeAi, 'rewrite').mockResolvedValue('Rewritten copy')

    const editor = makeEditor('<p>Hello world</p>')
    const wrapper = mountMenu(editor)

    await wrapper.find('[data-action="ai-menu-toggle"]').trigger('click')
    await ai('[data-action="ai-item-rewrite"]').trigger('click')
    await ai('[data-action="ai-run"]').trigger('click')
    await flushPromises()

    expect(editor.getHTML()).toContain('Hello world')
    expect(hasInBody('[data-field="ai-result"]')).toBe(true)

    await ai('[data-action="ai-apply"]').trigger('click')

    expect(editor.getHTML()).toContain('Rewritten copy')
    expect(editor.getHTML()).not.toContain('Hello world')
    expect(hasInBody('[data-field="ai-result"]')).toBe(false)
  })

  it('closes and resets the generated result when Discard is pressed without mutating the editor', async () => {
    vi.spyOn(chromeAi, 'rewrite').mockResolvedValue('Rewritten copy')

    const editor = makeEditor('<p>Hello world</p>')
    const wrapper = mountMenu(editor)

    await wrapper.find('[data-action="ai-menu-toggle"]').trigger('click')
    await ai('[data-action="ai-item-rewrite"]').trigger('click')
    await ai('[data-action="ai-run"]').trigger('click')
    await flushPromises()
    await ai('[data-action="ai-discard"]').trigger('click')

    expect(editor.getHTML()).toContain('Hello world')
    expect(hasInBody('.vmd-ai-popover')).toBe(false)
  })

  it('clears generated state when the menu is closed and reopened', async () => {
    vi.spyOn(chromeAi, 'rewrite').mockResolvedValue('Rewritten copy')

    const editor = makeEditor('<p>Hello world</p>')
    const wrapper = mountMenu(editor)

    await wrapper.find('[data-action="ai-menu-toggle"]').trigger('click')
    await ai('[data-action="ai-item-rewrite"]').trigger('click')
    await ai('[data-action="ai-run"]').trigger('click')
    await flushPromises()
    await wrapper.find('[data-action="ai-menu-toggle"]').trigger('click')

    expect(hasInBody('.vmd-ai-popover')).toBe(false)

    await wrapper.find('[data-action="ai-menu-toggle"]').trigger('click')

    expect(hasInBody('[data-field="ai-result"]')).toBe(false)
    expect(ai('[data-action="ai-item-rewrite"]').exists()).toBe(true)
  })

  it('maps wrapper failures to English and Spanish localized error labels', async () => {
    vi.spyOn(chromeAi, 'rewrite').mockRejectedValue({ code: 'request-failed', message: 'AI request failed.' })

    const englishWrapper = mountMenu(makeEditor('<p>Hello world</p>'), { locale: 'en' })
    await englishWrapper.find('[data-action="ai-menu-toggle"]').trigger('click')
    await ai('[data-action="ai-item-rewrite"]').trigger('click')
    await ai('[data-action="ai-run"]').trigger('click')
    await flushPromises()

    expect(ai('.vmd-ai-error').text()).toContain('AI request failed.')
    englishWrapper.unmount()

    const spanishWrapper = mountMenu(makeEditor('<p>Hello world</p>'), { locale: 'es' })
    await spanishWrapper.find('[data-action="ai-menu-toggle"]').trigger('click')
    await ai('[data-action="ai-item-rewrite"]').trigger('click')
    await ai('[data-action="ai-run"]').trigger('click')
    await flushPromises()

    expect(ai('.vmd-ai-error').text()).toContain('La solicitud de IA falló.')
  })
})
