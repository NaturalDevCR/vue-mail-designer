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

const editors: Editor[] = []

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
  it('disables rewrite, summarize, and translate when no text is selected', async () => {
    const wrapper = mountMenu(makeEditor('<p>Hello</p>', false))

    await wrapper.find('[data-action="ai-menu-toggle"]').trigger('click')

    expect(wrapper.find('[data-action="ai-item-rewrite"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('[data-action="ai-item-summarize"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('[data-action="ai-item-translate"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('[data-action="ai-item-write"]').attributes('disabled')).toBeUndefined()
  })

  it('disables translate when no target languages are configured', async () => {
    const wrapper = mountMenu(makeEditor(), { ai: { enabled: true } })

    await wrapper.find('[data-action="ai-menu-toggle"]').trigger('click')

    const translateButton = wrapper.find('[data-action="ai-item-translate"]')
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
    await wrapper.find('[data-action="ai-item-translate"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('.vmd-ai-error').text()).toContain('AI is not available in this browser.')
    expect(wrapper.find('[data-action="ai-run"]').attributes('disabled')).toBeDefined()
  })

  it('disables only the unavailable browser capability', async () => {
    setAvailability({ rewrite: false, write: true, summarize: true, translate: true })
    const wrapper = mountMenu(makeEditor())

    await wrapper.find('[data-action="ai-menu-toggle"]').trigger('click')

    const rewriteButton = wrapper.find('[data-action="ai-item-rewrite"]')
    expect(rewriteButton.attributes('disabled')).toBeDefined()
    expect(rewriteButton.attributes('title')).toContain('Not available in this browser')
    expect(wrapper.find('[data-action="ai-item-write"]').attributes('disabled')).toBeUndefined()
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
    await wrapper.find('[data-action="ai-item-rewrite"]').trigger('click')
    await wrapper.find('[data-action="ai-run"]').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Downloading AI model… 42%')
    expect(editor.getHTML()).toContain('Hello world')

    resolveRewrite('Rewritten copy')
    await flushPromises()

    expect(wrapper.text()).not.toContain('Downloading AI model… 42%')
    expect(editor.getHTML()).toContain('Hello world')
  })

  it('applies the generated result only after Apply is pressed', async () => {
    vi.spyOn(chromeAi, 'rewrite').mockResolvedValue('Rewritten copy')

    const editor = makeEditor('<p>Hello world</p>')
    const wrapper = mountMenu(editor)

    await wrapper.find('[data-action="ai-menu-toggle"]').trigger('click')
    await wrapper.find('[data-action="ai-item-rewrite"]').trigger('click')
    await wrapper.find('[data-action="ai-run"]').trigger('click')
    await flushPromises()

    expect(editor.getHTML()).toContain('Hello world')
    expect(wrapper.find('[data-field="ai-result"]').exists()).toBe(true)

    await wrapper.find('[data-action="ai-apply"]').trigger('click')

    expect(editor.getHTML()).toContain('Rewritten copy')
    expect(editor.getHTML()).not.toContain('Hello world')
    expect(wrapper.find('[data-field="ai-result"]').exists()).toBe(false)
  })

  it('closes and resets the generated result when Discard is pressed without mutating the editor', async () => {
    vi.spyOn(chromeAi, 'rewrite').mockResolvedValue('Rewritten copy')

    const editor = makeEditor('<p>Hello world</p>')
    const wrapper = mountMenu(editor)

    await wrapper.find('[data-action="ai-menu-toggle"]').trigger('click')
    await wrapper.find('[data-action="ai-item-rewrite"]').trigger('click')
    await wrapper.find('[data-action="ai-run"]').trigger('click')
    await flushPromises()
    await wrapper.find('[data-action="ai-discard"]').trigger('click')

    expect(editor.getHTML()).toContain('Hello world')
    expect(wrapper.find('.vmd-ai-popover').exists()).toBe(false)
  })

  it('clears generated state when the menu is closed and reopened', async () => {
    vi.spyOn(chromeAi, 'rewrite').mockResolvedValue('Rewritten copy')

    const editor = makeEditor('<p>Hello world</p>')
    const wrapper = mountMenu(editor)

    await wrapper.find('[data-action="ai-menu-toggle"]').trigger('click')
    await wrapper.find('[data-action="ai-item-rewrite"]').trigger('click')
    await wrapper.find('[data-action="ai-run"]').trigger('click')
    await flushPromises()
    await wrapper.find('[data-action="ai-menu-toggle"]').trigger('click')

    expect(wrapper.find('.vmd-ai-popover').exists()).toBe(false)

    await wrapper.find('[data-action="ai-menu-toggle"]').trigger('click')

    expect(wrapper.find('[data-field="ai-result"]').exists()).toBe(false)
    expect(wrapper.find('[data-action="ai-item-rewrite"]').exists()).toBe(true)
  })

  it('maps wrapper failures to English and Spanish localized error labels', async () => {
    vi.spyOn(chromeAi, 'rewrite').mockRejectedValue({ code: 'request-failed', message: 'AI request failed.' })

    const englishWrapper = mountMenu(makeEditor('<p>Hello world</p>'), { locale: 'en' })
    await englishWrapper.find('[data-action="ai-menu-toggle"]').trigger('click')
    await englishWrapper.find('[data-action="ai-item-rewrite"]').trigger('click')
    await englishWrapper.find('[data-action="ai-run"]').trigger('click')
    await flushPromises()

    expect(englishWrapper.find('.vmd-ai-error').text()).toContain('AI request failed.')

    const spanishWrapper = mountMenu(makeEditor('<p>Hello world</p>'), { locale: 'es' })
    await spanishWrapper.find('[data-action="ai-menu-toggle"]').trigger('click')
    await spanishWrapper.find('[data-action="ai-item-rewrite"]').trigger('click')
    await spanishWrapper.find('[data-action="ai-run"]').trigger('click')
    await flushPromises()

    expect(spanishWrapper.find('.vmd-ai-error').text()).toContain('La solicitud de IA falló.')
  })
})
