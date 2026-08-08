# Métodos (vía ref)

Se acceden montando el componente con `ref`:

```vue
<template>
  <EmailBuilder ref="builder" v-model:design="design" />
  <button @click="handleExport">Exportar</button>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { EmailBuilder as EmailBuilderInstance } from '@vue-mail-designer/builder'

const builder = ref<InstanceType<typeof EmailBuilderInstance>>()

function handleExport() {
  const html = builder.value?.exportHtml()
  // ...
}
</script>
```

| Método | Firma | Descripción |
|---|---|---|
| `exportHtml` | `(): string` | HTML de email completo, listo para tu proveedor de envío. |
| `exportJson` | `(): string` | El `EmailDocument` actual, serializado a JSON. |
| `getDesign` | `(): EmailDocument` | El `EmailDocument` actual, sin serializar. |
| `loadDesign` | `(doc: EmailDocument): void` | Reemplaza el documento actual por `doc` — resetea el historial de undo/redo. |
| `exportImage` | `(): Promise<string>` | PNG del diseño, como data URL. **Limitación:** imágenes de otro origen (CORS) pueden impedir la captura. |

## Versiones

Desde el menú **Exportar → Versiones…** el usuario puede guardar, cargar y borrar versiones nombradas del diseño — en memoria durante la sesión, no persistidas por la librería (guardalas vos si las necesitás entre sesiones).
