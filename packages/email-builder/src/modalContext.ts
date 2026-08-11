import type { ComputedRef, InjectionKey, Ref } from 'vue'

export type ModalContext = {
  theme: Ref<'light' | 'dark'>
  appearanceStyle: ComputedRef<Record<string, string>>
}

export const MODAL_CONTEXT_KEY: InjectionKey<ModalContext> = Symbol('vmd-modal-context')
