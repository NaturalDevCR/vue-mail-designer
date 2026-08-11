export type AiTone = 'as-is' | 'more-formal' | 'more-casual'
export type AiLength = 'as-is' | 'shorter' | 'longer'
export type AiFormat = 'plain-text' | 'markdown'
export type AiSummaryType = 'key-points' | 'tldr' | 'teaser' | 'headline'
export type AiSummaryLength = 'short' | 'medium' | 'long'
export type AiAvailability = 'no' | 'after-download' | 'readily'

export type WriteOptions = { tone?: AiTone; length?: AiLength; format?: AiFormat; sharedContext?: string }
export type RewriteOptions = { tone?: AiTone; length?: AiLength; sharedContext?: string }
export type SummarizeOptions = { type?: AiSummaryType; length?: AiSummaryLength; format?: AiFormat }

interface ProgressMonitor {
  addEventListener(type: 'downloadprogress', cb: (ev: { loaded: number }) => void): void
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
  detect(text: string): Promise<{ detectedLanguage: string; confidence: number }[]>
  destroy(): void
}

interface ChromeAiGlobals {
  Writer?: {
    create(opts: WriteOptions & { monitor?: (m: ProgressMonitor) => void }): Promise<WriterSession>
  }
  Rewriter?: {
    create(opts: RewriteOptions & { monitor?: (m: ProgressMonitor) => void }): Promise<RewriterSession>
  }
  Summarizer?: {
    create(opts: SummarizeOptions & { monitor?: (m: ProgressMonitor) => void }): Promise<SummarizerSession>
  }
  Translator?: {
    create(opts: { sourceLanguage: string; targetLanguage: string; monitor?: (m: ProgressMonitor) => void }): Promise<TranslatorSession>
    availability(opts: { sourceLanguage: string; targetLanguage: string }): Promise<AiAvailability>
  }
  LanguageDetector?: { create(): Promise<DetectorSession> }
}

function globals(): ChromeAiGlobals {
  return globalThis as unknown as ChromeAiGlobals
}

function withProgress(onProgress?: (pct: number) => void): { monitor?: (m: ProgressMonitor) => void } {
  if (!onProgress) return {}
  return {
    monitor(monitor) {
      monitor.addEventListener('downloadprogress', (ev) => {
        onProgress(Math.round(ev.loaded * 100))
      })
    },
  }
}

function has<T>(value: T | undefined): value is T {
  return typeof value !== 'undefined'
}

export function isWriterAvailable(): boolean {
  return has(globals().Writer)
}

export function isRewriterAvailable(): boolean {
  return has(globals().Rewriter)
}

export function isSummarizerAvailable(): boolean {
  return has(globals().Summarizer)
}

export function isTranslatorAvailable(): boolean {
  return has(globals().Translator)
}

export function isLanguageDetectorAvailable(): boolean {
  return has(globals().LanguageDetector)
}

export async function write(prompt: string, opts: WriteOptions = {}, onProgress?: (pct: number) => void): Promise<string> {
  const Writer = globals().Writer
  if (!Writer) throw new Error('Writer API no disponible')
  const session = await Writer.create({ ...opts, ...withProgress(onProgress) })
  try {
    return await session.write(prompt)
  } finally {
    session.destroy()
  }
}

export async function rewrite(text: string, opts: RewriteOptions = {}, onProgress?: (pct: number) => void): Promise<string> {
  const Rewriter = globals().Rewriter
  if (!Rewriter) throw new Error('Rewriter API no disponible')
  const session = await Rewriter.create({ ...opts, ...withProgress(onProgress) })
  try {
    return await session.rewrite(text)
  } finally {
    session.destroy()
  }
}

export async function summarize(text: string, opts: SummarizeOptions = {}, onProgress?: (pct: number) => void): Promise<string> {
  const Summarizer = globals().Summarizer
  if (!Summarizer) throw new Error('Summarizer API no disponible')
  const session = await Summarizer.create({ ...opts, ...withProgress(onProgress) })
  try {
    return await session.summarize(text)
  } finally {
    session.destroy()
  }
}

export async function translateAvailability(source: string, target: string): Promise<AiAvailability> {
  const Translator = globals().Translator
  if (!Translator) return 'no'
  return Translator.availability({ sourceLanguage: source, targetLanguage: target })
}

export async function translate(text: string, source: string, target: string, onProgress?: (pct: number) => void): Promise<string> {
  const Translator = globals().Translator
  if (!Translator) throw new Error('Translator API no disponible')
  const session = await Translator.create({ sourceLanguage: source, targetLanguage: target, ...withProgress(onProgress) })
  try {
    return await session.translate(text)
  } finally {
    session.destroy()
  }
}

export async function detectLanguage(text: string): Promise<string | undefined> {
  const LanguageDetector = globals().LanguageDetector
  if (!LanguageDetector) return undefined
  const session = await LanguageDetector.create()
  try {
    const candidates = await session.detect(text)
    return candidates.sort((a, b) => b.confidence - a.confidence)[0]?.detectedLanguage
  } finally {
    session.destroy()
  }
}
