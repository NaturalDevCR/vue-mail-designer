# Rename vue-mail-designer → vue-mailcraft Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the package from `vue-mail-designer` / `@vue-mail-designer/builder` to `vue-mailcraft` (unscoped) across the monorepo, keeping the workspace green (typecheck + tests pass).

**Architecture:** Pure string-rename across 11 already-enumerated files (package manifests, vite configs, one source file, two READMEs, demo app imports/aliases). No behavior change, no new code paths. All edits are interdependent (the demo app's workspace link breaks if the builder package is renamed but the demo's alias/tsconfig/import aren't updated in the same pass), so this ships as one task, not several.

**Tech Stack:** pnpm workspaces, Vite (lib mode), TypeScript, Vitest.

## Global Constraints

- New name: `vue-mailcraft`, **no npm scope** (per approved spec).
- Do NOT touch: the repo's on-disk directory name, the `vmd-` CSS class prefix in exported email HTML, or `docs/superpowers/plans/*.md` historical files (dated records of past work).
- `pnpm-lock.yaml` is never hand-edited — regenerate via `pnpm install` after the manifest changes.
- Spec of record: `docs/superpowers/specs/2026-08-08-rename-vue-mailcraft-design.md`.

---

### Task 1: Rename the package everywhere and verify the workspace still builds

**Files:**
- Modify: `package.json:2` (root)
- Modify: `packages/email-builder/package.json:2` and its `exports["./style.css"]` value
- Modify: `packages/email-builder/vite.config.ts:14`
- Modify: `packages/email-builder/src/store/keys.ts:9`
- Modify: `packages/email-builder/README.md` (title + install command + import specifier + style.css import)
- Modify: `README.md` (root — package name references)
- Modify: `apps/demo/package.json:12`
- Modify: `apps/demo/tsconfig.json:13`
- Modify: `apps/demo/vite.config.ts:9`
- Modify: `apps/demo/src/App.vue:16`
- Modify: `apps/demo/src/mediaLibrary.ts:1`

**Interfaces:** N/A — this task only renames identifiers/strings; no new functions, types, or exports are introduced. The public API surface (component names, exported types, function signatures) is unchanged.

- [ ] **Step 1: Root `package.json` — rename the workspace root**

In `package.json`, change:
```json
  "name": "vue-mail-designer",
```
to:
```json
  "name": "vue-mailcraft",
```
Leave `"private": true`, `"license": "MIT"`, and everything else untouched.

- [ ] **Step 2: `packages/email-builder/package.json` — rename the published package + its CSS export path**

Change:
```json
  "name": "@vue-mail-designer/builder",
```
to:
```json
  "name": "vue-mailcraft",
```

Then find the `exports` block:
```json
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./style.css": "./dist/vue-mail-designer.css"
  },
```
and change the last line to:
```json
    "./style.css": "./dist/vue-mailcraft.css"
```

- [ ] **Step 3: `packages/email-builder/vite.config.ts` — match the new CSS output filename**

At line 14, change:
```ts
      cssFileName: 'vue-mail-designer',
```
to:
```ts
      cssFileName: 'vue-mailcraft',
```
This must match the `./style.css` export path from Step 2 exactly (minus the `.css` extension) or the published `style.css` subpath export will point at a file that doesn't exist in `dist/`.

- [ ] **Step 4: `packages/email-builder/src/store/keys.ts` — update the error message tag**

At line 9, change:
```ts
  if (!pinia) throw new Error('[vue-mail-designer] Falta el contexto: usa los componentes dentro de <EmailBuilder>.')
```
to:
```ts
  if (!pinia) throw new Error('[vue-mailcraft] Falta el contexto: usa los componentes dentro de <EmailBuilder>.')
```

- [ ] **Step 5: `apps/demo/package.json` — rename the workspace dependency**

At line 12, change:
```json
    "@vue-mail-designer/builder": "workspace:*",
```
to:
```json
    "vue-mailcraft": "workspace:*",
```
Keep it in the same position in the dependency list (don't reorder other deps).

- [ ] **Step 6: `apps/demo/tsconfig.json` — rename the path alias**

At line 13, change:
```json
      "@vue-mail-designer/builder": ["../../packages/email-builder/src/index.ts"]
```
to:
```json
      "vue-mailcraft": ["../../packages/email-builder/src/index.ts"]
```

- [ ] **Step 7: `apps/demo/vite.config.ts` — rename the resolve alias**

At line 9, change:
```ts
      '@vue-mail-designer/builder': fileURLToPath(
```
to:
```ts
      'vue-mailcraft': fileURLToPath(
```
Leave the rest of that alias entry (the `fileURLToPath(...)` call and its argument) exactly as-is — only the alias key string changes.

- [ ] **Step 8: `apps/demo/src/App.vue` — update the import specifier**

At line 16, change:
```ts
import { EmailBuilder, escapeHtml, type CustomBlockDef, type EmailDocument, type MergeTagItem, type SpecialLink } from '@vue-mail-designer/builder'
```
to:
```ts
import { EmailBuilder, escapeHtml, type CustomBlockDef, type EmailDocument, type MergeTagItem, type SpecialLink } from 'vue-mailcraft'
```

- [ ] **Step 9: `apps/demo/src/mediaLibrary.ts` — update the import specifier**

At line 1, change:
```ts
import type { MediaItem, MediaLibraryOptions } from '@vue-mail-designer/builder'
```
to:
```ts
import type { MediaItem, MediaLibraryOptions } from 'vue-mailcraft'
```

- [ ] **Step 10: `packages/email-builder/README.md` — update title, install command, and code samples**

Change the title line:
```md
# @vue-mail-designer/builder
```
to:
```md
# vue-mailcraft
```

Change the install command:
```bash
pnpm add @vue-mail-designer/builder vue pinia
```
to:
```bash
pnpm add vue-mailcraft vue pinia
```

Change the import in the usage snippet:
```ts
import { EmailBuilder, type EmailDocument, type MergeTagDef } from '@vue-mail-designer/builder'
import '@vue-mail-designer/builder/style.css'
```
to:
```ts
import { EmailBuilder, type EmailDocument, type MergeTagDef } from 'vue-mailcraft'
import 'vue-mailcraft/style.css'
```

Search the rest of the file for any other literal `@vue-mail-designer/builder` or `vue-mail-designer` occurrences (e.g. in the "Licencia" section added earlier) and replace with `vue-mailcraft`.

- [ ] **Step 11: Root `README.md` — update package name references**

Search `README.md` for `vue-mail-designer` and `@vue-mail-designer/builder` (e.g. the `packages/email-builder` bullet describing the library, and the project title/description) and replace with `vue-mailcraft`. Keep the rest of the prose (stack, requisitos, comandos, estructura) unchanged — only the name references move.

- [ ] **Step 12: Grep for anything missed**

Run:
```bash
grep -rn "vue-mail-designer\|@vue-mail-designer" --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git --exclude-dir=docs .
```
Expected: no output, **except** `pnpm-lock.yaml` (handled by Step 13) — if it shows anything else, go back and fix that file before continuing. `docs/superpowers/plans/*.md` is excluded on purpose (historical record, not touched).

- [ ] **Step 13: Regenerate the lockfile**

Run:
```bash
pnpm install
```
Expected: exits 0, `pnpm-lock.yaml` diff shows the package renamed from `@vue-mail-designer/builder`/`vue-mail-designer` to `vue-mailcraft` (no dependency version changes).

- [ ] **Step 14: Typecheck + test the whole workspace**

Run:
```bash
pnpm check
```
Expected: exits 0 — `vue-tsc --noEmit` clean on `packages/email-builder` and `apps/demo`, and all Vitest suites in `packages/email-builder` passing (270 tests as of the last full run before this rename).

If typecheck fails on `apps/demo`, the most likely cause is a missed import specifier or alias (Steps 6-9) — grep again for the old name inside `apps/demo/`.

- [ ] **Step 15: Commit**

```bash
git add -A
git commit -m "chore: rename vue-mail-designer -> vue-mailcraft

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```
