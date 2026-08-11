import { afterEach, describe, expect, it, vi, type Mock } from 'vitest'
import type { AutosaveStorage } from '../src'
import { createDocument } from '../src/schema'
import { readAutosave, writeAutosave } from '../src/autosave/storage'
import type {
  AutosaveController,
  AutosaveControllerCallbacks,
  AutosaveErrorPayload,
  AutosaveRestoredPayload,
  AutosaveSavedPayload,
  AutosaveStatusPayload,
} from '../src/autosave/types'
import {
  createAutosaveController,
} from '../src/autosave/controller'

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

function designWithMarker(marker: string) {
  const design = createDocument()
  return {
    ...design,
    settings: {
      ...design.settings,
      preheader: marker,
    },
  }
}

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((nextResolve, nextReject) => {
    resolve = nextResolve
    reject = nextReject
  })
  return { promise, resolve, reject }
}

type MockedCallbacks = AutosaveControllerCallbacks & {
  applyRestoredDesign: Mock<AutosaveControllerCallbacks['applyRestoredDesign']>
  onStatus: Mock<(payload: AutosaveStatusPayload) => void>
  onSaved: Mock<(payload: AutosaveSavedPayload) => void>
  onRestored: Mock<(payload: AutosaveRestoredPayload) => void>
  onError: Mock<(payload: AutosaveErrorPayload) => void>
}

function createCallbacks(): MockedCallbacks {
  return {
    applyRestoredDesign: vi.fn<AutosaveControllerCallbacks['applyRestoredDesign']>(),
    onStatus: vi.fn<(payload: AutosaveStatusPayload) => void>(),
    onSaved: vi.fn<(payload: AutosaveSavedPayload) => void>(),
    onRestored: vi.fn<(payload: AutosaveRestoredPayload) => void>(),
    onError: vi.fn<(payload: AutosaveErrorPayload) => void>(),
  }
}

const controllers: AutosaveController[] = []

function createTrackedController(callbacks: AutosaveControllerCallbacks) {
  const controller = createAutosaveController(callbacks)
  controllers.push(controller)
  return controller
}

async function flushMicrotasks(rounds = 2) {
  for (let index = 0; index < rounds; index += 1) {
    await Promise.resolve()
  }
}

afterEach(() => {
  for (const controller of controllers.splice(0)) {
    controller.dispose()
  }
  vi.useRealTimers()
  vi.restoreAllMocks()
})

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

  it('accepts a save-only custom adapter', async () => {
    const design = createDocument()
    const save = vi.fn()
    const autosave: AutosaveStorage = {
      type: 'custom',
      save,
    }

    await writeAutosave(autosave, design)

    expect(save).toHaveBeenCalledWith(design)
    expect('load' in autosave).toBe(false)
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

describe('autosave controller', () => {
  it('stays disabled without re-emitting unchanged status', async () => {
    const callbacks = createCallbacks()
    const controller = createTrackedController(callbacks)

    await controller.configure(undefined, createDocument())
    expect(controller.getStatus()).toBe('disabled')

    await controller.configure(
      {
        enabled: false,
        storage: { type: 'custom', save: vi.fn() },
      },
      createDocument(),
    )

    expect(controller.getStatus()).toBe('disabled')

    controller.dispose()

    expect(callbacks.onStatus).not.toHaveBeenCalled()
  })

  it('uses the default debounce delay before saving', async () => {
    vi.useFakeTimers()
    const save = vi.fn()
    const callbacks = createCallbacks()
    const controller = createTrackedController(callbacks)

    await controller.configure(
      {
        enabled: true,
        storage: { type: 'custom', save },
      },
      createDocument(),
    )

    controller.handleDesignChange(designWithMarker('later'))
    await vi.advanceTimersByTimeAsync(999)

    expect(save).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)

    expect(save).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenCalledWith(designWithMarker('later'))
  })

  it('serializes change-mode saves and preserves each change snapshot', async () => {
    const firstSave = deferred<void>()
    const save = vi.fn((_design: ReturnType<typeof designWithMarker>): Promise<void> => Promise.resolve())
      .mockImplementationOnce(() => firstSave.promise)
      .mockImplementationOnce(() => Promise.resolve())
    const callbacks = createCallbacks()
    const controller = createTrackedController(callbacks)

    await controller.configure(
      {
        enabled: true,
        storage: { type: 'custom', save },
        mode: 'change',
      },
      createDocument(),
    )

    const first = designWithMarker('first')
    const second = designWithMarker('second')

    controller.handleDesignChange(first)
    first.settings.preheader = 'mutated after enqueue'
    controller.handleDesignChange(second)
    await flushMicrotasks()

    expect(save).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenNthCalledWith(1, designWithMarker('first'))

    firstSave.resolve()
    await flushMicrotasks(8)

    expect(save).toHaveBeenCalledTimes(2)
    expect(save).toHaveBeenNthCalledWith(2, designWithMarker('second'))
  })

  it('debounces and saves only the latest design', async () => {
    vi.useFakeTimers()
    const save = vi.fn()
    const callbacks = createCallbacks()
    const controller = createTrackedController(callbacks)

    await controller.configure(
      {
        enabled: true,
        storage: { type: 'custom', save },
        mode: 'debounce',
        delay: 100,
      },
      createDocument(),
    )

    controller.handleDesignChange(designWithMarker('one'))
    controller.handleDesignChange(designWithMarker('two'))

    await vi.advanceTimersByTimeAsync(99)
    expect(save).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)

    expect(save).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenCalledWith(designWithMarker('two'))
  })

  it('saves only dirty interval work and coalesces to the latest snapshot', async () => {
    vi.useFakeTimers()
    const save = vi.fn().mockResolvedValue(undefined)
    const callbacks = createCallbacks()
    const controller = createTrackedController(callbacks)

    await controller.configure(
      {
        enabled: true,
        storage: { type: 'custom', save },
        mode: 'interval',
        delay: 100,
      },
      createDocument(),
    )

    await vi.advanceTimersByTimeAsync(100)
    expect(save).not.toHaveBeenCalled()

    controller.handleDesignChange(designWithMarker('one'))
    controller.handleDesignChange(designWithMarker('two'))
    await vi.advanceTimersByTimeAsync(100)

    expect(save).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenCalledWith(designWithMarker('two'))

    await vi.advanceTimersByTimeAsync(100)
    expect(save).toHaveBeenCalledTimes(1)
  })

  it('never overlaps custom saves while debounce work is pending', async () => {
    vi.useFakeTimers()
    const firstSave = deferred<void>()
    const save = vi.fn((_design: ReturnType<typeof designWithMarker>): Promise<void> => Promise.resolve())
      .mockImplementationOnce(() => firstSave.promise)
      .mockImplementationOnce(() => Promise.resolve())
    const callbacks = createCallbacks()
    const controller = createTrackedController(callbacks)

    await controller.configure(
      {
        enabled: true,
        storage: { type: 'custom', save },
        mode: 'debounce',
        delay: 10,
      },
      createDocument(),
    )

    controller.handleDesignChange(designWithMarker('one'))
    await vi.advanceTimersByTimeAsync(10)
    expect(save).toHaveBeenCalledTimes(1)

    controller.handleDesignChange(designWithMarker('two'))
    await vi.advanceTimersByTimeAsync(10)
    expect(save).toHaveBeenCalledTimes(1)

    firstSave.resolve()
    await flushMicrotasks()

    expect(save).toHaveBeenCalledTimes(2)
    expect(save).toHaveBeenNthCalledWith(2, designWithMarker('two'))
  })

  it('keeps the initial design by default when restore finds a saved draft', async () => {
    const load = vi.fn().mockResolvedValue(designWithMarker('saved'))
    const callbacks = createCallbacks()
    const controller = createTrackedController(callbacks)
    const initial = designWithMarker('initial')

    await controller.configure(
      {
        enabled: true,
        storage: { type: 'custom', load, save: vi.fn() },
        restore: true,
      },
      initial,
    )

    expect(load).toHaveBeenCalledTimes(1)
    expect(callbacks.applyRestoredDesign).not.toHaveBeenCalled()
    expect(callbacks.onRestored).not.toHaveBeenCalled()
    expect(controller.getStatus()).toBe('idle')
  })

  it('restores the saved design when saved-design precedence is requested', async () => {
    const saved = designWithMarker('saved')
    const callbacks = createCallbacks()
    const controller = createTrackedController(callbacks)

    await controller.configure(
      {
        enabled: true,
        storage: { type: 'custom', load: vi.fn().mockResolvedValue(saved), save: vi.fn() },
        restore: true,
        restorePrecedence: 'saved-design',
      },
      designWithMarker('initial'),
    )

    expect(callbacks.applyRestoredDesign).toHaveBeenCalledTimes(1)
    expect(callbacks.applyRestoredDesign).toHaveBeenCalledWith(saved)
    expect(callbacks.onRestored).toHaveBeenCalledTimes(1)
    expect(callbacks.onRestored.mock.calls[0]?.[0].design).toEqual(saved)
    expect(controller.getStatus()).toBe('saved')
  })

  it('treats a missing saved draft as no restoration', async () => {
    const callbacks = createCallbacks()
    const controller = createTrackedController(callbacks)

    await controller.configure(
      {
        enabled: true,
        storage: { type: 'custom', load: vi.fn().mockResolvedValue(undefined), save: vi.fn() },
        restore: true,
      },
      createDocument(),
    )

    expect(callbacks.applyRestoredDesign).not.toHaveBeenCalled()
    expect(callbacks.onRestored).not.toHaveBeenCalled()
    expect(controller.getStatus()).toBe('idle')
  })

  it('emits observable status transitions for restore and save success', async () => {
    vi.useFakeTimers()
    const callbacks = createCallbacks()
    const controller = createTrackedController(callbacks)

    await controller.configure(
      {
        enabled: true,
        storage: { type: 'custom', load: vi.fn().mockResolvedValue(undefined), save: vi.fn().mockResolvedValue(undefined) },
        restore: true,
        mode: 'debounce',
        delay: 25,
      },
      createDocument(),
    )

    controller.handleDesignChange(designWithMarker('saved later'))
    await vi.advanceTimersByTimeAsync(25)

    expect(callbacks.onStatus.mock.calls.map(([payload]: [AutosaveStatusPayload]) => payload.status)).toEqual([
      'restoring',
      'idle',
      'saving',
      'saved',
    ])
    expect(callbacks.onSaved).toHaveBeenCalledTimes(1)
    expect(callbacks.onSaved.mock.calls[0]?.[0].design).toEqual(designWithMarker('saved later'))
  })

  it('reports load failures and leaves the initial design untouched', async () => {
    const error = new Error('broken load')
    const callbacks = createCallbacks()
    const controller = createTrackedController(callbacks)

    await controller.configure(
      {
        enabled: true,
        storage: { type: 'custom', load: vi.fn().mockRejectedValue(error), save: vi.fn() },
        restore: true,
      },
      createDocument(),
    )

    expect(callbacks.applyRestoredDesign).not.toHaveBeenCalled()
    expect(callbacks.onError).toHaveBeenCalledWith({ operation: 'load', error })
    expect(callbacks.onStatus).toHaveBeenLastCalledWith({ status: 'error', error })
    expect(controller.getStatus()).toBe('error')
  })

  it('reports save failures and can recover on a later successful save', async () => {
    vi.useFakeTimers()
    const error = new Error('broken save')
    const save = vi.fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce(undefined)
    const callbacks = createCallbacks()
    const controller = createTrackedController(callbacks)

    await controller.configure(
      {
        enabled: true,
        storage: { type: 'custom', save },
        mode: 'debounce',
        delay: 10,
      },
      createDocument(),
    )

    controller.handleDesignChange(designWithMarker('first'))
    await vi.advanceTimersByTimeAsync(10)

    expect(callbacks.onError).toHaveBeenCalledWith({ operation: 'save', error })
    expect(controller.getStatus()).toBe('error')

    controller.handleDesignChange(designWithMarker('second'))
    await vi.advanceTimersByTimeAsync(10)

    expect(controller.getStatus()).toBe('saved')
    expect(callbacks.onSaved).toHaveBeenCalledTimes(1)
  })

  it('disposal invalidates pending timers and late async completions', async () => {
    vi.useFakeTimers()
    const load = deferred<ReturnType<typeof designWithMarker> | undefined>()
    const save = deferred<void>()
    const callbacks = createCallbacks()
    const controller = createTrackedController(callbacks)

    const configurePromise = controller.configure(
      {
        enabled: true,
        storage: {
          type: 'custom',
          load: vi.fn().mockImplementation(() => load.promise),
          save: vi.fn().mockImplementation(() => save.promise),
        },
        restore: true,
        mode: 'debounce',
        delay: 10,
      },
      createDocument(),
    )

    controller.dispose()
    load.resolve(designWithMarker('late load'))
    await configurePromise

    controller.handleDesignChange(designWithMarker('late save'))
    vi.advanceTimersByTime(10)
    await flushMicrotasks()

    expect(callbacks.applyRestoredDesign).not.toHaveBeenCalled()
    expect(callbacks.onRestored).not.toHaveBeenCalled()
    expect(callbacks.onSaved).not.toHaveBeenCalled()
    expect(callbacks.onError).not.toHaveBeenCalled()
    expect(callbacks.onStatus).toHaveBeenLastCalledWith({ status: 'disabled' })

    save.resolve()
    await flushMicrotasks()

    expect(callbacks.onSaved).not.toHaveBeenCalled()
  })

  it('serializes saves across reconfiguration and ignores stale completions', async () => {
    vi.useFakeTimers()
    const staleSave = deferred<void>()
    const activeSave = deferred<void>()
    const save = vi.fn((_design: ReturnType<typeof designWithMarker>): Promise<void> => Promise.resolve())
      .mockImplementationOnce(() => staleSave.promise)
      .mockImplementationOnce(() => activeSave.promise)
      .mockImplementationOnce(() => Promise.resolve())
    const callbacks = createCallbacks()
    const controller = createTrackedController(callbacks)

    await controller.configure(
      {
        enabled: true,
        storage: { type: 'custom', save },
        mode: 'debounce',
        delay: 10,
      },
      createDocument(),
    )

    controller.handleDesignChange(designWithMarker('stale generation'))
    await vi.advanceTimersByTimeAsync(10)
    expect(save).toHaveBeenCalledTimes(1)

    await controller.configure(
      {
        enabled: true,
        storage: { type: 'custom', save },
        mode: 'debounce',
        delay: 10,
      },
      createDocument(),
    )

    controller.handleDesignChange(designWithMarker('active first'))
    await vi.advanceTimersByTimeAsync(10)
    expect(save).toHaveBeenCalledTimes(1)

    controller.handleDesignChange(designWithMarker('active second'))
    await vi.advanceTimersByTimeAsync(10)
    expect(save).toHaveBeenCalledTimes(1)

    staleSave.resolve()
    await flushMicrotasks()
    expect(save).toHaveBeenCalledTimes(2)
    expect(save).toHaveBeenNthCalledWith(2, designWithMarker('active second'))

    controller.handleDesignChange(designWithMarker('active third'))
    await vi.advanceTimersByTimeAsync(10)
    expect(save).toHaveBeenCalledTimes(2)

    activeSave.resolve()
    await flushMicrotasks()

    expect(save).toHaveBeenCalledTimes(3)
    expect(save).toHaveBeenNthCalledWith(3, designWithMarker('active third'))
  })
})
