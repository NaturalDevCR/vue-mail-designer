# Introduction

**Vue Mail Designer** (`@naturaldevcr/vue-mail-designer`) is a Vue 3 component for visual email editing: drag blocks onto a canvas, edit them with a properties inspector, and get email-client-compatible HTML (Outlook included) plus a re-editable design JSON.

## Who is this for?

For embedding an email editor inside your own application (a marketing SaaS, a CRM, a campaign builder) without depending on an external service. You control:

- **Where images are stored** — you implement `uploadImage` and optionally `mediaLibrary` against your own storage.
- **Which variables can be inserted** — `mergeTags` defines the variables available in the text editor.
- **Which blocks appear** — the `tools` prop hides, reorders, or limits blocks in the palette.
- **The editor's look** — `theme`, `appearance`, and `locale` (English by default, Spanish as the built-in alternative, or your own partial dictionary over English).

## What does it generate?

Two outputs, both under your control:

1. **Email HTML** (`exportHtml()` or the `export-html` event) — tables with inline styles, MSO ghost tables for Outlook, a media query to stack columns on mobile. Meant to be pasted straight into your sending provider (SES, SendGrid, Postmark, etc.).
2. **Design JSON** (`EmailDocument`, via `getDesign()`/`loadDesign()` or `v-model:design`) — the full editable model, to save in your database and reopen in the editor later.

## Localization

English is the default public language option:

```vue
<EmailBuilder locale="en" />
<EmailBuilder locale="es" />
```

If you only need to rename a few labels, pass a partial dictionary. Missing keys still fall back to English.

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

The builder uses one unified **Images** panel:

- **Search** runs `imageSearch` (or the built-in `openverseSearch`) and shows external image results.
- **Gallery** appears when you provide `mediaLibrary` and shows your uploaded assets.

Click a thumbnail to open the preview dialog, then choose **Add** to insert it as a new Image block or replace the currently selected Image block. You can also drag thumbnails directly from Search or Gallery onto the canvas, onto an existing Image block, or onto a Gallery block slot.

## Next steps

- [Installation](/guide/installation)
- [Quickstart](/guide/quickstart)
- [Props reference](/reference/props)

::: tip Using an AI coding assistant?
Point it at [llms-full.txt](/llms-full.txt) for the complete documentation in a single file, or [llms.txt](/llms.txt) for a linked index — [llmstxt.org](https://llmstxt.org) convention.
:::
