import type { EmailDocument } from '../schema'
import type {
  AutosaveController,
  AutosaveControllerCallbacks,
  AutosaveMode,
  AutosaveOptions,
  AutosaveStatus,
  AutosaveStorage,
} from './types'
import { readAutosave, writeAutosave } from './storage'

export type {
  AutosaveController,
  AutosaveControllerCallbacks,
  AutosaveErrorPayload,
  AutosaveMode,
  AutosaveOptions,
  AutosaveRestoredPayload,
  AutosaveSavedPayload,
  AutosaveStatus,
  AutosaveStatusPayload,
} from './types'

const DEFAULT_DEBOUNCE_DELAY = 1000
const DEFAULT_INTERVAL_DELAY = 5000

type RuntimeConfig = {
  storage: AutosaveStorage
  mode: AutosaveMode
  delay: number
  restore: boolean
  restorePrecedence: 'initial-design' | 'saved-design'
}

type NormalizedConfig = RuntimeConfig

function cloneDocument(document: EmailDocument): EmailDocument {
  return JSON.parse(JSON.stringify(document)) as EmailDocument
}

export function createAutosaveController(callbacks: AutosaveControllerCallbacks): AutosaveController {
  let generation = 0
  let disposed = false
  let status: AutosaveStatus = 'disabled'
  let runtime: RuntimeConfig | undefined
  let configured: NormalizedConfig | undefined
  let timer: ReturnType<typeof setTimeout> | undefined
  let intervalTimer: ReturnType<typeof setInterval> | undefined
  let pendingSnapshot: EmailDocument | undefined
  let intervalDirty = false
  let debounceReady = false
  let changeQueue = Promise.resolve()
  let saveInFlightToken: number | undefined
  let saveToken = 0
  let saveSettled = Promise.resolve()
  let resolveSaveSettled: (() => void) | undefined
  let restoringGeneration: number | undefined
  let dirtyDuringRestore = false

  function isActive(expectedGeneration: number) {
    return !disposed && generation === expectedGeneration
  }

  function hasSaveInFlight() {
    return saveInFlightToken !== undefined
  }

  async function waitForSaveSlot() {
    while (hasSaveInFlight()) {
      await saveSettled
    }
  }

  function beginSave() {
    const token = ++saveToken
    saveInFlightToken = token
    saveSettled = new Promise<void>(resolve => {
      resolveSaveSettled = resolve
    })
    return token
  }

  function finishSave(token: number) {
    if (saveInFlightToken !== token) return

    saveInFlightToken = undefined
    const settle = resolveSaveSettled
    resolveSaveSettled = undefined
    settle?.()
  }

  function clearSchedulingState() {
    if (timer) {
      clearTimeout(timer)
      timer = undefined
    }
    if (intervalTimer) {
      clearInterval(intervalTimer)
      intervalTimer = undefined
    }
    pendingSnapshot = undefined
    intervalDirty = false
    debounceReady = false
    changeQueue = Promise.resolve()
    restoringGeneration = undefined
    dirtyDuringRestore = false
  }

  function emitStatus(nextStatus: AutosaveStatus, error?: unknown) {
    if (status === nextStatus) return
    status = nextStatus
    callbacks.onStatus(error === undefined ? { status: nextStatus } : { status: nextStatus, error })
  }

  function scheduleInterval(expectedGeneration: number) {
    if (!runtime || runtime.mode !== 'interval') return

    intervalTimer = setInterval(() => {
      if (!isActive(expectedGeneration) || !runtime || runtime.mode !== 'interval') return
      if (!intervalDirty || !pendingSnapshot || hasSaveInFlight()) return

      const nextSnapshot = pendingSnapshot
      pendingSnapshot = undefined
      intervalDirty = false
      void runSave(nextSnapshot, expectedGeneration, runtime.storage)
    }, runtime.delay)
  }

  async function flushDebounce(expectedGeneration: number) {
    if (!isActive(expectedGeneration) || !runtime || runtime.mode !== 'debounce') return
    if (!pendingSnapshot) return

    if (hasSaveInFlight()) {
      debounceReady = true
      return
    }

    const nextSnapshot = pendingSnapshot
    pendingSnapshot = undefined
    debounceReady = false
    await runSave(nextSnapshot, expectedGeneration, runtime.storage)
  }

  async function runSave(snapshot: EmailDocument, expectedGeneration: number, storage: AutosaveStorage) {
    await waitForSaveSlot()
    if (!isActive(expectedGeneration)) return

    const token = beginSave()
    emitStatus('saving')

    try {
      await writeAutosave(storage, snapshot)

      if (!isActive(expectedGeneration)) return

      const savedDesign = cloneDocument(snapshot)
      callbacks.onSaved({ design: savedDesign, savedAt: Date.now() })
      emitStatus('saved')
    } catch (error) {
      if (!isActive(expectedGeneration)) return

      callbacks.onError({ operation: 'save', error })
      emitStatus('error', error)
    } finally {
      finishSave(token)

      if (disposed || !runtime) return

      if (runtime.mode === 'debounce' && debounceReady && pendingSnapshot) {
        const nextSnapshot = pendingSnapshot
        pendingSnapshot = undefined
        debounceReady = false
        void runSave(nextSnapshot, generation, runtime.storage)
      }
    }
  }

  function normalizeRuntime(options: AutosaveOptions): RuntimeConfig {
    const mode = options.mode ?? 'debounce'
    const delay = options.delay ?? (mode === 'interval' ? DEFAULT_INTERVAL_DELAY : mode === 'debounce' ? DEFAULT_DEBOUNCE_DELAY : 0)

    return {
      storage: options.storage,
      mode,
      delay,
      restore: options.restore ?? false,
      restorePrecedence: options.restorePrecedence ?? 'initial-design',
    }
  }

  function normalizeConfig(options: AutosaveOptions | undefined): NormalizedConfig | undefined {
    if (!options?.enabled) return undefined
    return normalizeRuntime(options)
  }

  function isEquivalentStorage(left: AutosaveStorage, right: AutosaveStorage) {
    if (left.type !== right.type) return false

    if (left.type === 'local' && right.type === 'local') {
      return left.key === right.key && left.storage === right.storage
    }

    if (left.type === 'custom' && right.type === 'custom') {
      return left.load === right.load && left.save === right.save
    }

    return false
  }

  function isEquivalentConfig(left: NormalizedConfig | undefined, right: NormalizedConfig | undefined) {
    if (!left || !right) return left === right

    return (
      left.mode === right.mode &&
      left.delay === right.delay &&
      left.restore === right.restore &&
      left.restorePrecedence === right.restorePrecedence &&
      isEquivalentStorage(left.storage, right.storage)
    )
  }

  return {
    async configure(options, initialDesign) {
      const nextConfig = normalizeConfig(options)
      if (isEquivalentConfig(configured, nextConfig)) return

      configured = nextConfig
      generation += 1
      const expectedGeneration = generation
      disposed = false
      clearSchedulingState()
      runtime = undefined

      if (!nextConfig) {
        emitStatus('disabled')
        return
      }

      runtime = nextConfig

      const startActiveScheduling = () => {
        if (!isActive(expectedGeneration) || !runtime) return
        if (runtime.mode === 'interval') scheduleInterval(expectedGeneration)
      }

      const hasExplicitInitialDesign = initialDesign !== undefined
      const shouldRestore = runtime.restore && (runtime.storage.type !== 'custom' || runtime.storage.load)

      if (shouldRestore) {
        restoringGeneration = expectedGeneration
        dirtyDuringRestore = false
        emitStatus('restoring')

        try {
          const restored = await readAutosave(runtime.storage)

          if (!isActive(expectedGeneration) || !runtime) return

          const shouldApplyRestore =
            restoringGeneration === expectedGeneration &&
            !dirtyDuringRestore &&
            restored !== undefined &&
            (!hasExplicitInitialDesign || runtime.restorePrecedence === 'saved-design')

          restoringGeneration = undefined
          const preserveCurrentStatus = dirtyDuringRestore && status !== 'restoring'
          dirtyDuringRestore = false

          if (shouldApplyRestore) {
            const restoredDesign = cloneDocument(restored)
            callbacks.applyRestoredDesign(restoredDesign)
            callbacks.onRestored({ design: cloneDocument(restoredDesign), restoredAt: Date.now() })
            emitStatus('saved')
          } else if (!preserveCurrentStatus) {
            void initialDesign
            emitStatus('idle')
          }
        } catch (error) {
          if (!isActive(expectedGeneration)) return

          restoringGeneration = undefined
          dirtyDuringRestore = false
          callbacks.onError({ operation: 'load', error })
          emitStatus('error', error)
        }

        startActiveScheduling()
        return
      }

      emitStatus('idle')
      startActiveScheduling()
    },

    handleDesignChange(design) {
      if (disposed || !runtime) return

      const expectedGeneration = generation
      if (restoringGeneration === expectedGeneration) {
        dirtyDuringRestore = true
      }
      const snapshot = cloneDocument(design)

      switch (runtime.mode) {
        case 'change':
          changeQueue = changeQueue.then(async () => {
            if (!isActive(expectedGeneration) || !runtime) return
            await runSave(snapshot, expectedGeneration, runtime.storage)
          })
          return

        case 'debounce':
          pendingSnapshot = snapshot
          debounceReady = false
          if (timer) clearTimeout(timer)
          timer = setTimeout(() => {
            timer = undefined
            void flushDebounce(expectedGeneration)
          }, runtime.delay)
          return

        case 'interval':
          pendingSnapshot = snapshot
          intervalDirty = true
      }
    },

    getStatus() {
      return status
    },

    dispose() {
      generation += 1
      disposed = true
      configured = undefined
      runtime = undefined
      clearSchedulingState()
      emitStatus('disabled')
    },
  }
}
