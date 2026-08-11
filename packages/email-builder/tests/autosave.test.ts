import { describe, expect, it, vi } from 'vitest'
import type { AutosaveStorage } from '../src'
import { createDocument } from '../src/schema'
import { readAutosave, writeAutosave } from '../src/autosave/storage'

class MemoryStorage implements Storage {
  private readonly data = new Map<string, string>()

  get length() {
    return this.data.size
  }

  clear() {
    this.data.clear()
  }

  getItem(key: string) {
    return this.data.has(key) ? this.data.get(key)! : null
  }

  key(index: number) {
    return Array.from(this.data.keys())[index] ?? null
  }

  removeItem(key: string) {
    this.data.delete(key)
  }

  setItem(key: string, value: string) {
    this.data.set(key, value)
  }
}

describe('autosave storage', () => {
  it('round-trips a local design as JSON', async () => {
    const storage = new MemoryStorage()
    const design = createDocument()
    await writeAutosave({ type: 'local', key: 'draft', storage }, design)
    await expect(readAutosave({ type: 'local', key: 'draft', storage })).resolves.toEqual(design)
  })

  it('returns undefined for a missing local autosave key', async () => {
    const storage = new MemoryStorage()
    await expect(readAutosave({ type: 'local', key: 'draft', storage })).resolves.toBeUndefined()
  })

  it('throws when local autosave JSON is malformed', async () => {
    const storage = new MemoryStorage()
    storage.setItem('draft', '{not valid json')
    await expect(readAutosave({ type: 'local', key: 'draft', storage })).rejects.toThrow()
  })

  it('passes through a custom adapter load and save', async () => {
    const design = createDocument()
    const loads: AutosaveStorage[] = []
    let saved: unknown
    const autosave: AutosaveStorage = {
      type: 'custom',
      load: async () => {
        loads.push(autosave)
        return design
      },
      save: async next => {
        saved = next
      },
    }

    await expect(readAutosave(autosave)).resolves.toEqual(design)
    await writeAutosave(autosave, design)
    expect(loads).toHaveLength(1)
    expect(saved).toEqual(design)
  })

  it('throws an explicit error when browser storage is unavailable', async () => {
    const originalWindow = globalThis.window
    vi.stubGlobal('window', undefined)

    try {
      await expect(readAutosave({ type: 'local', key: 'draft' })).rejects.toThrow(/local storage/i)
    } finally {
      vi.stubGlobal('window', originalWindow)
    }
  })
})
