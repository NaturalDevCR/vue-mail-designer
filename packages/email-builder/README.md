# @naturaldevcr/vue-mail-designer

A visual drag & drop email builder for Vue 3. Generates email-client-compatible HTML and a re-editable design JSON.

📖 **[Full documentation](https://naturaldevcr.github.io/vue-mail-designer/)** · [Repository](https://github.com/NaturalDevCR/vue-mail-designer) · 🤖 [llms-full.txt](https://naturaldevcr.github.io/vue-mail-designer/llms-full.txt) for AI coding assistants

## Install

```bash
pnpm add @naturaldevcr/vue-mail-designer vue pinia
```

## Basic usage

```vue
<template>
  <EmailBuilder
    v-model:design="design"
    :merge-tags="mergeTags"
    :upload-image="uploadImage"
    :media-library="mediaLibrary"
    @export-html="onHtml"
  />
</template>

<script setup lang="ts">
import { EmailBuilder, type EmailDocument, type MergeTagDef } from '@naturaldevcr/vue-mail-designer'
import '@naturaldevcr/vue-mail-designer/style.css'
import { ref } from 'vue'

const design = ref<EmailDocument>()
const mergeTags: MergeTagDef[] = [{ name: 'First name', value: 'first_name' }]

async function uploadImage(file: File): Promise<string> {
  // upload the file to your CDN and return the URL
  return 'https://cdn.your-domain.com/...'
}

const mediaLibrary = {
  async list(cursor?: string) {
    // list your bucket, paginated by cursor
    return { items: [], nextCursor: undefined }
  },
  async upload(file: File) {
    // upload the file and return the full MediaItem (id, url, thumbnailUrl, name)
    return { id: 'x', url: '...', thumbnailUrl: '...', name: file.name }
  },
  async delete(id: string) {
    // delete the file from your bucket
  },
  async rename(id: string, name: string) {
    // rename the file and return the updated MediaItem
    return { id, url: '...', thumbnailUrl: '...', name }
  },
}

function onHtml(html: string) {
  // save or send the HTML
}
</script>
```

## Localization

English is the default UI language. Use `locale="es"` to switch the builder to Spanish, or pass a partial `LocaleDict` to override only the English labels you want to customize.

```vue
<EmailBuilder locale="en" />
<EmailBuilder locale="es" />
```

```vue
<script setup lang="ts">
import { EmailBuilder, type LocaleDict } from '@naturaldevcr/vue-mail-designer'

const partialLocale: LocaleDict = {
  'images.gallery': 'Brand library',
  'image.searchPlaceholder': 'Search product photos',
}
</script>

<template>
  <EmailBuilder :locale="partialLocale" />
</template>
```

Any key you do not provide still falls back to the built-in English dictionary.

## Props

| Prop | Type | Description |
|------|------|-------------|
| `design` | `EmailDocument` | Design (v-model). |
| `mergeTags` | `MergeTagDef[]` | Variables insertable in text (`{ name, value }`). |
| `templates` | `EmailTemplate[]` | Extra templates, in addition to the built-in ones. |
| `uploadImage` | `(file: File) => Promise<string>` | Upload handler; returns the final URL. |
| `imageSearch` | `(query: string) => Promise<ImageResult[]>` | Search handler for the Search subtab in the unified Images panel; defaults to `openverseSearch`. |
| `mediaLibrary` | `MediaLibraryOptions` | Enables the Gallery subtab in the unified Images panel: `{ list: (cursor?) => Promise<{ items: MediaItem[], nextCursor? }>, upload: (file) => Promise<MediaItem>, delete: (id) => Promise<void>, rename: (id, name) => Promise<MediaItem> }`. Without this prop, only Search is shown. Every function is implemented by the integrator against their own storage (e.g. Firebase Storage); the library assumes no particular backend. |
| `unlayerFetch` | `(slug: string) => Promise<unknown>` | Handler to load an Unlayer template by URL/slug; returns the design JSON. Defaults to hitting Unlayer's API directly (fails via CORS without a proxy). |
| `theme` | `'light' \| 'dark'` | Builder UI theme. |
| `locale` | `'en' \| 'es' \| LocaleDict` | Public UI language option. English (`'en'`) is the default, Spanish (`'es'`) is the built-in alternative, and a `LocaleDict` is merged on top of English so you can override only the keys you want. |
| `appearance` | `Appearance` | Builder colors: `accent`, `panel`, `border`, `background`, `foreground`, `muted`. Each present field overrides its CSS variable; doesn't affect the email canvas. |
| `tools` | `Partial<Record<BlockType, ToolConfig>>` | Per-block palette config: `{ enabled?, position?, usageLimit? }` to hide, reorder, or limit instances. |
| `fonts` | `FontDef[]` | List of fonts (`{ label, value, url? }`); Google Fonts (`url`) are loaded both in the canvas and in the exported HTML. Defaults to a curated list. |
| `specialLinks` | `SpecialLink[]` | Special links insertable from the editor (`{ name, href }`, e.g. an unsubscribe link). |
| `customBlocks` | `CustomBlockDef[]` | Integrator-defined custom blocks (`{ type, label, icon?, defaultData, fields, render }`); appear in the palette with a generic inspector and their own render in the export. |

`mergeTags` also accepts groups: `{ name, tags: MergeTagDef[] }` (shown as optgroups in the editor).

> **Custom block security:** your `render(data)` generates raw HTML. If `data` can come from an imported JSON, escape the values (the library exports `escapeHtml`) to avoid injection.

## Images panel

The builder uses one unified **Images** panel:

- **Search** uses `imageSearch` (or the built-in `openverseSearch`) to find external images.
- **Gallery** uses `mediaLibrary` to show your uploaded assets. This subtab only appears when you provide `mediaLibrary`.

Clicking a thumbnail opens a preview dialog first. Choose **Add** to insert a new Image block on the canvas or replace the currently selected Image block. You can also drag thumbnails directly from Search or Gallery onto the canvas, onto an existing Image block, or onto a Gallery block slot.

## Extra methods (via ref)

- `exportImage(): Promise<string>` — PNG (data URL) of the design. Limitation: cross-origin images (CORS) can prevent the capture.
- Versions: from **Export → Versions…**, named versions are saved/loaded/deleted (in memory for the session).

## Backgrounds

The **body background color and image** are edited in the **Body** tab (`settings.backgroundColor` / `settings.backgroundImage`). Rows are transparent by default so the body background shows through; each row and column can have its own background color/image.

## Rich text editor

The rich text editor includes bold, italic, underline, strikethrough, lists (bullet/numbered), alignment, **text color**, **font size**, links, variables (merge tags), and clear formatting.

## Importing from Unlayer

From the **Export → Import from Unlayer…** menu you can paste an Unlayer design JSON, or the URL of a template from their studio (e.g. `https://studio.unlayer.com/create/...`). The design is converted to our format and a list of warnings is shown for anything that couldn't be mapped (responsive-specific styles, display conditions, Google fonts, etc.).

- **Programmatic:** `unlayerToDocument(json)` returns `{ document, warnings }`; `unlayerSlugFromUrl(url)` extracts the slug.
- **By URL:** the browser can't hit Unlayer's API directly due to CORS. Pass an `unlayerFetch` that uses your own backend/proxy (the demo app uses a Vite proxy at `/unlayer-api`).
- **Assets:** images from Unlayer templates live on their CDN and belong to them; replace them with your own assets. The converter warns about this automatically.

## Events

- `update:design` — on every design change.
- `change` — same as above, for when you'd rather not use `v-model`.
- `export-html` — when calling `exportHtml()`; delivers the HTML.

## Methods (via ref)

- `exportHtml(): string`
- `exportJson(): string`
- `getDesign(): EmailDocument`
- `loadDesign(doc: EmailDocument): void`

## Blocks

Heading, Text (rich editor), Image, Button, Divider, Spacer, Social, Menu, HTML, Video, **Table**, **Gallery**, and **Timer** (countdown: integrator-provided dynamic image, or a static box with the days remaining).

## Rich properties

- **Hide per device** per block and per row (`hideDesktop` / `hideMobile`) — the exported HTML uses classes + a media query.
- **Background image** per row (`url`, `repeat`, `size`, `position`).
- **Own font** per heading/text block (in addition to the document font).
- Border and radius per column (supported in the model and the HTML; no dedicated inspector control yet).
- **Image cropping** ("Crop" button in an image block's inspector, only visible with `uploadImage` configured) — aspect ratio, rotate/flip, straighten, and corner radius (`borderRadius`); the result is uploaded via `uploadImage`.

## Email compatibility

The HTML uses tables with inline styles, ghost tables for Outlook, and a media query to stack columns on mobile. Avoids flex/grid/position.

## Limitations

- Doesn't import existing HTML (JSON only).
- Row backgrounds in Outlook: partial support (no full-bleed VML yet).
- Merge tags are emitted as `{{value}}`; your platform's engine replaces them.
- Columns can't be reordered within a row (rows and blocks can).
- `theme` only accepts `'light' | 'dark'` (no `'auto'`).
- Column border/radius has no dedicated inspector control yet; the timer doesn't animate without an integrator-provided image service.
- The image block's corner radius (`borderRadius`) is rendered with CSS `border-radius`; Outlook desktop (Word engine) ignores it, so rounded corners look right in the builder and in most clients but not in Outlook desktop.
