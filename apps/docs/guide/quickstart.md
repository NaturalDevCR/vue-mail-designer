# Inicio rápido

Un componente mínimo con subida de imágenes y export de HTML:

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
import { EmailBuilder, type EmailDocument, type MergeTagDef } from '@vue-mail-designer/builder'
import '@vue-mail-designer/builder/style.css'
import { ref } from 'vue'

const design = ref<EmailDocument>()

const mergeTags: MergeTagDef[] = [{ name: 'Nombre', value: 'first_name' }]

async function uploadImage(file: File): Promise<string> {
  // subí el archivo a tu CDN/storage y devolvé la URL pública
  return 'https://cdn.tu-dominio.com/...'
}

function onHtml(html: string) {
  // guardá o enviá el HTML
}
</script>
```

- `design` es un `v-model`: arrancá con `undefined` (el editor crea un documento en blanco) o cargá uno guardado.
- `uploadImage` es la única prop de storage estrictamente necesaria — sin ella, el bloque Imagen no puede subir archivos nuevos (podés igual pegar una URL a mano).
- Llamá a `exportHtml()`/`exportJson()` por `ref`, o escuchá `export-html`/`update:design` — ver la [referencia de eventos y métodos](/reference/events).

## Con galería de medios

Si además querés una pestaña "Galería" que liste, suba, borre y renombre archivos de tu propio bucket:

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

Sin esta prop, la pestaña "Galería" no aparece. Ver [Bloques](/guide/blocks) y la [referencia de props](/reference/props) completa.
