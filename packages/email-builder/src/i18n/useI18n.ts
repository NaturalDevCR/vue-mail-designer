import type { InjectionKey } from 'vue'
import { inject, provide } from 'vue'
import type { LocaleDict } from './keys'

export type ResolvedLocale = 'en' | 'es'

export type I18n = {
  t: (k: string) => string
  locale: ResolvedLocale
}

export const I18N_KEY: InjectionKey<I18n> = Symbol('vmd-i18n')

export function provideI18n(
  dict: LocaleDict | (() => LocaleDict),
  locale: ResolvedLocale | (() => ResolvedLocale) = 'en',
): void {
  const getDict = typeof dict === 'function' ? dict : () => dict
  const getLocale = typeof locale === 'function' ? locale : () => locale
  provide(I18N_KEY, {
    t: (k: string) => getDict()[k] ?? k,
    get locale() {
      return getLocale()
    },
  })
}

export function useI18n(): I18n {
  return inject(I18N_KEY, { t: (k: string) => k, locale: 'en' })
}
