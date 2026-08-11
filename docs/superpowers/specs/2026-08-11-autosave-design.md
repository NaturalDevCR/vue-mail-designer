# Configurable Autosave and Draft Restoration

## Goal

Add an opt-in autosave system to `EmailBuilder` that can persist designs to browser storage or a user-owned remote backend, restore drafts according to explicit precedence rules, support change/debounce/interval timing, and expose observable status without coupling the editor to a backend.

## Scope

In scope:

- A public `autosave` prop on `EmailBuilder`.
- Built-in `localStorage` persistence.
- A generic custom storage adapter for Firestore, REST, IndexedDB, or any user-owned backend.
- Optional restoration on mount.
- Configurable precedence between the initial `design` prop and a restored draft.
- `change`, `debounce`, and `interval` save modes.
- Status events and an exposed status getter.
- Safe serialization, malformed local data handling, storage errors, timer cleanup, and restore/save loop prevention.
- English documentation, Spanish-compatible UI-free API copy, and generated LLM documentation updates.

Out of scope:

- A Firestore dependency or vendor-specific adapter.
- Remote deletion, conflict resolution, version history, multi-user synchronization, or optimistic locking.
- Package version bumps, publishing, or npm release work. Those happen only after local validation and explicit approval.

## Public API

```ts
export type AutosaveMode = 'change' | 'debounce' | 'interval'

export type AutosaveStatus =
  | 'disabled'
  | 'idle'
  | 'restoring'
  | 'saving'
  | 'saved'
  | 'error'

export type AutosaveStorage =
  | {
      type: 'local'
      key: string
      storage?: Storage
    }
  | {
      type: 'custom'
      load?: () => EmailDocument | undefined | Promise<EmailDocument | undefined>
      save: (design: EmailDocument) => void | Promise<void>
    }

export type AutosaveOptions = {
  enabled: boolean
  storage: AutosaveStorage
  mode?: AutosaveMode
  delay?: number
  restore?: boolean
  restorePrecedence?: 'initial-design' | 'saved-design'
}
```

Defaults:

- `mode`: `'debounce'`.
- `delay`: `1000` ms for debounce and `5000` ms for interval.
- `restore`: `false`, so enabling persistence never silently replaces a provided design.
- `restorePrecedence`: `'initial-design'`; it matters only when restoration is enabled and both sources exist.
- `change` saves every design change sequentially.
- `debounce` saves only the latest design after the delay has elapsed without another change.
- `interval` saves the latest dirty design at each interval.

For local storage, `key` is required and `storage` defaults to `window.localStorage` in browser contexts. The optional `storage` field allows tests or host applications to provide a compatible `Storage` implementation. Local values are JSON-serialized `EmailDocument` objects.

For custom storage, `save` is required and `load` is optional. The library never deletes or mutates remote data except by invoking the supplied `save` callback.

## Lifecycle and precedence

When `enabled` is false, the autosave controller is inert and status is `disabled`.

When enabled with `restore: true`, the controller enters `restoring` and calls the configured load operation. A missing value is treated as no saved draft. If both an initial `design` and a saved design exist:

- `restorePrecedence: 'initial-design'` keeps the initial `design` and does not apply the saved draft.
- `restorePrecedence: 'saved-design'` applies the saved draft.

If only one source exists, that source is used. Applying a restored design does not count as a user edit and must not immediately trigger another autosave. Once restoration finishes, later document changes are eligible for saving.

Autosave must not create a loop when the parent updates `design` in response to `update:design`. It should observe the builder's actual design-change path and distinguish restoration from user mutations.

## Status and events

`EmailBuilder` emits:

```ts
type AutosaveStatusPayload = {
  status: AutosaveStatus
  error?: unknown
}

type AutosaveSavedPayload = {
  design: EmailDocument
  savedAt: number
}

type AutosaveRestoredPayload = {
  design: EmailDocument
  restoredAt: number
}

type AutosaveErrorPayload = {
  operation: 'load' | 'save'
  error: unknown
}
```

Events:

- `autosave-status` whenever the status changes.
- `autosave-saved` after a successful save.
- `autosave-restored` after a saved design is applied.
- `autosave-error` when load or save fails.

The component exposes `getAutosaveStatus(): AutosaveStatus` for host UI that prefers polling or imperative access. Errors are reported to the host but do not interrupt editing.

## Failure handling and cleanup

- Invalid or malformed local JSON is treated as a failed load, reported through status/error events, and leaves the current design untouched.
- Missing browser storage is treated as a storage error; the editor remains usable.
- Custom adapter exceptions are passed through the error events without being swallowed from observability.
- A save in progress is never duplicated concurrently. Change-mode saves are serialized; debounce and interval modes coalesce pending work to the latest design.
- Debounce and interval timers are cleared on unmount and when autosave configuration is disabled or replaced.
- Pending async results are ignored after unmount or configuration invalidation.

## Documentation

Document the API and examples in:

- `packages/email-builder/README.md`.
- `apps/docs/reference/props.md` and the events reference.
- A dedicated autosave guide linked in the VitePress sidebar.
- `apps/docs/scripts/build-llms.mjs`, so generated `llms.txt` and `llms-full.txt` include the guide.

All new documentation and code comments are written in English. The runtime UI remains compatible with the existing English/Spanish locale system.

## Acceptance criteria

- Local storage can save and restore a design with a caller-provided key.
- A custom adapter can save and restore without any backend dependency in the package.
- All three save modes behave according to their timing definitions.
- Restoration and precedence are configurable and do not trigger a save loop.
- Status and lifecycle events let a host display saving, saved, restoring, and error states.
- Storage errors leave the editor usable and observable.
- Timers and pending work are cleaned up on unmount/configuration changes.
- Focused autosave tests and the full existing suite pass.
- Docs build passes and the generated LLM documentation contains the autosave guide.
