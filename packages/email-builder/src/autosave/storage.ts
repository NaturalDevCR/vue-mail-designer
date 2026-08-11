import type { EmailDocument } from '../schema'
import type { AutosaveStorage } from './types'

export function resolveLocalStorage(storage?: Storage): Storage {
  if (storage) return storage

  if (typeof window === 'undefined') {
    throw new Error('Autosave local storage is unavailable in this environment.')
  }

  try {
    return window.localStorage
  } catch (error) {
    throw new Error('Autosave local storage is unavailable in this browser.', {
      cause: error instanceof Error ? error : undefined,
    })
  }
}

export async function readAutosave(autosave: AutosaveStorage): Promise<EmailDocument | undefined> {
  if (autosave.type === 'custom') {
    return autosave.load()
  }

  const storage = resolveLocalStorage(autosave.storage)
  const raw = storage.getItem(autosave.key)
  if (raw === null) return undefined
  return JSON.parse(raw) as EmailDocument
}

export async function writeAutosave(autosave: AutosaveStorage, document: EmailDocument): Promise<void> {
  if (autosave.type === 'custom') {
    await autosave.save(document)
    return
  }

  const storage = resolveLocalStorage(autosave.storage)
  storage.setItem(autosave.key, JSON.stringify(document))
}
