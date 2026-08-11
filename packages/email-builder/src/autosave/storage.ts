import { zEmailDocument, type EmailDocument } from '../schema'
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

function createInvalidAutosaveDocumentError(cause?: unknown) {
  return new Error('Autosave document is invalid.', {
    cause: cause instanceof Error ? cause : undefined,
  })
}

function validateAutosaveDocument(value: unknown): EmailDocument | undefined {
  if (value === undefined) return undefined

  const parsed = zEmailDocument.safeParse(value)
  if (parsed.success) return parsed.data

  throw createInvalidAutosaveDocumentError(parsed.error)
}

export async function readAutosave(autosave: AutosaveStorage): Promise<EmailDocument | undefined> {
  if (autosave.type === 'custom') {
    const loaded = await autosave.load?.()
    return validateAutosaveDocument(loaded)
  }

  const storage = resolveLocalStorage(autosave.storage)
  const raw = storage.getItem(autosave.key)
  if (raw === null) return undefined
  return validateAutosaveDocument(JSON.parse(raw) as unknown)
}

export async function writeAutosave(autosave: AutosaveStorage, document: EmailDocument): Promise<void> {
  if (autosave.type === 'custom') {
    await autosave.save(document)
    return
  }

  const storage = resolveLocalStorage(autosave.storage)
  storage.setItem(autosave.key, JSON.stringify(document))
}
