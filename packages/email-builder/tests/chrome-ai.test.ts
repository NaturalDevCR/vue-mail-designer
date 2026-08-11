import { afterEach, describe, expect, it, vi } from 'vitest'
import {
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
  for (const key of ['Writer', 'Rewriter', 'Summarizer', 'Translator', 'LanguageDetector']) {
    delete (globalThis as Glob)[key]
  }
})

describe('disponibilidad', () => {
  it('reporta false cuando el global no existe', () => {
    expect(isWriterAvailable()).toBe(false)
    expect(isRewriterAvailable()).toBe(false)
    expect(isSummarizerAvailable()).toBe(false)
    expect(isTranslatorAvailable()).toBe(false)
    expect(isLanguageDetectorAvailable()).toBe(false)
  })

  it('reporta true cuando el global existe', () => {
    ;(globalThis as Glob).Writer = {}
    expect(isWriterAvailable()).toBe(true)
  })
})

describe('write', () => {
  it('lanza si Writer no está disponible', async () => {
    await expect(write('hola')).rejects.toThrow('Writer API no disponible')
  })

  it('crea sesión, escribe, y destruye la sesión', async () => {
    const destroy = vi.fn()
    const session = { write: vi.fn().mockResolvedValue('texto generado'), destroy }
    const create = vi.fn().mockResolvedValue(session)
    ;(globalThis as Glob).Writer = { create }

    const result = await write('escribe un saludo', { tone: 'more-formal', length: 'shorter' })

    expect(result).toBe('texto generado')
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ tone: 'more-formal', length: 'shorter' }))
    expect(session.write).toHaveBeenCalledWith('escribe un saludo')
    expect(destroy).toHaveBeenCalled()
  })

  it('reporta progreso de descarga vía el monitor', async () => {
    let capturedMonitor: ((ev: { loaded: number }) => void) | undefined
    const monitorTarget = {
      addEventListener: (_type: string, cb: (ev: { loaded: number }) => void) => {
        capturedMonitor = cb
      },
    }
    const create = vi.fn().mockImplementation(async (opts: { monitor?: (m: typeof monitorTarget) => void }) => {
      opts.monitor?.(monitorTarget)
      capturedMonitor?.({ loaded: 0.5 })
      return { write: vi.fn().mockResolvedValue('ok'), destroy: vi.fn() }
    })
    ;(globalThis as Glob).Writer = { create }

    const onProgress = vi.fn()
    await write('hola', {}, onProgress)

    expect(onProgress).toHaveBeenCalledWith(50)
  })

  it('destruye la sesión aunque write() rechace', async () => {
    const destroy = vi.fn()
    const create = vi.fn().mockResolvedValue({ write: vi.fn().mockRejectedValue(new Error('boom')), destroy })
    ;(globalThis as Glob).Writer = { create }

    await expect(write('hola')).rejects.toThrow('boom')
    expect(destroy).toHaveBeenCalled()
  })
})

describe('rewrite', () => {
  it('lanza si Rewriter no está disponible', async () => {
    await expect(rewrite('hola')).rejects.toThrow('Rewriter API no disponible')
  })

  it('reescribe el texto', async () => {
    const session = { rewrite: vi.fn().mockResolvedValue('reescrito'), destroy: vi.fn() }
    ;(globalThis as Glob).Rewriter = { create: vi.fn().mockResolvedValue(session) }
    expect(await rewrite('hola', { tone: 'more-casual' })).toBe('reescrito')
    expect(session.rewrite).toHaveBeenCalledWith('hola')
  })
})

describe('summarize', () => {
  it('lanza si Summarizer no está disponible', async () => {
    await expect(summarize('texto largo')).rejects.toThrow('Summarizer API no disponible')
  })

  it('resume el texto', async () => {
    const session = { summarize: vi.fn().mockResolvedValue('resumen'), destroy: vi.fn() }
    ;(globalThis as Glob).Summarizer = { create: vi.fn().mockResolvedValue(session) }
    expect(await summarize('texto largo', { type: 'tldr' })).toBe('resumen')
  })
})

describe('translate', () => {
  it('translateAvailability devuelve "no" si Translator no existe', async () => {
    expect(await translateAvailability('es', 'en')).toBe('no')
  })

  it('translateAvailability delega en Translator.availability', async () => {
    const availability = vi.fn().mockResolvedValue('readily')
    ;(globalThis as Glob).Translator = { availability, create: vi.fn() }
    expect(await translateAvailability('es', 'en')).toBe('readily')
    expect(availability).toHaveBeenCalledWith({ sourceLanguage: 'es', targetLanguage: 'en' })
  })

  it('lanza si Translator no está disponible', async () => {
    await expect(translate('hola', 'es', 'en')).rejects.toThrow('Translator API no disponible')
  })

  it('traduce el texto', async () => {
    const session = { translate: vi.fn().mockResolvedValue('hello'), destroy: vi.fn() }
    const create = vi.fn().mockResolvedValue(session)
    ;(globalThis as Glob).Translator = { create, availability: vi.fn() }
    expect(await translate('hola', 'es', 'en')).toBe('hello')
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ sourceLanguage: 'es', targetLanguage: 'en' }))
  })
})

describe('detectLanguage', () => {
  it('devuelve undefined si LanguageDetector no existe', async () => {
    expect(await detectLanguage('hola')).toBeUndefined()
  })

  it('devuelve el idioma detectado con mayor confianza', async () => {
    const session = {
      detect: vi.fn().mockResolvedValue([{ detectedLanguage: 'es', confidence: 0.9 }]),
      destroy: vi.fn(),
    }
    ;(globalThis as Glob).LanguageDetector = { create: vi.fn().mockResolvedValue(session) }
    expect(await detectLanguage('hola mundo')).toBe('es')
  })
})
