# Configurable Autosave Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add opt-in, observable autosave and draft restoration to `EmailBuilder`, supporting browser storage or a user-owned async adapter, and prepare the package for tokenless npm publishing through GitHub Actions without releasing it.

**Architecture:** Keep persistence framework-neutral in a small autosave module. A storage layer handles JSON/localStorage versus the caller's custom adapter, while a controller owns timing, serialization of saves, restoration precedence, status, events, and cancellation. `EmailBuilder.vue` supplies immutable design snapshots, applies restored designs, and maps controller notifications to the public Vue API.

**Tech Stack:** Vue 3 `<script setup>`, TypeScript, Pinia, Vitest, Vue Test Utils, pnpm workspaces, VitePress, GitHub Actions, npm Trusted Publishing/OIDC.

## Global Constraints

- Autosave is opt-in: an omitted or disabled `autosave` prop must leave the existing editor behavior unchanged.
- Public modes are exactly `'change'`, `'debounce'`, and `'interval'`.
- Defaults are debounce mode, 1000 ms debounce delay, 5000 ms interval delay, restoration disabled, and initial design precedence.
- Local persistence uses JSON in browser `localStorage`; the optional injected `Storage` is supported for tests and host integrations.
- Custom persistence has a required `save` callback and an optional `load` callback; the package must not depend on Firestore, REST, IndexedDB, or another vendor.
- Restore must be explicit, configurable, and must not immediately feed the restored document back into autosave.
- Saves must not run concurrently; change mode serializes every snapshot, while debounce and interval modes coalesce to the latest dirty snapshot.
- Storage failures are observable and must not make editing unusable.
- Timers and pending async work must be invalidated on unmount and autosave reconfiguration.
- All new code comments, documentation, package metadata, workflow text, issue text, and PR text are written in English.
- The package version remains `0.1.1`; this work must not create a release tag, publish to npm, or bump any version.
- The publish workflow uses npm Trusted Publishing with `id-token: write`, the `release` environment, and no long-lived npm token.

---

## File Map

Create the following focused source files:

- `packages/email-builder/src/autosave/types.ts` — exported autosave modes, status, storage, options, and event payload types.
- `packages/email-builder/src/autosave/storage.ts` — localStorage/custom-adapter operations and browser-safe storage resolution.
- `packages/email-builder/src/autosave/controller.ts` — timing scheduler, restore precedence, save queue/coalescing, lifecycle invalidation, status, and callbacks.
- `apps/docs/guide/autosave.md` — English usage guide with local, custom remote, restore, timing, and status examples.
- `.github/workflows/publish.yml` — tag-gated npm Trusted Publisher workflow.
- `RELEASING.md` — maintainer instructions for the one-time npm/GitHub configuration and future tag release.

Modify the following existing files:

- `packages/email-builder/src/index.ts` — re-export the autosave public types.
- `packages/email-builder/src/components/EmailBuilder.vue` — add the prop, controller lifecycle, design integration, events, and exposed status getter.
- `packages/email-builder/tests/autosave.test.ts` — controller/storage behavior tests.
- `packages/email-builder/tests/public-api.test.ts` — public component API and event tests.
- `packages/email-builder/README.md` — package API, examples, events, and remote-adapter guidance.
- `apps/docs/reference/props.md` — `autosave` prop table and type/example links.
- `apps/docs/reference/events.md` — autosave lifecycle events and payloads.
- `apps/docs/reference/methods.md` — `getAutosaveStatus()`.
- `apps/docs/.vitepress/config.ts` — autosave guide sidebar link.
- `apps/docs/scripts/build-llms.mjs` — include the autosave guide and current event/method summaries in generated LLM docs.
- `docs/superpowers/specs/2026-08-11-autosave-design.md` — retain the approved design plus the publishing-readiness scope already added before implementation.

## Public Interfaces

Implement and export these exact types from `src/autosave/types.ts`:

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
  | { type: 'local'; key: string; storage?: Storage }
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

export type AutosaveStatusPayload = { status: AutosaveStatus; error?: unknown }
export type AutosaveSavedPayload = { design: EmailDocument; savedAt: number }
export type AutosaveRestoredPayload = { design: EmailDocument; restoredAt: number }
export type AutosaveErrorPayload = { operation: 'load' | 'save'; error: unknown }
```

The controller's internal callback boundary must be explicit and testable:

```ts
export type AutosaveControllerCallbacks = {
  applyRestoredDesign: (design: EmailDocument) => void
  onStatus: (payload: AutosaveStatusPayload) => void
  onSaved: (payload: AutosaveSavedPayload) => void
  onRestored: (payload: AutosaveRestoredPayload) => void
  onError: (payload: AutosaveErrorPayload) => void
}

export type AutosaveController = {
  configure: (options: AutosaveOptions | undefined, initialDesign: EmailDocument) => Promise<void>
  handleDesignChange: (design: EmailDocument) => void
  getStatus: () => AutosaveStatus
  dispose: () => void
}
```

### Task 1: Add public types and storage adapters

**Files:**
- Create: `packages/email-builder/src/autosave/types.ts`
- Create: `packages/email-builder/src/autosave/storage.ts`
- Modify: `packages/email-builder/src/index.ts`
- Test: `packages/email-builder/tests/autosave.test.ts`

**Interfaces:**
- Consumes: `EmailDocument` from `src/schema.ts`.
- Produces: the public types above and internal `readAutosave`, `writeAutosave`, and `resolveLocalStorage` functions used by Task 2.

- [ ] **Step 1: Write failing storage tests.** Add a small `MemoryStorage` test double implementing `getItem`, `setItem`, `removeItem`, `clear`, `key`, and `length`, then add tests for local JSON round-trip with that injected storage, missing keys returning `undefined`, malformed JSON throwing a load error, custom adapter load/save pass-through, and missing browser storage producing an explicit error rather than accessing `window` during SSR.

```ts
it('round-trips a local design as JSON', async () => {
  const storage = new MemoryStorage()
  const design = createDocument()
  await writeAutosave({ type: 'local', key: 'draft', storage }, design)
  expect(await readAutosave({ type: 'local', key: 'draft', storage })).toEqual(design)
})

it('does not crash when browser storage is unavailable', async () => {
  await expect(readAutosave({ type: 'local', key: 'draft' })).rejects.toThrow()
})
```

- [ ] **Step 2: Run the focused test and verify it fails for missing adapter functions.**

Run: `pnpm --filter @naturaldevcr/vue-mail-designer test -- autosave.test.ts`

Expected: FAIL because the autosave storage module and public types do not exist.

- [ ] **Step 3: Implement the types and storage operations.** Resolve an injected local `Storage` first and otherwise use `window.localStorage` only when `window` exists. Serialize with `JSON.stringify`, parse with `JSON.parse`, preserve custom adapter promises, and let storage/JSON errors reject so the controller can report the original error.

- [ ] **Step 4: Export the autosave types from the package root and rerun the focused tests.**

Run: `pnpm --filter @naturaldevcr/vue-mail-designer test -- autosave.test.ts`

Expected: PASS for all storage tests.

- [ ] **Step 5: Commit the focused unit.**

```bash
git add packages/email-builder/src/autosave packages/email-builder/src/index.ts packages/email-builder/tests/autosave.test.ts
git commit -m "feat: add autosave storage types"
```

### Task 2: Implement the autosave controller

**Files:**
- Create: `packages/email-builder/src/autosave/controller.ts`
- Modify: `packages/email-builder/tests/autosave.test.ts`

**Interfaces:**
- Consumes: `AutosaveOptions`, storage functions, and `AutosaveControllerCallbacks` from Task 1.
- Produces: `createAutosaveController(callbacks): AutosaveController` for `EmailBuilder.vue`.

- [ ] **Step 1: Add failing controller tests for the observable contract.** Define a `createCallbacks()` helper returning `vi.fn()` implementations for all five callback fields and a `designWithMarker(marker: string)` helper that clones `createDocument()` and assigns the marker to a valid document string field. Cover disabled status, default debounce delay, change-mode saves, debounce latest-value coalescing, interval dirty-only saves, no concurrent custom saves, restore precedence, missing saved drafts, status transitions, save/load error callbacks, and dispose invalidating timers and late promises.

```ts
it('debounces and saves only the latest design', async () => {
  vi.useFakeTimers()
  const save = vi.fn()
  const controller = createAutosaveController(callbacks())
  await controller.configure({ enabled: true, storage: { type: 'custom', save }, mode: 'debounce', delay: 100 }, createDocument())
  controller.handleDesignChange(designWithText('one'))
  controller.handleDesignChange(designWithText('two'))
  vi.advanceTimersByTime(99)
  expect(save).not.toHaveBeenCalled()
  vi.advanceTimersByTime(1)
  await vi.runAllTimersAsync()
  expect(save).toHaveBeenCalledTimes(1)
  expect(save).toHaveBeenCalledWith(designWithText('two'))
})
```

- [ ] **Step 2: Run the focused test and verify the scheduling assertions fail.**

Run: `pnpm --filter @naturaldevcr/vue-mail-designer test -- autosave.test.ts`

Expected: FAIL because `controller.ts` has not implemented the scheduler.

- [ ] **Step 3: Implement configuration and lifecycle invalidation.** On every `configure`, dispose the prior timer/queue, increment a generation token, set `disabled` for missing/disabled options, normalize mode/delay defaults, and start restoration only when `restore: true` and a load operation exists. Ignore late load/save completions whose generation no longer matches or whose controller was disposed.

- [ ] **Step 4: Implement restoration precedence without a save loop.** Load once, treat `undefined` as no draft, select the initial or saved design according to `restorePrecedence`, call `applyRestoredDesign` while the controller is in its restoring phase, emit `autosave-restored` only when a saved design is actually applied, and transition to `idle`/`saved` without passing restoration through `handleDesignChange`.

- [ ] **Step 5: Implement all save modes and error/status callbacks.** Clone each input snapshot before scheduling, serialize change-mode writes through a promise chain, keep only the newest pending snapshot for debounce/interval, mark interval work dirty, emit `saving`/`saved` around successful writes, and emit both `error` status and `autosave-error` while retaining editor usability after failures.

- [ ] **Step 6: Run focused tests and typecheck.**

Run: `pnpm --filter @naturaldevcr/vue-mail-designer test -- autosave.test.ts && pnpm --filter @naturaldevcr/vue-mail-designer typecheck`

Expected: PASS with no TypeScript errors.

- [ ] **Step 7: Commit the controller.**

```bash
git add packages/email-builder/src/autosave/controller.ts packages/email-builder/tests/autosave.test.ts
git commit -m "feat: implement autosave scheduling"
```

### Task 3: Integrate autosave into `EmailBuilder`

**Files:**
- Modify: `packages/email-builder/src/components/EmailBuilder.vue`
- Modify: `packages/email-builder/tests/public-api.test.ts`
- Modify: `packages/email-builder/tests/autosave.test.ts`

**Interfaces:**
- Consumes: `AutosaveOptions`, payload types, and `createAutosaveController` from Tasks 1–2.
- Produces: the `autosave` prop, four autosave events, and `getAutosaveStatus()` on the component instance.

- [ ] **Step 1: Add failing component tests.** Mount with a custom adapter, mutate the existing canvas, assert the adapter receives a cloned design, assert `autosave-saved` and status payloads, assert `getAutosaveStatus()`, verify a saved design can restore on mount, and verify parent `design` remains authoritative under default initial-design precedence.

```ts
it('exposes autosave status and saves a changed design through the adapter', async () => {
  const save = vi.fn()
  const wrapper = mount(EmailBuilder, {
    props: { autosave: { enabled: true, storage: { type: 'custom', save }, mode: 'change' } },
  })
  await wrapper.find('.vmd-canvas-empty button').trigger('click')
  await flushPromises()
  expect(save).toHaveBeenCalledTimes(1)
  expect((wrapper.vm as { getAutosaveStatus: () => string }).getAutosaveStatus()).toBe('saved')
  expect(wrapper.emitted('autosave-saved')).toBeTruthy()
})
```

- [ ] **Step 2: Run the component tests and verify they fail because the prop/API is absent.**

Run: `pnpm --filter @naturaldevcr/vue-mail-designer test -- public-api.test.ts autosave.test.ts`

Expected: FAIL on the missing `autosave` prop, controller wiring, and exposed getter.

- [ ] **Step 3: Add the prop and typed emits.** Add `autosave?: AutosaveOptions` to `defineProps`, add typed `autosave-status`, `autosave-saved`, `autosave-restored`, and `autosave-error` events, and expose `getAutosaveStatus(): AutosaveStatus` without changing existing event signatures.

- [ ] **Step 4: Wire the controller to the existing document watcher.** Continue emitting `update:design` and `change` exactly as before, pass the cloned snapshot to `handleDesignChange`, configure on mount and when the autosave prop changes, and dispose on unmount. Apply restored designs through `store.loadDesign` while the controller suppresses the corresponding design-change notification. The initial `props.design` load remains the existing baseline and does not enter undo history.

- [ ] **Step 5: Add integration edge-case tests.** Assert disabled mode performs no save, restoration does not immediately save, saved-design precedence replaces an initial design only when requested, an adapter rejection emits `autosave-error` and leaves the canvas mounted, and reconfiguration cancels a pending debounce save.

- [ ] **Step 6: Run the focused suite and typecheck.**

Run: `pnpm --filter @naturaldevcr/vue-mail-designer test -- public-api.test.ts autosave.test.ts && pnpm --filter @naturaldevcr/vue-mail-designer typecheck`

Expected: PASS with the existing public API tests unchanged except for new autosave assertions.

- [ ] **Step 7: Commit the component integration.**

```bash
git add packages/email-builder/src/components/EmailBuilder.vue packages/email-builder/tests/public-api.test.ts packages/email-builder/tests/autosave.test.ts
git commit -m "feat: expose configurable builder autosave"
```

### Task 4: Document autosave and LLM discoverability

**Files:**
- Create: `apps/docs/guide/autosave.md`
- Modify: `packages/email-builder/README.md`
- Modify: `apps/docs/reference/props.md`
- Modify: `apps/docs/reference/events.md`
- Modify: `apps/docs/reference/methods.md`
- Modify: `apps/docs/.vitepress/config.ts`
- Modify: `apps/docs/scripts/build-llms.mjs`

**Interfaces:**
- Consumes: the public types and component API from Tasks 1–3.
- Produces: English human and LLM documentation that explains configuration without prescribing a backend.

- [ ] **Step 1: Write the guide and reference examples.** Include localStorage setup with a stable key, a custom Firestore/REST-shaped adapter without importing either SDK, all timing modes, `restore` and `restorePrecedence`, status/event handling, errors, and the fact that remote data lifecycle remains the host application's responsibility.

```vue
<EmailBuilder
  :autosave="{
    enabled: true,
    storage: { type: 'local', key: 'newsletter-draft' },
    mode: 'debounce',
    delay: 1500,
    restore: true,
    restorePrecedence: 'saved-design',
  }"
  @autosave-status="onAutosaveStatus"
  @autosave-error="onAutosaveError"
/>
```

- [ ] **Step 2: Update package README, sidebar, and generated-LLM source lists.** Keep all new prose in English, update the event/method descriptions, add `autosave` to the guide ordering, and update the generated summary text from the old three-event list to include the autosave lifecycle.

- [ ] **Step 3: Build the docs and verify generated LLM output contains the guide.**

Run: `pnpm --filter docs build && rg -n "Autosave|autosave" apps/docs/public/llms.txt apps/docs/public/llms-full.txt apps/docs/.vitepress/dist/llms.txt apps/docs/.vitepress/dist/llms-full.txt`

Expected: docs build succeeds and both generated LLM documents list and contain the autosave guide.

- [ ] **Step 4: Commit the documentation.**

```bash
git add apps/docs/guide/autosave.md apps/docs/reference packages/email-builder/README.md apps/docs/.vitepress/config.ts apps/docs/scripts/build-llms.mjs
git commit -m "docs: document configurable autosave"
```

### Task 5: Add npm Trusted Publisher release readiness

**Files:**
- Create: `.github/workflows/publish.yml`
- Create: `RELEASING.md`
- Modify: `packages/email-builder/package.json` only if needed to preserve/confirm public scoped-package metadata; do not change its version.

**Interfaces:**
- Consumes: package build/check scripts and the package repository metadata.
- Produces: a tag-gated, OIDC-authenticated release path that matches npm Trusted Publisher settings.

- [ ] **Step 1: Add a static workflow/readiness test before writing the workflow.** Test the planned file contents with shell assertions after creation: workflow filename, `v*.*.*` tag trigger, `id-token: write`, `contents: read`, `environment: release`, npm registry URL, version-match check, and `npm publish ./packages/email-builder --access public`. Assert the workflow contains no `NPM_TOKEN`, `NODE_AUTH_TOKEN`, or hard-coded secret.

- [ ] **Step 2: Create `.github/workflows/publish.yml`.** Use GitHub-hosted Node 24/npm 11.5.1+ as required by npm Trusted Publishing, install with the checked-in pnpm lockfile, run the package typecheck/test/build gates, compare `${GITHUB_REF_NAME#v}` with the package version, then run `npm publish ./packages/email-builder --access public` with `id-token: write` and the `release` environment. Keep the trigger tag-only so normal pushes and local validation cannot publish.

- [ ] **Step 3: Write `RELEASING.md`.** Document the one-time npm Trusted Publisher fields exactly: GitHub Actions, `NaturalDevCR`, `vue-mail-designer`, `publish.yml`, `release`, and allowed action `npm publish`. Explain that no npm token is required, then document the later maintainer flow: bump only `packages/email-builder/package.json`, run the full checks, commit, create matching `vX.Y.Z` tag, and push the commit/tag. State that this feature branch intentionally does not perform those release steps.

- [ ] **Step 4: Validate release readiness without publishing.** Parse/check the YAML structure with the repository's available tooling, inspect the workflow diff, verify the repository URL already exactly matches `https://github.com/NaturalDevCR/vue-mail-designer`, and run a dry package build/check. Do not push a tag and do not invoke `npm publish`.

- [ ] **Step 5: Commit the release readiness changes.**

```bash
git add .github/workflows/publish.yml RELEASING.md packages/email-builder/package.json
git commit -m "ci: prepare trusted npm publishing"
```

### Task 6: Run full verification and prepare the pull request

**Files:**
- Verify all files changed by Tasks 1–5; no additional source changes are expected unless a failing check identifies a concrete defect.

- [ ] **Step 1: Run the package gates.**

Run: `pnpm install --frozen-lockfile && pnpm --filter @naturaldevcr/vue-mail-designer typecheck && pnpm --filter @naturaldevcr/vue-mail-designer test && pnpm --filter @naturaldevcr/vue-mail-designer build`

Expected: all commands exit 0 and the package build emits its normal `dist` artifacts.

- [ ] **Step 2: Run the docs gate.**

Run: `pnpm --filter docs build`

Expected: VitePress builds and regenerated LLM files include the autosave guide.

- [ ] **Step 3: Inspect the final diff and status.**

Run: `git diff --check && git status --short && git diff --stat origin/main...HEAD`

Expected: no whitespace errors, only autosave/publishing/docs files are changed, and no package version or release tag was created.

- [ ] **Step 4: Create the English GitHub issue and PR.** The issue should track configurable autosave/draft restoration and publishing readiness; the PR should summarize API, tests, docs, and the tag-only Trusted Publisher workflow, explicitly state that npm publishing is not executed yet, and link the issue.

- [ ] **Step 5: Merge only after CI and review pass.** Merge the approved PR into `main`, keep the branch and main free of a release bump/tag, and report the exact issue/PR/merge results.

## Self-review checklist

- The approved spec's local/custom persistence, three timing modes, restoration, precedence, events, error handling, cleanup, tests, and LLM docs each map to Tasks 1–4.
- Publishing was explicitly added to the spec and maps to Task 5, while the version/release boundary remains enforced by the global constraints and workflow's tag-only trigger.
- Every public type and controller method used by later tasks is defined in the Public Interfaces section.
- No task depends on an unspecified backend, package version bump, npm token, or undocumented source file.
