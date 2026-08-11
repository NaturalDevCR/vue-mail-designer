# Props

All optional.

| Prop | Type | Description |
|------|------|-------------|
| `design` | `EmailDocument` | The document's design (`v-model:design`). Without it, the editor starts blank. |
| `mergeTags` | `MergeTagItem[]` | Variables insertable in text: `{ name, value }`, or groups `{ name, tags: MergeTagDef[] }` (shown as optgroups). |
| `templates` | `EmailTemplate[]` | Extra templates, in addition to the built-in defaults. |
| `uploadImage` | `(file: File) => Promise<string>` | Upload handler; returns the final URL. Without this prop, the Image block can't upload new files. |
| `imageSearch` | `(query: string) => Promise<ImageResult[]>` | Search handler for the Search subtab in the unified Images panel; defaults to `openverseSearch` (Openverse, CC0/CC-BY). |
| `mediaLibrary` | `MediaLibraryOptions` | Enables the Gallery subtab in the unified Images panel: `{ list: (cursor?) => Promise<{ items: MediaItem[], nextCursor? }>, upload: (file) => Promise<MediaItem>, delete: (id) => Promise<void>, rename: (id, name) => Promise<MediaItem> }`. Without this prop, only Search is shown. You implement each function against your own storage — the library assumes no particular backend. |
| `unlayerFetch` | `(slug: string) => Promise<unknown>` | Handler to load an Unlayer template by URL/slug; returns the design JSON. Defaults to hitting Unlayer's public API (fails via CORS without your own proxy). |
| `theme` | `'light' \| 'dark'` | Builder UI theme (doesn't affect the email canvas). |
| `showHeader` | `boolean` | Whether to show the builder header. Defaults to `true`; when `false`, the entire builder header is hidden. |
| `locale` | `'en' \| 'es' \| LocaleDict` | Public UI language option. English (`'en'`) is the default, Spanish (`'es'`) is the built-in alternative, and a `LocaleDict` is merged on top of English so you can override only the keys you want. |
| `appearance` | `Appearance \| ThemeAppearance` | Builder colors. A flat object (`{ accent, panel, border, background, foreground, muted }`) applies to both modes. The union Appearance or ThemeAppearance also accepts `{ light?: Appearance, dark?: Appearance }` for mode-specific values; omitted fields keep that mode's defaults. |
| `tools` | `Partial<Record<BlockType, ToolConfig>>` | Per-block palette config: `{ enabled?, position?, usageLimit? }` to hide, reorder, or limit instances of a block type. |
| `fonts` | `FontDef[]` | List of available fonts (`{ label, value, url? }`); the ones with `url` (Google Fonts) are loaded both in the canvas and in the exported HTML. Defaults to a curated list. |
| `specialLinks` | `SpecialLink[]` | Predefined links insertable from the text editor (`{ name, href }`) — for example, an unsubscribe link resolved by your sending platform. |
| `customBlocks` | `CustomBlockDef[]` | Integrator-defined custom blocks — see [Custom blocks](/guide/custom-blocks). |

## Locale

English is the default builder language:

```vue
<EmailBuilder locale="en" />
<EmailBuilder locale="es" />
```

You can also pass a partial dictionary to customize just a few labels while keeping English for every missing key:

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

## Images panel

The builder has one **Images** panel with two subtabs:

- **Search** shows results from `imageSearch` (or `openverseSearch` if you do not provide one).
- **Gallery** shows your uploaded assets from `mediaLibrary`.

Clicking a thumbnail opens a preview dialog first. Select **Add** to insert a new Image block or replace the currently selected Image block. You can also drag thumbnails straight from Search or Gallery onto the canvas, onto an existing Image block, or onto a Gallery block slot.

See also [Events](/reference/events) and [Methods](/reference/methods).

For example, use the per-mode form to configure a dark builder with distinct light and dark palettes:

```vue
<EmailBuilder
  :show-header="false"
  theme="dark"
  :appearance="{
    light: { accent: '#2563eb', panel: '#ffffff' },
    dark: { accent: '#60a5fa', panel: '#111827' },
  }"
/>
```
