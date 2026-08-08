# Events

| Event | Payload | When |
|---|---|---|
| `update:design` | `EmailDocument` | On every design change — the event that powers `v-model:design`. |
| `change` | `EmailDocument` | Same as `update:design`, for when you'd rather not use `v-model`. |
| `export-html` | `string` | When calling `exportHtml()` via `ref` — delivers the generated HTML. |

```vue
<template>
  <EmailBuilder
    v-model:design="design"
    @change="onChange"
    @export-html="onHtml"
  />
</template>

<script setup lang="ts">
function onChange(doc: EmailDocument) {
  // e.g. autosave
}

function onHtml(html: string) {
  // send or preview
}
</script>
```

See also [Methods](/reference/methods) for triggering the export from your own button.
