export type AiTone = 'as-is' | 'more-formal' | 'more-casual'
export type AiLength = 'as-is' | 'shorter' | 'longer'
export type AiFormat = 'plain-text' | 'markdown'
export type AiSummaryType = 'key-points' | 'tldr' | 'teaser' | 'headline'
export type AiSummaryLength = 'short' | 'medium' | 'long'
export type AiAvailability = 'no' | 'after-download' | 'readily'
export type AiErrorCode = 'not-supported' | 'request-failed' | 'language-detection-failed'

export type WriteOptions = { tone?: AiTone; length?: AiLength; format?: AiFormat; sharedContext?: string }
export type RewriteOptions = { tone?: AiTone; length?: AiLength; sharedContext?: string }
export type SummarizeOptions = { type?: AiSummaryType; length?: AiSummaryLength; format?: AiFormat }

export class ChromeAiError extends Error {
  code: AiErrorCode
  cause?: unknown

  constructor(code: AiErrorCode, message: string, cause?: unknown) {
    super(message)
    this.name = 'ChromeAiError'
    this.code = code
    this.cause = cause
  }
}

interface ProgressMonitor {
  addEventListener(type: 'downloadprogress', callback: (event: { loaded: number }) => void): void
}

interface WriterSession {
  write(prompt: string): Promise<string>
  destroy(): void
}

interface RewriterSession {
  rewrite(text: string): Promise<string>
  destroy(): void
}

interface SummarizerSession {
  summarize(text: string): Promise<string>
  destroy(): void
}

interface TranslatorSession {
  translate(text: string): Promise<string>
  destroy(): void
}

interface DetectorSession {
  detect(text: string): Promise<Array<{ detectedLanguage: string; confidence: number }>>
  destroy(): void
}

interface ChromeAiGlobals {
  Writer?: { create(options: WriteOptions & { monitor?: (monitor: ProgressMonitor) => void }): Promise<WriterSession> }
  Rewriter?: { create(options: RewriteOptions & { monitor?: (monitor: ProgressMonitor) => void }): Promise<RewriterSession> }
  Summarizer?: { create(options: SummarizeOptions & { monitor?: (monitor: ProgressMonitor) => void }): Promise<SummarizerSession> }
  Translator?: {
    create(options: {
      sourceLanguage: string
      targetLanguage: string
      monitor?: (monitor: ProgressMonitor) => void
    }): Promise<TranslatorSession>
    availability(options: { sourceLanguage: string; targetLanguage: string }): Promise<AiAvailability>
  }
  LanguageDetector?: { create(): Promise<DetectorSession> }
}

function globals(): ChromeAiGlobals {
  return globalThis as unknown as ChromeAiGlobals
}

function withProgress(onProgress?: (pct: number) => void): { monitor?: (monitor: ProgressMonitor) => void } {
  if (!onProgress) return {}
  return {
    monitor(monitor) {
      monitor.addEventListener('downloadprogress', (event) => {
        onProgress(Math.round(event.loaded * 100))
      })
    },
  }
}

function notSupported(capability: string): ChromeAiError {
  return new ChromeAiError('not-supported', `${capability} AI is not available in this browser.`)
}

function requestFailed(error: unknown): ChromeAiError {
  if (error instanceof ChromeAiError) return error
  return new ChromeAiError('request-failed', 'AI request failed.', error)
}

export function isWriterAvailable(): boolean {
  return typeof globals().Writer !== 'undefined'
}

export function isRewriterAvailable(): boolean {
  return typeof globals().Rewriter !== 'undefined'
}

export function isSummarizerAvailable(): boolean {
  return typeof globals().Summarizer !== 'undefined'
}

export function isTranslatorAvailable(): boolean {
  return typeof globals().Translator !== 'undefined'
}

export function isLanguageDetectorAvailable(): boolean {
  return typeof globals().LanguageDetector !== 'undefined'
}

export async function write(prompt: string, options: WriteOptions = {}, onProgress?: (pct: number) => void): Promise<string> {
  const Writer = globals().Writer
  if (!Writer) throw notSupported('Writer')

  let session: WriterSession | undefined
  try {
    session = await Writer.create({ ...options, ...withProgress(onProgress) })
    return await session.write(prompt)
  } catch (error) {
    throw requestFailed(error)
  } finally {
    session?.destroy()
  }
}

export async function rewrite(text: string, options: RewriteOptions = {}, onProgress?: (pct: number) => void): Promise<string> {
  const Rewriter = globals().Rewriter
  if (!Rewriter) throw notSupported('Rewriter')

  let session: RewriterSession | undefined
  try {
    session = await Rewriter.create({ ...options, ...withProgress(onProgress) })
    return await session.rewrite(text)
  } catch (error) {
    throw requestFailed(error)
  } finally {
    session?.destroy()
  }
}

export async function summarize(text: string, options: SummarizeOptions = {}, onProgress?: (pct: number) => void): Promise<string> {
  const Summarizer = globals().Summarizer
  if (!Summarizer) throw notSupported('Summarizer')

  let session: SummarizerSession | undefined
  try {
    session = await Summarizer.create({ ...options, ...withProgress(onProgress) })
    return await session.summarize(text)
  } catch (error) {
    throw requestFailed(error)
  } finally {
    session?.destroy()
  }
}

export async function translateAvailability(sourceLanguage: string, targetLanguage: string): Promise<AiAvailability> {
  const Translator = globals().Translator
  if (!Translator) return 'no'
  return Translator.availability({ sourceLanguage, targetLanguage })
}

export async function translate(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
  onProgress?: (pct: number) => void,
): Promise<string> {
  const Translator = globals().Translator
  if (!Translator) throw notSupported('Translator')

  let session: TranslatorSession | undefined
  try {
    session = await Translator.create({
      sourceLanguage,
      targetLanguage,
      ...withProgress(onProgress),
    })
    return await session.translate(text)
  } catch (error) {
    throw requestFailed(error)
  } finally {
    session?.destroy()
  }
}

export async function detectLanguage(text: string): Promise<string | undefined> {
  const LanguageDetector = globals().LanguageDetector
  if (!LanguageDetector) return undefined

  let session: DetectorSession | undefined
  try {
    session = await LanguageDetector.create()
    const results = await session.detect(text)
    return results[0]?.detectedLanguage
  } catch (error) {
    throw new ChromeAiError('language-detection-failed', 'Language detection failed.', error)
  } finally {
    session?.destroy()
  }
}
