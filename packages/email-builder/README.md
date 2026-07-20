# @vue-mail-designer/builder

Email builder visual drag & drop para Vue 3, estilo Unlayer. Genera HTML compatible con clientes de correo y JSON de diseño reeditable.

## Instalación

```bash
pnpm add @vue-mail-designer/builder vue pinia
```

## Uso básico

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
  // subí el archivo a tu CDN y devolvé la URL
  return 'https://cdn.tu-dominio.com/...'
}

function onHtml(html: string) {
  // guardá o enviá el HTML
}
</script>
```

## Props

| Prop | Tipo | Descripción |
|------|------|-------------|
| `design` | `EmailDocument` | Diseño (v-model). |
| `mergeTags` | `MergeTagDef[]` | Variables insertables en texto (`{ name, value }`). |
| `templates` | `EmailTemplate[]` | Plantillas extra además de las incluidas. |
| `uploadImage` | `(file: File) => Promise<string>` | Handler de subida; devuelve la URL final. |
| `imageSearch` | `(query: string) => Promise<ImageResult[]>` | Handler de búsqueda para la pestaña Imágenes; por defecto usa `openverseSearch`. |
| `theme` | `'light' \| 'dark'` | Tema de la UI del builder. |

## Eventos

- `update:design` — en cada cambio del diseño.
- `change` — igual que arriba, sin v-model.
- `export-html` — al llamar `exportHtml()`; entrega el HTML.

## Métodos (via ref)

- `exportHtml(): string`
- `exportJson(): string`
- `getDesign(): EmailDocument`
- `loadDesign(doc: EmailDocument): void`

## Compatibilidad de email

El HTML usa tablas con estilos inline, ghost tables para Outlook y una media query para apilar columnas en móvil. Evita flex/grid/position.

## Limitaciones (v1)

- No importa HTML existente (solo JSON).
- Estilos iguales en desktop y móvil (salvo el apilado de columnas).
- Los merge tags se emiten como `{{value}}`; el motor de tu plataforma los reemplaza.
- No se pueden reordenar columnas dentro de una fila (sí filas y bloques).
- `theme` solo acepta `'light' | 'dark'` (sin `'auto'`).
- Algunos campos de estilo no están expuestos en el inspector todavía (fontSize del menú, padding de social/video).
