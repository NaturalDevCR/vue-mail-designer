# Quickstart

A minimal component with image upload and HTML export:

```vue
<template>
  <EmailBuilder
    v-model:design="design"
    :merge-tags="mergeTags"
    :upload-image="uploadImage"
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
  // upload the file to your CDN/storage and return the public URL
  return 'https://cdn.your-domain.com/...'
}

function onHtml(html: string) {
  // save or send the HTML
}
</script>
```

- `design` is a `v-model`: start with `undefined` (the editor creates a blank document) or load a saved one.
- `uploadImage` is the only strictly necessary storage prop — without it, the Image block can't upload new files (you can still paste a URL by hand).
- Call `exportHtml()`/`exportJson()` via `ref`, or listen for `export-html`/`update:design` — see the [events and methods reference](/reference/events).

## With a media library

If you also want a "Gallery" tab that lists, uploads, deletes, and renames files from your own bucket:

```ts
const mediaLibrary = {
  async list(cursor?: string) {
    return { items: [], nextCursor: undefined }
  },
  async upload(file: File) {
    return { id: 'x', url: '...', thumbnailUrl: '...', name: file.name }
  },
  async delete(id: string) {},
  async rename(id: string, name: string) {
    return { id, url: '...', thumbnailUrl: '...', name }
  },
}
```

```vue
<EmailBuilder ... :media-library="mediaLibrary" />
```

Without this prop, the "Gallery" tab doesn't appear. See [Blocks](/guide/blocks) and the full [props reference](/reference/props).
