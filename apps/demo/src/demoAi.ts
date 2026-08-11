type DemoSession = {
  destroy(): void
}

type DemoAiGlobals = Record<string, unknown>
type DemoTone = 'as-is' | 'more-formal' | 'more-casual'
type DemoLength = 'as-is' | 'shorter' | 'longer'

const englishToSpanish: Record<string, string> = {
  welcome: 'bienvenido',
  to: 'a',
  discover: 'descubre',
  unforgettable: 'inolvidables',
  destinations: 'destinos',
  destination: 'destino',
  experiences: 'experiencias',
  experience: 'experiencia',
  journey: 'aventura',
  travel: 'viaje',
  tourism: 'turismo',
  context: 'contexto',
  text: 'texto',
  about: 'sobre',
  relaxation: 'relajación',
  relax: 'relajarte',
  stay: 'estancia',
  enjoy: 'disfruta',
  every: 'cada',
  detail: 'detalle',
  details: 'detalles',
  designed: 'diseñado',
  help: 'ayudarte',
  plan: 'planificar',
  next: 'próxima',
  escape: 'escapada',
  message: 'mensaje',
  create: 'crea',
  clear: 'claro',
  warm: 'cálido',
  audience: 'audiencia',
  latest: 'últimas',
  news: 'noticias',
  month: 'mes',
  thank: 'gracias',
  you: 'tú',
  for: 'para',
  with: 'con',
  and: 'y',
  your: 'tu',
}

const spanishToEnglish: Record<string, string> = Object.fromEntries(
  Object.entries(englishToSpanish).map(([english, spanish]) => [spanish, english]),
)

function demoSession<T extends DemoSession>(result: T): T {
  return result
}

function isSpanish(text: string): boolean {
  return /[áéíóúñ¿¡]|\b(el|la|los|las|para|con|una|bienvenido|descubre|turismo|viaje)\b/i.test(text)
}

function sentenceCase(text: string): string {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text
}

function firstSentence(text: string): string {
  return text.split(/(?<=[.!?])\s+/u)[0]?.trim() || text.trim()
}

function applyLength(text: string, length: DemoLength, extra: string): string {
  if (length === 'shorter') return firstSentence(text)
  if (length === 'longer') return `${text.trim()} ${extra}`
  return text.trim()
}

function generateDemoCopy(prompt: string, tone: DemoTone = 'as-is', length: DemoLength = 'as-is'): string {
  const spanish = isSpanish(prompt)
  const tourism = /tourism|travel|hotel|spa|destination|turismo|viaje|hotel|destino/i.test(prompt)

  if (spanish) {
    const copy = tourism
      ? 'Descubre destinos inolvidables, experiencias auténticas y todo lo necesario para planificar tu próxima escapada.'
      : 'Crea un mensaje claro y cercano que ayude a tu audiencia a dar el siguiente paso.'
    const formal = tone === 'more-formal' ? copy.replace('Descubre', 'Conoce').replace('Crea', 'Presenta') : copy
    const casual = tone === 'more-casual' ? formal.replace('tu audiencia', 'tu comunidad') : formal
    return applyLength(casual, length, 'Encuentra inspiración y empieza a disfrutar desde hoy.')
  }

  const copy = tourism
    ? 'Discover unforgettable destinations, thoughtful experiences, and everything you need to plan your next escape.'
    : 'Create a clear, welcoming message that helps your audience take the next step.'
  const formal = tone === 'more-formal' ? copy.replace('Discover', 'Explore').replace('Create', 'Prepare') : copy
  const casual = tone === 'more-casual' ? formal.replace('your audience', 'your community') : formal
  return applyLength(casual, length, 'Find inspiration and start planning today.')
}

export function rewriteDemoText(text: string, tone: DemoTone = 'as-is', length: DemoLength = 'as-is'): string {
  const original = text.trim()
  const spanish = isSpanish(original)
  const hotel = /hotel|spa/i.test(original)
  const tourism = /tourism|travel|destination|experience|journey|turismo|viaje|destino|experiencia|aventura/i.test(original)

  if (spanish) {
    const rewritten = hotel
      ? 'Te damos la bienvenida a nuestro hotel y spa, donde cada detalle está pensado para que descanses y disfrutes tu estancia.'
      : tourism
        ? 'Descubre destinos inolvidables, experiencias auténticas y todo lo necesario para planificar tu próxima escapada.'
        : sentenceCase(original)
    const formal = tone === 'more-formal' ? rewritten.replace('Te damos la bienvenida', 'Nos complace darte la bienvenida') : rewritten
    const casual = tone === 'more-casual'
      ? formal.replace('nuestro hotel y spa', 'este hotel y spa').replace('Descubre destinos inolvidables', 'Encuentra destinos increíbles')
      : formal
    return applyLength(casual, length, 'Esperamos recibirte muy pronto.')
  }

  const rewritten = hotel
    ? 'Welcome to our hotel and spa, where every detail is designed to help you relax and enjoy your stay.'
    : tourism
      ? 'Discover unforgettable destinations, meaningful experiences, and everything you need to plan your next getaway.'
      : sentenceCase(original)
  const formal = tone === 'more-formal'
    ? rewritten.replace('Welcome to', 'We are pleased to welcome you to').replace('Discover unforgettable destinations', 'Explore remarkable destinations')
    : rewritten
  const casual = tone === 'more-casual'
    ? formal
      .replace('Welcome to', 'Visit')
      .replace('Discover unforgettable destinations', 'Find amazing destinations')
      .replace('meaningful experiences', 'great experiences')
    : formal
  return applyLength(casual, length, 'We look forward to welcoming you soon.')
}

function translateWithDictionary(text: string, sourceLanguage: string, targetLanguage: string): string {
  if (!text.trim() || sourceLanguage === targetLanguage) return text

  const spanishTarget = targetLanguage.toLowerCase().startsWith('es')
  const phraseMap = spanishTarget
    ? [
        [/^welcome to hotel & spa poco a poco$/i, 'Bienvenido a Hotel & Spa Poco a Poco'],
        [/^welcome text about tourism$/i, 'Texto de bienvenida sobre turismo'],
        [/^welcome text with a tourism context$/i, 'Texto de bienvenida con contexto turístico'],
      ] as const
    : [
        [/^bienvenido a hotel & spa poco a poco$/i, 'Welcome to Hotel & Spa Poco a Poco'],
        [/^texto de bienvenida sobre turismo$/i, 'Welcome text about tourism'],
        [/^texto de bienvenida con contexto turístico$/i, 'Welcome text with a tourism context'],
      ] as const

  for (const [pattern, replacement] of phraseMap) {
    if (pattern.test(text.trim())) return replacement
  }

  const dictionary = spanishTarget ? englishToSpanish : spanishToEnglish
  return text.replace(/[A-Za-zÁÉÍÓÚáéíóúÑñ]+/g, (word) => {
    const translated = dictionary[word.toLowerCase()]
    if (!translated) return word
    return /^[A-ZÁÉÍÓÚÑ]/u.test(word) ? sentenceCase(translated) : translated
  })
}

function detectDemoLanguage(text: string): string {
  return isSpanish(text) ? 'es' : 'en'
}

/**
 * Keeps the public demo interactive on browsers that do not expose Chrome's
 * experimental built-in AI APIs. Real browser APIs always take precedence.
 * The fallback is intentionally local and deterministic; it is not a claim of
 * model-quality generation or a replacement for a production AI provider.
 */
export function installDemoAiFallback(): void {
  const globals = globalThis as DemoAiGlobals

  if (!globals.Writer) {
    globals.Writer = {
      create: async (options: { tone?: DemoTone; length?: DemoLength } = {}) =>
        demoSession({
          write: async (prompt: string) => generateDemoCopy(prompt, options.tone, options.length),
          destroy() {},
        }),
    }
  }

  if (!globals.Rewriter) {
    globals.Rewriter = {
      create: async (options: { tone?: DemoTone; length?: DemoLength } = {}) =>
        demoSession({
          rewrite: async (text: string) => rewriteDemoText(text, options.tone, options.length),
          destroy() {},
        }),
    }
  }

  if (!globals.Summarizer) {
    globals.Summarizer = {
      create: async () =>
        demoSession({
          summarize: async (text: string) => firstSentence(text),
          destroy() {},
        }),
    }
  }

  if (!globals.Translator) {
    globals.Translator = {
      availability: async () => 'readily',
      create: async ({ sourceLanguage, targetLanguage }: { sourceLanguage: string; targetLanguage: string }) =>
        demoSession({
          translate: async (text: string) => translateWithDictionary(text, sourceLanguage, targetLanguage),
          destroy() {},
        }),
    }
  }

  if (!globals.LanguageDetector) {
    globals.LanguageDetector = {
      create: async () =>
        demoSession({
          detect: async (text: string) => [{ detectedLanguage: detectDemoLanguage(text), confidence: 0.99 }],
          destroy() {},
        }),
    }
  }
}
