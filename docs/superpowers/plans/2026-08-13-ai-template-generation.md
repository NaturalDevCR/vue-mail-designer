# AI Template Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an optional provider-agnostic AI workflow that creates new email designs or modifies the current design, previews 1–3 validated proposals, and applies the selected proposal safely.

**Architecture:** `EmailBuilder` exposes `aiTemplates` and injects it through the existing reactive builder options. A focused `AiTemplateMenu` resolves dynamic context, builds a structured `AiTemplateRequest`, calls the host's `generate` callback, validates proposals with the existing Zod document schema plus custom-block registration checks, and applies only the user's selected design through `loadDesign`. The package never calls a provider directly or stores credentials.

**Tech Stack:** Vue 3 `<script setup>`, Pinia, TypeScript, Zod, Vitest, Vue Test Utils, existing portal/i18n/style patterns.

## Global Constraints

- The user explicitly selects `create` or `edit`; do not infer mode from prompt text.
- The user selects `count` 1, 2, or 3; default to 1.
- `context` is resolved at submit time and supports an object or a sync/async resolver.
- `currentDesign` is included only for edit requests and must be cloned.
- Every proposal design must pass `zEmailDocument`; unknown registered custom block types are invalid.
- Preview, apply, discard, stale-request, context-error, and provider-error behavior must be tested.
- Do not add provider SDKs, API keys, server routes, streaming, image generation, or JSON patch operations.
- Preserve unrelated worktree changes; only stage files belonging to this feature when committing.

---

### Task 1: Add the public AI template contract and validation helpers

**Files:**
- Create: `packages/email-builder/src/ai/templateGeneration.ts`
- Modify: `packages/email-builder/src/options.ts`
- Modify: `packages/email-builder/src/index.ts`
- Test: `packages/email-builder/tests/ai-template-generation.test.ts`

**Interfaces:**
- Produces `AiTemplateMode`, `AiTemplateContext`, `AiTemplateRequest`, `AiTemplateProposal`, `AiTemplateOptions`.
- Produces `resolveAiTemplateContext(context)`, `buildAiTemplateRequest(input)`, and `validateAiTemplateProposals(value, customBlocks)`.
- Consumes `EmailDocument`, `zEmailDocument`, `BlockType`, `CustomBlockDef`, and `MergeTagItem`.

- [ ] **Step 1: Write failing contract and validation tests**

Add tests that define the public behavior:

```ts
it('resolves a plain context object', async () => {
  await expect(resolveAiTemplateContext({ language: 'es' })).resolves.toEqual({ language: 'es' })
})

it('resolves a context function at request time', async () => {
  const context = vi.fn().mockResolvedValue({ campaignId: 'current' })
  await expect(resolveAiTemplateContext(context)).resolves.toEqual({ campaignId: 'current' })
  expect(context).toHaveBeenCalledOnce()
})

it('builds create and edit requests with cloned designs', () => {
  const design = createDocument()
  const create = buildAiTemplateRequest({ mode: 'create', prompt: 'Welcome', count: 1, context: {}, design, mergeTags: [], customBlocks: [] })
  const edit = buildAiTemplateRequest({ mode: 'edit', prompt: 'Make it elegant', count: 3, context: {}, design, mergeTags: [], customBlocks: [] })
  expect(create.currentDesign).toBeUndefined()
  expect(edit.currentDesign).toEqual(design)
  expect(edit.currentDesign).not.toBe(design)
  expect(edit.count).toBe(3)
})

it('accepts valid proposals and rejects malformed or unknown custom blocks', () => {
  const valid = { title: 'Proposal', design: createDocument() }
  expect(validateAiTemplateProposals([valid], [])).toEqual([valid])
  expect(() => validateAiTemplateProposals([{ title: 'Broken', design: { rows: [] } }], [])).toThrow()
  const custom = { ...createDocument(), rows: [{ ...createRow([100]), columns: [{ ...createColumn(100), blocks: [{ id: 'x', type: 'custom', customType: 'missing', data: {}, style: { padding: { top: 0, right: 0, bottom: 0, left: 0 } } }] }] }] }
  expect(() => validateAiTemplateProposals([{ title: 'Custom', design: custom }], [])).toThrow()
})
```

Use the repository's existing `createDocument`, `createRow`, and `createColumn` factories so tests remain schema-valid.

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `pnpm --filter @naturaldevcr/vue-mail-designer test -- ai-template-generation.test.ts`

Expected: FAIL because the new module and exported types do not exist.

- [ ] **Step 3: Implement the contract and validation**

Define the types in `options.ts` so consumers can use them in prop declarations. Implement `templateGeneration.ts` as a provider-neutral module:

```ts
export async function resolveAiTemplateContext(context?: AiTemplateContext): Promise<Record<string, unknown>> {
  if (!context) return {}
  const value = typeof context === 'function' ? await context() : context
  return { ...value }
}

export function validateAiTemplateProposals(value: unknown, customBlocks: CustomBlockDef[]): AiTemplateProposal[] {
  if (!Array.isArray(value) || value.length === 0) throw new Error('AI returned no proposals.')
  const registered = new Set(customBlocks.map((block) => block.type))
  return value.map((proposal) => {
    const parsed = zAiTemplateProposal.parse(proposal)
    zEmailDocument.parse(parsed.design)
    assertRegisteredCustomBlocks(parsed.design, registered)
    return clone(parsed)
  })
}
```

The proposal schema should require a non-empty `title`, allow an optional `description`, and accept `design` as unknown before parsing it with `zEmailDocument`. Walk every row/column/block recursively and throw for a `custom` block whose `customType` is not in the registered set. `buildAiTemplateRequest` must clone the edit design, copy configured block/merge-tag metadata, and set `schemaVersion: 1`.

- [ ] **Step 4: Run the focused tests to verify they pass**

Run: `pnpm --filter @naturaldevcr/vue-mail-designer test -- ai-template-generation.test.ts`

Expected: PASS.

- [ ] **Step 5: Export the public types and helpers**

Export the types from `options.ts` through `index.ts`; export only the stable request/response types and the validation/context helpers needed by host adapters. Do not export private traversal helpers.

- [ ] **Step 6: Commit the contract**

Run:

```bash
git add packages/email-builder/src/ai/templateGeneration.ts packages/email-builder/src/options.ts packages/email-builder/src/index.ts packages/email-builder/tests/ai-template-generation.test.ts
git commit -m "feat(ai): add template generation contract"
```

---

### Task 2: Wire the option into `EmailBuilder` and builder injection

**Files:**
- Modify: `packages/email-builder/src/components/EmailBuilder.vue`
- Modify: `packages/email-builder/src/options.ts`
- Test: `packages/email-builder/tests/email-builder-config.test.ts`

**Interfaces:**
- Consumes `AiTemplateOptions` from Task 1.
- Produces a reactive `options.aiTemplates` value available to `BuilderHeader` and `AiTemplateMenu`.

- [ ] **Step 1: Write failing configuration tests**

Add a test that mounts `EmailBuilder` with an `aiTemplates` object, injects/reads the provided options through a small test child, and verifies that changing the prop updates the injected value without remounting. Add a test that the default value is `undefined`.

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `pnpm --filter @naturaldevcr/vue-mail-designer test -- email-builder-config.test.ts`

Expected: FAIL because `aiTemplates` is not a prop or injected option.

- [ ] **Step 3: Implement reactive prop plumbing**

Add `aiTemplates?: AiTemplateOptions` to the `EmailBuilder` prop type and add a getter to the existing `reactive({ ... })` object provided under `BUILDER_OPTIONS_KEY`. Keep the getter pattern so replacing the host's context/generate callback is visible to child components.

- [ ] **Step 4: Run the focused tests and typecheck**

Run: `pnpm --filter @naturaldevcr/vue-mail-designer test -- email-builder-config.test.ts && pnpm --filter @naturaldevcr/vue-mail-designer typecheck`

Expected: PASS with no TypeScript errors.

- [ ] **Step 5: Commit the wiring**

Run:

```bash
git add packages/email-builder/src/components/EmailBuilder.vue packages/email-builder/src/options.ts packages/email-builder/tests/email-builder-config.test.ts
git commit -m "feat(ai): expose template options"
```

---

### Task 3: Build the template-generation UI and request lifecycle

**Files:**
- Create: `packages/email-builder/src/components/AiTemplateMenu.vue`
- Modify: `packages/email-builder/src/components/BuilderHeader.vue`
- Reuse: `packages/email-builder/src/components/ModalPortal.vue` without changes
- Modify: `packages/email-builder/src/i18n/en.ts`
- Modify: `packages/email-builder/src/i18n/es.ts`
- Modify: `packages/email-builder/src/styles.css`
- Test: `packages/email-builder/tests/ai-template-generation-menu.test.ts`

**Interfaces:**
- Consumes injected `options.aiTemplates`, `useDocumentStore`, `useBuilderPinia`, `useI18n`, `buildAiTemplateRequest`, `resolveAiTemplateContext`, and `validateAiTemplateProposals`.
- Produces a header action and a portal-mounted popover/modal with mode, prompt, count, loading, error, proposal preview, apply, discard, and regenerate states.

- [ ] **Step 1: Write failing UI tests for the initial state and explicit modes**

Mount `BuilderHeader` with injected enabled options and a document store. Assert that the AI action is visible only when enabled, the menu requires an explicit mode, offers `create` and `edit`, and defaults count to `1`. Assert that the Generate button stays disabled until a mode and non-empty prompt are present.

- [ ] **Step 2: Run the focused UI test to verify it fails**

Run: `pnpm --filter @naturaldevcr/vue-mail-designer test -- ai-template-generation-menu.test.ts`

Expected: FAIL because the header action and component do not exist.

- [ ] **Step 3: Implement the form and request lifecycle**

Create `AiTemplateMenu.vue` using the existing portal pattern. Keep state local to the menu:

```ts
const mode = ref<AiTemplateMode | null>(null)
const prompt = ref('')
const count = ref<1 | 2 | 3>(1)
const proposals = ref<AiTemplateProposal[]>([])
const loading = ref(false)
const errorMessage = ref('')
let requestId = 0
```

On submit:

1. Increment and capture a request id.
2. Read `store.getDesign()` or the equivalent cloned document snapshot.
3. Resolve the current `context`.
4. Call `buildAiTemplateRequest`, omitting `currentDesign` for create mode.
5. Await the host's `generate` callback.
6. Ignore the result if the request id is stale or the component is unmounted.
7. Validate proposals and show only valid results.

Display one preview card per proposal using the existing `PreviewDialog`/HTML rendering path or a focused preview component that calls `renderHtml` with the current fonts and custom blocks. Do not execute arbitrary model-produced scripts. Applying a card calls the existing exposed/store load path, closes the menu, and leaves the host's normal update/change/autosave watchers responsible for persistence. Discard and close leave the store untouched.

The UI must show generic localized errors for context, provider, and validation failures while retaining the original error only in the emitted `ai-templates-error` payload. `AiTemplateMenu` emits `error`, `BuilderHeader` forwards it as `ai-templates-error`, and `EmailBuilder` forwards that event to the host. Keep the public payload `{ operation: 'context' | 'generate' | 'validate'; error: unknown }`.

- [ ] **Step 4: Add localized strings and focused styles**

Add English and Spanish keys for the action, mode labels, prompt placeholder, proposal count, generate, loading, preview, apply, discard, regenerate, empty response, provider failure, and invalid proposal. Add styles under the existing `vmd-` namespace for the menu, mode selector, count selector, proposal cards, and loading/error states. Respect the existing light/dark CSS variables and avoid global selectors.

- [ ] **Step 5: Run the focused UI tests**

Run: `pnpm --filter @naturaldevcr/vue-mail-designer test -- ai-template-generation-menu.test.ts`

Expected: the initial-state tests pass; lifecycle tests from Task 4 are still pending.

- [ ] **Step 6: Commit the UI shell**

Run:

```bash
git add packages/email-builder/src/components/AiTemplateMenu.vue packages/email-builder/src/components/BuilderHeader.vue packages/email-builder/src/i18n/en.ts packages/email-builder/src/i18n/es.ts packages/email-builder/src/styles.css packages/email-builder/tests/ai-template-generation-menu.test.ts
git commit -m "feat(ai): add template generation menu"
```

---

### Task 4: Cover create/edit request behavior and proposal review

**Files:**
- Modify: `packages/email-builder/tests/ai-template-generation-menu.test.ts`
- Modify: `packages/email-builder/src/components/AiTemplateMenu.vue`
- Modify: `packages/email-builder/src/components/EmailBuilder.vue`

**Interfaces:**
- Consumes the UI shell and public contract from Tasks 1–3.
- Produces verified behavior for provider calls, context timing, validation, preview, apply, discard, and stale responses.

- [ ] **Step 1: Add failing lifecycle tests**

Cover these cases with a deferred promise helper:

```ts
it('sends create mode without currentDesign and forwards count', async () => { /* click create, choose 3, submit, inspect request */ })
it('sends edit mode with a cloned currentDesign', async () => { /* click edit, submit, inspect request identity */ })
it('reads a changing context only when Generate is clicked', async () => { /* mutate reactive context before submit */ })
it('shows multiple valid proposal previews and applies only the selected design', async () => { /* return two documents, apply second, assert update */ })
it('does not mutate the design when discarded or closed', async () => { /* return a proposal, discard, compare design */ })
it('ignores a stale provider response after a newer request', async () => { /* resolve second request first */ })
it('reports provider, context, and validation errors without crashing the builder', async () => { /* reject or return malformed data */ })
```

Use `createDocument()` as the baseline and assert the host `generate` callback received the exact mode/count semantics defined in the contract.

- [ ] **Step 2: Run the tests to verify the missing lifecycle behavior**

Run: `pnpm --filter @naturaldevcr/vue-mail-designer test -- ai-template-generation-menu.test.ts`

Expected: FAIL for the unimplemented or incomplete lifecycle cases.

- [ ] **Step 3: Complete the apply/error/event wiring**

Expose an `onError` callback through the injected options or a local event bridge so `EmailBuilder` emits `ai-templates-error`. Ensure applying a proposal uses `store.loadDesign(validatedDesign)`, closes the overlay, clears transient state, and does not call the provider again. Ensure all async continuations check the request id and mounted flag before changing Vue state.

- [ ] **Step 4: Run the lifecycle tests**

Run: `pnpm --filter @naturaldevcr/vue-mail-designer test -- ai-template-generation-menu.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit verified lifecycle behavior**

Run:

```bash
git add packages/email-builder/src/components/AiTemplateMenu.vue packages/email-builder/src/components/EmailBuilder.vue packages/email-builder/tests/ai-template-generation-menu.test.ts
git commit -m "test(ai): cover template proposal lifecycle"
```

---

### Task 5: Add host-facing documentation and deterministic demo integration

**Files:**
- Create: `apps/docs/guide/ai-template-generation.md`
- Modify: `apps/docs/reference/props.md`
- Modify: `apps/docs/reference/events.md`
- Modify: `apps/demo/src/App.vue`
- Create or modify: `apps/demo/src/demoTemplateAi.ts`
- Test: `packages/email-builder/tests/public-api.test.ts` if generated declarations are covered there

**Interfaces:**
- Consumes the public `AiTemplateOptions` contract and demo's existing deterministic AI fallback style.
- Produces copy-pasteable provider and backend examples, dynamic context guidance, and an offline demo flow.

- [ ] **Step 1: Add documentation examples**

Document the prop, explicit mode/count behavior, dynamic object/function context, request shape, proposal shape, validation boundary, preview/apply lifecycle, and API-key guidance. Include a backend-owned callback example:

```ts
const generate = async (request: AiTemplateRequest): Promise<AiTemplateProposal[]> => {
  const response = await fetch('/api/email-ai/templates', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (!response.ok) throw new Error('Template generation failed')
  return await response.json() as AiTemplateProposal[]
}
```

State explicitly that the browser should call the host backend rather than exposing provider credentials, and that the adapter may call any provider or local model.

- [ ] **Step 2: Add a deterministic demo adapter**

Create a local adapter that returns schema-valid create and edit proposals based on the requested mode/count, using existing factories and no network. It must visibly demonstrate that edit mode receives and transforms the current design, while create mode starts from `createDocument()`.

- [ ] **Step 3: Wire the demo and update reference pages**

Enable `aiTemplates` in the demo with a reactive campaign context and link the new guide from the props/reference docs. Document the `ai-templates-error` event payload in `events.md`.

- [ ] **Step 4: Run documentation/demo checks**

Run: `pnpm --filter @naturaldevcr/vue-mail-designer typecheck && pnpm --filter docs build`

Expected: PASS and the demo compiles without provider credentials.

- [ ] **Step 5: Commit documentation and demo**

Run:

```bash
git add apps/docs/guide/ai-template-generation.md apps/docs/reference/props.md apps/docs/reference/events.md apps/demo/src/App.vue apps/demo/src/demoTemplateAi.ts packages/email-builder/tests/public-api.test.ts
git commit -m "docs(ai): document template generation"
```

---

### Task 6: Full verification and release handoff

**Files:**
- Modify only files needed to correct verified failures from Tasks 1–5.
- Test: all existing package tests and typechecks.

- [ ] **Step 1: Run the full package test suite**

Run: `pnpm --filter @naturaldevcr/vue-mail-designer test`

Expected: PASS with the existing suite and all new AI template tests.

- [ ] **Step 2: Run typechecks and production builds**

Run: `pnpm --filter @naturaldevcr/vue-mail-designer typecheck && pnpm --filter @naturaldevcr/vue-mail-designer build && pnpm --filter docs build`

Expected: PASS; generated declarations include the new public types and the package build contains the new component/styles.

- [ ] **Step 3: Run a final diff audit**

Run: `git diff HEAD~5 --check` and `git status --short`

Confirm no API keys, provider-specific dependencies, unrelated user changes, placeholders, or raw provider response logging were added. Confirm that only intended feature commits appear after the pre-existing worktree changes.

- [ ] **Step 4: Commit only verified corrections**

If the verification steps require fixes, stage the exact feature files reported by `git diff --name-only` and use a focused conventional commit:

```bash
git add packages/email-builder/src/ai/templateGeneration.ts packages/email-builder/src/components/AiTemplateMenu.vue packages/email-builder/src/components/BuilderHeader.vue packages/email-builder/src/components/EmailBuilder.vue packages/email-builder/tests/ai-template-generation.test.ts packages/email-builder/tests/ai-template-generation-menu.test.ts
git commit -m "fix(ai): stabilize template generation"
```

If no fixes are needed, do not create an empty commit.
