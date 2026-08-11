import type { EmailDocument } from '../schema'

export interface AutosaveLocalStorage {
  type: 'local'
  key: string
  storage?: Storage
}

export interface AutosaveCustomStorage {
  type: 'custom'
  load?: () => Promise<EmailDocument | undefined> | EmailDocument | undefined
  save: (document: EmailDocument) => Promise<void> | void
}

export type AutosaveStorage = AutosaveLocalStorage | AutosaveCustomStorage
