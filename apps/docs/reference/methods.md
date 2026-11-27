# Methods (via ref)

Accessed by mounting the component with `ref`:

```vue
<template>
  <EmailBuilder ref="builder" v-model:design="design" />
  <button @click="handleExport">Export</button>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { EmailBuilder } from '@naturaldevcr/vue-mail-designer'

const builder = ref<InstanceType<typeof EmailBuilder>>()

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
| `loadDesign` | `(doc: EmailDocument): void` | Replaces the current document with `doc`. Undo restores the previous document. |
| `getAutosaveStatus` | `(): AutosaveStatus` | Current autosave lifecycle state: `'disabled'`, `'idle'`, `'restoring'`, `'saving'`, `'saved'`, or `'error'`. |
| `exportImage` | `(): Promise<string>` | PNG of the design, as a data URL. The browser may omit externally loaded images and fonts. Embedded images can be rendered without fetching external assets. |

The right rail's **Export** tab exposes the same HTML, JSON, import, PNG, and version workflows for users who prefer the built-in UI. Use the ref methods when the host application needs to save or load designs from its own backend.

## Pre-send review

Open **Export → Pre-send review** to check the generated email for images with missing or blank alt text and unresolved `{{variable}}` placeholders. Images explicitly marked as decorative are skipped. The review marks names recognized by the configured merge tags and special links. Check that your sending service supplies values for every placeholder it will deliver. The review leaves the design and its export actions available.

## Versions

Open **Export → Versions…** to save, restore, or delete named snapshots. Restoring a snapshot replaces the canvas and creates an entry in the undo history. Versions are kept in memory by default.

Pass `versionHistory` to keep snapshots between editor sessions. Use a stable key for each campaign and a separate key for its autosave draft.

```vue
<EmailBuilder :version-history="{ key: `campaign:${campaignId}:versions` }" />
```

The history uses browser `localStorage` by default. Pass `storage` in the options to use another `Storage` implementation. The dialog reports read and write errors and leaves malformed stored histories untouched.

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
