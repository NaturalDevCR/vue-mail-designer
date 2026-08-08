# Vue Mail Designer

[![npm](https://img.shields.io/npm/v/@vue-mail-designer/builder)](https://www.npmjs.com/package/@vue-mail-designer/builder)
[![CI](https://github.com/NaturalDevCR/vue-mail-designer/actions/workflows/ci.yml/badge.svg)](https://github.com/NaturalDevCR/vue-mail-designer/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

Email builder visual drag & drop para Vue 3, estilo Unlayer. Arrastrá bloques a un lienzo, editalos con un inspector de propiedades, y exportá HTML compatible con clientes de correo (Outlook incluido) más un JSON de diseño reeditable.

📖 **[Documentación completa](https://naturaldevcr.github.io/vue-mail-designer/)**

## Instalación

```bash
pnpm add @vue-mail-designer/builder vue pinia
```

## Uso básico

```vue
<template>
  <EmailBuilder v-model:design="design" :upload-image="uploadImage" @export-html="onHtml" />
</template>

<script setup lang="ts">
import { EmailBuilder, type EmailDocument } from '@vue-mail-designer/builder'
import '@vue-mail-designer/builder/style.css'
import { ref } from 'vue'

const design = ref<EmailDocument>()

async function uploadImage(file: File): Promise<string> {
  return 'https://cdn.tu-dominio.com/...'
}

function onHtml(html: string) {
  // guardá o enviá el HTML
}
</script>
```

Ver la [guía de inicio rápido](https://naturaldevcr.github.io/vue-mail-designer/guide/quickstart) para más.

## Este repo

Monorepo pnpm:

- **[`packages/email-builder`](./packages/email-builder)** — la librería publicada (`@vue-mail-designer/builder`).
- **[`apps/demo`](./apps/demo)** — demo de consumo, editor de punta a punta.
- **[`apps/docs`](./apps/docs)** — sitio de documentación ([VitePress](https://vitepress.dev)), desplegado a GitHub Pages.

## Desarrollo

Requisitos: Node ≥ 20, pnpm.

```bash
pnpm install
pnpm dev          # demo en modo desarrollo
pnpm build        # compila librería + demo
pnpm test         # tests de la librería (Vitest)
pnpm typecheck    # tipos en todo el workspace
pnpm check        # typecheck + test
pnpm docs:dev      # sitio de docs en modo desarrollo
pnpm docs:build    # build del sitio de docs
```

## Licencia

[MIT](./LICENSE)
