# Unified Image Library and English-First Localization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (\`- [ ]\`) syntax for tracking.

**Goal:** Combine image search and the media library into one Images panel with square thumbnails and confirm-before-insert previews, while making the editor English-first and configurable for English or Spanish.

**Architecture:** ImagesPanel.vue will own the horizontal Search/Gallery tabs, preview state, and the existing document insertion behavior. ImagesTab.vue and MediaLibraryTab.vue will remain focused on fetching/rendering their own data and emit a shared image-selection model; ImagePreviewDialog.vue will provide the reusable confirmation UI. The existing Pragmatic Drag and Drop payloads and canvas drop handlers remain the source of truth for drag behavior. Localization will use English as the base dictionary and move remaining user-facing literals behind the existing useI18n() provider.

**Tech Stack:** Vue 3 <script setup>, TypeScript, Pinia, Vitest, Vue Test Utils, Vite, CSS, @atlaskit/pragmatic-drag-and-drop, pnpm workspaces.

## Global Constraints

- The public language option remains locale?: 'en' | 'es' | LocaleDict.
- When locale is omitted, the editor defaults to English.
- A custom LocaleDict overlays English and falls back to English for missing keys.
- The Gallery subtab is rendered only when mediaLibrary is configured.
- Clicking a thumbnail opens a preview and must not mutate the document until Add is pressed.
- Dragging a thumbnail continues to use the full image URL and existing media-image canvas destinations.
- User-provided content, template copy, custom block labels, and special-link values are not automatically translated.
- New and changed UI labels, code comments, documentation, issue text, and PR text are written in English.
- Every production behavior change follows TDD: write a failing test, run it to observe the expected failure, implement the smallest fix, then rerun the targeted and relevant full suites.
- Do not add a new dependency or change the document schema.

---

## File Map

### New files

- packages/email-builder/src/components/tabs/ImagesPanel.vue — unified Images rail content, horizontal subtab state, preview state, and insertion callback.
- packages/email-builder/src/components/ImagePreviewDialog.vue — reusable image preview modal with Cancel/Add actions.
- packages/email-builder/src/components/tabs/imageTypes.ts — shared ImageSelection type emitted by both image sources.

### Existing files to modify

- packages/email-builder/src/components/SidePanel.vue — render ImagesPanel for the one Images rail entry and remove the Gallery rail entry.
- packages/email-builder/src/store/ui.ts — remove media from sidebarTab.
- packages/email-builder/src/components/tabs/ImagesTab.vue — emit selection data, localize all visible strings, and retain search/drag behavior.
- packages/email-builder/src/components/tabs/MediaLibraryTab.vue — emit selection data, localize all visible strings, and retain upload/list/pagination/rename/delete/drag behavior.
- packages/email-builder/src/components/tabs/DraggableImageThumb.vue — preserve drag payloads while forwarding thumbnail clicks to the preview flow; add accessible labels if required by the localized UI.
- packages/email-builder/src/components/EmailBuilder.vue — default locale resolution to English and pass the resolved locale to the i18n provider.
- packages/email-builder/src/i18n/useI18n.ts — make English the provider fallback and support a resolved en/es locale.
- packages/email-builder/src/i18n/en.ts — add the canonical complete English key set for all editor-facing strings.
- packages/email-builder/src/i18n/es.ts — add Spanish translations for every canonical key.
- packages/email-builder/src/components/UnlayerImportDialog.vue, TemplateGallery.vue, PreviewDialog.vue, ImageEditorModal.vue, and components/image-editor/CropPanel.vue — replace hard-coded visible strings with i18n keys.
- packages/email-builder/src/components/BlockView.vue, PropertiesPanel.vue, tabs/BodyTab.vue, components/fields/PaddingField.vue, and any other component found by the hard-coded-string audit — replace user-facing literals, titles, placeholders, and errors with i18n keys.
- packages/email-builder/src/styles.css — square thumbnail frames, unified subtab styling, and preview-dialog layout.
- packages/email-builder/tests/images-tab.test.ts — update click expectations to preview/Add and add square/search selection coverage.
- packages/email-builder/tests/media-library-tab.test.ts — update unified-panel selectors and preview/Add behavior while retaining library CRUD coverage.
- packages/email-builder/tests/sidepanel.test.ts — assert one Images rail entry and no separate Gallery rail entry.
- packages/email-builder/tests/i18n.test.ts — change default-language expectations and add Spanish/custom fallback coverage.
- packages/email-builder/tests/dnd.test.ts and/or a focused image-panel test — verify both sources still expose the full media-image drag payload.
- packages/email-builder/README.md, apps/docs/reference/props.md, and apps/docs/guide/introduction.md — document English as the default and English/Spanish locale configuration.

---

### Task 1: Add the shared image-selection model and preview dialog

**Files:**
- Create: packages/email-builder/src/components/tabs/imageTypes.ts
- Create: packages/email-builder/src/components/ImagePreviewDialog.vue
- Modify: packages/email-builder/src/styles.css
- Test: packages/email-builder/tests/image-preview-dialog.test.ts

**Interfaces:**
- Produces ImageSelection:

~~~ts
export type ImageSelection = {
  src: string
  thumbnailUrl: string
  alt: string
  title?: string
}
~~~

- Consumes a non-null image prop and emits close and add:

~~~ts
defineProps<{ image: ImageSelection }>()
defineEmits<{ close: []; add: [] }>()
~~~

- ImagePreviewDialog is mounted only when an image is selected; its modal does not write to the document store.

- [ ] Step 1: Write the failing tests

Mount ImagePreviewDialog with a real ImageSelection and assert:

~~~ts
it('shows the full image and emits add only when Add is pressed', async () => {
  const wrapper = mount(ImagePreviewDialog, { props: { image } })
  expect(wrapper.find('.vmd-image-preview-dialog img').attributes('src')).toBe(image.src)
  expect(wrapper.emitted('add')).toBeUndefined()
  await wrapper.find('[data-action="image-preview-add"]').trigger('click')
  expect(wrapper.emitted('add')).toHaveLength(1)
})
~~~

Add separate tests for Cancel, close, and backdrop click emitting close, and for title/alt rendering without changing the source URL.

- [ ] Step 2: Run the focused test to verify it fails

Run:

~~~bash
pnpm --filter @naturaldevcr/vue-mail-designer exec vitest run tests/image-preview-dialog.test.ts
~~~

Expected: Vitest fails because ImagePreviewDialog.vue and its selectors do not exist yet.

- [ ] Step 3: Implement the minimal dialog and styles

Implement the modal with the existing .vmd-modal/.vmd-modal-box visual language. Use t('common.close'), t('images.cancel'), and t('images.add') for all visible labels; add the dialog keys to the English/Spanish dictionaries before wiring the component, with the complete key audit in Task 4. Use @click.self on the backdrop and data-action="image-preview-add" for the Add button.

Add a preview layout in styles.css where the large image uses max-width: 100%, max-height: 60vh, and object-fit: contain; do not use cover in the preview.

- [ ] Step 4: Run the focused test to verify it passes

Run the same Vitest command. Expected: all dialog tests pass with no document-store dependency.

- [ ] Step 5: Commit

~~~bash
git add packages/email-builder/src/components/tabs/imageTypes.ts packages/email-builder/src/components/ImagePreviewDialog.vue packages/email-builder/src/styles.css packages/email-builder/tests/image-preview-dialog.test.ts
git commit -m "feat(images): add image preview dialog"
~~~

### Task 2: Build the unified Images panel and preserve insertion behavior

**Files:**
- Create: packages/email-builder/src/components/tabs/ImagesPanel.vue
- Modify: packages/email-builder/src/components/tabs/ImagesTab.vue
- Modify: packages/email-builder/src/components/tabs/MediaLibraryTab.vue
- Modify: packages/email-builder/src/components/SidePanel.vue
- Modify: packages/email-builder/src/store/ui.ts
- Test: packages/email-builder/tests/images-tab.test.ts
- Test: packages/email-builder/tests/media-library-tab.test.ts
- Test: packages/email-builder/tests/sidepanel.test.ts

**Interfaces:**
- ImagesTab.vue emits select: [image: ImageSelection] and continues to render DraggableImageThumb with src set to the full URL.
- MediaLibraryTab.vue emits select: [image: ImageSelection] and keeps its MediaItem-specific CRUD methods internal.
- ImagesPanel.vue owns:

~~~ts
const activeTab = ref<'search' | 'gallery'>('search')
const previewImage = ref<ImageSelection | null>(null)
function openPreview(image: ImageSelection): void
function closePreview(): void
function addPreviewImage(): void
~~~

- addPreviewImage() copies the existing insertion logic from ImagesTab.selectImage()/MediaLibraryTab.insert(): update a selected image block while preserving a non-empty alt, otherwise add a row/block and set src/alt, then close the preview.

- [ ] Step 1: Write failing integration tests

Update panel tests to assert:

~~~ts
it('uses one Images rail tab with Search and optional Gallery subtabs', async () => {
  const wrapper = mount(EmailBuilder, { props: { mediaLibrary: makeMediaLibrary() } })
  await wrapper.find('[data-tab="images"]').trigger('click')
  expect(wrapper.find('[data-subtab="search"]').exists()).toBe(true)
  expect(wrapper.find('[data-subtab="gallery"]').exists()).toBe(true)
  expect(wrapper.find('[data-tab="media"]').exists()).toBe(false)
})

it('opens preview without inserting until Add is pressed', async () => {
  const wrapper = await searchWithResults()
  await wrapper.find('.vmd-image-result').trigger('click')
  expect(wrapper.find('.vmd-image-preview-dialog').exists()).toBe(true)
  expect(wrapper.emitted('update:design')).toBeUndefined()
  await wrapper.find('[data-action="image-preview-add"]').trigger('click')
  expect(wrapper.emitted('update:design')).toBeTruthy()
})
~~~

Add the matching Gallery test, selected-block alt-preservation test, Cancel/close no-mutation test, conditional Gallery-subtab test, and assertions that image thumbnail buttons expose a square-frame class/style.

- [ ] Step 2: Run the focused tests to verify they fail

Run:

~~~bash
pnpm --filter @naturaldevcr/vue-mail-designer exec vitest run tests/images-tab.test.ts tests/media-library-tab.test.ts tests/sidepanel.test.ts
~~~

Expected: failures show the old separate media rail and immediate insertion behavior.

- [ ] Step 3: Implement the panel composition and event boundaries

Create ImagesPanel.vue with a horizontal tab bar and a single ImagePreviewDialog. Keep Gallery hidden when options.mediaLibrary is undefined. Pass selection events from both child views to openPreview.

Remove useDocumentStore and direct insertion functions from ImagesTab.vue and MediaLibraryTab.vue; they should only fetch/render and emit ImageSelection values. Preserve all existing list, upload, pagination, rename, delete, error, and drag code.

Update SidePanel.vue to render ImagesPanel for ui.sidebarTab === 'images', remove the media entry from TABS, and update store/ui.ts's sidebarTab type to 'content' | 'blocks' | 'body' | 'images'.

Add square grid rules in styles.css:

~~~css
.vmd-image-result,
.vmd-media-item-thumb { aspect-ratio: 1; }
.vmd-image-result img,
.vmd-media-item-thumb img { width: 100%; height: 100%; object-fit: cover; }
~~~

- [ ] Step 4: Run the focused tests to verify they pass

Run the same three test files. Expected: preview/Add, unified tabs, insertion, CRUD, and panel assertions pass.

- [ ] Step 5: Commit

~~~bash
git add packages/email-builder/src/components/tabs/ImagesPanel.vue packages/email-builder/src/components/tabs/ImagesTab.vue packages/email-builder/src/components/tabs/MediaLibraryTab.vue packages/email-builder/src/components/SidePanel.vue packages/email-builder/src/store/ui.ts packages/email-builder/src/styles.css packages/email-builder/tests/images-tab.test.ts packages/email-builder/tests/media-library-tab.test.ts packages/email-builder/tests/sidepanel.test.ts
git commit -m "feat(images): unify search and media library"
~~~

### Task 3: Add localization keys and English-default resolution

**Files:**
- Modify: packages/email-builder/src/components/EmailBuilder.vue
- Modify: packages/email-builder/src/i18n/useI18n.ts
- Modify: packages/email-builder/src/i18n/en.ts
- Modify: packages/email-builder/src/i18n/es.ts
- Modify: packages/email-builder/src/i18n/keys.ts if a typed key helper is useful
- Test: packages/email-builder/tests/i18n.test.ts

**Interfaces:**
- Keep the public prop type exactly locale?: 'en' | 'es' | LocaleDict.
- provideI18n must accept a dictionary getter and an optional resolved locale getter, defaulting to 'en':

~~~ts
provideI18n(
  dict: LocaleDict | (() => LocaleDict),
  locale: 'en' | 'es' | (() => 'en' | 'es') = 'en',
): void
~~~

- useI18n() fallback must return { t: key => key, locale: 'en' } outside an EmailBuilder provider.

- [ ] Step 1: Write failing i18n tests

Change the existing default-language test to expect English, then add:

~~~ts
it('uses English as the fallback for a partial custom dictionary', () => {
  const wrapper = mount(EmailBuilder, { props: { locale: { 'rail.images': 'Assets' } } })
  expect(wrapper.find('[data-tab="images"]').text()).toContain('Assets')
  expect(wrapper.text()).toContain('Content')
})

it('renders Spanish when explicitly selected', () => {
  const wrapper = mount(EmailBuilder, { props: { locale: 'es' } })
  expect(wrapper.find('[data-tab="images"]').text()).toContain('Imágenes')
})
~~~

Add a dictionary-completeness assertion that every key in en exists in es after the new UI keys are added.

- [ ] Step 2: Run the focused test to verify it fails

~~~bash
pnpm --filter @naturaldevcr/vue-mail-designer exec vitest run tests/i18n.test.ts
~~~

Expected: the old default Spanish assertion and new fallback/default assertions fail.

- [ ] Step 3: Implement English-first dictionary resolution

In EmailBuilder.vue, resolve dictionaries as follows:

~~~ts
const localeDict = computed<LocaleDict>(() => {
  if (props.locale === 'es') return { ...en, ...es }
  if (props.locale === 'en' || props.locale === undefined) return { ...en }
  return { ...en, ...props.locale }
})
const resolvedLocale = computed<'en' | 'es'>(() => (props.locale === 'es' ? 'es' : 'en'))
provideI18n(() => localeDict.value, () => resolvedLocale.value)
~~~

Change provideI18n's default locale and useI18n's fallback to English. Add unified panel/preview keys to both dictionaries, then make en.ts the complete canonical set and copy every key into es.ts with Spanish translations.

- [ ] Step 4: Run the focused test to verify it passes

Run the same i18n test command. Expected: English default, Spanish selection, custom overrides, reactivity, and dictionary completeness pass.

- [ ] Step 5: Commit

~~~bash
git add packages/email-builder/src/components/EmailBuilder.vue packages/email-builder/src/i18n/useI18n.ts packages/email-builder/src/i18n/en.ts packages/email-builder/src/i18n/es.ts packages/email-builder/src/i18n/keys.ts packages/email-builder/tests/i18n.test.ts
git commit -m "feat(i18n): default editor language to English"
~~~

### Task 4: Localize all editor-facing component strings

**Files:**
- Modify: packages/email-builder/src/components/UnlayerImportDialog.vue
- Modify: packages/email-builder/src/components/TemplateGallery.vue
- Modify: packages/email-builder/src/components/PreviewDialog.vue
- Modify: packages/email-builder/src/components/ImageEditorModal.vue
- Modify: packages/email-builder/src/components/image-editor/CropPanel.vue
- Modify: packages/email-builder/src/components/BlockView.vue
- Modify: packages/email-builder/src/components/PropertiesPanel.vue
- Modify: packages/email-builder/src/components/tabs/BodyTab.vue
- Modify: packages/email-builder/src/components/fields/PaddingField.vue
- Modify: packages/email-builder/src/i18n/en.ts
- Modify: packages/email-builder/src/i18n/es.ts
- Test: packages/email-builder/tests/i18n.test.ts and affected component tests

**Interfaces:**
- Every visible label, button, title, placeholder, empty/error message, and accessibility label calls t('...').
- Static option arrays must be created with translated labels inside setup() or use computed arrays so locale changes update their labels.
- Integrator-provided labels and user content continue to render as supplied.

- [ ] Step 1: Write the failing localization audit test

Add a test that mounts representative surfaces with locale: 'en' and asserts the known Spanish literals no longer occur in the rendered editor chrome. Add a Spanish-mode assertion for the same surfaces. Extend the dictionary completeness test to require every key used by the audited components.

- [ ] Step 2: Run the audit test to verify it fails

~~~bash
pnpm --filter @naturaldevcr/vue-mail-designer exec vitest run tests/i18n.test.ts tests/sidepanel.test.ts tests/header.test.ts tests/inspector.test.ts
~~~

Expected: the test finds hard-coded Spanish text in dialogs, inspector fields, image states, or body/padding controls.

- [ ] Step 3: Replace literals component-by-component

For each listed component, import useI18n, replace template literals with t(...), and add matching English/Spanish keys. Run rg -n "[¿]|No se |Buscar |Agregar|Cargando|Selecciona|Imagen|Galería|Cancelar|Cerrar|Eliminar|Subir|Renombrar|Borrar|Reintentar|Configura|Oculto|Derecha|Izquierda|Centro|Tamaño|Fuente|Texto" packages/email-builder/src --glob '*.vue' --glob '*.ts' and inspect every result; convert any remaining editor-facing result in the listed component set. For script-level errors that are rendered in the component, assign t(...) at the point the error is shown rather than storing Spanish text in the low-level service. For option arrays such as alignment and background-repeat, use computed values derived from t(...) so changing locale updates visible labels.

Use stable semantic key namespaces (dialog.*, image.*, props.*, body.*, field.*, canvas.*) and keep existing rail.*, palette.*, rte.*, header.*, versions.*, and ai.* namespaces intact.

- [ ] Step 4: Run the focused regression suite to verify it passes

~~~bash
pnpm --filter @naturaldevcr/vue-mail-designer exec vitest run tests/i18n.test.ts tests/sidepanel.test.ts tests/header.test.ts tests/inspector.test.ts tests/image-editor.test.ts tests/unlayer-dialog.test.ts
~~~

Expected: English default, Spanish opt-in, reactive locale updates, and existing component behavior all pass.

- [ ] Step 5: Commit

~~~bash
git add packages/email-builder/src/components packages/email-builder/src/i18n/en.ts packages/email-builder/src/i18n/es.ts packages/email-builder/tests
git commit -m "feat(i18n): localize editor chrome"
~~~

### Task 5: Localize public documentation and update package examples

**Files:**
- Modify: packages/email-builder/README.md
- Modify: apps/docs/reference/props.md
- Modify: apps/docs/guide/introduction.md
- Test/verify: apps/docs build output and package README references

**Interfaces:**
- Documentation describes locale as the public language option, English as the default, Spanish as the supported alternative, and partial dictionaries as English-overlaid customizations.

- [ ] Step 1: Identify stale documentation assertions

Run:

~~~bash
rg -n "default|Spanish|Spanish|locale|merged on top|es" README.md packages/email-builder/README.md apps/docs/reference/props.md apps/docs/guide/introduction.md
~~~

Record the exact passages to update in the diff; no runtime test is needed for prose, but the docs build must exercise the referenced API.

- [ ] Step 2: Update the documentation

Rewrite the prop tables and introduction examples in English. Include both forms:

~~~vue
<EmailBuilder locale="en" />
<EmailBuilder locale="es" />
~~~

and a partial dictionary example showing English fallback. Document the unified Images panel, Search/Gallery subtabs, preview/Add behavior, and drag-to-canvas behavior.

- [ ] Step 3: Build the docs to verify the changes

~~~bash
pnpm docs:build
~~~

Expected: VitePress builds without broken Markdown or type errors.

- [ ] Step 4: Commit

~~~bash
git add packages/email-builder/README.md apps/docs/reference/props.md apps/docs/guide/introduction.md
git commit -m "docs: document English-first localization"
~~~

### Task 6: Verify drag behavior and full package quality gates

**Files:**
- Modify: packages/email-builder/tests/dnd.test.ts only if a missing regression assertion is found.
- Modify: packages/email-builder/tests/images-tab.test.ts and media-library-tab.test.ts only if focused panel tests need the final drag selectors.

**Interfaces:**
- Both Search and Gallery DraggableImageThumb instances remain bound to useDraggableItem and expose media-image data whose src is the full URL.

- [ ] Step 1: Add the failing drag regression test

Use the existing Pragmatic DnD test helpers to mount each source and assert the source element is draggable; assert the packDrag payload contains the full URL when the source is exercised. Keep existing canvas destination tests as the behavior oracle.

- [ ] Step 2: Run the focused drag tests to verify failure

~~~bash
pnpm --filter @naturaldevcr/vue-mail-designer exec vitest run tests/dnd.test.ts tests/images-tab.test.ts tests/media-library-tab.test.ts
~~~

Expected: the test fails only if the panel refactor accidentally removed or altered existing drag binding.

- [ ] Step 3: Make the smallest drag compatibility fix

Keep DraggableImageThumb's getData payload unchanged except for any necessary localized preview label. Do not add a second drag implementation or mutate the document from click handlers.

- [ ] Step 4: Run the full verification matrix

~~~bash
pnpm check
pnpm build
pnpm docs:build
~~~

Expected: package/demo typecheck, all package tests, package/demo builds, and documentation build pass. Existing auto-scroll warnings in jsdom are baseline noise and must not become new test failures.

- [ ] Step 5: Inspect the final diff and commit any verification-only fixes

~~~bash
git diff --check
git status --short
git diff --stat origin/main...HEAD
~~~

Confirm there are no hard-coded Spanish UI strings left in the audited source, no unrelated file changes, and no generated build artifacts tracked by Git.

### Task 7: Prepare and publish the pull request

**Files:**
- No source files unless final review identifies a required fix.
- GitHub issue: NaturalDevCR/vue-mail-designer#1

**Interfaces:**
- The PR targets main, references issue #1, summarizes unified panel/preview/localization behavior, and reports exact verification commands and results.

- [ ] Step 1: Review the final branch against origin/main

~~~bash
git diff --check origin/main...HEAD
git log --oneline origin/main..HEAD
git status --short
~~~

Expected: only the approved design/plan and feature implementation commits are present; the working tree is clean.

- [ ] Step 2: Push the feature branch

~~~bash
git push -u origin codex/unified-image-library-localization
~~~

- [ ] Step 3: Open the PR in English

~~~bash
gh pr create --repo NaturalDevCR/vue-mail-designer --base main --head codex/unified-image-library-localization --title "Unify image library and add English-first localization" --body "Closes #1

## Summary
- Unifies Search and Gallery under one Images panel with horizontal subtabs.
- Adds square thumbnails and preview-before-add behavior.
- Preserves drag-and-drop to image blocks, gallery items, and the canvas.
- Defaults the editor to English and supports Spanish through locale.

## Verification
- pnpm check
- pnpm build
- pnpm docs:build"
~~~

- [ ] Step 4: Wait for checks and inspect the PR

~~~bash
PR_NUMBER=$(gh pr view --repo NaturalDevCR/vue-mail-designer --head codex/unified-image-library-localization --json number --jq .number)
gh pr checks --repo NaturalDevCR/vue-mail-designer "$PR_NUMBER" --watch
gh pr view --repo NaturalDevCR/vue-mail-designer "$PR_NUMBER" --web
~~~

Confirm required checks pass and review the rendered diff for accidental Spanish UI literals, untranslated new labels, or unrelated changes before merging.

- [ ] Step 5: Merge to main after checks pass

~~~bash
PR_NUMBER=$(gh pr view --repo NaturalDevCR/vue-mail-designer --head codex/unified-image-library-localization --json number --jq .number)
gh pr merge --repo NaturalDevCR/vue-mail-designer "$PR_NUMBER" --merge --delete-branch
git fetch origin main
git log -1 --oneline origin/main
~~~

If repository protection requires a maintainer action or a check cannot complete, report the exact blocker instead of bypassing protection.
