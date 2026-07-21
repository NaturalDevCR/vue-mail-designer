import type { InjectionKey } from 'vue'
import { inject, provide } from 'vue'
import type { LocaleDict } from './keys'

export type I18n = { t: (k: string) => string }

export const I18N_KEY: InjectionKey<I18n> = Symbol('vmd-i18n')

export function provideI18n(dict: LocaleDict): void {
  provide(I18N_KEY, { t: (k: string) => dict[k] ?? k })
}

export function useI18n(): I18n {
  return inject(I18N_KEY, { t: (k: string) => k })
}
