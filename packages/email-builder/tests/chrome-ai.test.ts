import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  detectLanguage,
  isLanguageDetectorAvailable,
  isRewriterAvailable,
  isSummarizerAvailable,
  isTranslatorAvailable,
  isWriterAvailable,
  rewrite,
  translateAvailability,
  write,
} from '../src/ai/chromeAi'

type Glob = typeof globalThis & Record<string, unknown>

afterEach(() => {
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
})
