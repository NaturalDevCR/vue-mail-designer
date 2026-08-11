# Image Sources and Email Timer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make image blocks easy to populate from Openverse or the configured gallery, preserve reliable image drag/drop behavior, and make timer exports email-safe through an optional dynamic image provider.

**Architecture:** Reuse the existing unified Images panel and drag/drop data model. Add an inspector action that opens that panel while retaining the selected image block, so both Openverse Search and Gallery can replace the block. Keep the canvas countdown live for editing, but add a public `timerImageUrlBuilder` callback that supplies a remotely generated timer image for exported email HTML; without a provider, export a clearly documented static fallback because email clients cannot execute JavaScript or CSS countdown logic reliably.

**Tech Stack:** Vue 3 `<script setup>`, Pinia, TypeScript, Vitest, Vue Test Utils, inline email HTML rendering.

## Global Constraints

- Preserve the existing `media-image` and `canvas-image` drag payloads and undo behavior.
- Do not add a backend, timer service, or dependency to the package.
- Keep Openverse as the default search source and keep `mediaLibrary` optional.
- Keep the timer schema backward-compatible; an existing `imageUrl` always takes precedence.
- Keep package, API, documentation, issue, and pull-request content in English.
- Keep English and Spanish UI localization complete for every new editor-facing string.

---

### Task 1: Expose image-source selection from the image inspector

**Files:**
- Modify: `packages/email-builder/src/components/PropertiesPanel.vue`
- Modify: `packages/email-builder/tests/inspector-fase-b.test.ts`

**Interfaces:**
- Consumes: `useUiStore`, the selected image block, and the existing unified `ImagesPanel`.
- Produces: an inspector button that changes the active view to the Images panel without clearing the selected image block.

- [ ] **Step 1: Write the failing test**

Add a test that selects an image block, clicks the new image-source action, and verifies the UI store is switched to the Images tab while the image remains selected.

```ts
  it('opens the unified image sources while keeping the image block selected', async () => {
    const { wrapper, store } = mountInspector()
    const row = store.addRow([100])
    const block = store.addBlockToColumn(row.columns[0].id, 'image')
    store.select({ kind: 'block', id: block.id })
    await wrapper.vm.$nextTick()

    await wrapper.find('[data-action="choose-image-source"]').trigger('click')

    expect(wrapper.vm).toBeTruthy()
    expect(store.selection).toEqual({ kind: 'block', id: block.id })
  })
```

The host should expose the UI store from `mountInspector` so the test can assert `ui.panelMode === 'tab'` and `ui.sidebarTab === 'images'`.

- [ ] **Step 2: Run the focused test and verify it fails for the missing action**

Run:

```bash
pnpm --filter @naturaldevcr/vue-mail-designer test -- inspector-fase-b.test.ts
```

Expected: the new test fails because `[data-action="choose-image-source"]` does not exist.

- [ ] **Step 3: Implement the smallest inspector action**

Add a button in the image block section with the English-localized label `Choose from Images`. Its handler must set:

```ts
ui.sidebarTab = 'images'
ui.panelMode = 'tab'
```

Keep the current selection untouched. The existing `ImagesPanel.addPreviewImage()` logic will replace the selected image block after the user previews and adds an Openverse or Gallery image.

- [ ] **Step 4: Verify the source-selection flow**

Run the focused test and the existing image tests:

```bash
pnpm --filter @naturaldevcr/vue-mail-designer test -- inspector-fase-b.test.ts images-tab.test.ts media-library-tab.test.ts dnd.test.ts
```

Expected: the inspector action passes, both image sources remain available, and existing drag/drop tests continue to pass for image blocks, gallery slots, and empty canvas creation.

---

### Task 2: Add a configurable email-safe timer image provider

**Files:**
- Modify: `packages/email-builder/src/options.ts`
- Modify: `packages/email-builder/src/components/EmailBuilder.vue`
- Modify: `packages/email-builder/src/render/html.ts`
- Modify: `packages/email-builder/src/components/BlockView.vue`
- Modify: `packages/email-builder/src/components/PropertiesPanel.vue`
- Modify: `packages/email-builder/src/i18n/en.ts`
- Modify: `packages/email-builder/src/i18n/es.ts`
- Modify: `packages/email-builder/tests/render-fase-b-blocks.test.ts`
- Modify: `packages/email-builder/tests/block-view-fase-b.test.ts`
- Modify: `packages/email-builder/tests/public-api.test.ts`
- Modify: `packages/email-builder/tests/inspector-fase-b.test.ts`

**Interfaces:**
- Produces: `TimerImageUrlBuilder = (block: TimerBlock) => string | undefined`.
- Consumes: the existing `TimerBlock.imageUrl`, with the new builder used only when `imageUrl` is empty.
- Produces: `EmailBuilder` prop `timerImageUrlBuilder` and the fourth optional `renderHtml` argument.

- [ ] **Step 1: Write failing renderer and API tests**

Add a renderer test proving the callback URL is emitted when no block-level URL exists, and that an explicit `imageUrl` still wins:

```ts
  it('uses the configured timer image builder for email-safe output', () => {
    const timer = createBlock('timer') as TimerBlock
    timer.imageUrl = ''
    const html = render(timer, undefined, undefined, () => 'https://cdn.example.com/timer.gif?end=1')
    expect(html).toContain('src="https://cdn.example.com/timer.gif?end=1"')
  })
```

Add a public API test that mounts `EmailBuilder` with `timerImageUrlBuilder`, exports HTML, and verifies the callback-generated image is present.

- [ ] **Step 2: Run the focused tests and verify they fail for the missing option**

Run:

```bash
pnpm --filter @naturaldevcr/vue-mail-designer test -- render-fase-b-blocks.test.ts public-api.test.ts
```

Expected: TypeScript/test failures identify the missing callback argument and prop.

- [ ] **Step 3: Implement the provider plumbing**

Add the public type and option:

```ts
export type TimerImageUrlBuilder = (block: TimerBlock) => string | undefined
```

Add `timerImageUrlBuilder?: TimerImageUrlBuilder` to `BuilderOptions` and the `EmailBuilder` props, provide it reactively, and pass it from `exportHtml()` and `exportImage()` into `renderHtml()`.

Extend `RenderCtx` with the optional builder and make timer rendering resolve:

```ts
const timerImageUrl = block.imageUrl || ctx.timerImageUrlBuilder?.(block)
```

If a URL is available, render the existing email-compatible `<img>` branch. Otherwise retain the current static inline countdown fallback.

In `BlockView.vue`, use the same resolution for the editor preview so a configured provider is visible in the canvas. Keep the JavaScript interval for the editor-only fallback; it is not used in exported email HTML.

- [ ] **Step 4: Add an explicit email-client explanation in the inspector**

When the timer has no explicit `imageUrl` and no configured builder, render a localized help message explaining that email clients do not run JavaScript countdowns and that a dynamic image provider is required for a live exported timer.

Add matching keys to `en.ts` and `es.ts`, and keep the existing `Image URL` field for integrators who already provide a timer endpoint directly.

- [ ] **Step 5: Verify timer behavior**

Run:

```bash
pnpm --filter @naturaldevcr/vue-mail-designer test -- render-fase-b-blocks.test.ts block-view-fase-b.test.ts public-api.test.ts inspector-fase-b.test.ts
```

Expected: callback-backed timers render an image URL, explicit URLs remain authoritative, the editor fallback still shows four live units, and the inspector explains the email limitation.

---

### Task 3: Documentation and complete verification

**Files:**
- Modify: `README.md`
- Modify: `docs/llm/*` files that document public options, if present
- Modify: `docs/superpowers/plans/2026-08-11-image-sources-and-email-timer.md`

**Interfaces:**
- Documents: image-source selection, drag/drop behavior, and `timerImageUrlBuilder` integration.

- [x] **Step 1: Document the public timer integration**

Explain that CSS/JavaScript alone cannot provide a reliable live countdown in email clients. Include an English example:

```ts
const timerImageUrlBuilder = (block: TimerBlock) =>
  `https://your-domain.example/email-timer.gif?end=${encodeURIComponent(block.endDate)}`

<EmailBuilder :timer-image-url-builder="timerImageUrlBuilder" />
```

State that the application owns the endpoint, cache headers, image generation, and privacy policy; the package only emits the returned URL.

- [ ] **Step 2: Run the full verification suite**

Run:

```bash
pnpm check
pnpm build
pnpm docs:build
git diff --check
```

Expected: typecheck, all tests, package/demo builds, documentation build, and whitespace validation pass.

- [ ] **Step 3: Review the final diff**

Confirm that the image drag/drop paths remain intact, the new inspector action preserves selection, the timer builder is optional and backward-compatible, and all new package/docs/UI strings are English-first with Spanish translations.
