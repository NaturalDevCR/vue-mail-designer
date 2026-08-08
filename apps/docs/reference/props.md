# Props

All optional.

| Prop | Type | Description |
|------|------|-------------|
| `design` | `EmailDocument` | The document's design (`v-model:design`). Without it, the editor starts blank. |
| `mergeTags` | `MergeTagItem[]` | Variables insertable in text: `{ name, value }`, or groups `{ name, tags: MergeTagDef[] }` (shown as optgroups). |
| `templates` | `EmailTemplate[]` | Extra templates, in addition to the built-in defaults. |
| `uploadImage` | `(file: File) => Promise<string>` | Upload handler; returns the final URL. Without this prop, the Image block can't upload new files. |
| `imageSearch` | `(query: string) => Promise<ImageResult[]>` | Search handler for the Images tab; defaults to `openverseSearch` (Openverse, CC0/CC-BY). |
| `mediaLibrary` | `MediaLibraryOptions` | Enables the "Gallery" tab: `{ list: (cursor?) => Promise<{ items: MediaItem[], nextCursor? }>, upload: (file) => Promise<MediaItem>, delete: (id) => Promise<void>, rename: (id, name) => Promise<MediaItem> }`. Without this prop, the tab doesn't appear. You implement each function against your own storage — the library assumes no particular backend. |
| `unlayerFetch` | `(slug: string) => Promise<unknown>` | Handler to load an Unlayer template by URL/slug; returns the design JSON. Defaults to hitting Unlayer's public API (fails via CORS without your own proxy). |
| `theme` | `'light' \| 'dark'` | Builder UI theme (doesn't affect the email canvas). |
| `locale` | `'es' \| 'en' \| LocaleDict` | UI language. An object is a dictionary merged on top of Spanish — translate only the keys you want. |
| `appearance` | `Appearance` | Builder colors: `accent`, `panel`, `border`, `background`, `foreground`, `muted`. Each present field overrides its `--vmd-*` CSS variable. |
| `tools` | `Partial<Record<BlockType, ToolConfig>>` | Per-block palette config: `{ enabled?, position?, usageLimit? }` to hide, reorder, or limit instances of a block type. |
| `fonts` | `FontDef[]` | List of available fonts (`{ label, value, url? }`); the ones with `url` (Google Fonts) are loaded both in the canvas and in the exported HTML. Defaults to a curated list. |
| `specialLinks` | `SpecialLink[]` | Predefined links insertable from the text editor (`{ name, href }`) — for example, an unsubscribe link resolved by your sending platform. |
| `customBlocks` | `CustomBlockDef[]` | Integrator-defined custom blocks — see [Custom blocks](/guide/custom-blocks). |

See also [Events](/reference/events) and [Methods](/reference/methods).
