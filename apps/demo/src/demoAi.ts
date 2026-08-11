type DemoSession = {
  destroy(): void
}

type DemoAiGlobals = Record<string, unknown>

function demoSession<T extends DemoSession>(result: T): T {
  return result
}

/**
 * Keeps the public demo interactive on browsers that do not expose Chrome's
 * experimental built-in AI APIs. Real browser APIs always take precedence.
 */
export function installDemoAiFallback(): void {
  const globals = globalThis as DemoAiGlobals

  if (!globals.Writer) {
    globals.Writer = {
      create: async () =>
        demoSession({
          write: async (prompt: string) => `Demo-generated copy for: ${prompt}`,
          destroy() {},
        }),
    }
  }

  if (!globals.Rewriter) {
    globals.Rewriter = {
      create: async () =>
        demoSession({
          rewrite: async (text: string) => `${text} (demo rewrite)`,
          destroy() {},
        }),
    }
  }

  if (!globals.Summarizer) {
    globals.Summarizer = {
      create: async () =>
        demoSession({
          summarize: async (text: string) => `Summary: ${text}`,
          destroy() {},
        }),
    }
  }

  if (!globals.Translator) {
    globals.Translator = {
      availability: async () => 'readily',
      create: async () =>
        demoSession({
          translate: async (text: string) => `Translated demo copy: ${text}`,
          destroy() {},
        }),
    }
  }

  if (!globals.LanguageDetector) {
    globals.LanguageDetector = {
      create: async () =>
        demoSession({
          detect: async () => [{ detectedLanguage: 'en', confidence: 1 }],
          destroy() {},
        }),
    }
  }
}
