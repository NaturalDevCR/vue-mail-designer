import type { EmailDocument } from '../schema'

export type AutosaveMode = 'change' | 'debounce' | 'interval'

export type AutosaveStatus =
  | 'disabled'
  | 'idle'
  | 'restoring'
  | 'saving'
  | 'saved'
  | 'error'

type AutosaveLocalStorage = {
  type: 'local'
  key: string
  storage?: Storage
}

type AutosaveCustomStorage = {
  type: 'custom'
  load?: () => Promise<EmailDocument | undefined> | EmailDocument | undefined
  save: (document: EmailDocument) => Promise<void> | void
}

export type AutosaveStorage = AutosaveLocalStorage | AutosaveCustomStorage

export type AutosaveOptions = {
  enabled: boolean
  storage: AutosaveStorage
  mode?: AutosaveMode
  delay?: number
  restore?: boolean
  restorePrecedence?: 'initial-design' | 'saved-design'
}

export type AutosaveStatusPayload = { status: AutosaveStatus; error?: unknown }
export type AutosaveSavedPayload = { design: EmailDocument; savedAt: number }
export type AutosaveRestoredPayload = { design: EmailDocument; restoredAt: number }
export type AutosaveErrorPayload = { operation: 'load' | 'save'; error: unknown }

export type AutosaveControllerCallbacks = {
  applyRestoredDesign: (design: EmailDocument) => void
  onStatus: (payload: AutosaveStatusPayload) => void
  onSaved: (payload: AutosaveSavedPayload) => void
  onRestored: (payload: AutosaveRestoredPayload) => void
  onError: (payload: AutosaveErrorPayload) => void
}

export type AutosaveController = {
  configure: (options: AutosaveOptions | undefined, initialDesign: EmailDocument | undefined) => Promise<void>
  handleDesignChange: (design: EmailDocument) => void
  getStatus: () => AutosaveStatus
  dispose: () => void
}
