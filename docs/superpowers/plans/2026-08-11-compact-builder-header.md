# Compact Builder Header Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Unlayer-like builder header treatment with a compact, professional toolbar while preserving all current actions and public APIs.

**Architecture:** Keep `BuilderHeader.vue` responsible for the same existing actions and add only semantic wrappers, a monogram, and icon labels needed by the new hierarchy. Replace only the header-specific CSS in `styles.css`, using the existing theme variables so light and dark modes share one structure. Extend the focused header tests with stable structure assertions, then run package tests, typecheck, and build.

**Tech Stack:** Vue 3 `<script setup>`, TypeScript, Pinia, Vitest, Vue Test Utils, Vite CSS.

## Global Constraints

- Preserve the existing templates, saved status, theme toggle, export menu, import actions, and versions behavior.
- Use `var(--vmd-panel)`, `var(--vmd-border)`, `var(--vmd-fg)`, `var(--vmd-muted)`, and `var(--vmd-accent)` instead of a fixed navy header palette.
- Do not add props, dependencies, or public API types.
- Keep button semantics, existing titles, and visible `focus-visible` treatment.
- Collapse only non-essential labels at narrow widths; keep status and export available.
- Do not overwrite or stage unrelated pre-existing worktree changes.

---

### Task 1: Add failing tests for the compact header contract

**Files:**
- Modify: `packages/email-builder/tests/header.test.ts`

**Interfaces:**
- Consumes: the current `BuilderHeader` mount helper and existing `data-action` hooks.
- Produces: assertions for the new semantic brand/navigation/action wrappers that the markup must satisfy.

- [ ] **Step 1: Write the failing test**

Add this test inside `describe('BuilderHeader', () => { ... })`:

```ts
  it('uses a compact toolbar with separated brand, navigation, and actions', () => {
    const { wrapper } = mountHeader()

    expect(wrapper.find('.vmd-header-leading').exists()).toBe(true)
    expect(wrapper.find('.vmd-header-brand-mark').text()).toBe('V')
    expect(wrapper.find('.vmd-header-nav').exists()).toBe(true)
    expect(wrapper.find('.vmd-header-tab').text()).toContain('Plantillas')
    expect(wrapper.find('.vmd-header-actions').exists()).toBe(true)
    expect(wrapper.find('.vmd-header-status').exists()).toBe(true)
  })
```

- [ ] **Step 2: Run the focused test to verify it fails for the intended reason**

Run:

```bash
pnpm --filter @naturaldevcr/vue-mail-designer test -- header.test.ts
```

Expected: the existing tests pass, and the new test fails because `.vmd-header-leading` and the other new structural classes do not exist yet.

### Task 2: Implement the compact header markup and styling

**Files:**
- Modify: `packages/email-builder/src/components/BuilderHeader.vue`
- Modify: `packages/email-builder/src/styles.css`

**Interfaces:**
- Consumes: existing `ui`, `t()`, `ICONS`, and export/menu handlers.
- Produces: the same header behavior with the approved compact visual structure.

- [ ] **Step 1: Add semantic markup without changing handlers**

Restructure only the header shell in `BuilderHeader.vue` as follows, keeping the existing modal portal and menu markup after the action group:

```vue
  <header class="vmd-header">
    <div class="vmd-header-leading">
      <div class="vmd-header-brand">
        <span class="vmd-header-brand-mark" aria-hidden="true">V</span>
        <span class="vmd-header-brand-name">Vue Mail Designer</span>
      </div>
      <nav class="vmd-header-nav" :aria-label="t('header.templates')">
        <button type="button" class="vmd-header-tab" data-action="templates" @click="ui.galleryOpen = true">
          <span class="vmd-ico" aria-hidden="true" v-html="ICONS.gallery" />
          <span class="vmd-header-tab-label">{{ t('header.templates') }}</span>
        </button>
      </nav>
    </div>
    <div class="vmd-header-actions">
      <span class="vmd-header-status"><span class="vmd-status-dot" aria-hidden="true" />{{ t('header.saved') }}</span>
      <button
        type="button"
        class="vmd-header-btn vmd-header-btn--icon"
        data-action="theme"
        :title="ui.theme === 'dark' ? t('header.themeLight') : t('header.themeDark')"
        :aria-label="ui.theme === 'dark' ? t('header.themeLight') : t('header.themeDark')"
        @click="ui.toggleTheme()"
      >
        <span class="vmd-ico" aria-hidden="true" v-html="ui.theme === 'dark' ? ICONS.sun : ICONS.moon" />
      </button>
      <div ref="exportRoot" class="vmd-export">
        <button type="button" class="vmd-btn-export" data-action="export" @click="menuOpen = !menuOpen">
          <span class="vmd-ico" aria-hidden="true" v-html="ICONS.html" />
          <span class="vmd-btn-export-label">{{ t('header.export') }}</span>
          <span class="vmd-ico" aria-hidden="true" v-html="ICONS.chevronDown" />
        </button>
        <!-- existing vmd-export-menu remains unchanged -->
      </div>
    </div>
```

Preserve the existing `data-action` values and handler bodies. Keep the current hidden file input and modal portal blocks unchanged.

- [ ] **Step 2: Replace the base header CSS with variable-driven rules**

Update the header block in `styles.css` so it uses the editor theme and compact groups:

```css
.vmd-header {
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  min-height: 56px; padding: 0 18px; background: var(--vmd-panel);
  color: var(--vmd-fg); border-bottom: 1px solid var(--vmd-border); flex-shrink: 0;
}
.vmd-header-leading, .vmd-header-actions { display: flex; align-items: center; min-width: 0; }
.vmd-header-leading { gap: 24px; }
.vmd-header-actions { gap: 8px; }
.vmd-header-brand { display: inline-flex; align-items: center; gap: 9px; min-width: 0; font-weight: 700; font-size: 14px; letter-spacing: -0.01em; }
.vmd-header-brand-mark { display: inline-flex; align-items: center; justify-content: center; width: 27px; height: 27px; flex: none; border-radius: 8px; background: var(--vmd-accent); color: #fff; font-size: 13px; font-weight: 800; }
.vmd-header-brand-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.vmd-header-nav { display: flex; align-items: center; height: 100%; }
.vmd-header-tab, .vmd-header-btn { border: 0; cursor: pointer; color: var(--vmd-muted); background: transparent; }
.vmd-header-tab { display: inline-flex; align-items: center; gap: 7px; min-height: 34px; padding: 0 10px; border-radius: var(--vmd-radius-sm); font-size: 12px; font-weight: 650; }
.vmd-header-tab:hover { background: var(--vmd-accent-soft); color: var(--vmd-accent); }
.vmd-header-tab .vmd-ico svg { width: 15px; height: 15px; }
.vmd-header-btn { padding: 7px; border-radius: var(--vmd-radius-sm); }
.vmd-header-btn:hover { background: var(--vmd-accent-soft); color: var(--vmd-accent); }
.vmd-header-btn--icon { display: inline-flex; align-items: center; justify-content: center; }
.vmd-header-btn--icon .vmd-ico svg { width: 17px; height: 17px; }
.vmd-header-status { display: inline-flex; align-items: center; gap: 6px; padding: 6px 9px; border-radius: 999px; background: color-mix(in srgb, #22c55e 9%, var(--vmd-panel)); color: color-mix(in srgb, #16a34a 78%, var(--vmd-fg)); font-size: 11px; font-weight: 650; white-space: nowrap; }
.vmd-status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.vmd-export { position: relative; }
.vmd-btn-export { display: inline-flex; align-items: center; gap: 6px; min-height: 34px; padding: 0 11px; border: 1px solid color-mix(in srgb, var(--vmd-accent) 35%, var(--vmd-border)); border-radius: var(--vmd-radius-sm); background: var(--vmd-accent); color: #fff; cursor: pointer; font-size: 12px; font-weight: 750; }
.vmd-btn-export:hover { background: color-mix(in srgb, var(--vmd-accent) 88%, #000); }
.vmd-btn-export .vmd-ico svg { width: 14px; height: 14px; }
```

Remove or override the later modern-system header rules so they do not restore the fixed `#111a2c` background or old button geometry. Keep the export menu rules and shared focus-visible rule intact.

- [ ] **Step 3: Add narrow-layout overrides**

Add these rules in the existing media query:

```css
  .vmd-header { padding: 0 12px; gap: 8px; }
  .vmd-header-leading { gap: 8px; }
  .vmd-header-brand-name, .vmd-header-tab-label, .vmd-header-status { display: none; }
  .vmd-header-tab { padding: 7px; }
  .vmd-btn-export-label { display: none; }
  .vmd-btn-export { padding: 0 9px; }
```

Keep the monogram, gallery icon, status dot, theme icon, export icon, and chevron visible so the compact layout remains understandable through existing title/aria labels.

### Task 3: Run verification and inspect the scoped diff

**Files:**
- Verify: `packages/email-builder/src/components/BuilderHeader.vue`
- Verify: `packages/email-builder/src/styles.css`
- Verify: `packages/email-builder/tests/header.test.ts`

**Interfaces:**
- Consumes: the implementation from Task 2.
- Produces: evidence that the header behavior, type safety, tests, and build remain intact.

- [ ] **Step 1: Run the focused header test**

```bash
pnpm --filter @naturaldevcr/vue-mail-designer test -- header.test.ts
```

Expected: all header tests pass.

- [ ] **Step 2: Run the full package test suite**

```bash
pnpm --filter @naturaldevcr/vue-mail-designer test
```

Expected: Vitest exits 0 with zero failed tests.

- [ ] **Step 3: Run typecheck and build**

```bash
pnpm typecheck
pnpm build
```

Expected: vue-tsc and both Vite builds exit 0.

- [ ] **Step 4: Review only the intended diff**

```bash
git diff -- packages/email-builder/src/components/BuilderHeader.vue packages/email-builder/src/styles.css packages/email-builder/tests/header.test.ts
git status --short
```

Confirm that the pre-existing modal and image-related changes remain untouched and that no unrelated files are staged or modified by this task.
