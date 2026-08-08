# Vue Mail Designer

[![npm](https://img.shields.io/npm/v/@naturaldevcr/vue-mail-designer)](https://www.npmjs.com/package/@naturaldevcr/vue-mail-designer)
[![CI](https://github.com/NaturalDevCR/vue-mail-designer/actions/workflows/ci.yml/badge.svg)](https://github.com/NaturalDevCR/vue-mail-designer/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

A visual drag & drop email builder for Vue 3. Drag blocks onto a canvas, edit them with a properties inspector, and export email-client-compatible HTML (Outlook included) plus a re-editable design JSON.

📖 **[Full documentation](https://naturaldevcr.github.io/vue-mail-designer/)** · 🤖 Using an AI coding assistant? Point it at [llms-full.txt](https://naturaldevcr.github.io/vue-mail-designer/llms-full.txt) for the complete docs in one file, or [llms.txt](https://naturaldevcr.github.io/vue-mail-designer/llms.txt) for a linked index.

## Install

```bash
pnpm add @naturaldevcr/vue-mail-designer vue pinia
```

## Basic usage

```vue
<template>
  <EmailBuilder v-model:design="design" :upload-image="uploadImage" @export-html="onHtml" />
</template>

<script setup lang="ts">
import { EmailBuilder, type EmailDocument } from '@naturaldevcr/vue-mail-designer'
import '@naturaldevcr/vue-mail-designer/style.css'
import { ref } from 'vue'

const design = ref<EmailDocument>()

async function uploadImage(file: File): Promise<string> {
  return 'https://cdn.your-domain.com/...'
}

function onHtml(html: string) {
  // save or send the HTML
}
</script>
```

See the [quickstart guide](https://naturaldevcr.github.io/vue-mail-designer/guide/quickstart) for more.

## This repo

pnpm monorepo:

- **[`packages/email-builder`](./packages/email-builder)** — the published library (`@naturaldevcr/vue-mail-designer`).
- **[`apps/demo`](./apps/demo)** — a consuming demo app, end-to-end editor.
- **[`apps/docs`](./apps/docs)** — documentation site ([VitePress](https://vitepress.dev)), deployed to GitHub Pages.

## Development

Requirements: Node ≥ 20, pnpm.

```bash
pnpm install
pnpm dev          # run the demo in dev mode
pnpm build        # build the library + demo
pnpm test         # library tests (Vitest)
pnpm typecheck    # typecheck the whole workspace
pnpm check        # typecheck + test
pnpm docs:dev      # docs site in dev mode
pnpm docs:build    # build the docs site
```

## License

[MIT](./LICENSE)
