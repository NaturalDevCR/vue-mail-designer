# Eventos

| Evento | Payload | Cuándo |
|---|---|---|
| `update:design` | `EmailDocument` | En cada cambio del diseño — es el evento que hace funcionar `v-model:design`. |
| `change` | `EmailDocument` | Igual que `update:design`, para cuando preferís no usar `v-model`. |
| `export-html` | `string` | Al llamar a `exportHtml()` por `ref` — entrega el HTML generado. |

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
  // guardado automático, por ejemplo
}

function onHtml(html: string) {
  // enviar o previsualizar
}
</script>
```

Ver también [Métodos](/reference/methods) para disparar el export desde tu propio botón.
