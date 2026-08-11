import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  ChromeAiError,
  clearSummarizerSessionCache,
  detectLanguage,
  isLanguageDetectorAvailable,
  isRewriterAvailable,
  isSummarizerAvailable,
  isTranslatorAvailable,
  isWriterAvailable,
  rewrite,
  summarize,
  translate,
  translateAvailability,
  write,
} from '../src/ai/chromeAi'

type Glob = typeof globalThis & Record<string, unknown>

afterEach(() => {
  clearSummarizerSessionCache()
  vi.restoreAllMocks()
  for (const key of ['Writer', 'Rewriter', 'Summarizer', 'Translator', 'LanguageDetector']) {
    delete (globalThis as Glob)[key]
  }
})

describe('chromeAi availability', () => {
  it('returns false when the browser globals are absent', () => {
    expect(isWriterAvailable()).toBe(false)
    expect(isRewriterAvailable()).toBe(false)
    expect(isSummarizerAvailable()).toBe(false)
    expect(isTranslatorAvailable()).toBe(false)
    expect(isLanguageDetectorAvailable()).toBe(false)
  })
})

describe('chromeAi wrappers', () => {
  it('reuses a Summarizer session for repeated requests with the same options', async () => {
    const destroy = vi.fn()
    const session = {
      summarize: vi.fn().mockResolvedValueOnce('First summary').mockResolvedValueOnce('Second summary'),
      destroy,
    }
    const create = vi.fn().mockResolvedValue(session)
    ;(globalThis as Glob).Summarizer = { create }

    await expect(summarize('First text', { type: 'headline', length: 'short' })).resolves.toBe('First summary')
    await expect(summarize('Second text', { type: 'headline', length: 'short' })).resolves.toBe('Second summary')

    expect(create).toHaveBeenCalledTimes(1)
    expect(session.summarize).toHaveBeenNthCalledWith(1, 'First text')
    expect(session.summarize).toHaveBeenNthCalledWith(2, 'Second text')
    expect(destroy).not.toHaveBeenCalled()
  })

  it('keeps separate Summarizer sessions for different options and clears them explicitly', async () => {
    const firstDestroy = vi.fn()
    const secondDestroy = vi.fn()
    const create = vi
      .fn()
      .mockResolvedValueOnce({ summarize: vi.fn().mockResolvedValue('Headline'), destroy: firstDestroy })
      .mockResolvedValueOnce({ summarize: vi.fn().mockResolvedValue('Key points'), destroy: secondDestroy })
    ;(globalThis as Glob).Summarizer = { create }

    await summarize('Text', { type: 'headline', length: 'short' })
    await summarize('Text', { type: 'key-points', length: 'short' })

    expect(create).toHaveBeenCalledTimes(2)
    clearSummarizerSessionCache()
    await Promise.resolve()
    expect(firstDestroy).toHaveBeenCalledTimes(1)
    expect(secondDestroy).toHaveBeenCalledTimes(1)
  })

  it('evicts a rejected Summarizer session so the next request can retry', async () => {
    const failedDestroy = vi.fn()
    const retryDestroy = vi.fn()
    const create = vi
      .fn()
      .mockResolvedValueOnce({ summarize: vi.fn().mockRejectedValue(new Error('temporary failure')), destroy: failedDestroy })
      .mockResolvedValueOnce({ summarize: vi.fn().mockResolvedValue('Recovered summary'), destroy: retryDestroy })
    ;(globalThis as Glob).Summarizer = { create }

    await expect(summarize('Text', { type: 'tldr' })).rejects.toMatchObject({ code: 'request-failed' })
    await expect(summarize('Text', { type: 'tldr' })).resolves.toBe('Recovered summary')

    expect(create).toHaveBeenCalledTimes(2)
    expect(failedDestroy).toHaveBeenCalledTimes(1)
    expect(retryDestroy).not.toHaveBeenCalled()
  })

  it('throws an English stable error when Writer is unavailable', async () => {
    await expect(write('Hello')).rejects.toMatchObject({
      code: 'not-supported',
      message: 'Writer AI is not available in this browser.',
    })
  })

  it('reports progress and destroys the writer session after a rejected request', async () => {
    let progressHandler: ((ev: { loaded: number }) => void) | undefined
    const destroy = vi.fn()
    const create = vi.fn().mockImplementation(async (options: { monitor?: (target: { addEventListener: (type: string, cb: (ev: { loaded: number }) => void) => void }) => void }) => {
      options.monitor?.({
        addEventListener: (_type, cb) => {
          progressHandler = cb
        },
      })
      progressHandler?.({ loaded: 0.5 })
      return {
        write: vi.fn().mockRejectedValue(new Error('boom')),
        destroy,
      }
    })
    ;(globalThis as Glob).Writer = { create }

    const onProgress = vi.fn()

    await expect(write('Hello', {}, onProgress)).rejects.toMatchObject({
      code: 'request-failed',
      message: 'AI request failed.',
    })
    expect(onProgress).toHaveBeenCalledWith(50)
    expect(destroy).toHaveBeenCalledTimes(1)
  })

  it('rewrites text and destroys the session after success', async () => {
    const destroy = vi.fn()
    const session = { rewrite: vi.fn().mockResolvedValue('Updated copy'), destroy }
    ;(globalThis as Glob).Rewriter = { create: vi.fn().mockResolvedValue(session) }

    await expect(rewrite('Hello')).resolves.toBe('Updated copy')
    expect(session.rewrite).toHaveBeenCalledWith('Hello')
    expect(destroy).toHaveBeenCalledTimes(1)
  })

  it('returns no translation availability when Translator is absent', async () => {
    await expect(translateAvailability('en', 'es')).resolves.toBe('no')
  })

  it('returns undefined when language detection is unavailable', async () => {
    await expect(detectLanguage('Hola mundo')).resolves.toBeUndefined()
  })

  it.each([
    {
      label: 'Rewriter',
      install() {
        const destroy = vi.fn()
        ;(globalThis as Glob).Rewriter = {
          create: vi.fn().mockResolvedValue({
            rewrite: vi.fn().mockRejectedValue(new Error('boom')),
            destroy,
          }),
        }
        return destroy
      },
      run: () => rewrite('Hello'),
      code: 'request-failed',
      message: 'AI request failed.',
    },
    {
      label: 'Summarizer',
      install() {
        const destroy = vi.fn()
        ;(globalThis as Glob).Summarizer = {
          create: vi.fn().mockResolvedValue({
            summarize: vi.fn().mockRejectedValue(new Error('boom')),
            destroy,
          }),
        }
        return destroy
      },
      run: () => summarize('Hello'),
      code: 'request-failed',
      message: 'AI request failed.',
    },
    {
      label: 'Translator',
      install() {
        const destroy = vi.fn()
        ;(globalThis as Glob).Translator = {
          availability: vi.fn().mockResolvedValue('readily'),
          create: vi.fn().mockResolvedValue({
            translate: vi.fn().mockRejectedValue(new Error('boom')),
            destroy,
          }),
        }
        return destroy
      },
      run: () => translate('Hello', 'en', 'es'),
      code: 'request-failed',
      message: 'AI request failed.',
    },
    {
      label: 'LanguageDetector',
      install() {
        const destroy = vi.fn()
        ;(globalThis as Glob).LanguageDetector = {
          create: vi.fn().mockResolvedValue({
            detect: vi.fn().mockRejectedValue(new Error('boom')),
            destroy,
          }),
        }
        return destroy
      },
      run: () => detectLanguage('Hola mundo'),
      code: 'language-detection-failed',
      message: 'Language detection failed.',
    },
  ])('destroys the $label session after a post-create request rejection', async ({ install, run, code, message }) => {
    const destroy = install()

    await expect(run()).rejects.toMatchObject({ code, message })
    expect(destroy).toHaveBeenCalledTimes(1)
  })

  it.each([
    {
      label: 'Writer',
      install() {
        ;(globalThis as Glob).Writer = { create: vi.fn().mockRejectedValue(new Error('boom')) }
      },
      run: () => write('Hello'),
      code: 'request-failed',
      message: 'AI request failed.',
    },
    {
      label: 'Rewriter',
      install() {
        ;(globalThis as Glob).Rewriter = { create: vi.fn().mockRejectedValue(new Error('boom')) }
      },
      run: () => rewrite('Hello'),
      code: 'request-failed',
      message: 'AI request failed.',
    },
    {
      label: 'Summarizer',
      install() {
        ;(globalThis as Glob).Summarizer = { create: vi.fn().mockRejectedValue(new Error('boom')) }
      },
      run: () => summarize('Hello'),
      code: 'request-failed',
      message: 'AI request failed.',
    },
    {
      label: 'Translator',
      install() {
        ;(globalThis as Glob).Translator = {
          availability: vi.fn().mockResolvedValue('readily'),
          create: vi.fn().mockRejectedValue(new Error('boom')),
        }
      },
      run: () => translate('Hello', 'en', 'es'),
      code: 'request-failed',
      message: 'AI request failed.',
    },
    {
      label: 'LanguageDetector',
      install() {
        ;(globalThis as Glob).LanguageDetector = { create: vi.fn().mockRejectedValue(new Error('boom')) }
      },
      run: () => detectLanguage('Hola mundo'),
      code: 'language-detection-failed',
      message: 'Language detection failed.',
    },
  ])('normalizes $label create() rejection without attempting session cleanup', async ({ install, run, code, message }) => {
    const destroy = vi.fn()
    install()

    const result = await run().catch((error) => error)

    expect(result).toBeInstanceOf(ChromeAiError)
    expect(result).toMatchObject({ code, message })
    expect(destroy).not.toHaveBeenCalled()
  })
})
