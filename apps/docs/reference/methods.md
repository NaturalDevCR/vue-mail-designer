# Methods (via ref)

Accessed by mounting the component with `ref`:

```vue
<template>
  <EmailBuilder ref="builder" v-model:design="design" />
  <button @click="handleExport">Export</button>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { EmailBuilder as EmailBuilderInstance } from '@naturaldevcr/vue-mail-designer'

const builder = ref<InstanceType<typeof EmailBuilderInstance>>()

function handleExport() {
  const html = builder.value?.exportHtml()
  // ...
}
</script>
```

| Method | Signature | Description |
|---|---|---|
| `exportHtml` | `(): string` | Full email HTML, ready for your sending provider. |
| `exportJson` | `(): string` | The current `EmailDocument`, serialized to JSON. |
| `getDesign` | `(): EmailDocument` | The current `EmailDocument`, unserialized. |
| `loadDesign` | `(doc: EmailDocument): void` | Replaces the current document with `doc` — resets the undo/redo history. |
| `getAutosaveStatus` | `(): AutosaveStatus` | Current autosave lifecycle state: `'disabled'`, `'idle'`, `'restoring'`, `'saving'`, `'saved'`, or `'error'`. |
| `exportImage` | `(): Promise<string>` | PNG of the design, as a data URL. **Limitation:** cross-origin images (CORS) can prevent the capture. |

## Versions

From the **Export → Versions…** menu, the user can save, load, and delete named versions of the design — in memory for the session, not persisted by the library (save them yourself if you need them across sessions).

## Autosave status

Use `getAutosaveStatus()` when your host UI needs a synchronous status read in addition to the autosave events:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { EmailBuilder, type AutosaveStatus } from '@naturaldevcr/vue-mail-designer'

const builder = ref<InstanceType<typeof EmailBuilder>>()

function readAutosaveStatus(): AutosaveStatus | undefined {
  return builder.value?.getAutosaveStatus()
}
</script>
```

Pair it with `autosave-status` when you want reactive updates. See [Autosave](/guide/autosave) for the full lifecycle.
