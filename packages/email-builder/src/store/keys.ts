import type { InjectionKey } from 'vue'
import { inject } from 'vue'
import type { Pinia } from 'pinia'

export const BUILDER_PINIA_KEY: InjectionKey<Pinia> = Symbol('vmd-pinia')

export function useBuilderPinia(): Pinia {
  const pinia = inject(BUILDER_PINIA_KEY)
  if (!pinia) throw new Error('[vue-mail-designer] Falta el contexto: usa los componentes dentro de <EmailBuilder>.')
  return pinia
}
