# Unified Image Library and English-First Localization — Design

**Date:** 2026-08-10
**Status:** Approved for specification review

## Context

The editor currently exposes image search and the media library as two separate rail entries. Their thumbnails are wide rectangles, clicking a thumbnail inserts the image immediately, and the media-library interaction is visually inconsistent with the search results. The existing drag-and-drop infrastructure already supports dragging thumbnails from both sources to image blocks, gallery slots, or the canvas, but this behavior needs regression coverage while the click interaction changes.

The codebase also has an i18n provider with English and Spanish dictionaries, but several editor-facing strings remain hard-coded in Vue components and helper modules. Spanish is currently the default language. The package, documentation, GitHub issue/PR, and new UI work must be English-first, while consumers must be able to configure English or Spanish when using the package.

## Goals

1. Replace the two image rail entries with one **Images** entry.
2. Add horizontal subtabs for **Search** and **Gallery** inside that entry.
3. Render image thumbnails as square cards in both sources.
4. Open a reusable image preview when a thumbnail is clicked; insert only after the user presses **Add**.
5. Preserve the existing insertion rules and drag-and-drop behavior.
6. Make the editor UI English-first and fully switchable between English and Spanish through the existing public `locale` option.
7. Keep package documentation and GitHub-facing artifacts in English.

## Non-goals

- Adding a third language or a translation-management backend.
- Changing the exported email document schema or generated email content.
- Reordering images within a gallery by dragging one canvas image onto another; the existing canvas-image move behavior remains unchanged.
- Supporting direct operating-system file drops onto the canvas.
- Translating user-provided content, custom block labels, template copy, or special-link values automatically. Those values remain supplied by the integrator or template author.

## Design

### 1. Unified Images panel

`SidePanel.vue` will expose one rail tab with key `images`. The current separate `media` rail tab will be removed, and the `sidebarTab` union in `store/ui.ts` will no longer include `media`.

The images view will render a horizontal tab bar:

- **Search** — the current Openverse search flow, active by default.
- **Gallery** — the current media-library flow, shown only when `mediaLibrary` is configured.

The two existing data flows should remain isolated internally so search state, pagination, upload state, rename state, and delete state do not interfere with each other. A small parent component (for example `ImagesPanel.vue`) will own the active subtab and compose the existing search/library views. The search and gallery components will emit a selected image to the shared preview flow instead of inserting immediately.

The rail label and subtab labels will come from i18n keys. The public media-library option remains optional; without it, the unified panel contains only Search.

### 2. Square thumbnails and preview

Both image grids will use a square thumbnail frame (`aspect-ratio: 1`) with the image filling the frame using `object-fit: cover`. The media-library name and existing actions remain outside the square frame. Existing drag affordances and accessible button semantics remain on the thumbnail button.

Clicking a thumbnail will set a local preview model containing the full image URL, thumbnail URL, alt text, and optional display name/title. It will not mutate the document. A reusable `ImagePreviewDialog.vue` will render:

- a modal backdrop that closes on backdrop click;
- a close button;
- the full image with contain-style fitting so it is not cropped;
- the image title/name when available;
- **Cancel** and **Add** actions.

The preview component will emit `close` and `add`. The owning image view will keep the existing insertion behavior behind the `add` callback:

- if the selected canvas block is an `image` block, update its `src` and preserve a non-empty existing `alt`;
- otherwise create a one-column row and an `image` block, then set its `src` and `alt`.

The preview will be shared by Search and Gallery so both sources have identical behavior and styling. Closing the dialog, including clicking Cancel or the backdrop, leaves the document unchanged.

### 3. Drag-and-drop

`DraggableImageThumb` will remain the drag source for both subtabs. Its drag payload will continue to use the full `src` URL and alt text, not the thumbnail URL. A click opens the preview; dragging continues to use the existing Pragmatic Drag and Drop source and must not insert immediately through the click path.

The current canvas destinations remain supported:

- dropping on an existing `image` block replaces its source while preserving a non-empty alt;
- dropping on a specific gallery item updates only that item;
- dropping on the general canvas creates a new image row/block as currently implemented;
- canvas images can continue to be moved between image slots.

No new document or drag payload types are required unless implementation review finds a regression in the current path.

### 4. English-first localization

The public component `locale` option remains the language configuration API:

```ts
locale?: 'en' | 'es' | LocaleDict
```

When omitted, the editor defaults to English. Passing `'es'` selects the complete Spanish dictionary. Passing a `LocaleDict` overlays custom keys on the English dictionary, allowing integrators to customize or extend the UI while retaining English fallbacks.

The i18n provider will use English as its fallback and will expose the resolved locale as `en` or `es` where applicable. `en.ts` becomes the canonical complete key set; `es.ts` must contain the corresponding translations for all editor UI keys. Missing custom keys must fall back to English rather than rendering raw key names.

All editor-facing hard-coded strings will be moved behind `t(...)`, including:

- rail, toolbar, canvas, palette, inspector, dialogs, fields, and AI menu labels;
- placeholders, button labels, titles, confirmations, loading/empty/error messages, and accessibility labels;
- Search/Gallery tabs, preview actions, upload/pagination/rename/delete actions, and image-preview text;
- errors surfaced by editor UI helpers when they are displayed to users.

Generated email content, template copy, user-entered text, custom block definitions, and integrator-supplied labels are outside this translation pass.

The README and docs will document English as the default and show both `locale="en"` and `locale="es"` usage. All new and updated package/GitHub text will be written in English.

## Data flow

```text
Search or Gallery thumbnail
        │ click
        ▼
Images panel preview state ── Cancel/close ──► no document change
        │ Add
        ▼
Existing image insertion helper ──► document store update

Search or Gallery thumbnail
        │ drag
        ▼
Existing media-image DnD payload ──► image block / gallery item / canvas drop target
```

## Error handling

- Search, gallery listing, upload, pagination, rename, and delete retain their current inline error states, but the messages become localized.
- Preview close and Cancel always clear preview state without changing the document.
- A missing or invalid image URL still renders the browser image failure state; no document mutation happens until Add is pressed.
- If the media library is absent, Gallery is hidden and the Search tab remains usable.
- If a custom locale dictionary omits a key, the English translation is used.

## Testing

Add or update tests to cover behavior rather than implementation details:

### Unified panel and preview

- The rail exposes one Images tab and no separate Gallery tab.
- Search is the default internal tab; Gallery appears only with `mediaLibrary`.
- Search results and media-library thumbnails render square-frame classes/styles.
- Clicking either source opens the preview and does not emit a document update before Add.
- Add without a selected image block creates the same new image row/block as before.
- Add with a selected image block replaces its source and preserves its existing alt.
- Cancel, close, and backdrop click leave the document unchanged.

### Drag-and-drop regression coverage

- Both image sources expose the existing `media-image` drag data with the full source URL.
- Dropping onto image blocks, gallery items, and the general canvas preserves the current behavior.
- Existing canvas-image movement tests remain green.

### Localization

- No locale prop defaults to English.
- `locale: 'es'` renders Spanish labels in representative rail, image-panel, dialog, and inspector flows.
- A custom dictionary overrides selected keys and falls back to English for omitted keys.
- The English and Spanish dictionaries cover every UI key used by the editor.

Run the package test suite, typecheck, package build, demo build, and documentation build before opening the PR.

## Acceptance criteria

- The rail contains one Images entry with horizontal Search and Gallery subtabs.
- Gallery and Search cards are square and visually consistent.
- Clicking a card opens a preview; Add is the only click action that mutates the canvas.
- Dragging a card to the canvas remains possible from both subtabs and uses the original image URL.
- Existing insertion, alt-preservation, and drop-target behavior is preserved.
- English is the default editor language; Spanish is selectable through `locale`.
- The editor UI has no remaining hard-coded Spanish strings in user-facing surfaces covered by this package.
- README/docs, issue, PR, and code comments related to the change are in English.
- Tests, typecheck, builds, and docs build pass.

